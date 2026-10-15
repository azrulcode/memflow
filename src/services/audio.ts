import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export async function speakText(text: string, languageCode: string = 'en-US', rate: number = 0.9): Promise<void> {
  if (!text || text.trim() === '') return;

  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: languageCode,
      pitch: 1.0,
      rate: Platform.OS === 'ios' ? 0.5 : rate, // iOS speech rate scaling is different
      onError: (err) => {
        console.warn('Speech error:', err);
      },
    });
  } catch (error) {
    console.warn('Speech playback failed:', error);
  }
}

export async function stopSpeech(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    // Ignore error if speech already stopped
  }
}
