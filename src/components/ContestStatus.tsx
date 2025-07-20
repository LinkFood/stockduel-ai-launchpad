'use client';

import React from 'react';
import type { ContestPeriod } from '@/types';

interface ContestStatusProps {
  contest: ContestPeriod;
}

const ContestStatus: React.FC<ContestStatusProps> = ({ contest }) => {
  const now = new Date();
  // Convert string date to Date object if needed
  const deadline = contest.predictionDeadline instanceof Date 
    ? contest.predictionDeadline 
    : new Date(contest.predictionDeadline);
  
  const timeLeft = deadline.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="text-center mt-4 p-4 bg-slate-800 rounded-xl border border-slate-600">
      <div className="text-orange-400 font-mono">
        ⏰ Predictions close in {hoursLeft}h {minutesLeft}m
      </div>
      <div className="text-sm text-gray-400 mt-1">
        {contest.totalParticipants} players competing this week
      </div>
    </div>
  );
};

export default ContestStatus;