export const POINTS = {
  PHOTO: 10,
  VIDEO: 30,
  EDITING: 20,
  COMPLETE_DAY_BONUS: 50,
};

export const LEVEL_THRESHOLDS = {
  seedling: { emoji: '🌱', min: 0, max: 499 },
  target: { emoji: '🎯', min: 500, max: 1499 },
  star: { emoji: '⭐', min: 1500, max: 2999 },
  diamond: { emoji: '💎', min: 3000, max: 4999 },
  trophy: { emoji: '🏆', min: 5000, max: Infinity },
};

export function calculateDayPoints(
  photosCount: number,
  videoCompleted: boolean,
  editingCompleted: boolean
): { points: number; isComplete: boolean } {
  let points = 0;

  points += photosCount * POINTS.PHOTO;
  if (videoCompleted) points += POINTS.VIDEO;
  if (editingCompleted) points += POINTS.EDITING;

  const isComplete = photosCount >= 3 && videoCompleted && editingCompleted;
  if (isComplete) points += POINTS.COMPLETE_DAY_BONUS;

  return { points, isComplete };
}

export function getLevelFromPoints(points: number): keyof typeof LEVEL_THRESHOLDS {
  if (points >= LEVEL_THRESHOLDS.trophy.min) return 'trophy';
  if (points >= LEVEL_THRESHOLDS.diamond.min) return 'diamond';
  if (points >= LEVEL_THRESHOLDS.star.min) return 'star';
  if (points >= LEVEL_THRESHOLDS.target.min) return 'target';
  return 'seedling';
}

export function getProgressPercentage(completedDays: number): number {
  return Math.min(Math.round((completedDays / 100) * 100), 100);
}
