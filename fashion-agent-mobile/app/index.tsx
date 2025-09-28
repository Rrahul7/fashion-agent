import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LandingScreen } from '../components/core/LandingScreen';
import { router } from 'expo-router';

export default function Index() {
  const [showLanding, setShowLanding] = useState(true);

  const handleLandingComplete = () => {
    setShowLanding(false);
    // Redirect to tabs after landing animation
    router.replace('/(tabs)/dashboard');
  };

  return (
    <>
      <StatusBar style="dark" />
      {showLanding && (
        <LandingScreen onAnimationComplete={handleLandingComplete} />
      )}
    </>
  );
}
