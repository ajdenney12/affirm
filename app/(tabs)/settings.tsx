import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [showDisclaimers, setShowDisclaimers] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#E9D5FF', '#FECDD3']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userEmail}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowDisclaimers(true)}
            >
              <View style={styles.menuItem}>
                <Text style={styles.menuItemText}>Disclaimers</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showDisclaimers}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDisclaimers(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Disclaimers</Text>
                <TouchableOpacity onPress={() => setShowDisclaimers(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.disclaimerSection}>
                  <Text style={styles.disclaimerTitle}>General Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    NextSelf is designed for personal growth and motivational purposes only. The content, affirmations, and goal-tracking features provided are not a substitute for professional medical, psychological, or mental health advice, diagnosis, or treatment.
                  </Text>
                </View>

                <View style={styles.disclaimerSection}>
                  <Text style={styles.disclaimerTitle}>Mental Health Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    This app is not a mental health service and is not intended to diagnose, treat, cure, or prevent any mental health condition or disorder. If you are experiencing a mental health crisis or emergency, please contact a licensed mental health professional or call 988 (Suicide & Crisis Lifeline) immediately.
                  </Text>
                </View>

                <View style={styles.disclaimerSection}>
                  <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    Nothing in this app constitutes medical advice. Always seek the guidance of a qualified healthcare provider before making any changes to your health, wellness, or lifestyle routine. Never disregard professional medical advice because of something you read or experience in this app.
                  </Text>
                </View>

                <View style={styles.disclaimerSection}>
                  <Text style={styles.disclaimerTitle}>General Liability</Text>
                  <Text style={styles.disclaimerText}>
                    By using NextSelf you acknowledge that results may vary and that Anthropic and the app developer are not liable for any decisions made based on content within this app. Use of this app is at your own discretion and risk.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDisclaimers(false)}
              >
                <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Close</Text>
                </LinearGradient>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  subtitle: {
    fontSize: 16,
    color: '#A855F7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A855F7',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C3AED',
  },
  infoValue: {
    fontSize: 16,
    color: '#A855F7',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C3AED',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#C4B5FD',
  },
  logoutButton: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderWidth: 1,
    borderColor: '#EC4899',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  modalClose: {
    fontSize: 24,
    color: '#C4B5FD',
    fontWeight: '300',
  },
  modalBody: {
    padding: 24,
  },
  disclaimerSection: {
    marginBottom: 24,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#A855F7',
  },
  modalButton: {
    margin: 24,
    marginTop: 0,
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
