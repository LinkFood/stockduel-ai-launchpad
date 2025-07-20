'use client';

import React from 'react';

interface QuickLeaderboardProps {
  contestId: string;
}

const QuickLeaderboard: React.FC<QuickLeaderboardProps> = ({ contestId }) => {
  // Mock leaderboard data for now
  const mockLeaderboard = [
    { rank: 1, name: "TradingGod23", points: 850, badge: "🏆" },
    { rank: 2, name: "StockWizard", points: 847, badge: "🥈" },
    { rank: 3, name: "You", points: 832, badge: "🥉", isUser: true },
    { rank: 4, name: "MarketBull", points: 829, badge: "" },
    { rank: 5, name: "DiamondHands", points: 821, badge: "" }
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-gray-300 flex items-center">
        📊 WEEKLY LEADERS
        <span className="ml-auto text-sm text-gray-500">Live Rankings</span>
      </h2>
      
      <div className="space-y-3">
        {mockLeaderboard.map((player) => (
          <div
            key={player.rank}
            className={`flex items-center justify-between p-4 rounded-xl ${
              player.isUser 
                ? 'bg-gradient-to-r from-blue-900 to-blue-800 border border-blue-600' 
                : 'bg-slate-800'
            }`}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{player.badge || `#${player.rank}`}</span>
              <span className={`font-semibold ${player.isUser ? 'text-blue-300' : ''}`}>
                {player.name}
              </span>
            </div>
            <div className="font-mono font-bold">{player.points} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLeaderboard;