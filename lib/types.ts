export type MealSlotId = 'breakfast' | 'snack' | 'supplement' | 'lunch' | 'dinner';

// 끼니 슬롯 중 사진/칼로리 기록이 아니라 복용 여부 체크만 하는 슬롯
export const CHECK_ONLY_SLOTS: MealSlotId[] = ['supplement'];

export const DEFAULT_MEAL_ORDER: MealSlotId[] = [
  'breakfast',
  'snack',
  'supplement',
  'lunch',
  'dinner',
];

export const MEAL_SLOT_LABEL: Record<MealSlotId, string> = {
  breakfast: '아침',
  snack: '간식',
  supplement: '영양제',
  lunch: '점심',
  dinner: '저녁',
};

export type Macros = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

export type MealItem = {
  id: string;
  name: string;
  photoUri?: string;
  source: 'photo-auto' | 'manual';
} & Macros;

// dateKey 형식: 'YYYY-MM-DD'
export type DailyLog = {
  dateKey: string;
  weightKg?: number;
  meals: Record<MealSlotId, MealItem[]>;
  checkedSlots: Partial<Record<MealSlotId, boolean>>; // 영양제처럼 사진 없이 복용 여부만 체크하는 슬롯
};

export type Goals = {
  targetWeightKg: number;
  targetCalories: number;
};

export type ReminderSettings = {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
};

export type TrendPoint = {
  dateKey: string;
  weightKg: number;
  calories: number;
};
