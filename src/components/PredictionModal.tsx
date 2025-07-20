'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

const PredictionModal: React.FC = () => {
  const { user } = useAuth();
  const { 
    selectedStock, 
    showPredictionModal, 
    setShowPredictionModal,
    currentContestPeriod,
    isLoading,
    setLoading,
    setError 
  } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [predictionType, setPredictionType] = useState<'up' | 'down'>('up');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(5);
  const [reasoning, setReasoning] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (showPredictionModal) {
      setStep(1);
      setPredictionType('up');
      setTargetPrice('');
      setConfidenceLevel(5);
      setReasoning('');
    }
  }, [showPredictionModal]);

  const handleClose = () => {
    setShowPredictionModal(false);
  };

  const handleDirectionSelect = (direction: 'up' | 'down') => {
    setPredictionType(direction);
    setStep(2);
    // Pre-fill a suggested target price based on current price
    const currentPrice = selectedStock?.currentPrice || 0;
    const suggestedPrice = direction === 'up' 
      ? (currentPrice * 1.05).toFixed(2) // 5% increase
      : (currentPrice * 0.95).toFixed(2); // 5% decrease
    setTargetPrice(suggestedPrice);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedStock || !currentContestPeriod) {
      setError('Missing required data for prediction');
      return;
    }

    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          stock_id: selectedStock.id,
          contest_id: currentContestPeriod.id,
          predicted_direction: predictionType,
          predicted_price: parseFloat(targetPrice),
          confidence_level: confidenceLevel,
          reasoning: reasoning.trim() || null
        });

      if (error) {
        console.error('Error submitting prediction:', error);
        setError('Failed to submit prediction. Please try again.');
      } else {
        // Success! Close modal and show success feedback
        setShowPredictionModal(false);
        setError(null);
        // You might want to refresh user predictions here
      }
    } catch (err) {
      console.error('Error submitting prediction:', err);
      setError('Failed to submit prediction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showPredictionModal || !selectedStock) return null;

  const formatPrice = (price?: number) => {
    if (!price) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 1 ? 'Pick Direction' : 'Set Target Price'}
              </h2>
              <p className="text-slate-400">{selectedStock.symbol} - {selectedStock.companyName}</p>
            </div>
            {/* Step indicator */}
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-500' : 'bg-green-500'}`} />
              <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-500' : 'bg-slate-600'}`} />
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stock Info */}
        <div className="p-6 border-b border-slate-700">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold text-white">
                  {formatPrice(selectedStock.currentPrice)}
                </div>
                <div className="text-sm text-slate-400">Current Price</div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  (selectedStock.priceChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(selectedStock.priceChange || 0) >= 0 ? '+' : ''}
                  {formatPrice(Math.abs(selectedStock.priceChange || 0))}
                </div>
                <div className="text-sm text-slate-400">24h Change</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            /* Step 1: Direction Selection */
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Will {selectedStock.symbol} go up or down?
                </h3>
                <p className="text-slate-400 text-sm">
                  Choose the direction you think the price will move
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleDirectionSelect('up')}
                  className="group p-8 rounded-2xl border-2 border-slate-600 bg-slate-800 hover:border-green-500 hover:bg-green-500/10 transition-all transform hover:scale-105 active:scale-95"
                >
                  <div className="text-center">
                    <div className="mb-4 p-4 rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors inline-block">
                      <TrendingUp className="text-green-400" size={32} />
                    </div>
                    <div className="font-bold text-xl text-white mb-2">BULLISH 🚀</div>
                    <div className="text-sm text-slate-400">Price will increase</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDirectionSelect('down')}
                  className="group p-8 rounded-2xl border-2 border-slate-600 bg-slate-800 hover:border-red-500 hover:bg-red-500/10 transition-all transform hover:scale-105 active:scale-95"
                >
                  <div className="text-center">
                    <div className="mb-4 p-4 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-colors inline-block">
                      <TrendingDown className="text-red-400" size={32} />
                    </div>
                    <div className="font-bold text-xl text-white mb-2">BEARISH 🐻</div>
                    <div className="text-sm text-slate-400">Price will decrease</div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Target Price & Details */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`p-2 rounded-full ${
                    predictionType === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {predictionType === 'up' ? 
                      <TrendingUp className="text-green-400" size={20} /> : 
                      <TrendingDown className="text-red-400" size={20} />
                    }
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {predictionType === 'up' ? 'Bullish' : 'Bearish'} on {selectedStock.symbol}
                  </h3>
                </div>
                <p className="text-slate-400 text-sm">
                  Set your target price and confidence level
                </p>
              </div>

              {/* Target Price Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <Target className="inline mr-2" size={16} />
                  Target Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-4 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {/* Price change indicator */}
                {targetPrice && selectedStock?.currentPrice && (
                  <div className="mt-2 text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      parseFloat(targetPrice) > selectedStock.currentPrice
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {parseFloat(targetPrice) > selectedStock.currentPrice ? '↗' : '↘'}
                      {Math.abs(((parseFloat(targetPrice) - selectedStock.currentPrice) / selectedStock.currentPrice) * 100).toFixed(1)}% change
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Confidence Level: {confidenceLevel}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${
                      predictionType === 'up' ? '#10b981' : '#ef4444'
                    } 0%, ${
                      predictionType === 'up' ? '#10b981' : '#ef4444'
                    } ${confidenceLevel * 10}%, #374151 ${confidenceLevel * 10}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>😐 Not sure</span>
                  <span>🎯 Very confident</span>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Why this target? (Optional)
                </label>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Share your analysis or reasoning..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  maxLength={500}
                />
                <div className="text-xs text-slate-400 mt-1">
                  {reasoning.length}/500 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || isLoading || !targetPrice}
                  className={`flex-2 py-3 px-6 rounded-lg font-semibold transition-all transform ${
                    submitting || isLoading || !targetPrice
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : predictionType === 'up'
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/25 hover:scale-105'
                  }`}
                >
                  {submitting ? '🚀 Submitting...' : '🎯 Lock in Prediction'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionModal;