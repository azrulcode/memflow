import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Play,
  Zap,
  PenTool,
  Plus,
  Search,
  Trash2,
  Volume2,
  Sparkles,
  Layers,
  Share2,
  Upload,
} from 'lucide-react-native';
import { Card, Deck } from '../types/card';
import { getDeckById, getCards, deleteCard, deleteDeck } from '../services/storage';
import { speakText } from '../services/audio';
import { triggerLightHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../services/haptics';
import { exportDeckToCsv, shareOrDownloadFile } from '../services/exporter';

export const DeckDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deckId } = route.params || {};

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!deckId) return;
    const currentDeck = await getDeckById(deckId);
    const deckCards = await getCards(deckId);
    setDeck(currentDeck);
    setCards(deckCards);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [deckId])
  );

  const handleDeleteCard = (cardId: string, word: string) => {
    triggerSelectionHaptic();
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${word}"?`)) {
        deleteCard(cardId).then(loadData);
      }
    } else {
      Alert.alert('Delete Card', `Are you sure you want to delete "${word}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(cardId);
            await loadData();
          },
        },
      ]);
    }
  };

  const handleDeleteDeck = () => {
    triggerSelectionHaptic();
    const confirmAction = async () => {
      if (deck) {
        await deleteDeck(deck.id);
        navigation.goBack();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete deck "${deck?.title}" and all its cards?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        'Delete Deck',
        `Are you sure you want to delete "${deck?.title}" and all its cards?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

  const handleExportDeckCsv = async () => {
    if (!deck || cards.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Add some cards before exporting.');
      } else {
        Alert.alert('Empty Deck', 'Add some cards before exporting.');
      }
      return;
    }
    triggerSelectionHaptic();
    try {
      const csv = exportDeckToCsv(deck, cards);
      const safeTitle = deck.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${safeTitle}_cards.csv`;
      await shareOrDownloadFile(fileName, csv, 'text/csv');
      triggerSuccessHaptic();
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert('Export Error: ' + err.message);
      } else {
        Alert.alert('Export Error', err.message);
      }
    }
  };

  const filteredCards = cards.filter(
    (c) =>
      c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!deck) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ImportExport', { initialDeckId: deck.id })}
            style={styles.headerActionBtn}
            accessibilityLabel="Import cards into deck"
          >
            <Upload size={18} color="#4F46E5" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportDeckCsv}
            style={styles.headerActionBtn}
            accessibilityLabel="Export deck to CSV"
          >
            <Share2 size={18} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteDeck} style={styles.deleteDeckBtn}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Deck Title Header */}
        <View style={styles.deckBanner}>
          <View style={styles.langBadge}>
            <Text style={styles.langText}>{deck.language.toUpperCase()}</Text>
          </View>
          <Text style={styles.deckTitle}>{deck.title}</Text>
          <Text style={styles.deckDesc}>{deck.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Layers size={14} color="#64748B" />
              <Text style={styles.metaText}>{cards.length} cards total</Text>
            </View>
            {deck.dueCount !== undefined && deck.dueCount > 0 && (
              <View style={styles.dueItem}>
                <Sparkles size={14} color="#DC2626" />
                <Text style={styles.dueText}>{deck.dueCount} ready to review</Text>
              </View>
            )}
          </View>
        </View>

        {/* Study Mode Launchers */}
        <Text style={styles.sectionTitle}>Choose Study Mode</Text>
        <View style={styles.modeCardsContainer}>
          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
            onPress={() => navigation.navigate('Study', { deckId: deck.id, title: deck.title })}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#4F46E5' }]}>
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeName, { color: '#4F46E5' }]}>Classic SRS</Text>
              <Text style={styles.modeDesc}>3D Flip card with memory grading</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
            onPress={() => navigation.navigate('SpeedReview', { deckId: deck.id, title: deck.title })}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#D97706' }]}>
              <Zap size={18} color="#FFFFFF" />
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeName, { color: '#D97706' }]}>Speed Drill</Text>
              <Text style={styles.modeDesc}>5-second rapid recall quiz</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
            onPress={() => navigation.navigate('TypingReview', { deckId: deck.id, title: deck.title })}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#059669' }]}>
              <PenTool size={18} color="#FFFFFF" />
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeName, { color: '#059669' }]}>Spelling Drill</Text>
              <Text style={styles.modeDesc}>Active orthography & typing test</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Card Catalog & Search */}
        <View style={styles.cardsHeader}>
          <Text style={styles.sectionTitle}>Cards in Deck ({cards.length})</Text>
          <TouchableOpacity
            style={styles.addCardBtn}
            onPress={() =>
              navigation.navigate('CardEditor', {
                deckId: deck.id,
                defaultLanguageCode: deck.languageCode,
              })
            }
          >
            <Plus size={16} color="#4F46E5" />
            <Text style={styles.addCardText}>Add Card</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search words or meanings..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Card Items */}
        {filteredCards.map((card) => (
          <View key={card.id} style={styles.cardItem}>
            <View style={styles.cardItemLeft}>
              <TouchableOpacity
                onPress={() => speakText(card.front, card.audioLanguage)}
                style={styles.cardItemSpeaker}
              >
                <Volume2 size={18} color="#4F46E5" />
              </TouchableOpacity>
              <View style={styles.cardItemContent}>
                <View style={styles.cardItemFrontRow}>
                  <Text style={styles.cardFrontText}>{card.front}</Text>
                  {card.phonetic && (
                    <Text style={styles.cardPhonetic}>/{card.phonetic}/</Text>
                  )}
                </View>
                <Text style={styles.cardBackText}>{card.back}</Text>
              </View>
            </View>

            <View style={styles.cardItemRight}>
              <View style={styles.cardStatePill}>
                <Text style={styles.cardStateText}>
                  {card.state === 'mastered'
                    ? '⭐'
                    : card.state === 'review'
                    ? `${card.interval}d`
                    : 'NEW'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteCard(card.id, card.front)}
                style={styles.deleteCardBtn}
              >
                <Trash2 size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteDeckBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  deckBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  langBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  langText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  deckTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  deckDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  dueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 12,
  },
  modeCardsContainer: {
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  modeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  cardItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardItemSpeaker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardItemContent: {
    flex: 1,
  },
  cardItemFrontRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardFrontText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardPhonetic: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  cardBackText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  cardItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardStatePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardStateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  deleteCardBtn: {
    padding: 6,
  },
});
