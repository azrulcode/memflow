import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react-native';
import { UserStats } from '../types/card';
import { getUserStats, getCards, resetToDefaultData } from '../services/storage';
import { ProgressBar } from '../components/ProgressBar';
import { triggerSuccessHaptic } from '../services/haptics';

export const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [totalCards, setTotalCards] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);

  const loadData = async () => {
    const s = await getUserStats();
    const cards = await getCards();
    setStats(s);
    setTotalCards(cards.length);
    setMasteredCount(cards.filter((c) => c.state === 'mastered').length);
    setLearningCount(cards.filter((c) => c.state === 'review' || c.state === 'learning').length);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleResetData = () => {
    const doReset = async () => {
      await resetToDefaultData();
      triggerSuccessHaptic();
      await loadData();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset all decks and reviews to original starter data?')) {
        doReset();
      }
    } else {
      Alert.alert(
        'Reset Starter Decks',
        'Restore the original Spanish, Japanese, and French starter decks?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  if (!stats) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Learning Progress</Text>

        {/* Big Streak Card (Duolingo style) */}
        <View style={styles.streakCard}>
          <View style={styles.streakFlameCircle}>
            <Flame size={48} color="#EA580C" fill="#EA580C" />
          </View>
          <Text style={styles.streakNumber}>{stats.streakDays}</Text>
          <Text style={styles.streakTitle}>Day Learning Streak!</Text>
          <Text style={styles.streakSubtitle}>
            Consistent daily repetition is the secret to fluent memory.
          </Text>
        </View>

        {/* Daily Goal Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitle}>
              <Sparkles size={18} color="#6366F1" />
              <Text style={styles.cardTitle}>Today's Goal</Text>
            </View>
            <Text style={styles.cardSubtext}>
              {stats.todayReviews} / {stats.dailyGoal} reviews
            </Text>
          </View>
          <ProgressBar
            progress={stats.todayReviews / stats.dailyGoal}
            color="#6366F1"
            height={10}
          />
        </View>

        {/* Performance Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.gridBox}>
            <Trophy size={24} color="#D97706" />
            <Text style={styles.gridValue}>{stats.xpTotal}</Text>
            <Text style={styles.gridLabel}>Total XP Earned</Text>
          </View>

          <View style={styles.gridBox}>
            <CheckCircle2 size={24} color="#059669" />
            <Text style={styles.gridValue}>{stats.totalReviews}</Text>
            <Text style={styles.gridLabel}>Total Reviews Done</Text>
          </View>

          <View style={styles.gridBox}>
            <Layers size={24} color="#2563EB" />
            <Text style={styles.gridValue}>{masteredCount}</Text>
            <Text style={styles.gridLabel}>Cards Mastered</Text>
          </View>

          <View style={styles.gridBox}>
            <Calendar size={24} color="#7C3AED" />
            <Text style={styles.gridValue}>{learningCount}</Text>
            <Text style={styles.gridLabel}>Active In Review</Text>
          </View>
        </View>

        {/* SRS Memory Engine Info */}
        <View style={styles.engineCard}>
          <Text style={styles.engineTitle}>Spaced Repetition Engine</Text>
          <Text style={styles.engineDescription}>
            MemFlow adapts review intervals using SuperMemo SM-2. When you recall easily, intervals multiply exponentially, protecting your vocabulary from the Ebbinghaus forgetting curve.
          </Text>
        </View>

        {/* Reset starter data */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
          <RotateCcw size={16} color="#64748B" />
          <Text style={styles.resetText}>Restore Starter Decks & Reset</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  streakCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  streakFlameCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#C2410C',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 13,
    color: '#C2410C',
    textAlign: 'center',
    maxWidth: 260,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtext: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  gridValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  engineCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  engineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 6,
  },
  engineDescription: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 8,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
