import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X, Heart, Zap, Volume2, Award, RotateCcw } from 'lucide-react-native';
import { Card } from '../types/card';
import { getCards, recordCardReview } from '../services/storage';
import { speakText } from '../services/audio';
import {
  triggerLightHaptic,
  triggerMediumHaptic,
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '../services/haptics';

const QUESTION_TIME_SECONDS = 5;

interface Choice {
  text: string;
  isCorrect: boolean;
}

export const SpeedReviewScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deckId } = route.params || {};

  const [allCards, setAllCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadCards();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deckId]);

  const loadCards = async () => {
    const cards = await getCards(deckId);
    // Shuffle cards for speed review
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setAllCards(shuffled);
    setCurrentIndex(0);
    setLives(3);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setGameOver(false);
    setVictory(false);
    setIsAnswered(false);
    setSelectedChoiceIndex(null);

    if (shuffled.length > 0) {
      setupQuestion(shuffled[0], shuffled);
    }
  };

  const setupQuestion = (card: Card, cardPool: Card[]) => {
    setIsAnswered(false);
    setSelectedChoiceIndex(null);

    // Speak word
    speakText(card.front, card.audioLanguage);

    // Generate 3 distractors
    const otherCards = cardPool.filter((c) => c.id !== card.id);
    const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
    const distractorTexts = shuffledOthers.slice(0, 3).map((c) => c.back);

    // If less than 3, fallback mock items
    while (distractorTexts.length < 3) {
      distractorTexts.push('Other expression');
    }

    const currentChoices: Choice[] = [
      { text: card.back, isCorrect: true },
      { text: distractorTexts[0], isCorrect: false },
      { text: distractorTexts[1], isCorrect: false },
      { text: distractorTexts[2], isCorrect: false },
    ].sort(() => Math.random() - 0.5);

    setChoices(currentChoices);

    // Reset and start countdown timer
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: QUESTION_TIME_SECONDS * 1000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isAnswered) {
        handleTimeout(card);
      }
    });
  };

  const handleTimeout = (card: Card) => {
    triggerWarningHaptic();
    setIsAnswered(true);
    setCombo(1);
    const newLives = lives - 1;
    setLives(newLives);

    recordCardReview(card.id, 'again');

    if (newLives <= 0) {
      setGameOver(true);
    } else {
      setTimeout(() => advanceToNext(card), 1000);
    }
  };

  const handleSelectChoice = (choice: Choice, index: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedChoiceIndex(index);
    timerAnim.stopAnimation();

    const currentCard = allCards[currentIndex];

    if (choice.isCorrect) {
      triggerSuccessHaptic();
      const points = 100 * combo;
      setScore((prev) => prev + points);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      // Record as good review in SRS
      recordCardReview(currentCard.id, 'good');
    } else {
      triggerWarningHaptic();
      setCombo(1);
      const newLives = lives - 1;
      setLives(newLives);

      recordCardReview(currentCard.id, 'again');

      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 800);
        return;
      }
    }

    setTimeout(() => advanceToNext(currentCard), 900);
  };

  const advanceToNext = (lastCard: Card) => {
    if (currentIndex + 1 < allCards.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupQuestion(allCards[nextIdx], allCards);
    } else {
      setVictory(true);
    }
  };

  if (gameOver || victory) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.endContainer}>
          <Award size={64} color={victory ? '#F59E0B' : '#64748B'} />
          <Text style={styles.endTitle}>
            {victory ? 'Speed Drill Crushed!' : 'Game Over'}
          </Text>
          <Text style={styles.endSubtitle}>
            {victory
              ? 'Incredible reflexes! You conquered all cards under pressure.'
              : 'Out of lives! Keep training your rapid recall.'}
          </Text>

          <View style={styles.scoreBoard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Final Score</Text>
              <Text style={styles.scoreValue}>{score} pts</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Max Streak Combo</Text>
              <Text style={styles.scoreValue}>{maxCombo}x 🔥</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.retryBtn} onPress={loadCards}>
            <RotateCcw size={16} color="#4F46E5" />
            <Text style={styles.retryBtnText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exitBtnText}>Back to Decks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = allCards[currentIndex];
  if (!currentCard) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Hearts & Combo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <X size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Combo multiplier badge */}
        <View style={styles.comboPill}>
          <Zap size={14} color="#D97706" />
          <Text style={styles.comboText}>{combo}x Combo</Text>
        </View>

        {/* Lives */}
        <View style={styles.livesRow}>
          {[1, 2, 3].map((heartIndex) => (
            <Heart
              key={heartIndex}
              size={20}
              color="#EF4444"
              fill={heartIndex <= lives ? '#EF4444' : '#E2E8F0'}
            />
          ))}
        </View>
      </View>

      {/* Countdown Timer Line */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerBar,
            {
              width: timerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Word Prompt Card */}
      <View style={styles.promptArea}>
        <TouchableOpacity
          style={styles.speakerIcon}
          onPress={() => speakText(currentCard.front, currentCard.audioLanguage)}
        >
          <Volume2 size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.promptWord}>{currentCard.front}</Text>
        {currentCard.phonetic && (
          <Text style={styles.promptPhonetic}>/{currentCard.phonetic}/</Text>
        )}
      </View>

      {/* Choices Grid */}
      <View style={styles.choicesGrid}>
        {choices.map((choice, index) => {
          const isSelected = selectedChoiceIndex === index;
          const showCorrect = isAnswered && choice.isCorrect;
          const showWrong = isAnswered && isSelected && !choice.isCorrect;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              disabled={isAnswered}
              onPress={() => handleSelectChoice(choice, index)}
              style={[
                styles.choiceBtn,
                showCorrect && styles.correctChoiceBtn,
                showWrong && styles.wrongChoiceBtn,
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  showCorrect && styles.correctChoiceText,
                  showWrong && styles.wrongChoiceText,
                ]}
              >
                {choice.text}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  comboText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  timerTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  promptArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  speakerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptWord: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  promptPhonetic: {
    fontSize: 16,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
  },
  choicesGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  choiceBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  correctChoiceBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  correctChoiceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  wrongChoiceBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  wrongChoiceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  endContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  endTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  endSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scoreBoard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
    marginBottom: 10,
  },
  retryBtnText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },
  exitBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  exitBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
});
