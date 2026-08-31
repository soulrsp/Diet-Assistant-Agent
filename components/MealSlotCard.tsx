import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import {
  LOW_CONFIDENCE_THRESHOLD,
  recognizeFoodPhoto,
  searchFoodByName,
} from '@/lib/mockVision';
import { MealItem, MealSlotId, MEAL_SLOT_LABEL, Macros } from '@/lib/types';

type Props = {
  slot: MealSlotId;
  items: MealItem[];
  cameraCaptureEnabled: boolean;
  onAdd: (item: MealItem) => void;
  onRemove: (itemId: string) => void;
};

type Mode = 'idle' | 'processing' | 'confirm' | 'search';

export default function MealSlotCard({ slot, items, cameraCaptureEnabled, onAdd, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | undefined>();
  const [pendingResult, setPendingResult] = useState<(Macros & { name: string; confidence?: number }) | null>(null);
  const [query, setQuery] = useState('');

  const slotCalories = items.reduce((sum, item) => sum + item.calories, 0);

  async function pickAndRecognize(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '사진에 접근하려면 권한을 허용해주세요.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const uri = result.assets[0].uri;
    setPendingPhotoUri(uri);
    setMode('processing');

    const recognized = await recognizeFoodPhoto(uri);
    setPendingResult(recognized);
    setMode('confirm');
  }

  function confirmPending() {
    if (!pendingResult) return;
    onAdd({
      id: `${Date.now()}`,
      name: pendingResult.name,
      calories: pendingResult.calories,
      carbs: pendingResult.carbs,
      protein: pendingResult.protein,
      fat: pendingResult.fat,
      photoUri: pendingPhotoUri,
      source: 'photo-auto',
    });
    reset();
  }

  function addManual(food: Macros & { name: string }) {
    onAdd({
      id: `${Date.now()}`,
      name: food.name,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      source: 'manual',
    });
    reset();
  }

  function reset() {
    setMode('idle');
    setPendingPhotoUri(undefined);
    setPendingResult(null);
    setQuery('');
  }

  const searchResults = mode === 'search' ? searchFoodByName(query) : [];
  const isLowConfidence = (pendingResult?.confidence ?? 1) < LOW_CONFIDENCE_THRESHOLD;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{MEAL_SLOT_LABEL[slot]}</Text>
        {slotCalories > 0 && <Text style={styles.calorieBadge}>{slotCalories} kcal</Text>}
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemName}>
            {item.name} {item.source === 'photo-auto' ? '📷' : ''}
          </Text>
          <Text style={styles.itemMacro}>
            {item.calories}kcal · 탄{item.carbs} 단{item.protein} 지{item.fat}
          </Text>
          <Pressable onPress={() => onRemove(item.id)} hitSlop={8}>
            <Text style={styles.removeText}>삭제</Text>
          </Pressable>
        </View>
      ))}

      {mode === 'idle' && (
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => pickAndRecognize(false)}>
            <Text style={styles.actionBtnText}>🖼 사진첩에서 기록</Text>
          </Pressable>
          {cameraCaptureEnabled && (
            <Pressable style={styles.actionBtnGhost} onPress={() => pickAndRecognize(true)}>
              <Text style={styles.actionBtnGhostText}>📷 카메라로 촬영</Text>
            </Pressable>
          )}
          <Pressable style={styles.actionBtnGhost} onPress={() => setMode('search')}>
            <Text style={styles.actionBtnGhostText}>직접 검색</Text>
          </Pressable>
        </View>
      )}

      {mode === 'processing' && (
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color="#E1611F" />
          <Text style={styles.processingText}>음식 인식 중... (목업)</Text>
        </View>
      )}

      {mode === 'confirm' && pendingResult && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmName}>{pendingResult.name}</Text>
          <Text style={styles.itemMacro}>
            {pendingResult.calories}kcal · 탄{pendingResult.carbs} 단{pendingResult.protein} 지
            {pendingResult.fat}
          </Text>
          {isLowConfidence && (
            <Text style={styles.warnText}>인식 정확도가 낮아요. 다르면 직접 검색으로 바꿔주세요.</Text>
          )}
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={confirmPending}>
              <Text style={styles.actionBtnText}>이 결과로 기록</Text>
            </Pressable>
            <Pressable style={styles.actionBtnGhost} onPress={() => setMode('search')}>
              <Text style={styles.actionBtnGhostText}>직접 검색</Text>
            </Pressable>
            <Pressable style={styles.actionBtnGhost} onPress={reset}>
              <Text style={styles.actionBtnGhostText}>취소</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mode === 'search' && (
        <View style={styles.confirmBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="음식 이름 검색 (예: 현미밥)"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {searchResults.map((food) => (
            <Pressable key={food.name} style={styles.searchResultRow} onPress={() => addManual(food)}>
              <Text style={styles.itemName}>{food.name}</Text>
              <Text style={styles.itemMacro}>{food.calories}kcal</Text>
            </Pressable>
          ))}
          {query.length > 0 && searchResults.length === 0 && (
            <Text style={styles.warnText}>검색 결과가 없어요. (목업 DB에는 8종만 있어요)</Text>
          )}
          <Pressable style={styles.actionBtnGhost} onPress={reset}>
            <Text style={styles.actionBtnGhostText}>취소</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  calorieBadge: {
    fontSize: 12,
    color: '#4E6B4C',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 14,
    flexShrink: 1,
  },
  itemMacro: {
    fontSize: 12,
    color: '#6C7263',
  },
  removeText: {
    fontSize: 12,
    color: '#B4791A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    backgroundColor: '#E1611F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnGhost: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2DFCF',
  },
  actionBtnGhostText: {
    fontSize: 13,
    color: '#6C7263',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 13,
    color: '#6C7263',
  },
  confirmBox: {
    gap: 8,
  },
  confirmName: {
    fontSize: 15,
    fontWeight: '600',
  },
  warnText: {
    fontSize: 12,
    color: '#B4791A',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F0E6',
  },
});
