import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DripLogo } from '../ui/DripLogo';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onAnimationComplete: () => void;
}

export function LandingScreen({ onAnimationComplete }: LandingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto fade out after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onAnimationComplete();
        }
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideUpAnim, onAnimationComplete]);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Main Logo/Icon */}
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { translateY: slideUpAnim }
                  ]
                }
              ]}
            >
              <View style={styles.logoCircle}>
                <DripLogo
                  size={56}
                  backgroundColor="transparent"
                  primaryColor="#FFD700"
                  secondaryColor="#FFA500"
                  accentColor="#FFFFFF"
                />
              </View>

              {/* App Name */}
              <Text style={styles.appName}>Fashion Agent</Text>
              <Text style={styles.tagline}>✨ Premium AI Style Expert ✨</Text>
            </Animated.View>

            {/* Bottom tagline */}
            <Animated.View 
              style={[
                styles.bottomSection,
                {
                  transform: [{ translateY: slideUpAnim }],
                  opacity: scaleAnim,
                }
              ]}
            >
              <Text style={styles.welcomeText}>🏆 Experience Luxury Fashion Analysis 🏆</Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
