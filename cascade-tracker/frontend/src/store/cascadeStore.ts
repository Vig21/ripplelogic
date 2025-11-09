import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  score: number;
  streak: number;
  predictions_total: number;
  predictions_correct: number;
}

interface CascadeStore {
  user: User | null;
  setUser: (user: User) => void;
  updateScore: (points: number) => void;
  updateStreak: (streak: number) => void;
  clearUser: () => void;
}

export const useCascadeStore = create<CascadeStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  updateScore: (points) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, score: state.user.score + points }
        : null,
    })),

  updateStreak: (streak) =>
    set((state) => ({
      user: state.user ? { ...state.user, streak } : null,
    })),

  clearUser: () => set({ user: null }),
}));
