import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect } from 'react';

import { auth } from './firebase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Firebase 콘솔 > Authentication > Sign-in method > Google을 활성화하면
 * 자동으로 "웹 클라이언트 ID"가 생성된다. (Google Cloud Console > API 및 서비스 >
 * 사용자 인증 정보 에서도 같은 값을 볼 수 있다) 그 값을 여기 붙여넣는다.
 *
 * 이 방식(expo-auth-session)은 Expo 공식 문서에서 deprecated로 표시되어 있지만,
 * 현재로선 Expo Go 안에서 그대로 동작하는 유일한 Google 로그인 방법이라 채택했다.
 * (CLAUDE.md 참고) 네이티브 Google Sign-In으로 바꾸려면 EAS Build(커스텀 개발 클라이언트)로
 * 전환해야 한다.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '948226646542-5rqc7eqmapf2g6hu0jhdolfc4q7q4653.apps.googleusercontent.com';

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (__DEV__) {
      // Google Cloud Console의 "승인된 리디렉션 URI"에 이 값을 등록해야 로그인 팝업이 정상 동작한다.
      console.log('[google-auth] redirect uri:', AuthSession.makeRedirectUri());
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch((error) => {
        console.warn('Google 로그인 실패', error);
      });
    }
  }, [response]);

  const isConfigured = GOOGLE_WEB_CLIENT_ID.startsWith('REPLACE_WITH_') === false;

  return { request, promptAsync, isConfigured };
}
