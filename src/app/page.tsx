'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LandingScreen from '@/components/LandingScreen';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function HomePage() {
  const { initializeApp, isLoading, error } = useAppStore();

  useEffect(() => {
    // Initialize app on first load
    initializeApp();
  }, [initializeApp]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={initializeApp} />;
  }

  return <LandingScreen />;
}
