'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LandingScreen from '@/components/LandingScreen';
import { mockStocks, mockContest, mockUser } from '@/components/MockData';

export default function DemoPage() {
  const { 
    setFeaturedStocks, 
    setCurrentContestPeriod, 
    setUser, 
    setLoading 
  } = useAppStore();

  useEffect(() => {
    // Load mock data to show UI
    setLoading(false);
    setFeaturedStocks(mockStocks);
    setCurrentContestPeriod(mockContest);
    // Uncomment to test with logged in user:
    // setUser(mockUser);
  }, [setFeaturedStocks, setCurrentContestPeriod, setUser, setLoading]);

  return <LandingScreen />;
}