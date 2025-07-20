// Mock data for UI testing without database
export const mockStocks = [
  {
    id: '1',
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    currentPrice: 185.45,
    priceChange: 2.15,
    priceChangePercent: 1.18,
    isActive: true,
    isFeatured: true,
    difficultyLevel: 3,
    marketCap: 2850000000000
  },
  {
    id: '2', 
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Automotive',
    currentPrice: 245.67,
    priceChange: -3.22,
    priceChangePercent: -1.29,
    isActive: true,
    isFeatured: true,
    difficultyLevel: 5,
    marketCap: 780000000000
  }
];

export const mockContest = {
  id: '1',
  type: 'weekly' as const,
  startDate: new Date('2025-01-19'),
  endDate: new Date('2025-01-24'),
  predictionDeadline: new Date('2025-01-19T23:59:59'),
  isActive: true,
  featuredStocks: ['1', '2'],
  totalParticipants: 1247
};

export const mockUser = {
  id: '1',
  email: 'demo@example.com',
  username: 'DemoUser',
  displayName: 'Demo User',
  totalScore: 850,
  weeklyScore: 145,
  streakCount: 3,
  totalPredictions: 25,
  correctPredictions: 18,
  createdAt: new Date(),
  updatedAt: new Date()
};