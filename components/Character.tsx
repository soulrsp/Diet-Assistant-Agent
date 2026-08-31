import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

/**
 * 오리지널 새싹 캐릭터. 포인트/미션 없이, 오늘 기록 여부와 목표 대비 초과 정도에 따라
 * 표정과 배경만 가볍게 바뀐다. (CLAUDE.md #11)
 *
 * 참고: 사용자가 로스트아크 "모코코" 느낌을 요청했지만, 모코코는 스마일게이트의
 * 저작권 있는 캐릭터라 디자인을 그대로 재현하지 않았다. 대신 동글동글한 새싹 생물이라는
 * 아이디어만 참고해 완전히 다른 모양(둥근 눈물방울형 몸통 + 쌍둥이 새싹 잎)으로 새로 그렸다.
 *
 * 5단계: great > good > neutral > bad(주황, 차악) > worst(빨강, 최악).
 * 기록이 전혀 없는 날도 worst로 취급한다(별도 no-log 상태 없음).
 */

export type CharacterMood = 'great' | 'good' | 'neutral' | 'bad' | 'worst';

type Props = {
  mood: CharacterMood;
  message: string;
  size?: number;
};

const MOOD_STYLE: Record<CharacterMood, { body: string; leaf: string; bg: string }> = {
  great: { body: '#BFE6C9', leaf: '#6FB784', bg: '#EAF6EE' },
  good: { body: '#CDEBD3', leaf: '#7EBF8F', bg: '#F0F7F1' },
  neutral: { body: '#DCE6D6', leaf: '#9AB69E', bg: '#F2F0E6' },
  bad: { body: '#F5CFA0', leaf: '#D99A4E', bg: '#FBF1E2' },
  worst: { body: '#F0AAAA', leaf: '#CE6161', bg: '#FBEAEA' },
};

export default function Character({ mood, message, size = 104 }: Props) {
  const { body, leaf, bg } = MOOD_STYLE[mood];

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* 쌍둥이 새싹 잎 */}
        <Path d="M 44 30 Q 34 14 46 8 Q 50 20 44 30 Z" fill={leaf} />
        <Path d="M 56 30 Q 66 14 54 8 Q 50 20 56 30 Z" fill={leaf} />

        {/* 눈물방울형 몸통 */}
        <Ellipse cx={50} cy={60} rx={32} ry={30} fill={body} />

        {/* 볼 홍조 (great일 때만) */}
        {mood === 'great' && (
          <>
            <Ellipse cx={30} cy={64} rx={5} ry={3.5} fill="#F3A6A6" opacity={0.7} />
            <Ellipse cx={70} cy={64} rx={5} ry={3.5} fill="#F3A6A6" opacity={0.7} />
          </>
        )}

        {/* 눈 */}
        {mood === 'worst' ? (
          <>
            <Path d="M 32 55 Q 36 50 40 55" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d="M 60 55 Q 64 50 68 55" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Ellipse cx={36} cy={57} rx={3.5} ry={4.5} fill="#3A3F33" />
            <Ellipse cx={64} cy={57} rx={3.5} ry={4.5} fill="#3A3F33" />
          </>
        )}

        {/* 입 */}
        {mood === 'great' && (
          <Path d="M 36 68 Q 50 82 64 68" stroke="#3A3F33" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        )}
        {mood === 'good' && (
          <Path d="M 38 69 Q 50 76 62 69" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {mood === 'neutral' && (
          <Path d="M 40 71 L 60 71" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {mood === 'bad' && (
          <Path d="M 39 73 Q 50 67 61 73" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {mood === 'worst' && (
          <Path d="M 38 76 Q 50 66 62 76" stroke="#3A3F33" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
      </Svg>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    gap: 8,
  },
  message: {
    fontSize: 13,
    color: '#6C7263',
  },
});
