import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Card, Deck } from '../types/card';

export interface ParseResult {
  cards: Card[];
  totalParsed: number;
  warnings: string[];
}

/**
 * Strips HTML tags commonly found in Anki exports (e.g. <b>, <div>, <br>)
 */
export function cleanAnkiHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Auto-detects delimiter: tab (\t), comma (,), semicolon (;), or pipe (|)
 */
function detectDelimiter(lines: string[]): string {
  let tabs = 0;
  let commas = 0;
  let semicolons = 0;
  let pipes = 0;

  for (const line of lines.slice(0, 10)) {
    if (line.startsWith('#')) continue;
    tabs += (line.match(/\t/g) || []).length;
    commas += (line.match(/,/g) || []).length;
    semicolons += (line.match(/;/g) || []).length;
    pipes += (line.match(/\|/g) || []).length;
  }

  if (tabs >= commas && tabs >= semicolons && tabs > 0) return '\t';
  if (commas >= semicolons && commas > 0) return ',';
  if (semicolons > 0) return ';';
  if (pipes > 0) return '|';
  return '\t'; // Default Anki delimiter
}

/**
 * Parses CSV/TSV/Anki text format into MemFlow cards
 */
export function parseDelimitedText(
  rawText: string,
  deckId: string,
  audioLanguage: string = 'ru-RU'
): ParseResult {
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const cards: Card[] = [];
  const warnings: string[] = [];

  const validLines = lines.filter((l) => !l.startsWith('#'));
  if (validLines.length === 0) {
    return { cards: [], totalParsed: 0, warnings: ['No card data found in text'] };
  }

  const delimiter = detectDelimiter(validLines);

  for (let i = 0; i < validLines.length; i++) {
    const line = validLines[i];
    // Check if header row like Front, Back
    if (i === 0 && (line.toLowerCase().includes('front') || line.toLowerCase().includes('word'))) {
      continue;
    }

    const parts = line.split(delimiter).map((p) => cleanAnkiHtml(p.trim()));
    if (parts.length >= 2) {
      const front = parts[0];
      const back = parts[1];
      const phonetic = parts[2] || undefined;
      const partOfSpeech = parts[3] || undefined;
      const example = parts[4] || undefined;
      const exampleTranslation = parts[5] || undefined;
      const notes = parts[6] || undefined;

      if (front && back) {
        cards.push({
          id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          deckId,
          front,
          back,
          phonetic,
          partOfSpeech,
          example,
          exampleTranslation,
          notes,
          audioLanguage,
          repetitions: 0,
          interval: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          state: 'new',
        });
      }
    } else {
      warnings.push(`Line ${i + 1} skipped: less than 2 columns`);
    }
  }

  return { cards, totalParsed: cards.length, warnings };
}

/**
 * Opens DocumentPicker to pick CSV, TSV, TXT, or JSON file and reads its content
 */
export async function pickAndReadFile(): Promise<{ fileName: string; content: string } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/*', 'application/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.name;

    let content = '';
    if (Platform.OS === 'web') {
      if (asset.file) {
        content = await asset.file.text();
      } else if (asset.uri) {
        const response = await fetch(asset.uri);
        content = await response.text();
      }
    } else {
      content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    return { fileName, content };
  } catch (error) {
    console.warn('Error reading picked file:', error);
    return null;
  }
}
