# Diet Assistant Agent

본인과 여자친구, 둘이서 쓰는 개인용 다이어트 기록 앱입니다. React Native(Expo) + Firebase로 만들었고, **웹 버전을 GitHub Pages로 배포**해서 브라우저로 접속해서 씁니다.

👉 https://soulrsp.github.io/Diet-Assistant-Agent

## 주요 기능

- 오늘 탭: 아침/간식/영양제/점심/저녁 + 당일 몸무게를 한 화면에서 기록
- 음식 사진 인식(1차 자동 인식 → 실패 시 수동 검색)
- 눈바디 사진 기록 (기기 로컬 저장 전용, 서버 업로드 안 함 — 현재 웹 버전에서는 비활성화)
- 몸무게·칼로리 이중축 추이 그래프 + 목표선
- 매일 기록 리마인더 알림 (웹 브라우저 지원 범위 내)
- 새싹이 캐릭터 반응 (오리지널 디자인, 5단계 기분)

설계 배경과 결정 사항은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 배포

`main` 브랜치에 push하면 [GitHub Actions](./.github/workflows/deploy.yml)가 자동으로 웹 빌드를 만들어 `gh-pages` 브랜치에 배포합니다. 수동으로 배포하려면:

```bash
npm run deploy
```

## 로컬 실행

```bash
npm install
npx expo start --web
```

## Firebase 설정

`lib/firebase.ts`에 Firebase 프로젝트 설정값이 들어있습니다. 개인용 앱이라 클라이언트에 키를 그대로 두는 방식을 택했습니다(자세한 이유는 CLAUDE.md #6 참고). Firestore 보안 규칙으로 실제 접근 권한을 제어합니다.

## 기술 스택

- React Native (Expo, expo-router, web output)
- Firebase Auth(이메일/비밀번호 + Google) + Firestore
- expo-image-picker, expo-notifications
- react-native-svg 기반 커스텀 차트
- GitHub Actions + gh-pages를 통한 자동 배포
