import dayjs from 'dayjs';

import { Goals, TrendPoint } from './types';

/**
 * 추이 그래프 화면 검증용 더미 데이터.
 * 실제 Firebase 연동 전까지는 이 함수가 반환하는 데이터로 그래프/목표선 UI를 확인한다.
 * 연동 시 이 파일을 Firestore 조회 로직으로 교체하면 된다.
 */
export function generateDummyTrend(days: number = 60): TrendPoint[] {
  const points: TrendPoint[] = [];
  let weight = 78.4;

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = dayjs().subtract(i, 'day');
    // 완만한 감량 추세 + 약간의 랜덤 노이즈
    const drift = (days - i) * -0.025;
    const noise = (Math.sin(i * 1.7) + Math.random() - 0.5) * 0.35;
    weight = 78.4 + drift + noise;

    const baseCalories = 1750;
    const calorieNoise = Math.sin(i * 0.9) * 220 + (Math.random() - 0.5) * 180;
    const calories = Math.max(1100, Math.round(baseCalories + calorieNoise));

    points.push({
      dateKey: date.format('YYYY-MM-DD'),
      weightKg: Math.round(weight * 10) / 10,
      calories,
    });
  }

  return points;
}

export const DUMMY_GOALS: Goals = {
  targetWeightKg: 70,
  targetCalories: 1600,
};
