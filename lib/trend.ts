import { generateDummyTrend } from './dummyData';
import { getRecentDailyLogs } from './storage';
import { TrendPoint } from './types';

export type TrendResult = {
  points: TrendPoint[];
  isDummy: boolean;
};

/**
 * Firestore에 몸무게가 기록된 날짜가 하나라도 있으면 실제 데이터를 사용하고,
 * 전혀 없으면(막 시작한 상태) 더미 데이터로 그래프 형태를 보여준다.
 */
export async function getTrendPoints(days: number): Promise<TrendResult> {
  const logs = await getRecentDailyLogs(days);

  const points: TrendPoint[] = logs
    .filter((log) => typeof log.weightKg === 'number')
    .map((log) => ({
      dateKey: log.dateKey,
      weightKg: log.weightKg as number,
      calories: Object.values(log.meals)
        .flat()
        .reduce((sum, item) => sum + item.calories, 0),
    }));

  if (points.length === 0) {
    return { points: generateDummyTrend(days), isDummy: true };
  }

  return { points, isDummy: false };
}
