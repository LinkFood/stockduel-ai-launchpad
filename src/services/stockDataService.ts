import type { MarketData, StockSearchResult } from '@/types';
import { supabase } from '@/lib/supabase';

export class StockDataService {
  private static edgeFunctionUrl = 'https://jiwzejsgvovtwisinznp.supabase.co/functions/v1/stock-data';
  private static searchUrl = 'https://query1.finance.yahoo.com/v1/finance/search';

  /**
   * Get current market data for a stock symbol
   */
  static async getCurrentData(symbol: string): Promise<MarketData | null> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: [symbol], type: 'current' }
      });

      if (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }

      return data?.data?.[symbol] || null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical data for backtesting/analysis
   */
  static async getHistoricalData(
    symbol: string, 
    interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' = '1d',
    range: string = '1mo'
  ): Promise<MarketData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols: [symbol], type: 'historical', interval, range }
      });

      if (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        return [];
      }

      const result = data?.data?.[symbol];
      return Array.isArray(result) ? result : result ? [result] : [];
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get market data for multiple stocks at once
   */
  static async getMultipleCurrentData(symbols: string[]): Promise<Record<string, MarketData | null>> {
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { symbols, type: 'current' }
      });

      if (error) {
        console.error('Error fetching multiple stock data:', error);
        return {};
      }

      return data?.data || {};
    } catch (error) {
      console.error('Error fetching multiple stock data:', error);
      return {};
    }
  }

  /**
   * Search for stocks by symbol or name
   */
  static async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      const url = `${this.searchUrl}?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.parseSearchResults(data);
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Parse Yahoo Finance current data response
   */
  private static parseYahooData(symbol: string, yahooResponse: any): MarketData | null {
    const result = yahooResponse.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    
    if (!meta || !quotes) return null;

    // Get the latest values
    const timestamps = result.timestamp || [];
    const lastIndex = timestamps.length - 1;
    
    if (lastIndex < 0) return null;

    const close = quotes.close;
    const open = quotes.open;
    const high = quotes.high;
    const low = quotes.low;
    const volume = quotes.volume;

    return {
      symbol: symbol.toUpperCase(),
      price: meta.regularMarketPrice || close[lastIndex] || 0,
      change: (meta.regularMarketPrice || close[lastIndex] || 0) - (meta.previousClose || 0),
      changePercent: ((meta.regularMarketPrice || close[lastIndex] || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1) * 100,
      volume: meta.regularMarketVolume || volume[lastIndex] || 0,
      high: meta.regularMarketDayHigh || Math.max(...high.filter((h: any) => h !== null)) || 0,
      low: meta.regularMarketDayLow || Math.min(...low.filter((l: any) => l !== null)) || 0,
      open: meta.regularMarketOpen || open[0] || 0,
      previousClose: meta.previousClose || 0
    };
  }

  /**
   * Parse Yahoo Finance historical data response
   */
  private static parseYahooHistoricalData(symbol: string, yahooResponse: any): MarketData[] {
    const result = yahooResponse.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    
    if (!quotes) return [];

    const { open, high, low, close, volume } = quotes;
    const marketData: MarketData[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (close[i] == null) continue;

      const currentPrice = close[i];
      const previousPrice = i > 0 ? close[i - 1] : currentPrice;
      const change = currentPrice - previousPrice;
      const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

      marketData.push({
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change,
        changePercent,
        volume: volume[i] || 0,
        high: high[i] || currentPrice,
        low: low[i] || currentPrice,
        open: open[i] || currentPrice,
        previousClose: previousPrice
      });
    }

    return marketData;
  }

  /**
   * Parse Yahoo Finance search results
   */
  private static parseSearchResults(searchResponse: any): StockSearchResult[] {
    const quotes = searchResponse.quotes || [];
    
    return quotes
      .filter((quote: any) => 
        quote.symbol && 
        quote.shortname && 
        quote.quoteType === 'EQUITY'
      )
      .slice(0, 10) // Limit to top 10 results
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0
      }));
  }

  /**
   * Calculate simple moving average for trend analysis
   */
  static calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((sum, price) => sum + price, 0);
      sma.push(sum / period);
    }
    
    return sma;
  }

  /**
   * Calculate RSI for momentum analysis
   */
  static calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return [];
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const rsi: number[] = [];
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    let rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
    
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
      rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }

  /**
   * Determine if market is currently open (US Eastern Time)
   */
  static isMarketOpen(): boolean {
    const now = new Date();
    const eastern = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const day = eastern.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = eastern.getHours();
    const minute = eastern.getMinutes();
    const time = hour * 100 + minute;

    // Markets closed on weekends
    if (day === 0 || day === 6) return false;

    // Regular market hours: 9:30 AM - 4:00 PM ET
    return time >= 930 && time < 1600;
  }

  /**
   * Get next market open time
   */
  static getNextMarketOpen(): Date {
    const now = new Date();
    const eastern = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const day = eastern.getDay();
    const hour = eastern.getHours();
    const minute = eastern.getMinutes();
    const time = hour * 100 + minute;

    let nextOpen = new Date(eastern);
    
    // If it's weekend, go to Monday
    if (day === 0) { // Sunday
      nextOpen.setDate(nextOpen.getDate() + 1);
    } else if (day === 6) { // Saturday  
      nextOpen.setDate(nextOpen.getDate() + 2);
    } else if (time >= 1600) { // After market close
      nextOpen.setDate(nextOpen.getDate() + 1);
    }
    
    // Set to 9:30 AM ET
    nextOpen.setHours(9, 30, 0, 0);
    
    // Convert back to local timezone
    return new Date(nextOpen.toLocaleString());
  }

  /**
   * Generate basic AI prediction for a stock
   */
  static generateAiPrediction(
    currentPrice: number, 
    historicalData: MarketData[], 
    symbol: string
  ): {
    targetPrice: number;
    confidence: number;
    reasoning: string;
  } {
    if (historicalData.length < 20) {
      return {
        targetPrice: currentPrice,
        confidence: 0.1,
        reasoning: "Insufficient historical data for analysis"
      };
    }

    const prices = historicalData.map(d => d.price);
    const sma20 = this.calculateSMA(prices, 20);
    const rsi = this.calculateRSI(prices);
    
    const lastSma = sma20[sma20.length - 1];
    const lastRsi = rsi[rsi.length - 1];
    const trend = prices[prices.length - 1] > prices[prices.length - 10] ? 'up' : 'down';
    
    // Simple momentum-based prediction
    let targetPrice = currentPrice;
    let confidence = 0.5;
    let reasoning = "Neutral market conditions";

    if (lastRsi < 30 && currentPrice < lastSma) {
      // Oversold + below trend = potential bounce
      targetPrice = currentPrice * 1.02; // +2%
      confidence = 0.7;
      reasoning = "Oversold conditions suggest potential upside reversal";
    } else if (lastRsi > 70 && currentPrice > lastSma) {
      // Overbought + above trend = potential pullback
      targetPrice = currentPrice * 0.98; // -2%
      confidence = 0.7;
      reasoning = "Overbought conditions suggest potential downside correction";
    } else if (trend === 'up' && currentPrice > lastSma) {
      // Uptrend continuation
      targetPrice = currentPrice * 1.015; // +1.5%
      confidence = 0.6;
      reasoning = "Uptrend momentum suggests continued strength";
    } else if (trend === 'down' && currentPrice < lastSma) {
      // Downtrend continuation
      targetPrice = currentPrice * 0.985; // -1.5%
      confidence = 0.6;
      reasoning = "Downtrend momentum suggests continued weakness";
    }

    return {
      targetPrice: Math.round(targetPrice * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      reasoning
    };
  }
}