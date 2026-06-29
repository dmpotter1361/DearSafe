import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { EventList, FeedSettings } from '../components/CalendarFeed';
import { themeDot } from '../themes';
import './Calendar.css';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const VIEWS = ['Calendar', 'Timeline', 'On this day'];
const colorFor = (theme) => themeDot(theme);
const todayISO = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');
const longDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

export default function Calendar() {
  const navigate = useNavigate();
  const [view, setView] = useState('Calendar');
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);   // YYYY-MM-DD or null
  const [extByDay, setExtByDay] = useState({});      // { day:int -> count } for the month
  const [dayEvents, setDayEvents] = useState({ loading: false });
  const [feedVer, setFeedVer] = useState(0);         // bump to refetch after feed changes

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

  // Pull external events for the whole visible month → mark which days have them.
  const reloadMonth = () => {
    const from = `${yy}-${pad(mm)}-01`;
    const to = `${yy}-${pad(mm)}-${pad(new Date(yy, mm, 0).getDate())}`;
    api.calendarRange(from, to)
      .then((r) => {
        const map = {};
        for (const ev of r.events || []) {
          const d = Number(ev.date.split('-')[2]);
          map[d] = (map[d] || 0) + 1;
        }
        setExtByDay(map);
      })
      .catch(() => setExtByDay({}));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reloadMonth, [yy, mm, feedVer]);

  // Load external events for the selected day.
  useEffect(() => {
    if (!selected) return;
    setDayEvents({ loading: true });
    api.calendarEvents(selected)
      .then((r) => setDayEvents({ loading: false, ...r }))
      .catch(() => setDayEvents({ loading: false, connected: false }));
  }, [selected, feedVer]);

  const firstDow = new Date(yy, mm - 1, 1).getDay();
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthCount = Object.values(byDay).reduce((n, a) => n + a.length, 0);
  const open = (id) => navigate(`/today?id=${id}`);

  const selEntries = selected ? entries.filter((e) => e.date === selected) : [];

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
        <>
          <div className="cal-grid card">
            <div className="dow">{DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="days">
              {cells.map((d, i) => {
                if (d === null) return <div key={`b${i}`} className="day blank" />;
                const iso = `${yy}-${pad(mm)}-${pad(d)}`;
                const cls = [
                  'day',
                  todayISO() === iso ? 'today' : '',
                  selected === iso ? 'sel' : '',
                  extByDay[d] ? 'has-ext' : '',
                ].join(' ').trim();
                return (
                  <div key={d} className={cls} onClick={() => setSelected(iso)}>
                    {extByDay[d] ? <span className="num-ext" title={`${extByDay[d]} calendar event(s)`}>📅</span> : null}
                    <span>{d}</span>
                    <div className="dots">
                      {(byDay[d] || []).slice(0, 3).map((c, j) => (
                        <i key={j} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="day-panel card">
              <h3>{longDate(selected)}</h3>

              <div className="dp-section">
                <span className="dp-label muted">Your entries</span>
                {selEntries.length === 0 ? (
                  <p className="ev-empty muted">No entry yet — <a href={`/today`} onClick={(e)=>{e.preventDefault();navigate('/today');}}>write one ›</a></p>
                ) : (
                  selEntries.map((e) => (
                    <button key={e.id} className="dp-entry" onClick={() => open(e.id)}>
                      <span className="dp-mood">{e.mood || '📓'}</span>
                      <b>{e.title || 'Untitled'}</b>
                    </button>
                  ))
                )}
              </div>

              {dayEvents.connected && (
                <div className="dp-section">
                  <span className="dp-label muted">On your calendar</span>
                  {dayEvents.loading
                    ? <p className="ev-empty muted">Loading…</p>
                    : <EventList events={dayEvents.events} empty="Nothing scheduled." />}
                </div>
              )}
            </div>
          )}

          <FeedSettings onChange={() => setFeedVer((v) => v + 1)} />
        </>
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
