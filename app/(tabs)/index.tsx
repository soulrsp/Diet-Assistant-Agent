import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';

import Character from '@/components/Character';
import MealSlotCard from '@/components/MealSlotCard';
import SupplementCheck from '@/components/SupplementCheck';
import { Text, View } from '@/components/Themed';
import { computeCharacterMood } from '@/lib/characterMood';
import { DUMMY_GOALS } from '@/lib/dummyData';
import {
  getCameraCaptureEnabled,
  getCharacterEnabled,
  getDailyLog,
  getGoals,
  getMealOrder,
  saveDailyLog,
  todayKey,
} from '@/lib/storage';
import { CHECK_ONLY_SLOTS, DailyLog, Goals, MealItem, MealSlotId } from '@/lib/types';

export default function TodayScreen() {
  const [mealOrder, setMealOrder] = useState<MealSlotId[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [goals, setGoals] = useState<Goals>(DUMMY_GOALS);
  const [characterEnabled, setCharacterEnabled] = useState(true);
  const [cameraCaptureEnabled, setCameraCaptureEnabled] = useState(false);
  const [weightText, setWeightText] = useState('');

  const load = useCallback(async () => {
    const [order, dailyLog, charEnabled, savedGoals, cameraEnabled] = await Promise.all([
      getMealOrder(),
      getDailyLog(todayKey()),
      getCharacterEnabled(),
      getGoals(),
      getCameraCaptureEnabled(),
    ]);
    setMealOrder(order);
    setLog(dailyLog);
    setCharacterEnabled(charEnabled);
    setGoals(savedGoals ?? DUMMY_GOALS);
    setCameraCaptureEnabled(cameraEnabled);
    setWeightText(dailyLog.weightKg ? String(dailyLog.weightKg) : '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!log) {
    return <View style={styles.container} />;
  }

  const totalCalories = Object.values(log.meals)
    .flat()
    .reduce((sum, item) => sum + item.calories, 0);

  async function persist(next: DailyLog) {
    setLog(next);
    await saveDailyLog(next);
  }

  function handleAdd(slot: MealSlotId, item: MealItem) {
    if (!log) return;
    const next: DailyLog = {
      ...log,
      meals: { ...log.meals, [slot]: [...log.meals[slot], item] },
    };
    persist(next);
  }

  function handleRemove(slot: MealSlotId, itemId: string) {
    if (!log) return;
    const next: DailyLog = {
      ...log,
      meals: { ...log.meals, [slot]: log.meals[slot].filter((i) => i.id !== itemId) },
    };
    persist(next);
  }

  function handleToggleCheck(slot: MealSlotId, checked: boolean) {
    if (!log) return;
    const next: DailyLog = {
      ...log,
      checkedSlots: { ...log.checkedSlots, [slot]: checked },
    };
    persist(next);
  }

  function handleWeightBlur() {
    if (!log) return;
    const value = parseFloat(weightText);
    const next: DailyLog = { ...log, weightKg: Number.isFinite(value) ? value : undefined };
    persist(next);
  }

  const { mood, message: moodMessage } = computeCharacterMood(log, goals);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.dateLabel}>{dayjs().format('YYYY년 M월 D일 dddd')}</Text>

        {characterEnabled && <Character mood={mood} message={moodMessage} />}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>오늘 섭취 칼로리: {totalCalories} kcal</Text>
        </View>

        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>오늘 몸무게 (kg)</Text>
          <TextInput
            style={styles.weightInput}
            keyboardType="decimal-pad"
            placeholder="예: 68.5"
            value={weightText}
            onChangeText={setWeightText}
            onBlur={handleWeightBlur}
          />
        </View>

        {mealOrder.map((slot) =>
          CHECK_ONLY_SLOTS.includes(slot) ? (
            <SupplementCheck
              key={slot}
              slot={slot}
              checked={!!log.checkedSlots[slot]}
              onToggle={(checked) => handleToggleCheck(slot, checked)}
            />
          ) : (
            <MealSlotCard
              key={slot}
              slot={slot}
              items={log.meals[slot]}
              cameraCaptureEnabled={cameraCaptureEnabled}
              onAdd={(item) => handleAdd(slot, item)}
              onRemove={(itemId) => handleRemove(slot, itemId)}
            />
          )
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryRow: {
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#4E6B4C',
    fontWeight: '600',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 14,
    padding: 14,
  },
  weightLabel: {
    fontSize: 14,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
    textAlign: 'right',
  },
});
