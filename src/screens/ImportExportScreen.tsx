import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import {
  FileText,
  Upload,
  Download,
  Clipboard as ClipboardIcon,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowLeft,
  Share2,
} from 'lucide-react-native';
import { Deck, Card } from '../types/card';
import {
  getDecks,
  importDeckWithCards,
  exportFullBackup,
  importFullBackup,
  getTodayDateString,
} from '../services/storage';
import { parseDelimitedText, pickAndReadFile } from '../services/importer';
import { shareOrDownloadFile } from '../services/exporter';
import { triggerSuccessHaptic, triggerSelectionHaptic, triggerWarningHaptic } from '../services/haptics';

export const ImportExportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { initialDeckId } = route.params || {};

  const [activeTab, setActiveTab] = useState<'import' | 'backup'>('import');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId || 'new');
  const [newDeckTitle, setNewDeckTitle] = useState('My Imported Deck');
  const [newDeckLanguage, setNewDeckLanguage] = useState('Russian');
  const [newDeckLanguageCode, setNewDeckLanguageCode] = useState('ru-RU');

  const [pastedText, setPastedText] = useState('');
  const [parsedCards, setParsedCards] = useState<Card[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const d = await getDecks();
    setDecks(d);
    if (!initialDeckId && d.length > 0) {
      setSelectedDeckId('new');
    }
  };

  const handlePasteClipboard = async () => {
    triggerSelectionHaptic();
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPastedText(text);
      handleParseText(text);
    }
  };

  const handleParseText = (text: string) => {
    if (!text.trim()) {
      setParsedCards([]);
      return;
    }
    const result = parseDelimitedText(text, selectedDeckId, newDeckLanguageCode);
    setParsedCards(result.cards);
    setParseWarnings(result.warnings);
  };

  const handlePickFile = async () => {
    triggerSelectionHaptic();
    setLoading(true);
    setStatusMessage(null);
    try {
      const file = await pickAndReadFile();
      if (!file) {
        setLoading(false);
        return;
      }

      if (file.fileName.endsWith('.json')) {
        // Maybe full backup or deck json
        try {
          const parsed = JSON.parse(file.content);
          if (parsed.appName === 'MemFlow' && parsed.decks) {
            // It's a full backup
            const res = await importFullBackup(file.content);
            triggerSuccessHaptic();
            setStatusMessage({ text: `Backup restored! Loaded ${res.deckCount} decks and ${res.cardCount} cards.` });
            await loadDecks();
            setLoading(false);
            return;
          } else if (parsed.deck && parsed.cards) {
            await importDeckWithCards(parsed.deck, parsed.cards);
            triggerSuccessHaptic();
            setStatusMessage({ text: `Imported deck "${parsed.deck.title}" with ${parsed.cards.length} cards!` });
            await loadDecks();
            setLoading(false);
            return;
          }
        } catch {
          // If not json, fall through to text parse
        }
      }

      setPastedText(file.content);
      handleParseText(file.content);
      setStatusMessage({ text: `Loaded file: ${file.fileName}` });
    } catch (err: any) {
      setStatusMessage({ text: 'Failed to read file: ' + err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedCards.length === 0) return;
    setLoading(true);
    triggerSelectionHaptic();

    try {
      let targetDeckId = selectedDeckId;

      if (selectedDeckId === 'new') {
        const newDeck: Deck = {
          id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: newDeckTitle.trim() || 'Imported Deck',
          description: `Imported flashcards for ${newDeckLanguage}`,
          language: newDeckLanguage,
          languageCode: newDeckLanguageCode,
          color: newDeckLanguage === 'Russian' ? '#E11D48' : '#4F46E5',
          icon: 'layers',
          cardCount: parsedCards.length,
          dueCount: parsedCards.length,
          newCount: parsedCards.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Assign deckId to cards
        const assignedCards = parsedCards.map((c) => ({
          ...c,
          deckId: newDeck.id,
          audioLanguage: newDeckLanguageCode,
        }));

        await importDeckWithCards(newDeck, assignedCards);
      } else {
        const existingDeck = decks.find((d) => d.id === selectedDeckId);
        if (existingDeck) {
          const assignedCards = parsedCards.map((c) => ({
            ...c,
            deckId: existingDeck.id,
            audioLanguage: existingDeck.languageCode || newDeckLanguageCode,
          }));
          await importDeckWithCards(existingDeck, assignedCards);
        }
      }

      triggerSuccessHaptic();
      setStatusMessage({
        text: `Successfully imported ${parsedCards.length} cards!`,
      });
      setPastedText('');
      setParsedCards([]);
      await loadDecks();
    } catch (err: any) {
      triggerWarningHaptic();
      setStatusMessage({ text: 'Import failed: ' + err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    triggerSelectionHaptic();
    setLoading(true);
    try {
      const backupJson = await exportFullBackup();
      const fileName = `memflow_backup_${getTodayDateString()}.json`;
      await shareOrDownloadFile(fileName, backupJson, 'application/json');
      triggerSuccessHaptic();
      setStatusMessage({ text: 'Backup file exported successfully!' });
    } catch (err: any) {
      triggerWarningHaptic();
      setStatusMessage({ text: 'Export failed: ' + err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    triggerSelectionHaptic();
    setLoading(true);
    setStatusMessage(null);

    const executeRestore = async () => {
      try {
        const file = await pickAndReadFile();
        if (!file) return;

        const res = await importFullBackup(file.content);
        triggerSuccessHaptic();
        setStatusMessage({ text: `Backup restored successfully! (${res.deckCount} decks, ${res.cardCount} cards)` });
        await loadDecks();
      } catch (err: any) {
        triggerWarningHaptic();
        setStatusMessage({ text: 'Restore failed: ' + err.message, isError: true });
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Restoring will replace all current decks and reviews with the backup. Continue?')) {
        await executeRestore();
      } else {
        setLoading(false);
      }
    } else {
      Alert.alert(
        'Restore Backup',
        'Restoring will replace your current decks with the backup file. Continue?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          { text: 'Restore', style: 'destructive', onPress: executeRestore },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Data & Import / Export</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Segmented Controls */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'import' && styles.tabBtnActive]}
          onPress={() => setActiveTab('import')}
        >
          <FileText size={16} color={activeTab === 'import' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
            Anki / CSV Import
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'backup' && styles.tabBtnActive]}
          onPress={() => setActiveTab('backup')}
        >
          <Database size={16} color={activeTab === 'backup' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'backup' && styles.tabTextActive]}>
            Manual Backup
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Alert Banner */}
        {statusMessage && (
          <View style={[styles.statusBanner, statusMessage.isError ? styles.statusError : styles.statusSuccess]}>
            {statusMessage.isError ? <AlertCircle size={18} color="#DC2626" /> : <CheckCircle size={18} color="#059669" />}
            <Text style={[styles.statusText, statusMessage.isError ? styles.statusErrorText : styles.statusSuccessText]}>
              {statusMessage.text}
            </Text>
          </View>
        )}

        {activeTab === 'import' ? (
          <View style={styles.tabContent}>
            {/* Target Deck Selection */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>1. Choose Destination</Text>
              <View style={styles.deckOptionRow}>
                <TouchableOpacity
                  style={[styles.deckOptionPill, selectedDeckId === 'new' && styles.deckOptionActive]}
                  onPress={() => setSelectedDeckId('new')}
                >
                  <Text style={[styles.deckOptionText, selectedDeckId === 'new' && styles.deckOptionTextActive]}>
                    + Create New Deck
                  </Text>
                </TouchableOpacity>

                {decks.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.deckOptionPill, selectedDeckId === d.id && styles.deckOptionActive]}
                    onPress={() => setSelectedDeckId(d.id)}
                  >
                    <Text style={[styles.deckOptionText, selectedDeckId === d.id && styles.deckOptionTextActive]}>
                      {d.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedDeckId === 'new' && (
                <View style={styles.newDeckInputs}>
                  <Text style={styles.subLabel}>NEW DECK TITLE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Russian Vocabulary"
                    placeholderTextColor="#94A3B8"
                    value={newDeckTitle}
                    onChangeText={setNewDeckTitle}
                  />

                  <Text style={[styles.subLabel, { marginTop: 10 }]}>LANGUAGE & AUDIO VOICE</Text>
                  <View style={styles.langPillsRow}>
                    {[
                      { name: 'Russian', code: 'ru-RU' },
                      { name: 'Spanish', code: 'es-ES' },
                      { name: 'Japanese', code: 'ja-JP' },
                      { name: 'French', code: 'fr-FR' },
                      { name: 'German', code: 'de-DE' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        style={[styles.langSmallPill, newDeckLanguageCode === item.code && styles.langSmallPillActive]}
                        onPress={() => {
                          setNewDeckLanguage(item.name);
                          setNewDeckLanguageCode(item.code);
                        }}
                      >
                        <Text style={[styles.langSmallText, newDeckLanguageCode === item.code && styles.langSmallTextActive]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Choose File or Paste */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>2. Add Words (File or Paste)</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickFile}>
                  <Upload size={18} color="#4F46E5" />
                  <Text style={styles.filePickerText}>Select CSV / TSV / Anki File</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.clipboardBtn} onPress={handlePasteClipboard}>
                  <ClipboardIcon size={16} color="#64748B" />
                  <Text style={styles.clipboardBtnText}>Paste</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.hintText}>
                Supported formats: Tab-separated Anki text, CSV (`Front,Back`), or semicolon. HTML tags are automatically cleaned.
              </Text>

              <TextInput
                style={styles.pasteBox}
                placeholder={`Example:\nПривет\tHi\nСпасибо\tThank you\nПожалуйста\tPlease`}
                placeholderTextColor="#94A3B8"
                value={pastedText}
                onChangeText={(val) => {
                  setPastedText(val);
                  handleParseText(val);
                }}
                multiline
              />
            </View>

            {/* Parse Preview */}
            {parsedCards.length > 0 && (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    Preview: Ready to Import {parsedCards.length} Cards
                  </Text>
                </View>

                {parsedCards.slice(0, 5).map((c, i) => (
                  <View key={i} style={styles.previewItem}>
                    <Text style={styles.previewFront}>{c.front}</Text>
                    <Text style={styles.previewBack}>{c.back}</Text>
                  </View>
                ))}
                {parsedCards.length > 5 && (
                  <Text style={styles.moreCount}>...and {parsedCards.length - 5} more cards</Text>
                )}

                <TouchableOpacity
                  style={styles.importConfirmBtn}
                  disabled={loading}
                  onPress={handleExecuteImport}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle size={18} color="#FFFFFF" />
                      <Text style={styles.importConfirmText}>
                        Import {parsedCards.length} Cards Now
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Backup & Restore Tab */
          <View style={styles.tabContent}>
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>Full Offline Backup</Text>
              <Text style={styles.backupDesc}>
                Export a single JSON file containing all your decks, cards, review logs, and streaks. No cloud account needed. You can save it to your iPhone Files app, iCloud Drive, or transfer to your computer.
              </Text>

              <TouchableOpacity style={styles.exportBackupBtn} onPress={handleExportBackup}>
                <Share2 size={18} color="#FFFFFF" />
                <Text style={styles.exportBackupText}>Export & Share Backup File</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeader}>Restore from Backup</Text>
              <Text style={styles.backupDesc}>
                Restore a previously exported `memflow_backup.json` file.
              </Text>

              <TouchableOpacity style={styles.restoreBtn} onPress={handleRestoreBackup}>
                <Download size={18} color="#4F46E5" />
                <Text style={styles.restoreBtnText}>Select Backup File to Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  statusSuccessText: {
    color: '#065F46',
  },
  statusErrorText: {
    color: '#991B1B',
  },
  tabContent: {
    gap: 16,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  deckOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  deckOptionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  deckOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  deckOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  deckOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  newDeckInputs: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  langPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  langSmallPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langSmallPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  langSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  langSmallTextActive: {
    color: '#4F46E5',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    borderRadius: 14,
  },
  filePickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  clipboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  clipboardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 16,
  },
  pasteBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  previewHeader: {
    marginBottom: 4,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  previewFront: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewBack: {
    fontSize: 14,
    color: '#64748B',
  },
  moreCount: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 4,
  },
  importConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  importConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backupDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  exportBackupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 14,
  },
  exportBackupText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    paddingVertical: 14,
    borderRadius: 14,
  },
  restoreBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4F46E5',
  },
});
