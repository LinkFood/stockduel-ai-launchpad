'use client';

import React from 'react';

const AuthPrompt: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 border border-blue-600">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">🎯 Ready to Predict?</h3>
        <p className="text-blue-200 mb-4">
          Join thousands of traders competing for bragging rights
        </p>
        <div className="flex space-x-3">
          <button className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-500 hover:to-green-400 transition-all">
            🚀 Sign Up Free
          </button>
          <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors">
            🔑 Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;