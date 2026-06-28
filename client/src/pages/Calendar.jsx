import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Calendar.css';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const VIEWS = ['Calendar', 'Timeline', 'On this day'];
const THEME_COLOR = {
  beach: 'var(--babyblue)', rain: 'var(--mint)', plain: 'var(--blush)',
  night: 'var(--lavender)', default: 'var(--peach)',
};
const colorFor = (theme) => THEME_COLOR[theme] || THEME_COLOR.default;
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState('Calendar');
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.listEntries().then(setEntries).catch(() => setEntries([]));
  }, []);

  // Month shown = month of the newest entry (fallback: today).
  const anchor = entries[0]?.date || todayISO();
  const [yy, mm] = anchor.split('-').map(Number);
  const monthName = new Date(yy, mm - 1, 1).toLocaleDateString(undefined, {
    month: 'long', year: 'numeric',
  });

  const byDay = useMemo(() => {
    const map = {};
    for (const e of entries) {
      const [ey, em, ed] = e.date.split('-').map(Number);
      if (ey === yy && em === mm) (map[ed] ||= []).push(colorFor(e.theme));
    }
    return map;
  }, [entries, yy, mm]);

  const firstDow = new Date(yy, mm - 1, 1).getDay();
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthCount = Object.values(byDay).reduce((n, a) => n + a.length, 0);
  const open = (id) => navigate(`/today?id=${id}`);

  return (
    <div className="cal-page">
      <div className="cal-head card">
        <h2>{monthName}</h2>
        <p className="muted">{monthCount} {monthCount === 1 ? 'entry' : 'entries'} this month</p>
        <div className="seg">
          {VIEWS.map((v) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'Calendar' && (
        <div className="cal-grid card">
          <div className="dow">{DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="days">
            {cells.map((d, i) =>
              d === null ? (
                <div key={`b${i}`} className="day blank" />
              ) : (
                <div key={d} className={`day ${todayISO() === `${yy}-${String(mm).padStart(2,'0')}-${String(d).padStart(2,'0')}` ? 'today' : ''}`}>
                  <span>{d}</span>
                  <div className="dots">
                    {(byDay[d] || []).slice(0, 3).map((c, j) => (
                      <i key={j} style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {(view === 'Timeline' || view === 'On this day') && (
        <div className="timeline">
          {view === 'On this day' && <p className="muted onthis">✨ One year ago today…</p>}
          {entries.length === 0 && <p className="muted">No entries yet.</p>}
          {entries.map((e) => (
            <button key={e.id} className="tl-item card" onClick={() => open(e.id)}>
              <div className="tl-thumb" style={{ background: colorFor(e.theme) }}>{e.mood || '📓'}</div>
              <div className="tl-body">
                <h4>{e.title || 'Untitled'}</h4>
                <p className="muted">{e.date === todayISO() ? 'Today' : e.date}</p>
                <div className="tl-tags">
                  {(e.tags || []).map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
