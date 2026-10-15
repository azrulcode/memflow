# MemFlow — Cross-Platform SRS Flashcard App

A Memrise & Anki-inspired language learning flashcard app built with **React Native & Expo (TypeScript)**, featuring spaced repetition scheduling (SM-2 / FSRS adaptation) and Duolingo-style streaks and gamification.

Designed for **iOS first**, with 100% shared code running across **Android** and **Web/Desktop**.

---

## 🚀 Quick Start: Running on iOS from Windows

Because MemFlow is built with Expo, you do **not** need a Mac to develop and test on your iPhone!

### Step 1: Install Expo Go on your iPhone
1. Open the **App Store** on your iPhone.
2. Search for and install **Expo Go** (free).
3. Ensure your iPhone and your Windows PC are on the same Wi-Fi network (or use `--tunnel` mode).

### Step 2: Start the Development Server
Open PowerShell in this project directory:
```bash
cd C:\Users\Azrul\.gemini\antigravity\scratch\memflow
npx expo start
```

### Step 3: Launch on Your iPhone
- Open the **Camera** app on your iPhone and point it at the QR code in your terminal.
- Tap the **"Open in Expo Go"** banner.
- The app will load natively on your iPhone with **instant hot-reload** whenever you edit code!

> **Tip for Different Networks / VPN**: If your iPhone cannot reach your PC's local IP, start Expo with tunnel mode:
> ```bash
> npx expo start --tunnel
> ```

---

## 💻 Running on Desktop / Web

You can also test and run the app directly on your Windows PC in any browser:
```bash
npx expo start --web
```
This launches `http://localhost:8081` with full keyboard and mouse support.

---

## 🤖 Running on Android

- Install **Expo Go** from Google Play on your Android device.
- Scan the same terminal QR code with the Expo Go in-app scanner.

---

## ✨ Features & Capabilities

### 1. Spaced Repetition System (SRS)
- **SuperMemo SM-2 with FSRS adaptations**: Dynamically computes intervals and ease factors ($EF$) based on your recall rating.
- **4 Rating Levels**:
  - **Again**: Resets interval to 1 day; card marked for immediate restudy.
  - **Hard**: Strained recall; interval increased conservatively ($\times 1.2$).
  - **Good**: Normal recall; interval scaled by current Ease Factor.
  - **Easy**: Effortless recall; bonus multiplier ($\times 1.35$) and increases Ease Factor.
- **Due Scheduler**: Automatically sorts cards by urgency and due timestamp.

### 2. Three Distinct Study Modes
- **Classic SRS Review**:
  - Interactive **3D perspective flip card** with smooth animations.
  - Native Text-to-Speech audio pronunciation (`expo-speech`).
  - Tactile haptic feedback on card flip and grading (`expo-haptics`).
  - Card fields: Front, Back, Phonetic / Romaji / Pinyin, Part of Speech, Context Example sentences, and Mnemonic notes.
- **Speed Review (Memrise-style)**:
  - 5-second countdown timer per question.
  - Multiple-choice drill with dynamically generated distractors.
  - Hearts / lives system (3 lives).
  - Combo streak multiplier ($1\times, 2\times, 3\times, 4\times\dots$).
- **Spelling & Typing Drill**:
  - Active recall test where the user types the exact word.
  - Real-time accent & punctuation-tolerant validation.
  - Audio playback on submit.

### 3. Duolingo-Inspired Gamification
- **Streak Tracker**: Daily streak counter with flame badge.
- **XP Engine**: Earn $+10$ to $+20$ XP per review and $+100 \times \text{combo}$ in Speed Review.
- **Daily Learning Goal**: Visual circular / linear progress bar tracking cards reviewed today against your target.
- **Mastery Levels**: Tracks cards as `new`, `learning`, `review`, and `mastered`.

### 4. Preloaded Starter Decks
- 🇪🇸 **Spanish Essentials**: High-frequency conversational phrases, travel vocab & survival questions.
- 🇯🇵 **Japanese Everyday & Kanji**: Core greetings, Kanji with Furigana & Romaji, and cultural phrases.
- 🇫🇷 **French Conversation**: Essential phrases, cafe vocabulary, and everyday idioms.
- **Custom Deck & Card Builder**: Create your own custom decks for any language or subject with custom theme colors and TTS language codes.

---

## 📁 Project Structure

```text
memflow/
├── src/
│   ├── components/
│   │   ├── FlashCard.tsx       # 3D Flip card with TTS and metadata
│   │   ├── RatingBar.tsx       # SM-2 Again/Hard/Good/Easy buttons with preview
│   │   ├── DeckCard.tsx        # Home screen deck item with due badge
│   │   └── ProgressBar.tsx     # Animated progress indicator
│   ├── data/
│   │   └── seedDecks.ts        # Spanish, Japanese, and French starter content
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Stack and Bottom Tab navigation
│   ├── screens/
│   │   ├── DeckListScreen.tsx  # Catalog of decks, streak, quick study
│   │   ├── StudyScreen.tsx     # Main 3D flashcard study session
│   │   ├── SpeedReviewScreen.tsx # Fast-paced countdown multiple-choice drill
│   │   ├── TypingReviewScreen.tsx# Active spelling and typing recall drill
│   │   ├── DeckDetailScreen.tsx# Deck view, mode launcher, card list
│   │   ├── CardEditorModal.tsx # Add/edit flashcard modal
│   │   ├── DeckEditorModal.tsx # Create new language deck modal
│   │   └── StatsScreen.tsx     # Streak, XP, and SRS engine analytics
│   ├── services/
│   │   ├── srs.ts              # SM-2 / FSRS scheduling algorithm
│   │   ├── storage.ts          # AsyncStorage persistence layer
│   │   ├── audio.ts            # Text-to-Speech audio engine (expo-speech)
│   │   └── haptics.ts          # Safe cross-platform tactile feedback
│   └── types/
│       └── card.ts             # TypeScript definitions
├── App.tsx                     # Root app entry point
└── app.json                    # Expo configuration
```

---

## 🛠️ Building Standalone Binaries (EAS Build)

When you are ready to produce a standalone `.ipa` for the iOS App Store or TestFlight:
```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build iOS binary in the cloud (no Mac required!)
eas build --platform ios
```
