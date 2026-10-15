# MemFlow — AI Agent Handoff & Architecture Guide

Welcome, Agent! This document contains essential context, architectural rules, and guidelines for continuing development on **MemFlow**.

---

## 🎯 Project Overview & Mission
- **What it is**: An open-source, free, cross-platform flashcard application inspired by Memrise and Anki, with Duolingo-style gamification (streaks, XP, goals).
- **Core Audience**: Learners studying languages (with specific focus on Russian, Japanese, Spanish, and French) and custom user-created flashcards.
- **Platforms**: iOS (primary target via Expo Go), Android, and Desktop (Web/React Native for Web).

---

## ⚠️ Key Design Principles & Constraints
1. **100% Offline-First (No Cloud Sync)**:
   - The user explicitly requested **no cloud sync or backend servers**.
   - All persistence is handled locally via `AsyncStorage` (`@react-native-async-storage/async-storage`).
   - Backup & restore is strictly **manual** (exporting/importing self-contained JSON backup files via iOS Share Sheet or browser downloads).
2. **User-Generated & Anki-First Content**:
   - The primary goal is letting users create their own flashcards or import Anki decks / CSV / TSV files, rather than relying on locked proprietary content.
3. **Multiplatform Audio & Haptics**:
   - Audio is generated using native Text-to-Speech via `expo-speech` (supporting `ru-RU`, `es-ES`, `ja-JP`, `fr-FR`, `en-US`, etc.).
   - Haptics are wrapped in safe cross-platform guards in `src/services/haptics.ts` so they never crash on web or desktop.

---

## 📁 Codebase Layout

```text
memflow/
├── src/
│   ├── types/
│   │   └── card.ts             # Card, Deck, ReviewLog, UserStats data models
│   ├── services/
│   │   ├── srs.ts              # SuperMemo SM-2 & FSRS spaced repetition engine
│   │   ├── storage.ts          # Local AsyncStorage manager & backup export/restore
│   │   ├── importer.ts         # Anki (.txt/.tsv), CSV, and text-paste parser
│   │   ├── exporter.ts         # CSV export and iOS Share Sheet / Web download
│   │   ├── audio.ts            # Text-to-Speech audio engine (expo-speech)
│   │   └── haptics.ts          # Tactile feedback helpers (expo-haptics)
│   ├── data/
│   │   └── seedDecks.ts        # Russian, Spanish, Japanese, French starter decks
│   ├── components/
│   │   ├── FlashCard.tsx       # 3D perspective flip card with audio trigger
│   │   ├── RatingBar.tsx       # Again (1d), Hard (2d), Good (4d), Easy (7d) controls
│   │   ├── DeckCard.tsx        # Deck list item with due badge and quick actions
│   │   └── ProgressBar.tsx     # Animated progress indicator
│   ├── navigation/
│   │   └── AppNavigator.tsx    # React Navigation (Native Stack + Bottom Tabs)
│   └── screens/
│       ├── DeckListScreen.tsx  # Home screen: deck catalog, streak, quick study
│       ├── DeckDetailScreen.tsx# Deck view, mode launcher, card list, export CSV
│       ├── StudyScreen.tsx     # Classic SRS 3D flip card review session
│       ├── SpeedReviewScreen.tsx # 5-second countdown rapid-fire multiple-choice quiz
│       ├── TypingReviewScreen.tsx# Active orthography & typing drill
│       ├── ImportExportScreen.tsx# Anki/CSV file import, paste text, manual backup
│       ├── CardEditorModal.tsx # Add/edit flashcard modal
│       ├── DeckEditorModal.tsx # Create new language deck modal
│       └── StatsScreen.tsx     # Streak counter, XP accumulator, and review analytics
├── App.tsx                     # App entry point (SafeAreaProvider + AppNavigator)
└── package.json                # Dependencies (Expo SDK 57, React Native 0.86, React 19)
```

---

## 🛠️ Verification & Commands

```bash
# Start development server
npx expo start

# Start desktop web preview
npx expo start --web

# Type check
node --stack-size=8192 ./node_modules/typescript/bin/tsc --noEmit

# Test web bundling
npx expo export -p web
```
