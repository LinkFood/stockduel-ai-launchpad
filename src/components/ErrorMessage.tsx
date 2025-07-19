'use client';

import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  title = "Oops! Something went wrong"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
        
        {/* Error message */}
        <h2 className="text-2xl font-bold mb-4 text-red-400">{title}</h2>
        <p className="text-gray-300 mb-8 leading-relaxed">{message}</p>
        
        {/* Actions */}
        <div className="space-y-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-[1.02]"
            >
              🔄 Try Again
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            🔄 Refresh Page
          </button>
        </div>
        
        {/* Help text */}
        <div className="mt-8 p-4 bg-slate-800 rounded-xl border border-slate-600">
          <h4 className="font-semibold mb-2 text-gray-300">Troubleshooting:</h4>
          <ul className="text-sm text-gray-400 space-y-1 text-left">
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Clear your browser cache</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;