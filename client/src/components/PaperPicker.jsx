import { useEffect, useRef, useState } from 'react';
import './PaperPicker.css';

// Per-entry writing-surface style for the editor (plain / lined / dotted / grid).
export const PAPERS = [
  { id: 'plain', label: 'Plain' },
  { id: 'lined', label: 'Lined' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'grid', label: 'Grid' },
];
const byId = Object.fromEntries(PAPERS.map((p) => [p.id, p]));

export default function PaperPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = byId[value] || byId.plain;

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const pick = (id) => { onChange?.(id); setOpen(false); };

  return (
    <div className="paper-picker" ref={ref}>
      <button
        type="button"
        className="paper-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Paper style"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={`paper-swatch sm pp-${current.id}`} />
        <span className="paper-trigger-label">📝 {current.label}</span>
        <span className="paper-caret">▾</span>
      </button>

      {open && (
        <div className="paper-pop" role="menu">
          {PAPERS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitemradio"
              aria-checked={p.id === value}
              className={`paper-opt ${p.id === value ? 'sel' : ''}`}
              onClick={() => pick(p.id)}
              title={p.label}
            >
              <span className={`paper-swatch pp-${p.id}`} />
              <span className="paper-opt-label">{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
