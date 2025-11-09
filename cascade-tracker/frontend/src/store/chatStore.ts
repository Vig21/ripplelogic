import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean; // Flag to indicate message is still being streamed
}

export interface ChatState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Messages
  messages: ChatMessage[];
  isProcessing: boolean;
  currentStreamingMessage: string;
  statusMessage: string | null; // Status updates like "Searching markets..."

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setProcessing: (processing: boolean) => void;
  setStatusMessage: (status: string | null) => void;
  appendStreamingContent: (content: string) => void;
  finalizeStreamingMessage: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  isConnected: false,
  isConnecting: false,
  connectionError: null,

  messages: [],
  isProcessing: false,
  currentStreamingMessage: '',
  statusMessage: null,

  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setConnectionError: (error) => set({ connectionError: error }),

  // Message actions
  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  setProcessing: (processing) => set({ isProcessing: processing }),
  setStatusMessage: (status) => set({ statusMessage: status }),

  appendStreamingContent: (content) => {
    set((state) => ({
      currentStreamingMessage: state.currentStreamingMessage + content,
      statusMessage: null, // Clear status when streaming starts
    }));
  },

  finalizeStreamingMessage: () => {
    const { currentStreamingMessage } = get();

    if (currentStreamingMessage.trim()) {
      get().addMessage({
        role: 'assistant',
        content: currentStreamingMessage.trim(),
      });
    }

    set({
      currentStreamingMessage: '',
      isProcessing: false,
      statusMessage: null,
    });
  },

  clearMessages: () => set({ messages: [], currentStreamingMessage: '', statusMessage: null }),
}));
