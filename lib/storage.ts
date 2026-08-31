import dayjs from 'dayjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from './firebase';
import { DEFAULT_MEAL_ORDER, DailyLog, Goals, MealSlotId, ReminderSettings } from './types';

/**
 * Firestore 기반 저장 계층. 로그인한 사용자(uid)별로 데이터를 분리 보관한다.
 * 눈바디 사진은 여기서 다루지 않는다 — lib/bodyPhotoStorage.ts(기기 로컬)에서만 관리한다. (CLAUDE.md #5)
 */

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('로그인이 필요합니다.');
  return uid;
}

// Firestore는 undefined 필드를 허용하지 않으므로 저장 전 제거한다.
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function todayKey(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function emptyDailyLog(dateKey: string): DailyLog {
  return {
    dateKey,
    weightKg: undefined,
    meals: {
      breakfast: [],
      snack: [],
      supplement: [],
      lunch: [],
      dinner: [],
    },
    checkedSlots: {},
  };
}

function preferencesRef() {
  return doc(db, 'users', requireUid(), 'settings', 'preferences');
}

function goalsRef() {
  return doc(db, 'users', requireUid(), 'settings', 'goals');
}

function dailyLogRef(dateKey: string) {
  return doc(db, 'users', requireUid(), 'dailyLogs', dateKey);
}

export async function getMealOrder(): Promise<MealSlotId[]> {
  const snap = await getDoc(preferencesRef());
  const order = snap.data()?.mealOrder as MealSlotId[] | undefined;
  return order ?? DEFAULT_MEAL_ORDER;
}

export async function setMealOrder(order: MealSlotId[]): Promise<void> {
  await setDoc(preferencesRef(), { mealOrder: order }, { merge: true });
}

export async function getGoals(): Promise<Goals | null> {
  const snap = await getDoc(goalsRef());
  if (!snap.exists()) return null;
  return snap.data() as Goals;
}

export async function setGoals(goals: Goals): Promise<void> {
  await setDoc(goalsRef(), stripUndefined(goals));
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  const snap = await getDoc(preferencesRef());
  const reminder = snap.data()?.reminder as ReminderSettings | undefined;
  return reminder ?? { enabled: false, hour: 21, minute: 0 };
}

export async function setReminderSettings(settings: ReminderSettings): Promise<void> {
  await setDoc(preferencesRef(), { reminder: settings }, { merge: true });
}

export async function getCharacterEnabled(): Promise<boolean> {
  const snap = await getDoc(preferencesRef());
  const value = snap.data()?.characterEnabled as boolean | undefined;
  return value ?? true;
}

export async function setCharacterEnabled(enabled: boolean): Promise<void> {
  await setDoc(preferencesRef(), { characterEnabled: enabled }, { merge: true });
}

export async function getCameraCaptureEnabled(): Promise<boolean> {
  const snap = await getDoc(preferencesRef());
  const value = snap.data()?.cameraCaptureEnabled as boolean | undefined;
  return value ?? false;
}

export async function setCameraCaptureEnabled(enabled: boolean): Promise<void> {
  await setDoc(preferencesRef(), { cameraCaptureEnabled: enabled }, { merge: true });
}

export async function getDailyLog(dateKey: string): Promise<DailyLog> {
  const snap = await getDoc(dailyLogRef(dateKey));
  if (!snap.exists()) return emptyDailyLog(dateKey);
  return { ...emptyDailyLog(dateKey), ...(snap.data() as DailyLog) };
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  await setDoc(dailyLogRef(log.dateKey), stripUndefined(log));
}

/**
 * 최근 days일 동안의 DailyLog를 dateKey 오름차순으로 가져온다.
 * 추이 탭에서 실제 기록이 있으면 이 데이터를, 없으면 더미 데이터를 사용한다.
 */
export async function getRecentDailyLogs(days: number): Promise<DailyLog[]> {
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');
  const uid = requireUid();
  const q = query(
    collection(db, 'users', uid, 'dailyLogs'),
    where('dateKey', '>=', from),
    orderBy('dateKey', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DailyLog);
}
