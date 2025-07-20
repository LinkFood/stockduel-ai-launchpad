'use client';

import React from 'react';
import { useAppStore, useFeaturedStocks, useCurrentContest, useUser } from '@/store/useAppStore';
import StockCard from './StockCard';
import ContestStatus from './ContestStatus';
import QuickLeaderboard from './QuickLeaderboard';
import AuthPrompt from './AuthPrompt';

const LandingScreen = () => {
  const featuredStocks = useFeaturedStocks();
  const currentContest = useCurrentContest();
  const user = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="pt-8 pb-6 px-6">
        <h1 className="text-3xl font-bold text-center">📊 STOCK PREDICTIONS</h1>
        <p className="text-center text-gray-400 mt-2">Beat the AI. Win bragging rights.</p>
        
        {/* Contest Status */}
        {currentContest && (
          <ContestStatus contest={currentContest} />
        )}
      </div>

      {/* Auth Section */}
      {!user && (
        <div className="px-6 mb-8">
          <AuthPrompt />
        </div>
      )}

      {/* Featured Stocks */}
      <div className="px-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center">
          🎯 THIS WEEK'S FEATURED STOCKS
          <span className="ml-auto text-sm text-gray-500">
            {featuredStocks.length} available
          </span>
        </h2>
        
        <div className="space-y-4">
          {featuredStocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} />
          ))}
        </div>

        {featuredStocks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📈</div>
            <p>Loading featured stocks...</p>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {user && currentContest && (
        <div className="px-6 mb-8">
          <QuickLeaderboard contestId={currentContest.id} />
        </div>
      )}

      {/* How it Works */}
      <div className="px-6 pb-8">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
          <h3 className="text-lg font-semibold mb-4 text-center">🎮 How It Works</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start">
              <span className="text-lg mr-3">1️⃣</span>
              <div>
                <strong>Sunday Night:</strong> Make your predictions for the week
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-3">2️⃣</span>
              <div>
                <strong>All Week:</strong> Watch your picks battle the AI predictions
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-3">3️⃣</span>
              <div>
                <strong>Friday Close:</strong> See who won and climb the leaderboard
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-lg mr-3">🏆</span>
              <div>
                <strong>Bragging Rights:</strong> Pure glory, no money involved
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Notice */}
      <div className="px-6 pb-20">
        <div className="bg-blue-900 border border-blue-700 rounded-xl p-4 text-center">
          <div className="text-2xl mb-2">🚧</div>
          <p className="text-blue-200 text-sm">
            <strong>Early Beta:</strong> Starting with AAPL only. More stocks coming soon!
          </p>
        </div>
      </div>

      {/* Bottom Navigation Spacer */}
      <div className="h-20"></div>
    </div>
  );
};

export default LandingScreen;