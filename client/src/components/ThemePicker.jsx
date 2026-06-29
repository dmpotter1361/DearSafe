import { useEffect, useRef, useState } from 'react';
import { THEMES, themeById } from '../themes';
import './ThemePicker.css';

// A 🎨 button that opens a popover grid of pastel theme swatches. Scales past a
// flat chip row as the curated set grows; closes on select or outside click.
export default function ThemePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = themeById(value);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const pick = (id) => { onChange?.(id); setOpen(false); };

  return (
    <div className="theme-picker" ref={ref}>
      <button
        type="button"
        className="theme-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="theme-swatch sm" style={{ background: current.bg }} />
        <span className="theme-trigger-label">{current.emoji} {current.label}</span>
        <span className="theme-caret">▾</span>
      </button>

      {open && (
        <div className="theme-pop" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === value}
              className={`theme-opt ${t.id === value ? 'sel' : ''}`}
              onClick={() => pick(t.id)}
              title={t.label}
            >
              <span className="theme-swatch" style={{ background: t.bg }}>
                <span className="theme-emoji">{t.emoji}</span>
              </span>
              <span className="theme-opt-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
