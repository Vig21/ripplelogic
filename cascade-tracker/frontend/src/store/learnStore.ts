import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningChallenge, LearningProgress, LearningPrediction } from '@/services/learnApi';

interface LearnState {
  // User state
  username: string | null;
  progress: LearningProgress | null;

  // Challenges
  challenges: LearningChallenge[];
  currentChallenge: LearningChallenge | null;

  // Predictions
  userPredictions: LearningPrediction[];

  // UI state
  selectedDifficulty: string | null;
  selectedCategory: string | null;

  // Actions
  setUsername: (username: string) => void;
  setProgress: (progress: LearningProgress | null) => void;
  setChallenges: (challenges: LearningChallenge[]) => void;
  setCurrentChallenge: (challenge: LearningChallenge | null) => void;
  setUserPredictions: (predictions: LearningPrediction[]) => void;
  setSelectedDifficulty: (difficulty: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  addPrediction: (prediction: LearningPrediction) => void;
  updateProgress: (update: Partial<LearningProgress>) => void;
  clearLearnState: () => void;
}

export const useLearnStore = create<LearnState>()(
  persist(
    (set) => ({
      // Initial state
      username: null,
      progress: null,
      challenges: [],
      currentChallenge: null,
      userPredictions: [],
      selectedDifficulty: null,
      selectedCategory: null,

      // Actions
      setUsername: (username) => set({ username }),

      setProgress: (progress) => set({ progress }),

      setChallenges: (challenges) => set({ challenges }),

      setCurrentChallenge: (challenge) => set({ currentChallenge: challenge }),

      setUserPredictions: (predictions) => set({ userPredictions: predictions }),

      setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      addPrediction: (prediction) =>
        set((state) => ({
          userPredictions: [prediction, ...state.userPredictions],
        })),

      updateProgress: (update) =>
        set((state) => ({
          progress: state.progress ? { ...state.progress, ...update } : null,
        })),

      clearLearnState: () =>
        set({
          username: null,
          progress: null,
          challenges: [],
          currentChallenge: null,
          userPredictions: [],
          selectedDifficulty: null,
          selectedCategory: null,
        }),
    }),
    {
      name: 'learn-storage',
      partialize: (state) => ({
        username: state.username,
        selectedDifficulty: state.selectedDifficulty,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);
