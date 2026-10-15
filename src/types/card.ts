export type CardState = 'new' | 'learning' | 'review' | 'mastered';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface Card {
  id: string;
  deckId: string;
  front: string;          // Target word or prompt (e.g. "Bonjour")
  back: string;           // Translation or answer (e.g. "Hello / Good day")
  phonetic?: string;      // IPA, Romaji, or Pinyin (e.g. "bɔ̃.ʒuʁ")
  partOfSpeech?: string;  // Noun, Verb, Adj, etc.
  example?: string;       // Context sentence (e.g. "Bonjour, comment ça va ?")
  exampleTranslation?: string;
  notes?: string;         // Mnemonic or grammar tip
  audioLanguage?: string; // Language code for TTS, e.g. "fr-FR", "es-ES", "ja-JP", "en-US"
  
  // SRS Parameters (SM-2 Algorithm)
  repetitions: number;    // Consecutive successful reviews
  interval: number;       // In days (0 = due today, fractional or integers)
  easeFactor: number;     // Difficulty multiplier (default: 2.5)
  dueDate: string;        // ISO 8601 string timestamp
  lastReviewed?: string;  // ISO timestamp of last review
  state: CardState;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  language: string;       // e.g. "Spanish", "Japanese", "French", "General"
  languageCode: string;   // e.g. "es-ES", "ja-JP", "fr-FR", "en-US"
  color: string;          // Accent theme hex (e.g. "#10B981")
  icon: string;           // Icon name
  cardCount: number;
  dueCount?: number;
  newCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: Rating;
  reviewedAt: string;
  scheduledDays: number;
  reviewDurationMs?: number;
}

export interface UserStats {
  streakDays: number;
  lastStudyDate: string; // YYYY-MM-DD
  xpTotal: number;
  cardsMastered: number;
  totalReviews: number;
  dailyGoal: number;     // e.g. 20 cards per day
  todayReviews: number;
}
