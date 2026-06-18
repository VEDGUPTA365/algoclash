export const getTier = (rating) => {
  if (rating >= 2000) return { name: 'Hacker',    color: '#ef4444', bg: '#450a0a', emoji: '🔴' };
  if (rating >= 1500) return { name: 'Pro',        color: '#a855f7', bg: '#3b0764', emoji: '🟣' };
  if (rating >= 1000) return { name: 'Veteran',    color: '#3b82f6', bg: '#172554', emoji: '🔵' };
  if (rating >= 500)  return { name: 'Apprentice', color: '#22c55e', bg: '#052e16', emoji: '🟢' };
  return                     { name: 'Newbie',     color: '#94a3b8', bg: '#1e293b', emoji: '🟤' };
};

export const getRatingChange = (change) => ({
  text:  change > 0 ? `+${change}` : `${change}`,
  color: change > 0 ? '#4ade80'    : '#f87171',
});
