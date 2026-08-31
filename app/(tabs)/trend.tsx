import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import DualAxisChart from '@/components/DualAxisChart';
import { Text, View } from '@/components/Themed';
import { DUMMY_GOALS } from '@/lib/dummyData';
import { getGoals } from '@/lib/storage';
import { getTrendPoints } from '@/lib/trend';
import { Goals, TrendPoint } from '@/lib/types';

const PERIODS = [
  { label: '1주', days: 7 },
  { label: '1개월', days: 30 },
  { label: '2개월', days: 60 },
];

export default function TrendScreen() {
  const [periodDays, setPeriodDays] = useState(30);
  const [goals, setGoals] = useState<Goals>(DUMMY_GOALS);
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [isDummy, setIsDummy] = useState(true);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getGoals(), getTrendPoints(periodDays)]).then(([savedGoals, trend]) => {
        if (cancelled) return;
        setGoals(savedGoals ?? DUMMY_GOALS);
        setPoints(trend.points);
        setIsDummy(trend.isDummy);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [periodDays])
  );

  const latest = points[points.length - 1];
  const first = points[0];
  const weightDelta = latest && first ? Math.round((latest.weightKg - first.weightKg) * 10) / 10 : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          {isDummy
            ? '아직 실제 기록이 부족해서 더미 데이터로 보여주고 있어요. 몸무게를 기록하면 실제 데이터로 바뀝니다.'
            : '실제 기록 데이터를 보여주고 있어요.'}
        </Text>
      </View>

      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.days}
            style={[styles.periodBtn, periodDays === p.days && styles.periodBtnActive]}
            onPress={() => setPeriodDays(p.days)}>
            <Text style={[styles.periodText, periodDays === p.days && styles.periodTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!loading && <DualAxisChart points={points} goals={goals} />}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>현재 체중</Text>
          <Text style={styles.statValue}>{latest?.weightKg ?? '-'} kg</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>기간 내 변화</Text>
          <Text style={styles.statValue}>{weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>목표까지</Text>
          <Text style={styles.statValue}>
            {latest ? Math.round((latest.weightKg - goals.targetWeightKg) * 10) / 10 : '-'} kg
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  noticeBox: {
    backgroundColor: '#EDEBE0',
    borderRadius: 10,
    padding: 10,
  },
  noticeText: {
    fontSize: 12,
    color: '#6C7263',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2DFCF',
  },
  periodBtnActive: {
    backgroundColor: '#E1611F',
    borderColor: '#E1611F',
  },
  periodText: {
    fontSize: 13,
    color: '#6C7263',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C7263',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
