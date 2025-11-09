'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore';
import { useCascadeStore } from '../store/cascadeStore';
import { websocketService } from '../services/websocketService';
import { RichMessageContent } from './chat/RichMessageContent';

// Helper function to get or create user ID
const getUserId = (user: any): string => {
  if (user?.id) return user.id;

  // For guest users, create or retrieve a persistent ID
  let guestId = localStorage.getItem('cascade_guest_id');
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cascade_guest_id', guestId);
  }
  return guestId;
};

export function PolymarketTradingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isConnected,
    isProcessing,
    currentStreamingMessage,
    statusMessage,
  } = useChatStore();

  const { user } = useCascadeStore();

  // Connect to WebSocket on mount
  useEffect(() => {
    const userId = getUserId(user);
    console.log('Connecting WebSocket with user ID:', userId);
    websocketService.connect(userId);

    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected || isProcessing) return;

    // Add user message to store
    useChatStore.getState().addMessage({
      role: 'user',
      content: inputMessage.trim(),
    });

    // Send to server
    websocketService.sendMessage(inputMessage.trim());

    // Clear input
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQueries = [
    "What are the trending markets right now?",
    "Find markets about Bitcoin",
    "Show me the most active prediction markets",
    "Analyze cascade effects in crypto markets",
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                     bg-gradient-to-br from-pm-blue to-pm-teal
                     text-slate-900 shadow-glow hover:shadow-xl
                     flex items-center justify-center
                     transition-all duration-300 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>

            {/* Connection indicator */}
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full
                           ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px]
                     glass-card flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pm-blue to-pm-teal
                             flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Trading Assistant</h3>
                  <p className="text-xs text-gray-400">
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Connected to Polymarket
                      </span>
                    ) : (
                      'Connecting...'
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pm-blue/25 to-pm-teal/25
                               flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-pm-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Welcome to Polymarket Trading Assistant
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Ask me about prediction markets, trends, and cascade effects
                  </p>

                  {/* Suggested queries */}
                  <div className="space-y-2 w-full">
                    {suggestedQueries.slice(0, 3).map((query, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputMessage(query);
                          inputRef.current?.focus();
                        }}
                        className="w-full p-3 rounded-lg text-sm text-left
                                 bg-white/5 hover:bg-white/10
                                 border border-white/10 hover:border-pm-blue/40
                                 text-gray-300 hover:text-white
                                 transition-all"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-pm-blue to-pm-teal text-slate-900'
                            : 'bg-white/10 text-gray-100'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <RichMessageContent
                              content={message.content}
                              isStreaming={message.isStreaming || false}
                            />
                            <p className="text-xs opacity-60 mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming message */}
                  {currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/10 text-gray-100">
                        <RichMessageContent
                          content={currentStreamingMessage}
                          isStreaming={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Processing/Status indicator */}
                  {isProcessing && !currentStreamingMessage && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-3 bg-white/10 flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                        {statusMessage && (
                          <span className="text-sm text-white/70 animate-pulse">{statusMessage}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConnected ? "Ask about markets..." : "Connecting..."}
                  disabled={!isConnected || isProcessing}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-gray-500
                           focus:outline-none focus:border-pm-blue
                           resize-none max-h-24
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || isProcessing || !inputMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pm-blue to-pm-teal
                           text-slate-900 font-semibold
                           hover:from-pm-blue/90 hover:to-pm-teal/90
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {/* Help text */}
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
