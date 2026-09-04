import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showDisclaimers, setShowDisclaimers] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.replace('/(tabs)');
      } catch (error: any) {
        Alert.alert('Login Error', error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

  const handleSignUp = async () => {
    if (!ageConfirmed) {
      Alert.alert('Age Verification Required', 'You must confirm that you are 13 years or older to create an account');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setShowAgeVerification(false);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'nextself://',
        },
      });
      if (error) throw error;
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nextself://',
      });
      if (error) throw error;
      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      setShowAgeVerification(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F6F2FF', '#EDE5FF']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#7C4DEE', '#9B6DFF']}
                style={styles.icon}
              >
                <Text style={styles.iconText}>✨</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>NextSelf</Text>
            <Text style={styles.subtitle}>Your personal space for growth and positivity</Text>
          </View>

          <View style={styles.card}>
            {!isForgotPassword ? (
              <>
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, isLogin && styles.tabActive]}
                    onPress={() => setIsLogin(true)}
                  >
                    <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, !isLogin && styles.tabActive]}
                    onPress={() => setIsLogin(false)}
                  >
                    <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {isLogin && (
                    <TouchableOpacity
                      onPress={() => setIsForgotPassword(true)}
                      style={styles.forgotPassword}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#7C4DEE', '#9B6DFF']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setIsLogin(!isLogin)}
                  style={styles.switchAuth}
                >
                  <Text style={styles.switchAuthText}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Text style={styles.switchAuthLink}>
                      {isLogin ? 'Sign up' : 'Login'}
                    </Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowDisclaimers(true)}
                  style={styles.disclaimerLink}
                >
                  <Text style={styles.disclaimerLinkText}>View Disclaimers</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.forgotTitle}>Reset Password</Text>
                <Text style={styles.forgotSubtitle}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleForgotPassword}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#7C4DEE', '#9B6DFF']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsForgotPassword(false)}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showAgeVerification}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowAgeVerification(false);
            setAgeConfirmed(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Age Verification Required</Text>
              <Text style={styles.modalText}>
                In accordance with our Terms of Service, you must be at least 13 years old to create an account and use NextSelf.
              </Text>

              <TouchableOpacity
                style={styles.disclaimerButton}
                onPress={() => {
                  setShowAgeVerification(false);
                  setShowDisclaimers(true);
                }}
              >
                <Text style={styles.disclaimerButtonText}>View Disclaimers</Text>
              </TouchableOpacity>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setAgeConfirmed(!ageConfirmed)}
                >
                  <View style={[styles.checkboxBox, ageConfirmed && styles.checkboxBoxChecked]}>
                    {ageConfirmed && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I confirm that I am 13 years of age or older and agree to the Terms of Service and Privacy Policy.
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => {
                    setShowAgeVerification(false);
                    setAgeConfirmed(false);
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButtonConfirm, (!ageConfirmed || loading) && styles.modalButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={!ageConfirmed || loading}
                >
                  <LinearGradient
                    colors={['#7C4DEE', '#9B6DFF']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDisclaimers}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDisclaimers(false)}
        >
          <View style={styles.disclaimerModalOverlay}>
            <View style={styles.disclaimerModalContent}>
              <View style={styles.disclaimerModalHeader}>
                <Text style={styles.disclaimerModalTitle}>Disclaimers</Text>
                <TouchableOpacity onPress={() => setShowDisclaimers(false)}>
                  <Text style={styles.disclaimerModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.disclaimerModalBody} showsVerticalScrollIndicator={false}>
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
                style={styles.disclaimerModalButton}
                onPress={() => setShowDisclaimers(false)}
              >
                <LinearGradient colors={['#7C4DEE', '#9B6DFF']} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>Close</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#7C4DEE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9B6DFF',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4EEFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9B6DFF',
  },
  tabTextActive: {
    color: '#7C4DEE',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C4DEE',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE5FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C4DEE',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchAuth: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 14,
    color: '#9B6DFF',
  },
  switchAuthLink: {
    color: '#7C4DEE',
    fontWeight: '600',
  },
  forgotTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C4DEE',
    marginBottom: 8,
  },
  forgotSubtitle: {
    fontSize: 14,
    color: '#9B6DFF',
    marginBottom: 24,
  },
  backButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9B6DFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C4DEE',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#7C4DEE',
    lineHeight: 20,
    marginBottom: 16,
  },
  checkboxContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#EDE5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#C9B8F0',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#7C4DEE',
    borderColor: '#7C4DEE',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#7C4DEE',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#F4EEFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#7C4DEE',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  disclaimerLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  disclaimerLinkText: {
    fontSize: 13,
    color: '#9B6DFF',
    textDecorationLine: 'underline',
  },
  disclaimerButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  disclaimerButtonText: {
    fontSize: 14,
    color: '#7C4DEE',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  disclaimerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  disclaimerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  disclaimerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE5FF',
  },
  disclaimerModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C4DEE',
  },
  disclaimerModalClose: {
    fontSize: 24,
    color: '#C9B8F0',
    fontWeight: '300',
  },
  disclaimerModalBody: {
    padding: 24,
  },
  disclaimerSection: {
    marginBottom: 24,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C4DEE',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9B6DFF',
  },
  disclaimerModalButton: {
    margin: 24,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
