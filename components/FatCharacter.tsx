import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * inout의 "지방이" 캐릭터에서 영감을 받은 가벼운 반응형 캐릭터.
 * 포인트/미션 없이, 오늘 기록 여부와 몸무게 변화 방향에 따라 표정과 배경만 바뀐다. (CLAUDE.md #11)
 */

export type CharacterMood = 'great' | 'good' | 'neutral' | 'no-log';

type Props = {
  mood: CharacterMood;
  message: string;
  size?: number;
};

const MOOD_STYLE: Record<CharacterMood, { body: string; bg: string }> = {
  great: { body: '#FFC98A', bg: '#FFF3E2' },
  good: { body: '#FFD9A6', bg: '#FBF6EA' },
  neutral: { body: '#E8D9B8', bg: '#F2F0E6' },
  'no-log': { body: '#D8D4C2', bg: '#EDEBE0' },
};

export default function FatCharacter({ mood, message, size = 96 }: Props) {
  const { body, bg } = MOOD_STYLE[mood];

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={55} r={38} fill={body} />
        <Circle cx={35} cy={48} r={4.5} fill="#3A3226" />
        <Circle cx={65} cy={48} r={4.5} fill="#3A3226" />
        {mood === 'great' && (
          <Path d="M 32 62 Q 50 78 68 62" stroke="#3A3226" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        )}
        {mood === 'good' && (
          <Path d="M 34 63 Q 50 72 66 63" stroke="#3A3226" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {mood === 'neutral' && (
          <Path d="M 36 65 L 64 65" stroke="#3A3226" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {mood === 'no-log' && (
          <Path d="M 34 68 Q 50 58 66 68" stroke="#3A3226" strokeWidth={3} fill="none" strokeLinecap="round" />
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
