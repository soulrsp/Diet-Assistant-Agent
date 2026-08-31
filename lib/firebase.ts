import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// firebase/auth의 공개 타입에는 getReactNativePersistence가 빠져있지만
// React Native 빌드(dist/rn)에는 실제로 존재하고 런타임에서 정상 동작한다.
// @ts-expect-error - RN 전용 export가 firebase/auth의 기본 타입 표면에 없음
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * 개인 사이드로드 앱이라 API 키를 클라이언트에 그대로 둔다. (CLAUDE.md #6)
 * 눈바디 사진은 이 프로젝트로 절대 업로드하지 않는다 — 항상 기기 로컬(lib/bodyPhotoStorage.ts)에만 저장한다.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyC7if3KtVBVcgAdckLG3Cl9m9z3nUCcYbw',
  authDomain: 'llm-debate-agent-36ab2.firebaseapp.com',
  projectId: 'llm-debate-agent-36ab2',
  storageBucket: 'llm-debate-agent-36ab2.firebasestorage.app',
  messagingSenderId: '948226646542',
  appId: '1:948226646542:web:10d9e1f09751e2ae5ed25f',
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh 등으로 이미 초기화된 경우
    return getAuth(app);
  }
}

export const auth = createAuth();

export const db = getFirestore(app);
