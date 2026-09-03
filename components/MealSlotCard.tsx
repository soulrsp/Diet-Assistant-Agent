import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/Themed';
import { identifyFoodFromPhoto } from '@/lib/geminiVision';
import { searchNutritionByName } from '@/lib/nutritionApi';
import { MealItem, MealSlotId, MEAL_SLOT_LABEL, Macros } from '@/lib/types';

type Props = {
  slot: MealSlotId;
  items: MealItem[];
  cameraCaptureEnabled: boolean;
  onAdd: (item: MealItem) => void;
  onRemove: (itemId: string) => void;
};

type Mode = 'idle' | 'processing' | 'confirm' | 'notfound' | 'search' | 'manual';

type PendingFood = Macros & { name: string; confidence?: number };

export default function MealSlotCard({ slot, items, cameraCaptureEnabled, onAdd, onRemove }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | undefined>();
  const [pendingResult, setPendingResult] = useState<PendingFood | null>(null);
  const [notFoundName, setNotFoundName] = useState('');
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', calories: '', carbs: '', protein: '', fat: '' });

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

    let guessedName = '';
    try {
      const guess = await identifyFoodFromPhoto(uri);
      guessedName = guess.name;
      const nutrition = await searchNutritionByName(guess.name);
      setPendingResult({ ...nutrition, confidence: guess.confidence });
      setMode('confirm');
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : '음식을 인식하지 못했습니다.';
      const message = guessedName ? `"${guessedName}"(으)로 인식했어요. ${rawMessage}` : rawMessage;
      goToNotFound(guessedName, message);
    }
  }

  function goToNotFound(name: string, message: string) {
    setNotFoundName(name);
    setNotFoundMessage(message);
    setMode('notfound');
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

  async function handleSearchSubmit() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const nutrition = await searchNutritionByName(query.trim());
      setPendingResult(nutrition);
      setMode('confirm');
    } catch (error) {
      goToNotFound(query.trim(), '정확히 일치하는 식품을 찾지 못했어요. 직접 입력해주세요.');
    } finally {
      setSearching(false);
    }
  }

  function goToManualEntry() {
    setManualForm({ name: notFoundName, calories: '', carbs: '', protein: '', fat: '' });
    setMode('manual');
  }

  function submitManualEntry() {
    if (!manualForm.name.trim()) return;
    onAdd({
      id: `${Date.now()}`,
      name: manualForm.name.trim(),
      calories: parseInt(manualForm.calories, 10) || 0,
      carbs: parseInt(manualForm.carbs, 10) || 0,
      protein: parseInt(manualForm.protein, 10) || 0,
      fat: parseInt(manualForm.fat, 10) || 0,
      photoUri: pendingPhotoUri,
      source: 'manual',
    });
    reset();
  }

  function reset() {
    setMode('idle');
    setPendingPhotoUri(undefined);
    setPendingResult(null);
    setNotFoundName('');
    setNotFoundMessage('');
    setQuery('');
  }

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
          <Text style={styles.processingText}>음식 인식 중...</Text>
        </View>
      )}

      {mode === 'confirm' && pendingResult && (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmName}>{pendingResult.name}</Text>
          <Text style={styles.itemMacro}>
            {pendingResult.calories}kcal · 탄{pendingResult.carbs} 단{pendingResult.protein} 지
            {pendingResult.fat}
          </Text>
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

      {mode === 'notfound' && (
        <View style={styles.confirmBox}>
          <Text style={styles.warnText}>{notFoundMessage}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={goToManualEntry}>
              <Text style={styles.actionBtnText}>직접 입력</Text>
            </Pressable>
            <Pressable style={styles.actionBtnGhost} onPress={() => setMode('search')}>
              <Text style={styles.actionBtnGhostText}>다시 검색</Text>
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
            placeholder="정확한 음식 이름 (예: 된장찌개)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            autoFocus
          />
          <Text style={styles.hintText}>식약처 DB에서 부분 일치로 검색해요. 결과가 이상하면 직접 입력해주세요.</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={handleSearchSubmit} disabled={searching}>
              <Text style={styles.actionBtnText}>{searching ? '검색 중...' : '검색'}</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtnGhost}
              onPress={() => {
                setNotFoundName(query.trim());
                goToManualEntry();
              }}>
              <Text style={styles.actionBtnGhostText}>바로 직접 입력</Text>
            </Pressable>
            <Pressable style={styles.actionBtnGhost} onPress={reset}>
              <Text style={styles.actionBtnGhostText}>취소</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mode === 'manual' && (
        <View style={styles.confirmBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="음식 이름"
            value={manualForm.name}
            onChangeText={(name) => setManualForm((f) => ({ ...f, name }))}
          />
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="칼로리(kcal)"
              keyboardType="number-pad"
              value={manualForm.calories}
              onChangeText={(calories) => setManualForm((f) => ({ ...f, calories }))}
            />
            <TextInput
              style={styles.manualInput}
              placeholder="탄수화물(g)"
              keyboardType="number-pad"
              value={manualForm.carbs}
              onChangeText={(carbs) => setManualForm((f) => ({ ...f, carbs }))}
            />
          </View>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="단백질(g)"
              keyboardType="number-pad"
              value={manualForm.protein}
              onChangeText={(protein) => setManualForm((f) => ({ ...f, protein }))}
            />
            <TextInput
              style={styles.manualInput}
              placeholder="지방(g)"
              keyboardType="number-pad"
              value={manualForm.fat}
              onChangeText={(fat) => setManualForm((f) => ({ ...f, fat }))}
            />
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={submitManualEntry}>
              <Text style={styles.actionBtnText}>추가</Text>
            </Pressable>
            <Pressable style={styles.actionBtnGhost} onPress={reset}>
              <Text style={styles.actionBtnGhostText}>취소</Text>
            </Pressable>
          </View>
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
  hintText: {
    fontSize: 11,
    color: '#6C7263',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2DFCF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
});
