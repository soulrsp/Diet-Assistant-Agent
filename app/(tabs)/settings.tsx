import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/lib/authContext';
import { DUMMY_GOALS } from '@/lib/dummyData';
import { applyReminderSchedule } from '@/lib/notifications';
import {
  getCharacterEnabled,
  getGoals,
  getMealOrder,
  getReminderSettings,
  setCharacterEnabled,
  setGoals,
  setMealOrder,
  setReminderSettings,
} from '@/lib/storage';
import { Goals, MealSlotId, MEAL_SLOT_LABEL, ReminderSettings } from '@/lib/types';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [order, setOrder] = useState<MealSlotId[]>([]);
  const [goals, setLocalGoals] = useState<Goals>(DUMMY_GOALS);
  const [weightText, setWeightText] = useState('');
  const [calorieText, setCalorieText] = useState('');
  const [reminder, setReminder] = useState<ReminderSettings>({ enabled: false, hour: 21, minute: 0 });
  const [characterOn, setCharacterOn] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [mealOrder, savedGoals, savedReminder, charEnabled] = await Promise.all([
          getMealOrder(),
          getGoals(),
          getReminderSettings(),
          getCharacterEnabled(),
        ]);
        setOrder(mealOrder);
        const g = savedGoals ?? DUMMY_GOALS;
        setLocalGoals(g);
        setWeightText(String(g.targetWeightKg));
        setCalorieText(String(g.targetCalories));
        setReminder(savedReminder);
        setCharacterOn(charEnabled);
      })();
    }, [])
  );

  async function moveSlot(index: number, direction: -1 | 1) {
    const next = [...order];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setOrder(next);
    await setMealOrder(next);
  }

  async function saveGoals() {
    const weight = parseFloat(weightText);
    const calories = parseInt(calorieText, 10);
    const next: Goals = {
      targetWeightKg: Number.isFinite(weight) ? weight : goals.targetWeightKg,
      targetCalories: Number.isFinite(calories) ? calories : goals.targetCalories,
    };
    setLocalGoals(next);
    await setGoals(next);
  }

  async function toggleReminder(enabled: boolean) {
    const next = { ...reminder, enabled };
    setReminder(next);
    await setReminderSettings(next);
    await applyReminderSchedule(next);
  }

  async function changeReminderTime(hour: number, minute: number) {
    const next = { ...reminder, hour, minute };
    setReminder(next);
    await setReminderSettings(next);
    if (next.enabled) await applyReminderSchedule(next);
  }

  async function toggleCharacter(value: boolean) {
    setCharacterOn(value);
    await setCharacterEnabled(value);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="목표 설정">
        <Row label="목표 체중 (kg)">
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={weightText}
            onChangeText={setWeightText}
            onBlur={saveGoals}
          />
        </Row>
        <Row label="일일 목표 칼로리 (kcal)">
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={calorieText}
            onChangeText={setCalorieText}
            onBlur={saveGoals}
          />
        </Row>
      </Section>

      <Section title="알림">
        <Row label="매일 기록 리마인더">
          <Switch value={reminder.enabled} onValueChange={toggleReminder} />
        </Row>
        {reminder.enabled && (
          <Row label="알림 시간">
            <View style={styles.timePickerRow}>
              <TimeStepper
                value={reminder.hour}
                max={23}
                onChange={(h) => changeReminderTime(h, reminder.minute)}
              />
              <Text style={styles.timeColon}>:</Text>
              <TimeStepper
                value={reminder.minute}
                max={59}
                step={10}
                onChange={(m) => changeReminderTime(reminder.hour, m)}
              />
            </View>
          </Row>
        )}
      </Section>

      <Section title="캐릭터">
        <Row label="새싹이 캐릭터 표시">
          <Switch value={characterOn} onValueChange={toggleCharacter} />
        </Row>
      </Section>

      <Section title="오늘 탭 항목 순서">
        {order.map((slot, index) => (
          <View key={slot} style={styles.orderRow}>
            <Text style={styles.orderLabel}>{MEAL_SLOT_LABEL[slot]}</Text>
            <View style={styles.orderButtons}>
              <Pressable
                style={styles.orderBtn}
                disabled={index === 0}
                onPress={() => moveSlot(index, -1)}>
                <Text style={[styles.orderBtnText, index === 0 && styles.orderBtnTextDisabled]}>▲</Text>
              </Pressable>
              <Pressable
                style={styles.orderBtn}
                disabled={index === order.length - 1}
                onPress={() => moveSlot(index, 1)}>
                <Text
                  style={[
                    styles.orderBtnText,
                    index === order.length - 1 && styles.orderBtnTextDisabled,
                  ]}>
                  ▼
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Section>

      <Section title="계정">
        <Row label={user?.email ?? ''}>
          <Pressable style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutBtnText}>로그아웃</Text>
          </Pressable>
        </Row>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TimeStepper({
  value,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Pressable
        style={styles.stepperBtn}
        onPress={() => onChange(((value - step) % (max + 1) + (max + 1)) % (max + 1))}>
        <Text style={styles.stepperBtnText}>-</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{String(value).padStart(2, '0')}</Text>
      <Pressable style={styles.stepperBtn} onPress={() => onChange((value + step) % (max + 1))}>
        <Text style={styles.stepperBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  section: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6C7263',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
    textAlign: 'right',
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeColon: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F0E6',
  },
  orderLabel: {
    fontSize: 14,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  orderBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2DFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnText: {
    fontSize: 12,
  },
  orderBtnTextDisabled: {
    opacity: 0.3,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutBtnText: {
    fontSize: 13,
    color: '#B4791A',
  },
});
