import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7C4DEE',
        tabBarInactiveTintColor: '#9D96AE',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 88,
          paddingTop: 12,
          paddingBottom: 12,
          paddingHorizontal: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 30,
          elevation: 10,
          shadowColor: '#7C4DEE',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          height: 28,
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
