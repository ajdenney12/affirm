import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi, I'm your NextSelf wellness coach. \u{1F331}\n\nIf one thing in your life could feel different a month from now \u2014 what would it be?",
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = inputText.trim();

    if (!text || loading) {
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    setInputText('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No authenticated session');
      }

      const payload = {
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      };

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabase.supabaseKey,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`AI chat request failed with status ${response.status}`);
      }

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error('AI chat returned an invalid response.');
      }

      const replyText =
        data?.content?.[0]?.text ||
        data?.content ||
        "I'm having trouble connecting right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyText,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFFFFF', '#F6F2FF', '#EDE5FF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>AI Coach</Text>
              <Text style={styles.subtitle}>Your personal wellness guide</Text>
            </View>
            <View style={styles.headerBadge}><Ionicons name="sparkles" size={20} color="#FFFFFF" /></View>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.role === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user'
                      ? styles.userText
                      : styles.assistantText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}

            {loading && (
              <View
                style={[
                  styles.bubble,
                  styles.assistantBubble,
                  styles.typingBubble,
                ]}
              >
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              returnKeyType="default"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || loading) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['#7C4DEE', '#9B6DFF']}
                style={styles.sendGradient}
              >
                <Text style={styles.sendText}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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

  flex: {
    flex: 1,
  },

  header: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE5FF',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C4DEE', alignItems: 'center', justifyContent: 'center' },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#33215E',
  },

  subtitle: {
    fontSize: 16,
    color: '#33215E',
    marginTop: 4,
  },

  messageList: {
    flex: 1,
  },

  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C4DEE',
    borderBottomRightRadius: 4,
  },

  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },

  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },

  userText: {
    color: '#FFFFFF',
  },

  assistantText: {
    color: '#33215E',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#33215E',
    borderWidth: 1,
    borderColor: '#EDE5FF',
  },

  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
