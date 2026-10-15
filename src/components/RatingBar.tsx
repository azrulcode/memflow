import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Card, Rating } from '../types/card';
import { getEstimatedIntervalLabel } from '../services/srs';
import {
  triggerMediumHaptic,
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '../services/haptics';

interface RatingBarProps {
  card: Card;
  disabled?: boolean;
  onRate: (rating: Rating) => void;
}

export const RatingBar: React.FC<RatingBarProps> = ({ card, disabled = false, onRate }) => {
  const handlePress = (rating: Rating) => {
    if (disabled) return;
    if (rating === 'again') {
      triggerWarningHaptic();
    } else if (rating === 'easy') {
      triggerSuccessHaptic();
    } else {
      triggerMediumHaptic();
    }
    onRate(rating);
  };

  const ratings: { key: Rating; label: string; color: string; bgColor: string; borderColor: string }[] = [
    {
      key: 'again',
      label: 'Again',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FCA5A5',
    },
    {
      key: 'hard',
      label: 'Hard',
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FCD34D',
    },
    {
      key: 'good',
      label: 'Good',
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#6EE7B7',
    },
    {
      key: 'easy',
      label: 'Easy',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      borderColor: '#A5B4FC',
    },
  ];

  return (
    <View style={styles.container}>
      {ratings.map((item) => {
        const intervalPreview = getEstimatedIntervalLabel(card, item.key);

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => handlePress(item.key)}
            style={[
              styles.button,
              {
                backgroundColor: item.bgColor,
                borderColor: item.borderColor,
                opacity: disabled ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.intervalText, { color: item.color }]}>
              {intervalPreview}
            </Text>
            <Text style={[styles.labelText, { color: item.color }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  intervalText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
    opacity: 0.85,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
