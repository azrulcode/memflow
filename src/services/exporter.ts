import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Card, Deck } from '../types/card';

function escapeCsvField(val?: string): string {
  if (!val) return '""';
  const clean = val.replace(/"/g, '""');
  return `"${clean}"`;
}

export function exportDeckToCsv(deck: Deck, cards: Card[]): string {
  const headers = ['Front', 'Back', 'Phonetic', 'PartOfSpeech', 'Example', 'ExampleTranslation', 'Notes'];
  const rows = cards.map((c) => [
    escapeCsvField(c.front),
    escapeCsvField(c.back),
    escapeCsvField(c.phonetic),
    escapeCsvField(c.partOfSpeech),
    escapeCsvField(c.example),
    escapeCsvField(c.exampleTranslation),
    escapeCsvField(c.notes),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportDeckToJson(deck: Deck, cards: Card[]): string {
  return JSON.stringify({ deck, cards }, null, 2);
}

export async function shareOrDownloadFile(
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // iOS / Android Native
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Export ${fileName}`,
      UTI: mimeType === 'application/json' ? 'public.json' : 'public.plain-text',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
