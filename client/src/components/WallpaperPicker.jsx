import { useEffect, useRef, useState } from 'react';
import { WALLPAPERS, wallpaperById } from '../wallpapers';
import './WallpaperPicker.css';

// Top-bar 🖼️ button → popover grid of app wallpapers (global page background).
export default function WallpaperPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = wallpaperById(value);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const pick = (id) => { onChange?.(id); setOpen(false); };

  return (
    <div className="wp-picker" ref={ref}>
      <button
        type="button"
        className="wp-trigger"
        onClick={() => setOpen((o) => !o)}
        title={`Wallpaper: ${current.label}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        🖼️
      </button>

      {open && (
        <div className="wp-pop" role="menu">
          <div className="wp-pop-title muted">Wallpaper</div>
          <div className="wp-grid">
            {WALLPAPERS.map((w) => (
              <button
                key={w.id}
                type="button"
                role="menuitemradio"
                aria-checked={w.id === value}
                className={`wp-opt ${w.id === value ? 'sel' : ''}`}
                onClick={() => pick(w.id)}
                title={w.label}
              >
                <span
                  className="wp-swatch"
                  style={{ background: w.css || 'var(--bg)', backgroundSize: w.size || 'cover' }}
                />
                <span className="wp-label">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
