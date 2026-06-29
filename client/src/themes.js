// Single source of truth for the per-entry pastel themes (backgrounds + accents).
// Shared by the editor's theme picker and the calendar's dots.
// Each theme: id (stored on the entry), label, emoji, a CSS background gradient,
// a calendar dot color, and `dark` (true = dark backdrop → light card + text).

export const THEMES = [
  { id: 'plain',  label: 'Plain',  emoji: '🌸', dot: 'var(--blush)',
    bg: 'linear-gradient(180deg,#fdeef4 0%,#f4ecfb 100%)' },
  { id: 'beach',  label: 'Beach',  emoji: '🏖️', dot: 'var(--babyblue)',
    bg: 'linear-gradient(180deg,#bfe3f5 0%,#d8eef7 36%,#f6ead0 66%,#f3e1c4 100%)' },
  { id: 'sky',    label: 'Sky',    emoji: '☁️', dot: 'var(--babyblue)',
    bg: 'linear-gradient(180deg,#cfe6fb 0%,#e7f1fb 55%,#fdf3f7 100%)' },
  { id: 'rain',   label: 'Rain',   emoji: '☔', dot: 'var(--mint)',
    bg: 'linear-gradient(180deg,#cdd6e8 0%,#dfe6f1 50%,#eef1f6 100%)' },
  { id: 'meadow', label: 'Meadow', emoji: '🌿', dot: 'var(--mint)',
    bg: 'linear-gradient(180deg,#d6efd5 0%,#eaf6e4 55%,#f7f4dd 100%)' },
  { id: 'forest', label: 'Forest', emoji: '🌲', dot: 'var(--mint)',
    bg: 'linear-gradient(180deg,#cfe7d8 0%,#dbeede 50%,#eef4e6 100%)' },
  { id: 'floral', label: 'Floral', emoji: '🌷', dot: 'var(--blush)',
    bg: 'linear-gradient(180deg,#fbdce9 0%,#f5dcf0 50%,#efe2fb 100%)' },
  { id: 'sunset', label: 'Sunset', emoji: '🌅', dot: 'var(--peach)',
    bg: 'linear-gradient(180deg,#ffd9c9 0%,#ffe0d0 32%,#f7d6e6 68%,#ead7f2 100%)' },
  { id: 'cozy',   label: 'Cozy',   emoji: '🕯️', dot: 'var(--peach)',
    bg: 'linear-gradient(180deg,#f6e3d2 0%,#f1d8c6 50%,#ecd3cf 100%)' },
  { id: 'butter', label: 'Sunny',  emoji: '🌼', dot: 'var(--butter)',
    bg: 'linear-gradient(180deg,#fdf3c9 0%,#fbeed3 55%,#fdf0e6 100%)' },
  { id: 'night',  label: 'Night',  emoji: '🌙', dot: 'var(--lavender)', dark: true,
    bg: 'linear-gradient(180deg,#2f2a44 0%,#3a3357 60%,#463a63 100%)' },
  { id: 'starry', label: 'Starry', emoji: '✨', dot: 'var(--lavender)', dark: true,
    bg: `radial-gradient(1.5px 1.5px at 18% 22%, #fff 50%, transparent 51%),
         radial-gradient(1.5px 1.5px at 67% 14%, #fff 50%, transparent 51%),
         radial-gradient(1px 1px at 41% 38%, #ffe9b0 50%, transparent 51%),
         radial-gradient(1.5px 1.5px at 84% 47%, #fff 50%, transparent 51%),
         radial-gradient(1px 1px at 29% 64%, #fff 50%, transparent 51%),
         radial-gradient(1.5px 1.5px at 73% 76%, #fff 50%, transparent 51%),
         radial-gradient(1px 1px at 52% 88%, #ffe9b0 50%, transparent 51%),
         linear-gradient(180deg,#23243f 0%,#2b2b50 55%,#3a2f57 100%)` },
];

const BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

export const themeById = (id) => BY_ID[id] || BY_ID.plain;
export const themeDot = (id) => themeById(id).dot;
export const isDarkTheme = (id) => !!themeById(id).dark;
