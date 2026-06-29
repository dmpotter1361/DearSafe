import { useMemo } from 'react';
import './ContextRail.css';

// Right-hand rail shown on wide desktops: glanceable context that would
// otherwise be empty margin — live writing stats + "On this day" past entries.

function stats(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const photos = (html || '').match(/<img/g)?.length || 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, photos, minutes };
}

const longDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

export default function ContextRail({ current, entries, onOpen }) {
  const s = useMemo(() => stats(current?.body), [current?.body]);

  // Past entries on the same month/day (other years/months excluded by full date).
  const onThisDay = useMemo(() => {
    if (!current) return [];
    const md = current.date.slice(5); // MM-DD
    return entries.filter((e) => e.id !== current.id && e.date.slice(5) === md);
  }, [entries, current]);

  if (!current) return null;

  return (
    <aside className="context-rail">
      <div className="rail-card card">
        <h4 className="rail-title">At a glance</h4>
        <div className="rail-stats">
          <div className="rail-stat">
            <span className="rail-num">{s.words}</span>
            <span className="rail-lbl muted">{s.words === 1 ? 'word' : 'words'}</span>
          </div>
          <div className="rail-stat">
            <span className="rail-num">{s.photos}</span>
            <span className="rail-lbl muted">{s.photos === 1 ? 'photo' : 'photos'}</span>
          </div>
          <div className="rail-stat">
            <span className="rail-num">{s.words ? s.minutes : 0}</span>
            <span className="rail-lbl muted">min read</span>
          </div>
        </div>
      </div>

      <div className="rail-card card">
        <h4 className="rail-title">✨ On this day</h4>
        <p className="muted rail-sub">{longDate(current.date)} in your journal</p>
        {onThisDay.length === 0 ? (
          <p className="muted rail-empty">No past entries on this day yet — they’ll gather here over time. 🌱</p>
        ) : (
          <div className="rail-otd">
            {onThisDay.map((e) => (
              <button key={e.id} className="rail-otd-item" onClick={() => onOpen(e)}>
                <span className="rail-otd-mood">{e.mood || '📓'}</span>
                <span className="rail-otd-text">
                  <b>{e.title || 'Untitled'}</b>
                  <small className="muted">{e.date}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
