// ─── ELO RATING SYSTEM ────────────────────────────────────────────────────────
// K factor determines max rating change per game
const K = 32;

// Expected score for player A against player B
const expectedScore = (ratingA, ratingB) => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

// Calculate new ratings after a duel
// actualScoreA: 1 if A won, 0 if A lost
export const calculateElo = (ratingA, ratingB, actualScoreA) => {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = expectedScore(ratingB, ratingA);
  const actualScoreB = 1 - actualScoreA;

  const newRatingA = Math.round(ratingA + K * (actualScoreA - expectedA));
  const newRatingB = Math.round(ratingB + K * (actualScoreB - expectedB));

  // Minimum rating is 0
  const finalA = Math.max(0, newRatingA);
  const finalB = Math.max(0, newRatingB);

  return {
    newRatingA:    finalA,
    newRatingB:    finalB,
    changeA:       finalA - ratingA,
    changeB:       finalB - ratingB,
  };
};

// Get tier based on rating
export const getTier = (rating) => {
  if (rating >= 2000) return { name: 'Hacker',     color: '#ef4444', bg: '#450a0a', emoji: '🔴' };
  if (rating >= 1500) return { name: 'Pro',         color: '#a855f7', bg: '#3b0764', emoji: '🟣' };
  if (rating >= 1000) return { name: 'Veteran',     color: '#3b82f6', bg: '#172554', emoji: '🔵' };
  if (rating >= 500)  return { name: 'Apprentice',  color: '#22c55e', bg: '#052e16', emoji: '🟢' };
  return                     { name: 'Newbie',      color: '#94a3b8', bg: '#1e293b', emoji: '🟤' };
};
