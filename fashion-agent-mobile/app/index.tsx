import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // User is authenticated, navigate to main app
        console.log('✅ User authenticated, navigating to main app');
        router.replace('/(tabs)/dashboard');
      } else {
        // User is not authenticated, navigate to login
        console.log('❌ User not authenticated, navigating to login');
        router.replace('/auth/login');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
