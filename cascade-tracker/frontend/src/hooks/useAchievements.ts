import { useState, useCallback } from 'react';
import { BADGE_CONFIG } from '@/components/AchievementToast';

interface Achievement {
  id: string;
  badgeId: string;
  badgeName: string;
  teaches: string;
  icon: string;
  color: string;
  timestamp: Date;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const addAchievement = useCallback((badgeId: string, badgeName: string) => {
    const config = BADGE_CONFIG[badgeId as keyof typeof BADGE_CONFIG];

    if (!config) {
      console.warn(`Unknown badge ID: ${badgeId}`);
      return;
    }

    const achievement: Achievement = {
      id: `${badgeId}_${Date.now()}`,
      badgeId,
      badgeName,
      teaches: config.teaches,
      icon: config.icon,
      color: config.color,
      timestamp: new Date()
    };

    setAchievements((prev) => [...prev, achievement]);
  }, []);

  const dismissAchievement = useCallback((id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const checkAchievements = useCallback((event: {
    type: 'prediction' | 'streak' | 'research' | 'level_up';
    data: any;
  }) => {
    switch (event.type) {
      case 'prediction':
        if (event.data.isFirst) {
          addAchievement('first_prediction', 'First Steps');
        }
        if (event.data.isPerfect) {
          addAchievement('perfect_score', 'Perfect Prediction');
        }
        if (event.data.isEarly) {
          addAchievement('early_bird', 'Early Bird');
        }
        if (event.data.isContrarian) {
          addAchievement('contrarian', 'Against the Grain');
        }
        break;

      case 'streak':
        if (event.data.streak === 3) {
          addAchievement('streak_3', 'Hot Streak');
        } else if (event.data.streak === 5) {
          addAchievement('streak_5', 'On Fire!');
        }
        break;

      case 'research':
        if (event.data.questionsAsked >= 10) {
          addAchievement('researcher', 'Dedicated Researcher');
        }
        break;

      case 'level_up':
        addAchievement('level_up', `Level ${event.data.level}`);
        break;
    }
  }, [addAchievement]);

  return {
    achievements,
    addAchievement,
    dismissAchievement,
    checkAchievements
  };
}
