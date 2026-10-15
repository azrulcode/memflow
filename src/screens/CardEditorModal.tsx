import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { X, Check } from 'lucide-react-native';
import { Card } from '../types/card';
import { saveCard } from '../services/storage';
import { triggerSuccessHaptic } from '../services/haptics';

export const CardEditorModal: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deckId, defaultLanguageCode } = route.params || {};

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!front.trim() || !back.trim() || !deckId) return;

    const newCard: Card = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deckId,
      front: front.trim(),
      back: back.trim(),
      phonetic: phonetic.trim() || undefined,
      partOfSpeech: partOfSpeech.trim() || undefined,
      example: example.trim() || undefined,
      exampleTranslation: exampleTranslation.trim() || undefined,
      notes: notes.trim() || undefined,
      audioLanguage: defaultLanguageCode || 'en-US',
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString(),
      state: 'new',
    };

    await saveCard(newCard);
    triggerSuccessHaptic();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>New Flashcard</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!front.trim() || !back.trim()}
            style={[
              styles.saveBtn,
              (!front.trim() || !back.trim()) && { opacity: 0.4 },
            ]}
          >
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>FRONT (Target Word / Phrase) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gracias"
              placeholderTextColor="#94A3B8"
              value={front}
              onChangeText={setFront}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BACK (Translation / Meaning) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Thank you"
              placeholderTextColor="#94A3B8"
              value={back}
              onChangeText={setBack}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONETICS / ROMAJI / PINYIN</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GRAH-syahs"
              placeholderTextColor="#94A3B8"
              value={phonetic}
              onChangeText={setPhonetic}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PART OF SPEECH</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Noun, Verb, Expression"
              placeholderTextColor="#94A3B8"
              value={partOfSpeech}
              onChangeText={setPartOfSpeech}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EXAMPLE SENTENCE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Muchas gracias por la comida."
              placeholderTextColor="#94A3B8"
              value={example}
              onChangeText={setExample}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EXAMPLE TRANSLATION</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Thank you very much for the meal."
              placeholderTextColor="#94A3B8"
              value={exampleTranslation}
              onChangeText={setExampleTranslation}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MNEMONIC TIP / NOTES</Text>
            <TextInput
              style={[styles.input, { height: 75 }]}
              placeholder="e.g. Memory trick or grammar nuance"
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    gap: 16,
  },
  inputGroup: {
    gap: 6,
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
});
