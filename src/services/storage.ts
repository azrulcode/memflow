import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Deck, Rating, ReviewLog, UserStats } from '../types/card';
import { SEED_CARDS, SEED_DECKS } from '../data/seedDecks';
import { calculateSRS, isCardDue } from './srs';

const DECKS_KEY = '@memflow_decks_v1';
const CARDS_KEY = '@memflow_cards_v1';
const STATS_KEY = '@memflow_stats_v1';
const LOGS_KEY = '@memflow_logs_v1';

export async function initializeStorage(): Promise<void> {
  try {
    const existingDecks = await AsyncStorage.getItem(DECKS_KEY);
    if (!existingDecks) {
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(SEED_DECKS));
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(SEED_CARDS));
      
      const initialStats: UserStats = {
        streakDays: 1,
        lastStudyDate: getTodayDateString(),
        xpTotal: 50,
        cardsMastered: 0,
        totalReviews: 0,
        dailyGoal: 15,
        todayReviews: 0,
      };
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(initialStats));
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export async function getDecks(): Promise<Deck[]> {
  try {
    const rawDecks = await AsyncStorage.getItem(DECKS_KEY);
    const rawCards = await AsyncStorage.getItem(CARDS_KEY);

    if (!rawDecks) return [];

    const decks: Deck[] = JSON.parse(rawDecks);
    const cards: Card[] = rawCards ? JSON.parse(rawCards) : [];

    // Calculate dynamic counts
    return decks.map((deck) => {
      const deckCards = cards.filter((c) => c.deckId === deck.id);
      const dueCount = deckCards.filter((c) => isCardDue(c)).length;
      const newCount = deckCards.filter((c) => c.state === 'new').length;

      return {
        ...deck,
        cardCount: deckCards.length,
        dueCount,
        newCount,
      };
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return [];
  }
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const decks = await getDecks();
  return decks.find((d) => d.id === deckId) || null;
}

export async function saveDeck(deck: Deck): Promise<void> {
  try {
    const rawDecks = await AsyncStorage.getItem(DECKS_KEY);
    let decks: Deck[] = rawDecks ? JSON.parse(rawDecks) : [];
    
    const existingIndex = decks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      decks[existingIndex] = { ...deck, updatedAt: new Date().toISOString() };
    } else {
      decks.push({
        ...deck,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving deck:', error);
  }
}

export async function deleteDeck(deckId: string): Promise<void> {
  try {
    const rawDecks = await AsyncStorage.getItem(DECKS_KEY);
    const rawCards = await AsyncStorage.getItem(CARDS_KEY);

    if (rawDecks) {
      const decks: Deck[] = JSON.parse(rawDecks);
      const filteredDecks = decks.filter((d) => d.id !== deckId);
      await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(filteredDecks));
    }

    if (rawCards) {
      const cards: Card[] = JSON.parse(rawCards);
      const filteredCards = cards.filter((c) => c.deckId !== deckId);
      await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filteredCards));
    }
  } catch (error) {
    console.error('Error deleting deck:', error);
  }
}

export async function getCards(deckId?: string): Promise<Card[]> {
  try {
    const rawCards = await AsyncStorage.getItem(CARDS_KEY);
    if (!rawCards) return [];
    const cards: Card[] = JSON.parse(rawCards);
    return deckId ? cards.filter((c) => c.deckId === deckId) : cards;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

export async function saveCard(card: Card): Promise<void> {
  try {
    const rawCards = await AsyncStorage.getItem(CARDS_KEY);
    let cards: Card[] = rawCards ? JSON.parse(rawCards) : [];

    const existingIndex = cards.findIndex((c) => c.id === card.id);
    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Error saving card:', error);
  }
}

export async function deleteCard(cardId: string): Promise<void> {
  try {
    const rawCards = await AsyncStorage.getItem(CARDS_KEY);
    if (!rawCards) return;
    const cards: Card[] = JSON.parse(rawCards);
    const filtered = cards.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting card:', error);
  }
}

export async function recordCardReview(
  cardId: string,
  rating: Rating,
  durationMs: number = 0
): Promise<{ updatedCard: Card; xpGained: number }> {
  const cards = await getCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    throw new Error('Card not found');
  }

  const card = cards[cardIndex];
  const srs = calculateSRS(card, rating);

  const updatedCard: Card = {
    ...card,
    interval: srs.interval,
    easeFactor: srs.easeFactor,
    repetitions: srs.repetitions,
    dueDate: srs.dueDate,
    state: srs.state,
    lastReviewed: new Date().toISOString(),
  };

  cards[cardIndex] = updatedCard;
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));

  // Determine XP: 10 base, +5 for good, +10 for easy
  let xpGained = 10;
  if (rating === 'good') xpGained = 15;
  if (rating === 'easy') xpGained = 20;

  // Update Stats & Streak
  await updateStatsAfterReview(xpGained, updatedCard.state === 'mastered');

  // Record log
  const log: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    cardId,
    deckId: card.deckId,
    rating,
    reviewedAt: new Date().toISOString(),
    scheduledDays: srs.interval,
    reviewDurationMs: durationMs,
  };

  const rawLogs = await AsyncStorage.getItem(LOGS_KEY);
  const logs: ReviewLog[] = rawLogs ? JSON.parse(rawLogs) : [];
  logs.push(log);
  // Keep last 500 logs
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));

  return { updatedCard, xpGained };
}

