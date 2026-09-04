import { getGeminiApiKey } from './apiKeys';

/**
 * Google Cloud Vision 대신 Gemini API(멀티모달)로 음식 사진을 인식한다.
 * Google Cloud Vision은 본인인증(결제 계정 등록)이 막혀서 채택하지 못했고,
 * Gemini API는 Google AI Studio에서 카드 없이 바로 키를 발급받을 수 있다. (CLAUDE.md 참고)
 *
 * API 키는 소스 코드에 두지 않는다 — public 저장소라 커밋되면 그대로 노출되기 때문이다.
 * AURA(Dating-Planning-Agent)와 같은 방식으로, 사용자가 설정 탭에서 직접 발급받은 키를
 * 입력하면 이 기기에만 저장해서 사용한다. (lib/apiKeys.ts)
 */

const GEMINI_MODEL = 'gemini-3.6-flash';

export type GeminiFoodGuess = {
  name: string;
  confidence: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 무료 티어는 트래픽이 몰리면 일시적으로 과부하 응답(429/503/530 등)을 준다 — 잠깐 쉬었다 재시도한다.
const RETRYABLE_STATUS = new Set([429, 503, 529, 530]);
const MAX_RETRIES = 2;

async function photoUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('이미지를 읽는 데 실패했습니다.'));
    reader.readAsDataURL(blob);
  });

  return { base64, mimeType };
}

/**
 * 사진 속 음식을 한국어 음식명 하나와 확신도(0~1)로 추정한다.
 * 실패하거나 파싱할 수 없으면 예외를 던진다 — 호출부에서 수동 검색으로 유도한다.
 */
export async function identifyFoodFromPhoto(photoUri: string): Promise<GeminiFoodGuess> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았어요. 설정 탭에서 등록해주세요.');
  }

  const { base64, mimeType } = await photoUriToBase64(photoUri);

  const prompt =
    '이 사진 속 음식이 무엇인지 알려줘. 일반적으로 통용되는 한국어 음식명 하나만 답해줘 ' +
    '(예: "된장찌개", "현미밥", "삼겹살구이"). 음식이 아니거나 알아볼 수 없으면 ' +
    'foodName을 "unknown"으로, confidence를 0으로 답해.';

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          foodName: { type: 'STRING' },
          confidence: { type: 'NUMBER' },
        },
        required: ['foodName', 'confidence'],
      },
    },
  });

  let response: Response | undefined;
  let lastErrorText = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      }
    );

    if (response.ok) break;
    if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_RETRIES) {
      lastErrorText = await response.text();
      break;
    }
    await sleep(1000 * (attempt + 1));
  }

  if (!response || !response.ok) {
    if (RETRYABLE_STATUS.has(response?.status ?? 0)) {
      throw new Error('Gemini 서버가 혼잡해요. 잠시 후 다시 시도해주세요.');
    }
    throw new Error(`Gemini API 오류 (${response?.status}): ${lastErrorText}`);
  }

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답에서 텍스트를 찾지 못했습니다.');
  }

  const parsed = JSON.parse(text) as { foodName?: string; confidence?: number };
  const name = (parsed.foodName ?? '').trim();
  if (!name || name === 'unknown') {
    throw new Error('사진에서 음식을 인식하지 못했습니다.');
  }

  const confidence = parsed.confidence;
  return {
    name,
    confidence: typeof confidence === 'number' ? Math.min(Math.max(confidence, 0), 1) : 0.5,
  };
}
