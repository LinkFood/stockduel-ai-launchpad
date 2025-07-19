import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Stock, 
  ContestPeriod, 
  Prediction, 
  LeaderboardEntry,
  MarketData,
  AppState 
} from '@/types';
import { DatabaseService } from '@/lib/supabase';
import { StockDataService } from '@/services/stockDataService';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setCurrentContestPeriod: (contest: ContestPeriod | null) => void;
  setFeaturedStocks: (stocks: Stock[]) => void;
  setUserPredictions: (predictions: Prediction[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex actions
  initializeApp: () => Promise<void>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  registerUser: (userData: { email: string; username: string; password: string; displayName?: string }) => Promise<boolean>;
  logoutUser: () => void;
  refreshData: () => Promise<void>;
  submitPrediction: (predictionData: {
    stockId: string;
    predictionType: 'price_target' | 'streak_up' | 'streak_down';
    targetPrice?: number;
    confidenceLevel: number;
    reasoning?: string;
  }) => Promise<boolean>;
  
  // Market data state
  marketData: Record<string, MarketData>;
  setMarketData: (symbol: string, data: MarketData) => void;
  fetchMarketData: (symbols: string[]) => Promise<void>;
  
  // UI state
  selectedStock: Stock | null;
  setSelectedStock: (stock: Stock | null) => void;
  showPredictionModal: boolean;
  setShowPredictionModal: (show: boolean) => void;
  predictionFormData: {
    stockId: string;
    predictionType: 'price_target' | 'streak_up' | 'streak_down';
    targetPrice?: number;
    confidenceLevel: number;
    reasoning?: string;
  } | null;
  setPredictionFormData: (data: any) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      currentContestPeriod: null,
      featuredStocks: [],
      userPredictions: [],
      leaderboard: [],
      isLoading: false,
      error: null,
      marketData: {},
      selectedStock: null,
      showPredictionModal: false,
      predictionFormData: null,

      // Basic setters
      setUser: (user) => set({ user }),
      setCurrentContestPeriod: (contest) => set({ currentContestPeriod: contest }),
      setFeaturedStocks: (stocks) => set({ featuredStocks: stocks }),
      setUserPredictions: (predictions) => set({ userPredictions: predictions }),
      setLeaderboard: (leaderboard) => set({ leaderboard }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setMarketData: (symbol, data) => 
        set((state) => ({ 
          marketData: { ...state.marketData, [symbol]: data } 
        })),
      setSelectedStock: (stock) => set({ selectedStock: stock }),
      setShowPredictionModal: (show) => set({ showPredictionModal: show }),
      setPredictionFormData: (data) => set({ predictionFormData: data }),

      // Complex actions
      initializeApp: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Get current or upcoming contest
          let contest = await DatabaseService.getCurrentContest();
          if (!contest) {
            contest = await DatabaseService.getUpcomingContest();
          }
          
          // Get featured stocks
          const featuredStocks = await DatabaseService.getFeaturedStocks();
          
          // Get market data for featured stocks
          const symbols = featuredStocks.map(s => s.symbol);
          const marketDataResults = await StockDataService.getMultipleCurrentData(symbols);
          
          // Update stocks with current prices
          const stocksWithPrices = featuredStocks.map(stock => ({
            ...stock,
            currentPrice: marketDataResults[stock.symbol]?.price,
            priceChange: marketDataResults[stock.symbol]?.change,
            priceChangePercent: marketDataResults[stock.symbol]?.changePercent
          }));
          
          set({ 
            currentContestPeriod: contest,
            featuredStocks: stocksWithPrices,
            marketData: marketDataResults
          });

          // If user is logged in, get their data
          const { user } = get();
          if (user && contest) {
            await get().refreshUserData(user.id, contest.id);
          }
          
        } catch (error) {
          console.error('Failed to initialize app:', error);
          set({ error: 'Failed to load application data' });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshUserData: async (userId: string, contestId: string) => {
        try {
          const [userPredictions, leaderboard] = await Promise.all([
            DatabaseService.getUserPredictionsForContest(userId, contestId),
            DatabaseService.getLeaderboardForContest(contestId, 100)
          ]);
          
          set({ 
            userPredictions,
            leaderboard 
          });
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },

      loginUser: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real app, you'd verify the password hash
          const user = await DatabaseService.getUserByEmail(email);
          
          if (!user) {
            set({ error: 'Invalid email or password' });
            return false;
          }
          
          set({ user });
          
          // Track login activity
          await DatabaseService.trackUserActivity({
            user_id: user.id,
            action: 'login'
          });
          
          // Refresh user-specific data
          const { currentContestPeriod } = get();
          if (currentContestPeriod) {
            await get().refreshUserData(user.id, currentContestPeriod.id);
          }
          
          return true;
          
        } catch (error) {
          console.error('Login failed:', error);
          set({ error: 'Login failed. Please try again.' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      registerUser: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if email already exists
          const existingUser = await DatabaseService.getUserByEmail(userData.email);
          if (existingUser) {
            set({ error: 'Email already registered' });
            return false;
          }
          
          // In a real app, you'd hash the password properly
          const hashedPassword = btoa(userData.password); // Simple encoding for demo
          
          const newUser = await DatabaseService.createUser({
            email: userData.email,
            username: userData.username,
            password_hash: hashedPassword,
            display_name: userData.displayName || userData.username
          });
          
          set({ user: newUser });
          
          // Track registration
          await DatabaseService.trackUserActivity({
            user_id: newUser.id,
            action: 'register'
          });
          
          return true;
          
        } catch (error) {
          console.error('Registration failed:', error);
          set({ error: 'Registration failed. Please try again.' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logoutUser: () => {
        set({ 
          user: null,
          userPredictions: [],
          leaderboard: []
        });
      },

      refreshData: async () => {
        const { user, currentContestPeriod } = get();
        
        // Refresh market data
        const symbols = get().featuredStocks.map(s => s.symbol);
        await get().fetchMarketData(symbols);
        
        // Refresh user data if logged in
        if (user && currentContestPeriod) {
          await get().refreshUserData(user.id, currentContestPeriod.id);
        }
      },

      fetchMarketData: async (symbols: string[]) => {
        try {
          const marketDataResults = await StockDataService.getMultipleCurrentData(symbols);
          
          set((state) => ({
            marketData: { ...state.marketData, ...marketDataResults },
            featuredStocks: state.featuredStocks.map(stock => ({
              ...stock,
              currentPrice: marketDataResults[stock.symbol]?.price || stock.currentPrice,
              priceChange: marketDataResults[stock.symbol]?.change || stock.priceChange,
              priceChangePercent: marketDataResults[stock.symbol]?.changePercent || stock.priceChangePercent
            }))
          }));
        } catch (error) {
          console.error('Failed to fetch market data:', error);
        }
      },

      submitPrediction: async (predictionData) => {
        const { user, currentContestPeriod, marketData } = get();
        
        if (!user || !currentContestPeriod) {
          set({ error: 'Please log in to make predictions' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const stock = get().featuredStocks.find(s => s.id === predictionData.stockId);
          const currentMarketData = marketData[stock?.symbol || ''];
          
          if (!stock || !currentMarketData) {
            set({ error: 'Unable to get current stock price' });
            return false;
          }
          
          const prediction = await DatabaseService.createPrediction({
            user_id: user.id,
            stock_id: predictionData.stockId,
            contest_period_id: currentContestPeriod.id,
            prediction_type: predictionData.predictionType,
            target_price: predictionData.targetPrice,
            confidence_level: predictionData.confidenceLevel,
            reasoning: predictionData.reasoning,
            stock_price_at_prediction: currentMarketData.price
          });
          
          // Add to user predictions
          set((state) => ({
            userPredictions: [...state.userPredictions, prediction]
          }));
          
          // Track prediction activity
          await DatabaseService.trackUserActivity({
            user_id: user.id,
            action: 'prediction_made',
            metadata: {
              stock_symbol: stock.symbol,
              prediction_type: predictionData.predictionType,
              target_price: predictionData.targetPrice
            }
          });
          
          return true;
          
        } catch (error) {
          console.error('Failed to submit prediction:', error);
          set({ error: 'Failed to submit prediction. Please try again.' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'stock-prediction-app',
      // Only persist user authentication and some preferences
      partialize: (state) => ({
        user: state.user
      })
    }
  )
);

// Helper hooks for specific data
export const useUser = () => useAppStore((state) => state.user);
export const useFeaturedStocks = () => useAppStore((state) => state.featuredStocks);
export const useCurrentContest = () => useAppStore((state) => state.currentContestPeriod);
export const useUserPredictions = () => useAppStore((state) => state.userPredictions);
export const useLeaderboard = () => useAppStore((state) => state.leaderboard);
export const useMarketData = () => useAppStore((state) => state.marketData);
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);