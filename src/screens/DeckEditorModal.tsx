import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Check } from 'lucide-react-native';
import { Deck } from '../types/card';
import { saveDeck } from '../services/storage';
import { triggerSuccessHaptic } from '../services/haptics';

const LANGUAGES = [
  { name: 'Russian', code: 'ru-RU' },
  { name: 'Spanish', code: 'es-ES' },
  { name: 'Japanese', code: 'ja-JP' },
  { name: 'French', code: 'fr-FR' },
  { name: 'German', code: 'de-DE' },
  { name: 'Italian', code: 'it-IT' },
  { name: 'Korean', code: 'ko-KR' },
  { name: 'Chinese', code: 'zh-CN' },
  { name: 'English', code: 'en-US' },
];

const COLORS = [
  '#4F46E5', // Indigo
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export const DeckEditorModal: React.FC = () => {
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSave = async () => {
    if (!title.trim()) return;

    const newDeck: Deck = {
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim() || `Vocabulary deck for ${selectedLang.name}`,
      language: selectedLang.name,
      languageCode: selectedLang.code,
      color: selectedColor,
      icon: 'layers',
      cardCount: 0,
      dueCount: 0,
      newCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveDeck(newDeck);
    triggerSuccessHaptic();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <X size={20} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.title}>Create New Deck</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!title.trim()}
          style={[styles.saveBtn, !title.trim() && { opacity: 0.4 }]}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DECK TITLE *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Italian Food & Dining"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, { height: 75 }]}
            placeholder="What does this deck cover?"
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TARGET LANGUAGE & PRONUNCIATION VOICE</Text>
          <View style={styles.pillContainer}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang.code === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langPill,
                    isSelected && styles.langPillActive,
                  ]}
                  onPress={() => setSelectedLang(lang)}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      isSelected && styles.langPillTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ACCENT THEME COLOR</Text>
          <View style={styles.colorsRow}>
            {COLORS.map((c) => {
              const isSelected = selectedColor === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleActive,
                  ]}
                />
              );
            })}
          </View>
        </View>
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
  closeBtn: {
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formContainer: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  langPillActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  langPillTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
});
