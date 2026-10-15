import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function triggerLightHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore if not supported on simulator
    }
  }
}

export function triggerMediumHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }
}

export function triggerSuccessHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }
}

export function triggerWarningHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }
}

export function triggerSelectionHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      Haptics.selectionAsync();
    } catch {}
  }
}
