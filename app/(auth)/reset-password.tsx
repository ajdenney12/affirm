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
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { parseTokenFromUrl } from '../../lib/auth-deep-link';
import { useRouter } from 'expo-router';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let handled = false;

    const establishRecoverySession = async (url: string) => {
      if (handled) return;
      handled = true;

      const { accessToken, refreshToken, type } = parseTokenFromUrl(url);

      if (!accessToken || !refreshToken) {
        setInitializing(false);
        setInitError('This password reset link is invalid or incomplete. Please request a new reset link from the login screen.');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setInitializing(false);
        setInitError('This password reset link has expired. Please request a new reset link from the login screen.');
        return;
      }

      setSessionReady(true);
      setInitializing(false);
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        establishRecoverySession(url);
      } else {
        setInitializing(false);
        setInitError('This password reset link is invalid. Please request a new reset link from the login screen.');
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      establishRecoverySession(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        if (
          error.message.toLowerCase().includes('session') ||
          error.message.toLowerCase().includes('token') ||
          error.message.toLowerCase().includes('expired')
        ) {
          Alert.alert(
            'Session Expired',
            'This password reset link has expired. Please request a new reset link from the login screen.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
          return;
        }
        throw error;
      }

      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C4DEE" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.initErrorText}>{initError}</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={styles.errorBackButton}
        >
          <LinearGradient colors={['#7C4DEE', '#9B6DFF']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Choose a new password for your account</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
                disabled={loading || !sessionReady}
              >
                <LinearGradient
                  colors={['#7C4DEE', '#9B6DFF']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9B6DFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F2FF',
    padding: 32,
  },
  initErrorText: {
    fontSize: 16,
    color: '#7C4DEE',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorBackButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
