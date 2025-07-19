'use client';

import React from 'react';
import type { Stock } from '@/types';
import { useAppStore, useUser, useUserPredictions } from '@/store/useAppStore';

interface StockCardProps {
  stock: Stock;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const user = useUser();
  const userPredictions = useUserPredictions();
  const { setSelectedStock, setShowPredictionModal } = useAppStore();

  // Check if user already has a prediction for this stock this week
  const existingPrediction = userPredictions.find(p => p.stockId === stock.id);

  const handleMakePrediction = () => {
    if (!user) {
      // Should show login modal instead
      alert('Please log in to make predictions');
      return;
    }

    setSelectedStock(stock);
    setShowPredictionModal(true);
  };

  const formatPrice = (price?: number) => {
    if (!price) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change?: number, changePercent?: number) => {
    if (change === undefined || changePercent === undefined) {
      return { text: '--', color: 'text-gray-400' };
    }

    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-400' : 'text-red-400';
    const text = `${sign}${formatPrice(Math.abs(change))} (${sign}${changePercent.toFixed(2)}%)`;
    
    return { text, color };
  };

  const priceChange = formatChange(stock.priceChange, stock.priceChangePercent);

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-slate-600 shadow-xl">
      {/* Stock Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{stock.symbol}</h3>
          <p className="text-gray-400 text-sm">{stock.companyName}</p>
          {stock.sector && (
            <p className="text-gray-500 text-xs mt-1">{stock.sector}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono">
            {formatPrice(stock.currentPrice)}
          </div>
          <div className={`font-semibold ${priceChange.color}`}>
            {priceChange.text}
          </div>
        </div>
      </div>

      {/* Market Status / Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-300">Difficulty</div>
          <div className="flex items-center">
            {'★'.repeat(stock.difficultyLevel)}
            {'☆'.repeat(5 - stock.difficultyLevel)}
            <span className="ml-2 text-sm text-gray-400">
              {stock.difficultyLevel}/5
            </span>
          </div>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-300">Featured</div>
          <div className="text-lg font-bold text-yellow-400">
            {stock.isFeatured ? '⭐ Yes' : '📊 Regular'}
          </div>
        </div>
      </div>

      {/* Prediction Status */}
      {existingPrediction ? (
        <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-xl p-4 border border-green-600 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-300">✅ Prediction Made</div>
              <div className="text-sm text-green-200">
                {existingPrediction.predictionType === 'price_target' 
                  ? `Target: ${formatPrice(existingPrediction.targetPrice)}`
                  : existingPrediction.predictionType === 'streak_up'
                  ? 'Predicting: Streak continues UP'
                  : 'Predicting: Streak breaks DOWN'
                }
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-300">Confidence</div>
              <div className="font-bold text-green-200">
                {existingPrediction.confidenceLevel}/10
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleMakePrediction}
          disabled={!user}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-[1.02] ${
            user
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 hover:shadow-xl'
              : 'bg-slate-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {user ? (
            <>
              <span className="text-xl mr-2">🎯</span>
              MAKE PREDICTION
            </>
          ) : (
            <>
              <span className="text-xl mr-2">🔒</span>
              LOGIN TO PREDICT
            </>
          )}
        </button>
      )}

      {/* Quick Stats Row */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
        <div>
          {stock.isFeatured && <span className="text-yellow-400">⭐ Featured</span>}
        </div>
        <div>
          Updated: {new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

export default StockCard;