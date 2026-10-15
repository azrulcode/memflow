import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = '#10B981',
  backgroundColor = '#E2E8F0',
  height = 8,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { backgroundColor, height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
