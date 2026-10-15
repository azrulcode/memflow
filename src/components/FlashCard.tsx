import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Volume2, Sparkles, BookOpen, RotateCw } from 'lucide-react-native';
import { Card } from '../types/card';
import { speakText } from '../services/audio';
import { triggerLightHaptic, triggerSelectionHaptic } from '../services/haptics';

interface FlashCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 36, 440);
const CARD_HEIGHT = Math.min(width * 1.05, 460);

export const FlashCard: React.FC<FlashCardProps> = ({ card, isFlipped, onFlip }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isFlipped]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = animatedValue.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const handleCardPress = () => {
    triggerLightHaptic();
    onFlip();
  };

  const handlePlayAudio = (e: any, text: string) => {
    e.stopPropagation();
    triggerSelectionHaptic();
    speakText(text, card.audioLanguage);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Front Face */}
      <Animated.View
        style={[
          styles.card,
          styles.frontCard,
          {
            transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleCardPress}
          style={styles.innerTouchable}
        >
          <View style={styles.topBadgeRow}>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>
                {card.state === 'new' ? '🌱 NEW' : card.state === 'mastered' ? '⭐ MASTERED' : '🔄 REVIEW'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => handlePlayAudio(e, card.front)}
              style={styles.audioButton}
              accessibilityLabel="Pronounce word"
            >
              <Volume2 size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.frontText}>{card.front}</Text>
            {card.phonetic && (
              <Text style={styles.phoneticText}>/{card.phonetic}/</Text>
            )}
          </View>

          <View style={styles.bottomHintRow}>
            <RotateCw size={15} color="#94A3B8" />
            <Text style={styles.bottomHintText}>Tap to reveal translation</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.card,
          styles.backCard,
          {
            transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleCardPress}
          style={styles.innerTouchable}
        >
          <View style={styles.topBadgeRow}>
            {card.partOfSpeech ? (
              <View style={styles.posBadge}>
                <Text style={styles.posBadgeText}>{card.partOfSpeech.toUpperCase()}</Text>
              </View>
            ) : <View />}
            <TouchableOpacity
              onPress={(e) => handlePlayAudio(e, card.front)}
              style={styles.audioButton}
            >
              <Volume2 size={24} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.backMainText}>{card.back}</Text>
            <Text style={styles.originalSubText}>{card.front}</Text>

            {card.example && (
              <View style={styles.exampleBox}>
                <View style={styles.exampleHeader}>
                  <BookOpen size={14} color="#6366F1" />
                  <Text style={styles.exampleLabel}>Example</Text>
                </View>
                <Text style={styles.exampleText}>{card.example}</Text>
                {card.exampleTranslation && (
                  <Text style={styles.exampleTranslationText}>
                    "{card.exampleTranslation}"
                  </Text>
                )}
              </View>
            )}

            {card.notes && (
              <View style={styles.notesBox}>
                <Sparkles size={14} color="#D97706" />
                <Text style={styles.notesText}>{card.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomHintRow}>
            <Text style={styles.bottomHintText}>Rate below to schedule next review</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginVertical: 12,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: '#FFFFFF',
  },
  backCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  innerTouchable: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stateBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  posBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  posBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  frontText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneticText: {
    fontSize: 18,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backMainText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  originalSubText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    marginTop: 6,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  exampleTranslationText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    width: '100%',
  },
  notesText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  bottomHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomHintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
