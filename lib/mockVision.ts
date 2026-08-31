import { Macros } from './types';

/**
 * Google Cloud Vision API 연동 전까지 사용하는 목업 함수.
 * 실제 연동 시 이 함수의 시그니처(사진 uri를 받아 이름+매크로를 반환)는 그대로 두고
 * 내부 구현만 Vision API 호출 + 식약처 식품영양성분DB 조회로 교체하면 된다.
 */
const MOCK_FOOD_DB: (Macros & { name: string })[] = [
  { name: '현미밥 한 공기', calories: 310, carbs: 68, protein: 6, fat: 1 },
  { name: '닭가슴살 샐러드', calories: 280, carbs: 12, protein: 35, fat: 9 },
  { name: '된장찌개', calories: 190, carbs: 14, protein: 12, fat: 9 },
  { name: '계란말이', calories: 210, carbs: 4, protein: 14, fat: 15 },
  { name: '고등어구이', calories: 260, carbs: 0, protein: 24, fat: 18 },
  { name: '김치볶음밥', calories: 520, carbs: 78, protein: 12, fat: 16 },
  { name: '두부조림', calories: 150, carbs: 8, protein: 13, fat: 7 },
  { name: '아메리카노', calories: 10, carbs: 2, protein: 0, fat: 0 },
];

export type VisionRecognitionResult = {
  name: string;
  confidence: number; // 0~1
} & Macros;

export function recognizeFoodPhoto(photoUri: string): Promise<VisionRecognitionResult> {
  return new Promise((resolve) => {
    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      const pick = MOCK_FOOD_DB[Math.floor(Math.random() * MOCK_FOOD_DB.length)];
      const confidence = 0.55 + Math.random() * 0.4;
      resolve({ ...pick, confidence });
    }, delay);
  });
}

// 인식 신뢰도가 이 값보다 낮으면 화면에서 "정확하지 않을 수 있어요" 안내 + 수동 검색 유도
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export function searchFoodByName(query: string): (Macros & { name: string })[] {
  const q = query.trim();
  if (!q) return [];
  return MOCK_FOOD_DB.filter((item) => item.name.includes(q));
}
