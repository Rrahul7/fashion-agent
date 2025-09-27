import { Stack } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';

// Toast configuration for security notifications
const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={{
      height: 60,
      width: '90%',
      backgroundColor: '#10B981',
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: 'center',
    }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        {text1}
      </Text>
      {text2 && (
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
          {text2}
        </Text>
      )}
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={{
      height: 60,
      width: '90%',
      backgroundColor: '#EF4444',
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: 'center',
    }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        {text1}
      </Text>
      {text2 && (
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
          {text2}
        </Text>
      )}
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={{
      height: 60,
      width: '90%',
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: 'center',
    }}>
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        {text1}
      </Text>
      {text2 && (
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
          {text2}
        </Text>
      )}
    </View>
  ),
};

export default function RootLayout() {
  useEffect(() => {
    // Security: Log app initialization
    console.log('🚀 Fashion Agent mobile app initialized');
    console.log('📱 Platform:', Platform.OS);
    console.log('🔒 Security features enabled');
    
    // Optional: Check for app integrity on launch
    // This could include certificate pinning checks, etc.
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      
      <Stack 
        screenOptions={{
          headerShown: false,
          // Security: Disable screenshots in sensitive areas
          ...(Platform.OS === 'android' && {
            // For Android, you might want to prevent screenshots
            // This would require additional native configuration
          }),
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Disable swipe back on login screen
          }} 
        />
        
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
      
      <Toast 
        config={toastConfig}
        position="top"
        topOffset={60}
      />
    </AuthProvider>
  );
}
