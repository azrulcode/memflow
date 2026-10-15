import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X, Trophy, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { Card, Rating } from '../types/card';
import { getCards, recordCardReview } from '../services/storage';
import { sortStudyCards } from '../services/srs';
import { speakText } from '../services/audio';
import { FlashCard } from '../components/FlashCard';
import { RatingBar } from '../components/RatingBar';
import { ProgressBar } from '../components/ProgressBar';
import { triggerSuccessHaptic, triggerSelectionHaptic } from '../services/haptics';

export const StudyScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deckId, title } = route.params || {};

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const cardStartTimeRef = useRef(Date.now());

  useEffect(() => {
    loadDeckCards();
  }, [deckId]);

  const loadDeckCards = async () => {
    setLoading(true);
    const allCards = await getCards(deckId);
    const sorted = sortStudyCards(allCards);
    setCards(sorted);
    setLoading(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setTotalXpEarned(0);
    setReviewCount(0);
    cardStartTimeRef.current = Date.now();

    // Auto-pronounce first word
    if (sorted.length > 0) {
      setTimeout(() => {
        speakText(sorted[0].front, sorted[0].audioLanguage);
      }, 300);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (rating: Rating) => {
    if (!cards[currentIndex]) return;

    const currentCard = cards[currentIndex];
    const duration = Date.now() - cardStartTimeRef.current;

    const { xpGained } = await recordCardReview(currentCard.id, rating, duration);
    setTotalXpEarned((prev) => prev + xpGained);
    setReviewCount((prev) => prev + 1);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
      cardStartTimeRef.current = Date.now();

      // Pronounce next card front word
      const nextCard = cards[currentIndex + 1];
      setTimeout(() => {
        speakText(nextCard.front, nextCard.audioLanguage);
      }, 250);
    } else {
      triggerSuccessHaptic();
      setSessionCompleted(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading study cards...</Text>
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Cards in this Deck</Text>
        <Text style={styles.emptySubtitle}>Add some cards or check other decks.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Session Completion View
  if (sessionCompleted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completedContainer}>
          <View style={styles.trophyCircle}>
            <Trophy size={54} color="#D97706" />
          </View>

          <Text style={styles.completedTitle}>Lesson Complete!</Text>
          <Text style={styles.completedSubtitle}>
            Great job! You reviewed {reviewCount} cards and sharpened your memory.
          </Text>

          <View style={styles.statsSummaryCard}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>+{totalXpEarned}</Text>
              <Text style={styles.statLabel}>XP EARNED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{reviewCount}</Text>
              <Text style={styles.statLabel}>CARDS REVIEWED</Text>
            </View>
          </View>

          <View style={styles.completionActions}>
            <TouchableOpacity
              style={styles.studyAgainButton}
              onPress={loadDeckCards}
            >
              <RotateCcw size={16} color="#4F46E5" />
              <Text style={styles.studyAgainText}>Review Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => navigation.goBack()}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.doneButtonText}>Finish Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = (currentIndex + 1) / cards.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          accessibilityLabel="Exit study session"
        >
          <X size={22} color="#64748B" />
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <ProgressBar progress={progress} color="#4F46E5" height={6} />
          <Text style={styles.progressCounter}>
            {currentIndex + 1} / {cards.length}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Main Flashcard */}
      <View style={styles.cardArea}>
        <FlashCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </View>

      {/* Rating Controls */}
      <View style={styles.ratingArea}>
        {isFlipped ? (
          <RatingBar
            card={currentCard}
            onRate={handleRating}
          />
        ) : (
          <TouchableOpacity
            style={styles.revealPrompt}
            activeOpacity={0.8}
            onPress={handleFlip}
          >
            <Sparkles size={16} color="#6366F1" />
            <Text style={styles.revealPromptText}>Tap card to show answer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  progressCounter: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingArea: {
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    minHeight: 85,
    justifyContent: 'center',
  },
  revealPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  revealPromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  statsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    justifyContent: 'space-around',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '100%',
  },
  completionActions: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  studyAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 16,
  },
  studyAgainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
