import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function AffirmationsScreen() {
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadAffirmations();
  }, []);

  const loadAffirmations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('affirmations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAffirmations(data || []);
    } catch (error: any) {
      console.error('Error loading affirmations:', error);
    }
  };

  const handleAdd = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter an affirmation');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('affirmations')
        .insert([
          {
            user_id: user.id,
            text: inputText.trim(),
            timestamp: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      setInputText('');
      await loadAffirmations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add affirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Affirmation',
      'Are you sure you want to delete this affirmation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('affirmations')
                .delete()
                .eq('id', id);

              if (error) throw error;
              await loadAffirmations();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete affirmation');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#E0E7FF', '#FECDD3']} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NextSelf</Text>
            <Text style={styles.subtitle}>Daily Affirmations</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write your affirmation..."
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            disabled={loading || !inputText.trim()}
          >
            <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.addButtonGradient}>
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {affirmations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyText}>No affirmations yet</Text>
              <Text style={styles.emptySubtext}>Create your first affirmation above</Text>
            </View>
          ) : (
            affirmations.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardText}>{item.text}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={showSettings}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Settings</Text>

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuIcon}>🚪</Text>
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    maxHeight: 120,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteIcon: {
    fontSize: 20,
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
    color: '#1F2937',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
