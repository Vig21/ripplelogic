'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { websocketService } from '../services/websocketService';

export function PolymarketOAuthModal() {
  const { showOAuthModal, oauthStatus, setShowOAuthModal } = useChatStore();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Listen for OAuth success message from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth_success') {
        console.log('OAuth success received from popup');
        setIsCheckingStatus(true);

        // Check status after a short delay
        setTimeout(() => {
          websocketService.checkOAuthStatus();
          setIsCheckingStatus(false);
          setShowOAuthModal(false);
        }, 1000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setShowOAuthModal]);

  // Check if auth window was closed
  useEffect(() => {
    if (authWindow && !authWindow.closed) {
      const interval = setInterval(() => {
        if (authWindow.closed) {
          console.log('Auth window was closed');
          setAuthWindow(null);
          // Check status in case user completed auth
          websocketService.checkOAuthStatus();
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [authWindow]);

  const handleAuthenticate = () => {
    if (!oauthStatus?.pendingAuthUrl) {
      console.error('No auth URL available');
      return;
    }

    // Open auth URL in popup window
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      oauthStatus.pendingAuthUrl,
      'Polymarket OAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (popup) {
      setAuthWindow(popup);
      popup.focus();
    } else {
      console.error('Failed to open auth window. Popup might be blocked.');
      alert('Please allow popups for this site to authenticate.');
    }
  };

  const handleClose = () => {
    setShowOAuthModal(false);
  };

  return (
    <AnimatePresence>
      {showOAuthModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
          >
            <div className="glass-card p-8 m-4 relative">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2 neon-text">
                Connect to Polymarket
              </h2>

              {/* Description */}
              <p className="text-gray-300 text-center mb-6">
                To access real-time prediction market data and trading insights, please authenticate with Polymarket.
              </p>

              {/* Features list */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neon-cyan mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Search Markets</p>
                    <p className="text-sm text-gray-400">Find trending prediction markets</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neon-cyan mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Analyze Trends</p>
                    <p className="text-sm text-gray-400">Get AI-powered market analysis</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-neon-cyan mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-white font-medium">Discover Cascades</p>
                    <p className="text-sm text-gray-400">Understand market cascade effects</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAuthenticate}
                  disabled={isCheckingStatus}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all
                           bg-gradient-to-r from-purple-500 to-cyan-500
                           hover:from-purple-600 hover:to-cyan-600
                           text-white shadow-glow
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingStatus ? 'Checking Status...' : 'Authenticate with Polymarket'}
                </button>

                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 rounded-lg font-semibold transition-all
                           bg-white/5 hover:bg-white/10
                           text-gray-300 hover:text-white
                           border border-white/10"
                >
                  Maybe Later
                </button>
              </div>

              {/* Security note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your credentials are securely stored and never shared
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
