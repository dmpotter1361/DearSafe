// Sample entries for the visual prototype (stand-in for the encrypted backend).
// Themes map to soft pastel backgrounds defined in Today.css.

export const SAMPLE_ENTRIES = [
  {
    id: 'e1',
    date: '2026-06-28',
    title: 'A day at the shore',
    theme: 'beach',
    mood: '😄',
    tags: ['beach', 'family'],
    blocks: [
      { type: 'p', text: 'Woke up early and drove out to the coast 🐚. The water was freezing but so worth it — we found the prettiest little tide pools.' },
      { type: 'photo', variant: 'beach', caption: '📍 Cannon Beach — low tide around 9am' },
      { type: 'p', text: 'Built a lopsided sandcastle, ate too many snacks, came home sandy and happy 💛.' },
    ],
  },
  {
    id: 'e2',
    date: '2026-06-27',
    title: 'Soap batch #14 — lavender',
    theme: 'plain',
    mood: '🙂',
    tags: ['soap', 'projects'],
    blocks: [
      { type: 'p', text: 'Lavender + a touch of chamomile. Lye temp 105°F, oils 110°F, traced in ~4 min.' },
      { type: 'photo', variant: 'soap', caption: 'Poured into the wooden mold — smells amazing' },
    ],
  },
  {
    id: 'e3',
    date: '2026-06-25',
    title: 'Quiet rainy afternoon',
    theme: 'rain',
    mood: '😌',
    tags: ['journal'],
    blocks: [
      { type: 'p', text: 'Tea, a good book, and rain on the window. Some days that is the whole entry. ☔' },
    ],
  },
];

// Days in June 2026 that have entries (for the calendar dots).
export const ACTIVITY = {
  1: ['mint'], 3: ['blush', 'babyblue'], 5: ['lavender'], 7: ['peach'],
  10: ['mint', 'butter'], 13: ['babyblue'], 23: ['blush'], 24: ['mint'],
  25: ['lavender', 'peach'], 26: ['babyblue'], 27: ['butter'], 28: ['babyblue'],
};
