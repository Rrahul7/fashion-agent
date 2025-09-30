import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
// import { LinearGradient } from 'expo-linear-gradient'; // Install with: npx expo install expo-linear-gradient

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { login, authError, clearAuthError } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    clearAuthError();

    try {
      await login(email.trim().toLowerCase(), password);
      // Navigate to main app after successful login
      console.log('✅ Login successful, navigating to dashboard');
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      // Error is already handled in the auth hook
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    clearAuthError();
    router.push('./register' as any); // Type workaround for dynamic routes
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>👗</Text>
              <Text style={styles.title}>Fashion Agent</Text>
              <Text style={styles.subtitle}>
                AI-powered outfit analysis and style recommendations
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setSecureTextEntry(!secureTextEntry)}
                  >
                    <Text style={styles.eyeText}>
                      {secureTextEntry ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {authError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>🚨 {authError}</Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.loadingText}>Logging in...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navigateToRegister} disabled={loading}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityText}>
                🔒 Your data is protected with end-to-end encryption
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#667eea', // Solid color instead of gradient
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 20,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 16,
  },
  registerLink: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
