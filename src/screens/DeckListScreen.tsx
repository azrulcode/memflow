import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Flame, Zap, Plus, BookOpen, Sparkles, Trophy, Upload } from 'lucide-react-native';
import { Deck, UserStats } from '../types/card';
import { getDecks, getUserStats, initializeStorage } from '../services/storage';
import { DeckCard } from '../components/DeckCard';
import { ProgressBar } from '../components/ProgressBar';
import { triggerSelectionHaptic } from '../services/haptics';

export const DeckListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    await initializeStorage();
    const loadedDecks = await getDecks();
    const loadedStats = await getUserStats();
    setDecks(loadedDecks);
    setStats(loadedStats);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalDue = decks.reduce((sum, d) => sum + (d.dueCount || 0), 0);
  const totalCards = decks.reduce((sum, d) => sum + (d.cardCount || 0), 0);

  const handleQuickStudy = () => {
    triggerSelectionHaptic();
    // Find the deck with most due cards
    const deckWithDue = [...decks].sort((a, b) => (b.dueCount || 0) - (a.dueCount || 0))[0];
    if (deckWithDue) {
      navigation.navigate('Study', { deckId: deckWithDue.id, title: deckWithDue.title });
    }
  };

  const handleCreateDeck = () => {
    triggerSelectionHaptic();
    navigation.navigate('DeckEditor', {});
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Gamification Bar */}
        <View style={styles.topStatsBar}>
          <View style={styles.statPill}>
            <Flame size={18} color="#EA580C" fill="#EA580C" />
            <Text style={styles.streakText}>{stats?.streakDays || 0} Day Streak</Text>
          </View>

          <View style={styles.statPill}>
            <Trophy size={16} color="#D97706" />
            <Text style={styles.xpText}>{stats?.xpTotal || 0} XP</Text>
          </View>
        </View>

        {/* Daily Goal Card */}
        {stats && (
          <View style={styles.dailyGoalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleRow}>
                <Sparkles size={16} color="#6366F1" />
                <Text style={styles.goalTitle}>Daily Learning Goal</Text>
              </View>
              <Text style={styles.goalCounter}>
                {stats.todayReviews} / {stats.dailyGoal} cards
              </Text>
            </View>
            <ProgressBar
              progress={stats.todayReviews / stats.dailyGoal}
              color="#6366F1"
              height={8}
            />
          </View>
        )}

        {/* Quick Review Action Banner if cards due */}
        {totalDue > 0 && (
          <TouchableOpacity
            style={styles.quickBanner}
            activeOpacity={0.9}
            onPress={handleQuickStudy}
          >
            <View style={styles.quickBannerLeft}>
              <View style={styles.quickIconCircle}>
                <Zap size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.quickBannerTitle}>{totalDue} Cards Ready for Review</Text>
                <Text style={styles.quickBannerSubtitle}>Keep your retention rate at 95%</Text>
              </View>
            </View>
            <View style={styles.quickActionPill}>
              <Text style={styles.quickActionText}>Review Now</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Decks Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Decks</Text>
          <View style={styles.headerButtonRow}>
            <TouchableOpacity
              style={styles.importButton}
              onPress={() => {
                triggerSelectionHaptic();
                navigation.navigate('ImportExport');
              }}
            >
              <Upload size={14} color="#059669" />
              <Text style={styles.importButtonText}>Import / Backup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newDeckButton}
              onPress={handleCreateDeck}
            >
              <Plus size={15} color="#4F46E5" />
              <Text style={styles.newDeckText}>New Deck</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deck List */}
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onPress={() => navigation.navigate('DeckDetail', { deckId: deck.id })}
            onStudy={() =>
              navigation.navigate('Study', { deckId: deck.id, title: deck.title })
            }
            onSpeedReview={() =>
              navigation.navigate('SpeedReview', { deckId: deck.id, title: deck.title })
            }
          />
        ))}

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
    paddingBottom: 24,
  },
  topStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  dailyGoalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  goalCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  quickBanner: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  quickBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickBannerSubtitle: {
    fontSize: 11,
    color: '#E0E7FF',
    marginTop: 2,
  },
  quickActionPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  quickActionText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  importButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  newDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newDeckText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
});
