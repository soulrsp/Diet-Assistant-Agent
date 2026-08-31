import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { BodyPhotoEntry, listBodyPhotos, saveBodyPhoto } from '@/lib/bodyPhotoStorage';
import { todayKey } from '@/lib/storage';

export default function BodyLogScreen() {
  const [photos, setPhotos] = useState<BodyPhotoEntry[]>([]);
  const [selected, setSelected] = useState<BodyPhotoEntry | null>(null);

  const load = useCallback(() => {
    setPhotos(listBodyPhotos());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addTodayPhoto(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('권한 필요', '사진에 접근하려면 권한을 허용해주세요.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [3, 4] });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const entry = await saveBodyPhoto(todayKey(), result.assets[0].uri);
    setSelected(entry);
    load();
  }

  return (
    <View style={styles.container}>
      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          눈바디 사진은 서버에 올라가지 않고, 이 기기 안에만 저장됩니다.
        </Text>
      </View>

      {selected && (
        <View style={styles.previewWrap}>
          <Image source={{ uri: selected.uri }} style={styles.previewImage} contentFit="cover" />
          <Text style={styles.previewDate}>{dayjs(selected.dateKey).format('YYYY.MM.DD')}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={() => addTodayPhoto(true)}>
          <Text style={styles.actionBtnText}>오늘 눈바디 촬영</Text>
        </Pressable>
        <Pressable style={styles.actionBtnGhost} onPress={() => addTodayPhoto(false)}>
          <Text style={styles.actionBtnGhostText}>앨범에서 선택</Text>
        </Pressable>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.dateKey}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable style={styles.thumbWrap} onPress={() => setSelected(item)}>
            <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
            <Text style={styles.thumbDate}>{dayjs(item.dateKey).format('M/D')}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>아직 기록된 눈바디 사진이 없어요.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  noticeBox: {
    backgroundColor: '#EDEBE0',
    borderRadius: 10,
    padding: 10,
  },
  noticeText: {
    fontSize: 12,
    color: '#6C7263',
  },
  previewWrap: {
    alignItems: 'center',
    gap: 6,
  },
  previewImage: {
    width: 180,
    height: 240,
    borderRadius: 16,
  },
  previewDate: {
    fontSize: 13,
    color: '#6C7263',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#E1611F',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionBtnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2DFCF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnGhostText: {
    color: '#6C7263',
    fontWeight: '600',
  },
  grid: {
    gap: 8,
    paddingTop: 8,
  },
  thumbWrap: {
    flex: 1 / 3,
    padding: 4,
    alignItems: 'center',
  },
  thumb: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
  },
  thumbDate: {
    fontSize: 11,
    color: '#6C7263',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6C7263',
    marginTop: 40,
  },
});
