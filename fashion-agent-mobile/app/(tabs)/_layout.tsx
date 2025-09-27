import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

// For icon imports, we'll use system icons for now
// You can install lucide-react-native later: npx expo install lucide-react-native
// import { Home, Upload, History, User } from 'lucide-react-native';

// Simple icon component using emoji for now
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons = {
    dashboard: focused ? '🏠' : '🏠',
    upload: focused ? '📸' : '📷',
    history: focused ? '📋' : '📋',
    profile: focused ? '👤' : '👤',
  };
  
  return (
    <Text style={{ fontSize: 24 }}>
      {icons[name as keyof typeof icons] || '•'}
    </Text>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#667eea',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: '👗 Fashion Agent',
          tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          headerTitle: 'Analyze Outfit',
          tabBarIcon: ({ focused }) => <TabIcon name="upload" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Style History',
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
