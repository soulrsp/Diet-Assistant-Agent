import { Directory, File, Paths } from 'expo-file-system';

/**
 * 눈바디 사진 전용 로컬 저장소.
 * 설계 결정: 눈바디 사진은 가장 민감한 개인 신체 이미지이므로 서버(Firebase)에 올리지 않고
 * 기기 documentDirectory 안에서만 관리한다. (CLAUDE.md #5 참고)
 */

function bodyLogDir(): Directory {
  const dir = new Directory(Paths.document, 'bodylog');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

export type BodyPhotoEntry = {
  dateKey: string; // YYYY-MM-DD
  uri: string;
};

export async function saveBodyPhoto(dateKey: string, sourceUri: string): Promise<BodyPhotoEntry> {
  const dir = bodyLogDir();
  const dest = new File(dir, `${dateKey}.jpg`);
  if (dest.exists) {
    dest.delete();
  }
  const source = new File(sourceUri);
  await source.copy(dest);
  return { dateKey, uri: dest.uri };
}

export function listBodyPhotos(): BodyPhotoEntry[] {
  const dir = bodyLogDir();
  if (!dir.exists) return [];

  const entries = dir
    .list()
    .filter((item): item is File => item instanceof File)
    .map((file) => ({
      dateKey: file.name.replace(/\.jpg$/i, ''),
      uri: file.uri,
    }));

  return entries.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

export function deleteBodyPhoto(dateKey: string): void {
  const dir = bodyLogDir();
  const file = new File(dir, `${dateKey}.jpg`);
  if (file.exists) {
    file.delete();
  }
}
