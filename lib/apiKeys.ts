import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gemini / 식약처 API 키는 소스 코드에 넣지 않는다 — 이 저장소는 public이라 커밋되는 순간
 * 키가 그대로 노출되기 때문이다. 대신 사용자(AURA 앱과 동일한 방식)가 설정 탭에서 본인 키를
 * 직접 입력하면 이 기기의 AsyncStorage에만 저장하고, Firestore(다른 기기와 동기화되는 저장소)에는
 * 절대 올리지 않는다.
 */

const KEYS = {
  gemini: 'apiKey:gemini',
  nutrition: 'apiKey:nutrition',
};

export async function getGeminiApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.gemini);
}

export async function setGeminiApiKey(value: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.gemini, value.trim());
}

export async function getNutritionApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.nutrition);
}

export async function setNutritionApiKey(value: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.nutrition, value.trim());
}
