'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import AchievementToast from '@/components/AchievementToast';

interface AchievementContextType {
  addAchievement: (badgeId: string, badgeName: string) => void;
  checkAchievements: (event: {
    type: 'prediction' | 'streak' | 'research' | 'level_up';
    data: any;
  }) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const { achievements, addAchievement, dismissAchievement, checkAchievements } = useAchievements();

  return (
    <AchievementContext.Provider value={{ addAchievement, checkAchievements }}>
      {children}
      <AchievementToast achievements={achievements} onDismiss={dismissAchievement} />
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within AchievementProvider');
  }
  return context;
}
