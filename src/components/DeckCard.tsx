import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Play, Zap, BookOpen, Layers } from 'lucide-react-native';
import { Deck } from '../types/card';
import { triggerSelectionHaptic } from '../services/haptics';

interface DeckCardProps {
  deck: Deck;
  onPress: () => void;
  onStudy: () => void;
  onSpeedReview: () => void;
}

export const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onPress,
  onStudy,
  onSpeedReview,
}) => {
  const dueCount = deck.dueCount ?? 0;
  const newCount = deck.newCount ?? 0;

  const handleStudyPress = (e: any) => {
    e.stopPropagation();
    triggerSelectionHaptic();
    onStudy();
  };

  const handleSpeedPress = (e: any) => {
    e.stopPropagation();
    triggerSelectionHaptic();
    onSpeedReview();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, { borderLeftColor: deck.color || '#4F46E5' }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.languagePill}>
          <Text style={styles.languageText}>{deck.language.toUpperCase()}</Text>
        </View>

        <View style={styles.badgeRow}>
          {dueCount > 0 ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>{dueCount} DUE</Text>
            </View>
          ) : (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          )}
          {newCount > 0 && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{newCount} NEW</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title}>{deck.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {deck.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.countInfo}>
          <Layers size={15} color="#64748B" />
          <Text style={styles.countText}>{deck.cardCount} cards</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={handleSpeedPress}
            accessibilityLabel="Speed review"
          >
            <Zap size={15} color="#D97706" />
            <Text style={styles.speedButtonText}>Speed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.studyButton, { backgroundColor: deck.color || '#4F46E5' }]}
            onPress={handleStudyPress}
            accessibilityLabel="Study cards"
          >
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.studyButtonText}>Study</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  languagePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  languageText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dueBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  completedBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  countInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  studyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
