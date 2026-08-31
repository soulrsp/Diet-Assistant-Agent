import { CharacterMood } from '@/components/Character';

import { DailyLog, Goals } from './types';

const BAD_THRESHOLD_PCT = 15;

/**
 * 목표 칼로리/체중 대비 초과율을 계산해 캐릭터 기분을 정한다. (CLAUDE.md 참고)
 * - 오늘 아무 기록도 없으면 worst
 * - 칼로리 또는 체중이 목표보다 15%를 넘게 초과하면 worst, 0~15% 초과면 bad
 * - 초과가 없으면 기록량에 따라 great(3끼 이상)/good(1~2끼)/neutral(몸무게만)
 */
export function computeCharacterMood(
  log: DailyLog,
  goals: Goals
): { mood: CharacterMood; message: string } {
  const totalCalories = Object.values(log.meals)
    .flat()
    .reduce((sum, item) => sum + item.calories, 0);
  const loggedMealCount = Object.values(log.meals).flat().length;

  const hasAnyLog = loggedMealCount > 0 || typeof log.weightKg === 'number';
  if (!hasAnyLog) {
    return { mood: 'worst', message: '오늘 기록이 아직 없어요' };
  }

  const caloriesOverPct =
    loggedMealCount > 0 && goals.targetCalories > 0
      ? ((totalCalories - goals.targetCalories) / goals.targetCalories) * 100
      : 0;
  const weightOverPct =
    typeof log.weightKg === 'number' && goals.targetWeightKg > 0
      ? ((log.weightKg - goals.targetWeightKg) / goals.targetWeightKg) * 100
      : 0;

  const overPct = Math.max(caloriesOverPct, weightOverPct);

  if (overPct > BAD_THRESHOLD_PCT) {
    return { mood: 'worst', message: '목표보다 많이 초과했어요. 내일은 조절해봐요' };
  }
  if (overPct > 0) {
    return { mood: 'bad', message: '목표를 살짝 넘었어요' };
  }
  if (loggedMealCount >= 3) {
    return { mood: 'great', message: '오늘 기록 잘 챙기고 있어요!' };
  }
  if (loggedMealCount > 0) {
    return { mood: 'good', message: '조금 더 기록해볼까요?' };
  }
  return { mood: 'neutral', message: '몸무게만 기록했어요' };
}
