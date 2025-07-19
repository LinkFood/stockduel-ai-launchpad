// Core types for the stock prediction platform

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalScore: number;
  weeklyScore: number;
  streakCount: number;
  totalPredictions: number;
  correctPredictions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: string;
  symbol: string;
  companyName: string;
  sector?: string;
  marketCap?: number;
  isActive: boolean;
  isFeatured: boolean;
  difficultyLevel: number;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
}

export interface ContestPeriod {
  id: string;
  type: 'weekly' | 'monthly' | 'earnings';
  startDate: Date;
  endDate: Date;
  predictionDeadline: Date;
  isActive: boolean;
  featuredStocks: string[];
  totalParticipants: number;
}

export type PredictionType = 'price_target' | 'streak_up' | 'streak_down';

export interface Prediction {
  id: string;
  userId: string;
  stockId: string;
  contestPeriodId: string;
  predictionType: PredictionType;
  targetPrice?: number;
  confidenceLevel: number;
  reasoning?: string;
  stockPriceAtPrediction: number;
  predictedAt: Date;
  
  // Results (filled when contest ends)
  actualPrice?: number;
  isCorrect?: boolean;
  accuracyScore?: number;
  pointsEarned?: number;
  resultedAt?: Date;
}

export interface AiPrediction {
  id: string;
  stockId: string;
  contestPeriodId: string;
  modelName: string;
  targetPrice: number;
  confidenceScore: number;
  reasoning: string;
  stockPriceAtPrediction: number;
  predictedAt: Date;
  
  // Results
  actualPrice?: number;
  isCorrect?: boolean;
  accuracyScore?: number;
}

export interface StockPrice {
  id: string;
  stockId: string;
  priceDate: Date;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice: number;
  volume?: number;
  adjustedClose?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsValue: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCriteria: Record<string, any>;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  unlockedAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  user: Pick<User, 'username' | 'displayName' | 'avatarUrl'>;
  contestPeriodId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracyPercentage: number;
  totalPoints: number;
  rankPosition: number;
  percentile: number;
}

export interface StockStats {
  id: string;
  stockId: string;
  contestPeriodId: string;
  totalPredictions: number;
  bullishPredictions: number;
  bearishPredictions: number;
  avgTargetPrice?: number;
  sentimentScore: number; // -1.0 to 1.0
}

// UI State types
export interface PredictionFormData {
  stockId: string;
  predictionType: PredictionType;
  targetPrice?: number;
  confidenceLevel: number;
  reasoning?: string;
}

export interface AppState {
  user: User | null;
  currentContestPeriod: ContestPeriod | null;
  featuredStocks: Stock[];
  userPredictions: Prediction[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

// Prediction analysis types
export interface PredictionAnalysis {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  riskLevel: number; // 1-10
  aiConfidence: number; // 0-1
  crowdSentiment: 'bullish' | 'bearish' | 'neutral';
  volatilityScore: number;
  expectedReturn: number;
}

// Contest status types
export type ContestStatus = 'upcoming' | 'active' | 'ended' | 'results_pending';

export interface ContestInfo {
  period: ContestPeriod;
  status: ContestStatus;
  timeRemaining?: number; // milliseconds
  userHasPredictions: boolean;
  totalParticipants: number;
}