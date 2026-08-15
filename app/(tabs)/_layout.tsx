import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6B3FC6',
        tabBarInactiveTintColor: '#8B8794',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 78,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 4,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 28,
          elevation: 8,
          shadowColor: '#6B3FC6',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          height: 26,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Affirmations',
          tabBarIcon: ({ color, size }) => <Ionicons name={'home-outline' as IconName} color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ color, size }) => <Ionicons name={'chatbubble-ellipses-outline' as IconName} color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Ionicons name={'radio-button-on-outline' as IconName} color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name={'settings-outline' as IconName} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
