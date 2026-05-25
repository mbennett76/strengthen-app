export const PILLARS = [
  {
    id: 'spiritual',
    name: 'Spiritual',
    icon: '✦',
    color: '#B45309',
    colorLight: '#FFFBEB',
    colorBorder: '#FDE68A',
    colorMid: '#D97706',
    description: 'Grow closer to God',
    verse: 'in favour with God',
    suggestions: [
      'Daily personal prayer',
      'Scripture study (10+ min)',
      'Church attendance',
      'Act of service for someone',
      'Family scripture study',
      'Write in gratitude journal',
      'Attend the temple',
    ],
  },
  {
    id: 'socialFamily',
    name: 'Social/Family',
    icon: '❤',
    color: '#166534',
    colorLight: '#F0FDF4',
    colorBorder: '#BBF7D0',
    colorMid: '#16A34A',
    description: 'Strengthen relationships',
    verse: 'in favour with man',
    suggestions: [
      'Eat dinner together',
      'Family Home Evening',
      'Kind act for a family member',
      'No contention for the day',
      'Express love to family',
      'Help with a household task',
      'Reach out to a friend',
    ],
  },
  {
    id: 'physical',
    name: 'Physical',
    icon: '⚡',
    color: '#1E40AF',
    colorLight: '#EFF6FF',
    colorBorder: '#BFDBFE',
    colorMid: '#2563EB',
    description: 'Honor your body',
    verse: 'in stature',
    suggestions: [
      'Exercise (30+ min)',
      'Sleep 8+ hours',
      'Eat healthy meals',
      'No social media after 9pm',
      'Drink 8 glasses of water',
      'Walk outside',
      'No junk food today',
    ],
  },
  {
    id: 'intellectual',
    name: 'Intellectual',
    icon: '◎',
    color: '#6B21A8',
    colorLight: '#FAF5FF',
    colorBorder: '#E9D5FF',
    colorMid: '#9333EA',
    description: 'Develop your mind',
    verse: 'in wisdom',
    suggestions: [
      'Read for 20+ minutes',
      'Learn a new skill',
      'Write a journal entry',
      'Limit screen time (2 hrs)',
      'Study or practice a talent',
      'Listen to uplifting music',
      'No negative media today',
    ],
  },
];

export const AVATAR_COLORS = [
  '#B45309', '#DC2626', '#166534', '#1E40AF',
  '#6B21A8', '#C2410C', '#0F766E', '#BE185D',
];

export const FREQUENCIES = [
  { id: 'daily',   label: 'Daily',   desc: 'Resets each day' },
  { id: 'weekly',  label: 'Weekly',  desc: 'Resets each Monday' },
  { id: 'monthly', label: 'Monthly', desc: 'Resets on the 1st' },
];

export const getPeriodKey = (frequency) => {
  const now = new Date();
  if (frequency === 'weekly') {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `w_${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  if (frequency === 'monthly') {
    return `m_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return `d_${now.toISOString().split('T')[0]}`;
};

export const getToday = () => new Date().toISOString().split('T')[0];

export const formatTime = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export const generateGroupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const TROPHIES = [
  { id: 'first_step',  icon: '🌱', name: 'First Step',       desc: 'Complete your very first goal',             condition: (s) => s.totalStars >= 1 },
  { id: 'star_10',     icon: '⭐', name: 'Rising Star',      desc: 'Earn 10 stars',                             condition: (s) => s.totalStars >= 10 },
  { id: 'star_25',     icon: '🌟', name: 'Shining Light',    desc: 'Earn 25 stars',                             condition: (s) => s.totalStars >= 25 },
  { id: 'star_50',     icon: '💫', name: 'Radiant',          desc: 'Earn 50 stars',                             condition: (s) => s.totalStars >= 50 },
  { id: 'star_100',    icon: '✨', name: 'Luminous',         desc: 'Earn 100 stars',                            condition: (s) => s.totalStars >= 100 },
  { id: 'streak_3',    icon: '🔥', name: 'On Fire',          desc: 'Achieve a 3-day streak',                    condition: (s) => s.bestStreak >= 3 },
  { id: 'streak_7',    icon: '🔥🔥', name: 'Week Warrior',   desc: 'Achieve a 7-day streak',                    condition: (s) => s.bestStreak >= 7 },
  { id: 'streak_14',   icon: '🔥🔥🔥', name: 'Unstoppable', desc: 'Achieve a 14-day streak',                   condition: (s) => s.bestStreak >= 14 },
  { id: 'streak_30',   icon: '👑', name: 'Monthly Champion', desc: 'Achieve a 30-day streak',                   condition: (s) => s.bestStreak >= 30 },
  { id: 'all_four',    icon: '🏅', name: 'All Four',         desc: 'Complete all 4 pillars in one day',         condition: (s) => s.allFourDays >= 1 },
  { id: 'all_four_5',  icon: '🎖️', name: 'Complete Disciple', desc: 'Complete all 4 pillars five times',       condition: (s) => s.allFourDays >= 5 },
  { id: 'spiritual_5', icon: '✦',  name: 'Faith Anchor',     desc: 'Complete spiritual goals 5 different days', condition: (s) => s.spiritualDays >= 5 },
  { id: 'social_5',    icon: '🏠', name: 'Family First',     desc: 'Complete social goals 5 different days',    condition: (s) => s.socialDays >= 5 },
  { id: 'physical_5',  icon: '⚡', name: 'Strong Body',      desc: 'Complete physical goals 5 different days',  condition: (s) => s.physicalDays >= 5 },
  { id: 'intellect_5', icon: '📖', name: 'Sharp Mind',       desc: 'Complete intellectual goals 5 days',        condition: (s) => s.intellectualDays >= 5 },
];
