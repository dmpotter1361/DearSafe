import { useEffect, useState } from 'react';

const KEY = 'dearsafe-theme';

// Light/dark with persistence; applies data-theme to <html>.
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggle };
}
