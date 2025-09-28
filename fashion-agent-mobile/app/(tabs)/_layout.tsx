import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Home, User, Clock } from 'lucide-react-native';

const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  const iconSize = 22;
  
  switch (name) {
    case 'dashboard':
      return <Home size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
    case 'history':
      return <Clock size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
    case 'profile':
      return <User size={iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />;
    default:
      return <Home size={iconSize} color={color} strokeWidth={2} />;
  }
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1F2937',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#F5F1E8',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#F5F1E8',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTintColor: '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerTitle: 'Drip',
          tabBarIcon: ({ focused, color }) => <TabIcon name="dashboard" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'My Reviews',
          tabBarIcon: ({ focused, color }) => <TabIcon name="history" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Account',
          tabBarIcon: ({ focused, color }) => <TabIcon name="profile" focused={focused} color={color} />,
        }}
      />
      {/* Hide upload tab but keep file for potential future use */}
      <Tabs.Screen
        name="upload"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}
