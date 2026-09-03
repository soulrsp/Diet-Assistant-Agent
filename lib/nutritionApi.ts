import { getNutritionApiKey } from './apiKeys';
import { Macros } from './types';

/**
 * 식품의약품안전처 식품영양성분DB정보 API (공공데이터포털).
 * Gemini가 추정한 음식명으로 이 API를 검색해 칼로리/탄단지를 가져온다.
 *
 * API 키는 소스 코드에 두지 않는다 — public 저장소라 커밋되면 그대로 노출되기 때문이다.
 * 사용자가 설정 탭에서 직접 발급받은 키를 입력하면 이 기기에만 저장해서 사용한다. (lib/apiKeys.ts)
 *
 * 실제 호출로 확인한 사실:
 * - 응답 형태: { header: {...}, body: { items: [...], totalCount } }
 * - FOOD_NM_KR 파라미터는 부분 일치 검색을 지원한다(예: "김치찌개" → "김치찌개_꽁치" 등 375건).
 *   여러 결과 중 첫 번째를 사용하는데, 식품명이 정확히 같은 항목이 있으면 보통 먼저 나온다.
 * - 영양성분 필드 순서: AMT_NUM1(에너지) · AMT_NUM3(단백질) · AMT_NUM4(지방) · AMT_NUM6(탄수화물)
 *   (식약처 표기 순서: 에너지·수분·단백질·지방·회분·탄수화물)
 */

const BASE_URL = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02';

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : NaN;
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export type NutritionResult = Macros & { name: string };

/**
 * 음식명으로 식약처 DB를 검색한다. 여러 결과 중 이름이 정확히 같은 항목을 우선하고,
 * 없으면 첫 번째 결과를 사용한다. 매칭 결과가 없거나 API 호출이 실패하면 예외를 던진다.
 */
export async function searchNutritionByName(foodName: string): Promise<NutritionResult> {
  const apiKey = await getNutritionApiKey();
  if (!apiKey) {
    throw new Error('식약처 API 키가 설정되지 않았어요. 설정 탭에서 등록해주세요.');
  }

  const url = new URL(BASE_URL);
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('numOfRows', '10');
  url.searchParams.set('type', 'json');
  url.searchParams.set('FOOD_NM_KR', foodName);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`식약처 API 오류 (${response.status})`);
  }

  const data = await response.json();

  if (data?.header?.resultCode && data.header.resultCode !== '00') {
    throw new Error(`식약처 API 오류: ${data.header.resultMsg}`);
  }

  const rows: any[] = data?.body?.items ?? [];
  if (rows.length === 0) {
    throw new Error(`"${foodName}"에 대한 식품을 찾지 못했습니다.`);
  }

  const row = rows.find((r) => r.FOOD_NM_KR === foodName) ?? rows[0];

  return {
    name: row.FOOD_NM_KR ?? foodName,
    calories: toNumber(row.AMT_NUM1),
    protein: toNumber(row.AMT_NUM3),
    fat: toNumber(row.AMT_NUM4),
    carbs: toNumber(row.AMT_NUM6),
  };
}
