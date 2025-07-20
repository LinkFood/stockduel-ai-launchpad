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

  const [predictionType, setPredictionType] = useState<'up' | 'down'>('up');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(5);
  const [reasoning, setReasoning] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (showPredictionModal) {
      setPredictionType('up');
      setConfidenceLevel(5);
      setReasoning('');
    }
  }, [showPredictionModal]);

  const handleClose = () => {
    setShowPredictionModal(false);
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
          <div>
            <h2 className="text-xl font-bold text-white">Make Prediction</h2>
            <p className="text-slate-400">{selectedStock.symbol} - {selectedStock.companyName}</p>
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

        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Prediction Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPredictionType('up')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  predictionType === 'up'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <TrendingUp className="mx-auto mb-2" size={24} />
                <div className="font-semibold">UP</div>
                <div className="text-xs">Price will increase</div>
              </button>
              
              <button
                type="button"
                onClick={() => setPredictionType('down')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  predictionType === 'down'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <TrendingDown className="mx-auto mb-2" size={24} />
                <div className="font-semibold">DOWN</div>
                <div className="text-xs">Price will decrease</div>
              </button>
            </div>
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Reasoning (Optional)
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Why do you think the price will go in this direction?"
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              maxLength={500}
            />
            <div className="text-xs text-slate-400 mt-1">
              {reasoning.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isLoading}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                submitting || isLoading
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : predictionType === 'up'
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PredictionModal;