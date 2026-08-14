import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

interface ThemeGroup {
  theme: string;
  icon: string;
  gradient: string[];
  affirmations: any[];
}

export default function AffirmationsScreen() {
  const [affirmations, setAffirmations] = useState<any[]>([]);
  const [dailyAffirmation, setDailyAffirmation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editText, setEditText] = useState('');
  const [newAffirmationText, setNewAffirmationText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const affirmationsResult = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (affirmationsResult.error) throw affirmationsResult.error;

      setAffirmations(affirmationsResult.data || []);

      if (affirmationsResult.data && affirmationsResult.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * affirmationsResult.data.length);
        setDailyAffirmation(affirmationsResult.data[randomIndex]);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAffirmation = async (id: string) => {
    Alert.alert('Delete Affirmation', 'Are you sure you want to delete this affirmation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('affirmations').delete().eq('id', id);
            if (error) throw error;
            await loadData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete affirmation');
          }
        },
      },
    ]);
  };

  const handleEditAffirmation = (affirmation: any) => {
    setEditingItem(affirmation);
    setEditText(affirmation.text);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    try {
      const { error } = await supabase
        .from('affirmations')
        .update({ text: editText.trim() })
        .eq('id', editingItem.id);
      if (error) throw error;

      setEditModalVisible(false);
      setEditingItem(null);
      setEditText('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    }
  };

  const handleAddAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert('Error', 'Please enter an affirmation');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('affirmations')
        .insert({
          user_id: user.id,
          text: newAffirmationText.trim(),
          timestamp: new Date().toISOString(),
        });
      if (error) throw error;

      setNewAffirmationText('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add affirmation');
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#E9D5FF', '#FECDD3']} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Affirmations</Text>
            <Text style={styles.subtitle}>Empowering thoughts for your journey</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {affirmations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyText}>Start Your Journey</Text>
              <Text style={styles.emptySubtext}>
                Create your first affirmation below
              </Text>
            </View>
          ) : (
            affirmations.map((affirmation) => (
              <View key={affirmation.id} style={styles.affirmationCard}>
                <View style={styles.affirmationContent}>
                  <Text style={styles.sparkleIcon}>✨</Text>
                  <Text style={styles.affirmationText}>{affirmation.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteAffirmation(affirmation.id)}
                    style={styles.trashIcon}
                  >
                    <Text style={styles.trashIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.addSection}>
            <Text style={styles.addSectionTitle}>Write Your Affirmation</Text>
            <View style={styles.addInputContainer}>
              <TextInput
                style={styles.addInput}
                value={newAffirmationText}
                onChangeText={setNewAffirmationText}
                placeholder="I am confident and capable..."
                placeholderTextColor="#C4B5FD"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.addButton, !newAffirmationText.trim() && styles.addButtonDisabled]}
                onPress={handleAddAffirmation}
                disabled={!newAffirmationText.trim()}
              >
                <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.addButtonGradient}>
                  <Text style={styles.addButtonText}>+ Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalOverlay}
              onPress={() => setEditModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Affirmation</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Affirmation Text</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={editText}
                      onChangeText={setEditText}
                      placeholder="Enter affirmation"
                      multiline
                      maxLength={500}
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => {
                        setEditModalVisible(false);
                        setEditingItem(null);
                        setEditText('');
                      }}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButtonConfirm}
                      onPress={handleSaveEdit}
                    >
                      <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.buttonGradient}>
                        <Text style={styles.buttonText}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  subtitle: {
    fontSize: 16,
    color: '#A855F7',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#A855F7',
    textAlign: 'center',
    lineHeight: 24,
  },
  affirmationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  affirmationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  affirmationText: {
    flex: 1,
    fontSize: 20,
    fontStyle: 'italic',
    color: '#8B5CF6',
    lineHeight: 28,
  },
  trashIcon: {
    padding: 8,
    marginLeft: 8,
  },
  trashIconText: {
    fontSize: 20,
  },
  addSection: {
    marginTop: 24,
  },
  addSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#7C3AED',
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#7C3AED',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(233, 213, 255, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  modalButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
