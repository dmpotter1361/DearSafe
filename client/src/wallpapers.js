// App-wide wallpapers (the page background behind everything). A global per-owner
// preference (stored in settings), distinct from the per-entry theme. Each is a CSS
// background value; soft-pattern ones layer a repeating motif over a pastel wash.

const dots = (c) => `radial-gradient(${c} 1.6px, transparent 1.7px)`;
const hearts = (c) =>
  `radial-gradient(circle at 50% 60%, ${c} 0 30%, transparent 31%)`;

export const WALLPAPERS = [
  { id: 'default', label: 'Default', css: null }, // the app's built-in pastel wash
  { id: 'cream', label: 'Cream', css: '#fff8f4' },
  { id: 'blush', label: 'Blush', css: 'linear-gradient(160deg,#fde4ee 0%,#fbeef4 60%,#fff6fb 100%)' },
  { id: 'lavender', label: 'Lavender', css: 'linear-gradient(160deg,#ece3fb 0%,#f1ebfb 60%,#faf6ff 100%)' },
  { id: 'mint', label: 'Mint', css: 'linear-gradient(160deg,#dcf3e6 0%,#ecf8f0 60%,#f7fdf9 100%)' },
  { id: 'sky', label: 'Sky', css: 'linear-gradient(160deg,#dcecfb 0%,#eaf3fc 60%,#f8fbff 100%)' },
  { id: 'peach', label: 'Peach', css: 'linear-gradient(160deg,#ffe6d6 0%,#fff0e6 60%,#fff8f3 100%)' },
  { id: 'sunny', label: 'Sunny', css: 'linear-gradient(160deg,#fdf2cc 0%,#fdf6dd 60%,#fffdf3 100%)' },
  { id: 'rainbow', label: 'Rainbow', css: 'linear-gradient(135deg,#fbe0e9,#ffe9da,#fbf4d4,#dcf3e6,#dcecfb,#ece3fb)' },
  { id: 'dots', label: 'Dots', size: '22px 22px',
    css: `${dots('rgba(232,155,180,0.35)')}, linear-gradient(160deg,#fff5f9,#f6f0ff)` },
  { id: 'confetti', label: 'Confetti', size: '26px 26px, 26px 26px, 100% 100%',
    css: `${dots('rgba(150,200,235,0.4)')}, ${dots('rgba(255,200,120,0.0)')}, linear-gradient(160deg,#fef7ff,#eef6ff)` },
  { id: 'hearts', label: 'Hearts', size: '30px 30px',
    css: `${hearts('rgba(232,155,180,0.18)')}, linear-gradient(160deg,#fff5f9,#fdeef6)` },
  { id: 'midnight', label: 'Midnight', css: 'linear-gradient(160deg,#2a2433 0%,#332c41 60%,#3a3346 100%)', dark: true },
  { id: 'starry', label: 'Starry', dark: true, size: 'auto',
    css: `radial-gradient(1.4px 1.4px at 20% 30%,#fff 50%,transparent 51%),
          radial-gradient(1.4px 1.4px at 70% 20%,#fff 50%,transparent 51%),
          radial-gradient(1.2px 1.2px at 45% 65%,#ffe9b0 50%,transparent 51%),
          radial-gradient(1.4px 1.4px at 85% 55%,#fff 50%,transparent 51%),
          radial-gradient(1.2px 1.2px at 30% 80%,#fff 50%,transparent 51%),
          linear-gradient(160deg,#23243f 0%,#2b2b50 60%,#332b4f 100%)` },
];

const BY_ID = Object.fromEntries(WALLPAPERS.map((w) => [w.id, w]));
export const wallpaperById = (id) => BY_ID[id] || BY_ID.default;
