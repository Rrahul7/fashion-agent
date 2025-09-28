import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GuestOutfitReview } from '../components/core/GuestOutfitReview';

export default function Index() {
  return (
    <>
      <StatusBar style="light" />
      <GuestOutfitReview />
    </>
  );
}
