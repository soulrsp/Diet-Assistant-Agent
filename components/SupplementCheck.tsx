import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { MealSlotId, MEAL_SLOT_LABEL } from '@/lib/types';

type Props = {
  slot: MealSlotId;
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

export default function SupplementCheck({ slot, checked, onToggle }: Props) {
  return (
    <Pressable style={styles.card} onPress={() => onToggle(!checked)}>
      <View style={styles.row}>
        <Text style={styles.title}>{MEAL_SLOT_LABEL[slot]}</Text>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <Text style={styles.subtitle}>{checked ? '오늘 챙겨 먹었어요' : '복용 여부를 체크해주세요'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    color: '#6C7263',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2DFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4E6B4C',
    borderColor: '#4E6B4C',
  },
  checkmark: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