export async function getUserStats(): Promise<UserStats> {
  try {
    const rawStats = await AsyncStorage.getItem(STATS_KEY);
    const today = getTodayDateString();

    if (!rawStats) {
      const defaultStats: UserStats = {
        streakDays: 1,
        lastStudyDate: today,
        xpTotal: 0,
        cardsMastered: 0,
        totalReviews: 0,
        dailyGoal: 15,
        todayReviews: 0,
      };
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    }

    const stats: UserStats = JSON.parse(rawStats);

    // If day changed, reset todayReviews
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (stats.lastStudyDate !== yesterday) {
        // Streak broken
        stats.streakDays = 0;
      }
      stats.todayReviews = 0;
      stats.lastStudyDate = today;
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }

    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      streakDays: 0,
      lastStudyDate: getTodayDateString(),
      xpTotal: 0,
      cardsMastered: 0,
      totalReviews: 0,
      dailyGoal: 15,
      todayReviews: 0,
    };
  }
}

async function updateStatsAfterReview(xpGained: number, isMastered: boolean): Promise<void> {
  const stats = await getUserStats();
  const today = getTodayDateString();

  if (stats.lastStudyDate !== today) {
    stats.streakDays += 1;
    stats.todayReviews = 1;
    stats.lastStudyDate = today;
  } else {
    stats.todayReviews += 1;
    if (stats.streakDays === 0) stats.streakDays = 1;
  }

  stats.xpTotal += xpGained;
  stats.totalReviews += 1;
  if (isMastered) {
    stats.cardsMastered += 1;
  }

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function resetToDefaultData(): Promise<void> {
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(SEED_DECKS));
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(SEED_CARDS));
  const initialStats: UserStats = {
    streakDays: 1,
    lastStudyDate: getTodayDateString(),
    xpTotal: 100,
    cardsMastered: 0,
    totalReviews: 0,
    dailyGoal: 15,
    todayReviews: 0,
  };
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(initialStats));
  await AsyncStorage.removeItem(LOGS_KEY);
}

export interface BackupData {
  version: number;
  appName: string;
  exportedAt: string;
  decks: Deck[];
  cards: Card[];
  stats: UserStats;
  logs?: ReviewLog[];
}

export async function exportFullBackup(): Promise<string> {
  const decks = await getDecks();
  const cards = await getCards();
  const stats = await getUserStats();
  const rawLogs = await AsyncStorage.getItem(LOGS_KEY);
  const logs = rawLogs ? JSON.parse(rawLogs) : [];

  const backup: BackupData = {
    version: 1,
    appName: 'MemFlow',
    exportedAt: new Date().toISOString(),
    decks,
    cards,
    stats,
    logs,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importFullBackup(jsonString: string): Promise<{ deckCount: number; cardCount: number }> {
  try {
    const data: BackupData = JSON.parse(jsonString);
    if (!data.decks || !data.cards) {
      throw new Error('Invalid backup file: missing decks or cards');
    }

    await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(data.decks));
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(data.cards));
    if (data.stats) {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(data.stats));
    }
    if (data.logs) {
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
    }

    return {
      deckCount: data.decks.length,
      cardCount: data.cards.length,
    };
  } catch (error) {
    throw new Error('Failed to parse backup JSON: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function importDeckWithCards(deck: Deck, newCards: Card[]): Promise<void> {
  await saveDeck(deck);
  const existingCards = await getCards();
  const updatedCards = [...existingCards, ...newCards];
  await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updatedCards));
}

