import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Star, Crown, Sparkles, LogIn } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    // Navigate to login screen - placeholder for now
    Alert.alert(
      'Login',
      'Login functionality coming soon!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F5F1E8', '#EDE7DC']}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollView}>
            {/* Guest Header */}
            <View style={styles.guestHeader}>
              <View style={styles.guestIconContainer}>
                <User size={48} color="#6B7280" />
              </View>
              <Text style={styles.guestTitle}>Welcome to Drip</Text>
              <Text style={styles.guestSubtitle}>Sign up to unlock premium features</Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>🌟 Premium Benefits</Text>
              
              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Star size={24} color="#F59E0B" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>5 Style Reviews</Text>
                  <Text style={styles.benefitDescription}>
                    Get up to 5 outfit reviews instead of 3 guest reviews
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Crown size={24} color="#8B5CF6" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Style History</Text>
                  <Text style={styles.benefitDescription}>
                    Keep track of your fashion evolution and progress
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Sparkles size={24} color="#10B981" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Personalized Tips</Text>
                  <Text style={styles.benefitDescription}>
                    Get AI recommendations tailored to your style preferences
                  </Text>
                </View>
              </View>
            </View>

            {/* Login Button */}
            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <LogIn size={20} color="white" />
                <Text style={styles.loginButtonText}>Sign Up / Log In</Text>
              </TouchableOpacity>
              
              <Text style={styles.freeText}>Continue as guest with 3 free reviews</Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F5F1E8', '#EDE7DC']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            
            <Text style={styles.name}>{user?.name || 'Fashion Enthusiast'}</Text>
            <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
            
            <View style={styles.premiumBadge}>
              <Crown size={16} color="#F59E0B" />
              <Text style={styles.premiumText}>Premium Member</Text>
            </View>
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>⚙️ Settings</Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>🔔 Notifications</Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>🎨 Preferences</Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>❓ Help & Support</Text>
              <Text style={styles.comingSoon}>Coming Soon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]} 
              onPress={handleLogout}
            >
              <Text style={[styles.menuText, styles.logoutText]}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Version Section */}
          <View style={styles.versionSection}>
            <Text style={styles.versionText}>Drip v1.0.0</Text>
            <Text style={styles.securityText}>🔒 Your data is protected</Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  // Guest Styles
  guestHeader: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
  },
  guestIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  guestTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  guestSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  freeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Authenticated User Styles
  profileSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 30,
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5D03A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  premiumText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
  },
  comingSoon: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
  },
  versionSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});
