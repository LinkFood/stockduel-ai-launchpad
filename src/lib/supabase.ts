import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables - you'll need to add these to .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for common database operations
export class DatabaseService {
  
  // ===== USER OPERATIONS =====
  
  static async createUser(userData: {
    email: string;
    username: string;
    password_hash: string;
    display_name?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  // ===== STOCK OPERATIONS =====
  
  static async getAllActiveStocks() {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('is_active', true)
      .order('symbol');
    
    if (error) throw error;
    return data;
  }

  static async getFeaturedStocks() {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('symbol');
    
    if (error) throw error;
    return data;
  }

  static async getStockBySymbol(symbol: string) {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();
    
    if (error) throw error;
    return data;
  }

  // ===== CONTEST OPERATIONS =====
  
  static async getCurrentContest() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('contest_periods')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUpcomingContest() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('contest_periods')
      .select('*')
      .eq('is_active', true)
      .gt('start_date', now)
      .order('start_date')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===== PREDICTION OPERATIONS =====
  
  static async createPrediction(predictionData: {
    user_id: string;
    stock_id: string;
    contest_period_id: string;
    prediction_type: string;
    target_price?: number;
    confidence_level: number;
    reasoning?: string;
    stock_price_at_prediction: number;
  }) {
    const { data, error } = await supabase
      .from('predictions')
      .insert([predictionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserPredictionsForContest(userId: string, contestId: string) {
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        stock:stocks(symbol, company_name),
        contest_period:contest_periods(*)
      `)
      .eq('user_id', userId)
      .eq('contest_period_id', contestId);
    
    if (error) throw error;
    return data;
  }

  static async getStockPredictionsForContest(stockId: string, contestId: string) {
    const { data, error } = await supabase
      .from('predictions')
      .select(`
        *,
        user:users(username, display_name)
      `)
      .eq('stock_id', stockId)
      .eq('contest_period_id', contestId);
    
    if (error) throw error;
    return data;
  }

  // ===== LEADERBOARD OPERATIONS =====
  
  static async getLeaderboardForContest(contestId: string, limit: number = 100) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:users(username, display_name, avatar_url)
      `)
      .eq('contest_period_id', contestId)
      .order('rank_position')
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getUserLeaderboardEntry(userId: string, contestId: string) {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('contest_period_id', contestId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ===== STOCK PRICE OPERATIONS =====
  
  static async getLatestStockPrice(stockId: string) {
    const { data, error } = await supabase
      .from('stock_prices')
      .select('*')
      .eq('stock_id', stockId)
      .order('price_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async insertStockPrice(priceData: {
    stock_id: string;
    price_date: string;
    open_price?: number;
    high_price?: number;
    low_price?: number;
    close_price: number;
    volume?: number;
    adjusted_close?: number;
  }) {
    const { data, error } = await supabase
      .from('stock_prices')
      .upsert([priceData], { 
        onConflict: 'stock_id,price_date' 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ===== AI PREDICTION OPERATIONS =====
  
  static async getAiPrediction(stockId: string, contestId: string, modelName: string = 'basic_momentum') {
    const { data, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('stock_id', stockId)
      .eq('contest_period_id', contestId)
      .eq('model_name', modelName)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async createAiPrediction(aiData: {
    stock_id: string;
    contest_period_id: string;
    model_name: string;
    target_price: number;
    confidence_score: number;
    reasoning: string;
    stock_price_at_prediction: number;
  }) {
    const { data, error } = await supabase
      .from('ai_predictions')
      .upsert([aiData], {
        onConflict: 'stock_id,contest_period_id,model_name'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ===== ANALYTICS OPERATIONS =====
  
  static async trackUserActivity(activityData: {
    user_id: string;
    action: string;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }) {
    const { error } = await supabase
      .from('user_activity')
      .insert([{
        ...activityData,
        metadata: activityData.metadata || {}
      }]);
    
    if (error) throw error;
  }

  static async getStockStats(stockId: string, contestId: string) {
    const { data, error } = await supabase
      .from('stock_stats')
      .select('*')
      .eq('stock_id', stockId)
      .eq('contest_period_id', contestId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to leaderboard changes
  subscribeToLeaderboard: (contestId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`leaderboard_${contestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_entries',
          filter: `contest_period_id=eq.${contestId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to new predictions
  subscribeToStockPredictions: (stockId: string, contestId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`predictions_${stockId}_${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'predictions',
          filter: `stock_id=eq.${stockId} AND contest_period_id=eq.${contestId}`
        },
        callback
      )
      .subscribe();
  }
};

export default supabase;