import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X, Volume2, CheckCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react-native';
import { Card } from '../types/card';
import { getCards, recordCardReview } from '../services/storage';
import { speakText } from '../services/audio';
import {
  triggerLightHaptic,
  triggerSuccessHaptic,
  triggerWarningHaptic,
} from '../services/haptics';

export const TypingReviewScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deckId } = route.params || {};

  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadCards();
  }, [deckId]);

  const loadCards = async () => {
    const deckCards = await getCards(deckId);
    setCards(deckCards);
    setCurrentIndex(0);
    setInput('');
    setHasChecked(false);
    setIsCorrect(false);
    setCompleted(false);
    setScore(0);

    if (deckCards.length > 0) {
      speakText(deckCards[0].front, deckCards[0].audioLanguage);
    }
  };

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"¿¡]/g, '')
      .replace(/\s+/g, ' ');
  };

  const handleCheck = () => {
    if (!input.trim() || hasChecked) return;

    const currentCard = cards[currentIndex];
    const correct = normalize(input) === normalize(currentCard.front);

    setIsCorrect(correct);
    setHasChecked(true);

    if (correct) {
      triggerSuccessHaptic();
      setScore((prev) => prev + 1);
      recordCardReview(currentCard.id, 'good');
    } else {
      triggerWarningHaptic();
      recordCardReview(currentCard.id, 'again');
    }

    // Play pronunciation
    speakText(currentCard.front, currentCard.audioLanguage);
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setInput('');
      setHasChecked(false);
      setIsCorrect(false);

      speakText(cards[nextIdx].front, cards[nextIdx].audioLanguage);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completedContainer}>
          <CheckCircle size={64} color="#10B981" />
          <Text style={styles.completedTitle}>Spelling Drill Finished!</Text>
          <Text style={styles.completedSubtitle}>
            You scored {score} out of {cards.length} correct words!
          </Text>

          <TouchableOpacity style={styles.retryBtn} onPress={loadCards}>
            <RotateCcw size={16} color="#4F46E5" />
            <Text style={styles.retryBtnText}>Practice Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exitBtnText}>Back to Deck</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {cards.length}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.promptLabel}>Translate & Spell in target language:</Text>
          <Text style={styles.meaningText}>{currentCard.back}</Text>

          {currentCard.phonetic && (
            <Text style={styles.phoneticHint}>Hint: /{currentCard.phonetic}/</Text>
          )}

          <TouchableOpacity
            style={styles.speakerBtn}
            onPress={() => speakText(currentCard.front, currentCard.audioLanguage)}
          >
            <Volume2 size={20} color="#4F46E5" />
            <Text style={styles.speakerText}>Listen to pronunciation</Text>
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              hasChecked &&
                (isCorrect ? styles.inputCorrect : styles.inputWrong),
            ]}
            placeholder="Type answer here..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!hasChecked}
            onSubmitEditing={handleCheck}
          />

          {hasChecked && (
            <View
              style={[
                styles.feedbackBox,
                isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}
            >
              {isCorrect ? (
                <View style={styles.feedbackRow}>
                  <CheckCircle size={20} color="#059669" />
                  <Text style={styles.feedbackCorrectText}>Spot on! Perfect spelling.</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.feedbackRow}>
                    <AlertCircle size={20} color="#DC2626" />
                    <Text style={styles.feedbackWrongText}>Not quite right.</Text>
                  </View>
                  <Text style={styles.correctAnswerText}>
                    Correct answer: <Text style={{ fontWeight: '800' }}>{currentCard.front}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {!hasChecked ? (
            <TouchableOpacity
              style={[
                styles.checkBtn,
                !input.trim() && { opacity: 0.5 },
              ]}
              disabled={!input.trim()}
              onPress={handleCheck}
            >
              <Text style={styles.checkBtnText}>Check Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  meaningText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneticHint: {
    fontSize: 15,
    color: '#6366F1',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
  },
  speakerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  inputWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  feedbackBox: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  feedbackCorrect: {
    backgroundColor: '#ECFDF5',
  },
  feedbackWrong: {
    backgroundColor: '#FEF2F2',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackCorrectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  feedbackWrongText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#991B1B',
    marginTop: 6,
  },
  footer: {
    padding: 20,
  },
  checkBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
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
