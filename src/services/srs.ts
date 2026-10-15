import { Card, CardState, Rating } from '../types/card';

/**
 * SuperMemo SM-2 & FSRS-adapted Spaced Repetition Algorithm
 */

export interface SRSResult {
  interval: number;       // In days
  easeFactor: number;     // Multiplier (1.3 to 3.5)
  repetitions: number;    // Successful consecutive streaks
  dueDate: string;        // ISO timestamp
  state: CardState;
}

export function calculateSRS(card: Card, rating: Rating): SRSResult {
  let { repetitions, interval, easeFactor } = card;
  easeFactor = easeFactor || 2.5;
  interval = interval || 0;
  repetitions = repetitions || 0;

  let nextInterval = 1;
  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextState: CardState = 'review';

  switch (rating) {
    case 'again': {
      // Failed recall - reset streak
      nextRepetitions = 0;
      nextInterval = 1; // Due next day (or in 1 day)
      nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
      nextState = 'learning';
      break;
    }

    case 'hard': {
      // Strained recall
      nextRepetitions += 1;
      nextInterval = Math.max(1, Math.round((interval || 1) * 1.2));
      nextEaseFactor = Math.max(1.3, easeFactor - 0.15);
      nextState = 'review';
      break;
    }

    case 'good': {
      // Normal recall
      if (repetitions === 0) {
        nextInterval = 1;
      } else if (repetitions === 1) {
        nextInterval = 3;
      } else {
        nextInterval = Math.max(1, Math.round(interval * easeFactor));
      }
      nextRepetitions += 1;
      nextState = nextInterval >= 21 ? 'mastered' : 'review';
      break;
    }

    case 'easy': {
      // Effortless recall
      if (repetitions === 0) {
        nextInterval = 4;
      } else {
        nextInterval = Math.max(2, Math.round(interval * easeFactor * 1.35));
      }
      nextRepetitions += 1;
      nextEaseFactor = Math.min(3.5, easeFactor + 0.15);
      nextState = nextInterval >= 14 ? 'mastered' : 'review';
      break;
    }
  }

  // Calculate new due date
  const now = new Date();
  const dueTimestamp = new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000);

  return {
    interval: nextInterval,
    easeFactor: Math.round(nextEaseFactor * 100) / 100,
    repetitions: nextRepetitions,
    dueDate: dueTimestamp.toISOString(),
    state: nextState,
  };
}

/**
 * Returns human-readable label for estimated next interval (e.g., "1d", "4d", "14d")
 */
export function getEstimatedIntervalLabel(card: Card, rating: Rating): string {
  const result = calculateSRS(card, rating);
  const days = result.interval;
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}

/**
 * Check if a card is currently due for review
 */
export function isCardDue(card: Card): boolean {
  if (card.state === 'new') return true;
  if (!card.dueDate) return true;
  return new Date(card.dueDate).getTime() <= Date.now();
}

/**
 * Sort cards for study session:
 * 1. Overdue cards (most urgent first)
 * 2. Learning cards
 * 3. New cards
 */
export function sortStudyCards(cards: Card[]): Card[] {
  const now = Date.now();
  
  return [...cards].sort((a, b) => {
    // If one is new and the other isn't
    if (a.state === 'new' && b.state !== 'new') return 1;
    if (a.state !== 'new' && b.state === 'new') return -1;

    // If both have due dates, earlier due date comes first
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : now;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : now;
    return aDue - bDue;
  });
}
