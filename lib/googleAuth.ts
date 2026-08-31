import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from './firebase';

/**
 * 웹 전용 배포(CLAUDE.md #27)로 전환하면서 Firebase JS SDK의 표준 팝업 로그인으로 교체했다.
 * Firebase 콘솔에서 Authentication > Sign-in method > Google만 켜면 바로 동작하고,
 * 별도의 Google Cloud 클라이언트 ID 발급/리디렉션 URI 등록이 필요 없다
 * (Firebase가 자기 도메인으로 콜백을 처리해준다).
 *
 * 유일한 조건: Firebase 콘솔 Authentication > Settings > 승인된 도메인에
 * 배포 도메인(예: soulrsp.github.io)이 등록되어 있어야 한다. localhost는 기본 포함되어 있다.
 */
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}
