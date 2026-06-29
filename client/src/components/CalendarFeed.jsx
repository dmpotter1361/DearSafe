import { useEffect, useState } from 'react';
import { api } from '../api';
import './CalendarFeed.css';

// Compact list of external calendar events (shared by Today + Calendar).
export function EventList({ events, empty = 'Nothing on your calendar.' }) {
  if (!events || events.length === 0) return <p className="ev-empty muted">{empty}</p>;
  return (
    <ul className="ev-list">
      {events.map((e, i) => (
        <li key={i} className="ev-item">
          <span className="ev-time">{e.allDay ? 'all day' : e.time}</span>
          <span className="ev-text">
            {e.summary}
            {e.location && <small className="ev-loc muted"> · {e.location}</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}

// A soft "on your calendar that day" strip for the editor.
export function EventContext({ date }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let live = true;
    setState({ loading: true });
    api
      .calendarEvents(date)
      .then((r) => live && setState({ loading: false, ...r }))
      .catch(() => live && setState({ loading: false, connected: false }));
    return () => { live = false; };
  }, [date]);

  if (state.loading || !state.connected) return null; // hidden until a feed is connected
  if (state.error) return null;
  if (!state.events?.length) return null;

  return (
    <div className="ev-context">
      <span className="ev-context-label muted">📅 On your calendar</span>
      <EventList events={state.events} />
    </div>
  );
}

// Settings card to connect / change / disconnect the .ics feed.
export function FeedSettings({ onChange }) {
  const [url, setUrl] = useState('');
  const [saved, setSaved] = useState(null); // currently-saved URL (or null)
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () =>
    api.getCalendarFeed().then((r) => {
      setSaved(r.url || null);
      setEditing(!r.url);
      setUrl(r.url || '');
    });

  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.setCalendarFeed(url.trim());
      setSaved(r.url);
      setEditing(false);
      onChange?.();
    } catch (e) {
      setErr(e.message || 'Could not save that URL.');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true); setErr('');
    try {
      await api.clearCalendarFeed();
      setSaved(null);
      setUrl('');
      setEditing(true);
      onChange?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="feed-card card">
      <div className="feed-head">
        <h3>📅 Calendar feed</h3>
        {saved && !editing && <span className="pill">Connected</span>}
      </div>
      <p className="muted feed-blurb">
        Paste a read-only calendar link (iCal/<code>.ics</code>) to see each day's events
        beside your entries. Google, Apple, and Outlook all publish one — nothing is shared
        back, and the link is encrypted like everything else.
      </p>

      {saved && !editing ? (
        <div className="feed-saved">
          <code className="feed-url" title={saved}>{saved}</code>
          <div className="feed-actions">
            <button className="btn ghost" onClick={() => setEditing(true)}>Change</button>
            <button className="btn ghost" onClick={disconnect} disabled={busy}>Disconnect</button>
          </div>
        </div>
      ) : (
        <div className="feed-edit">
          <div className="field">
            <span>🔗</span>
            <input
              value={url}
              placeholder="https://calendar.google.com/…/basic.ics"
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && url.trim() && save()}
            />
          </div>
          <div className="feed-actions">
            <button className="btn" onClick={save} disabled={busy || !url.trim()}>
              {busy ? 'Saving…' : 'Connect'}
            </button>
            {saved && (
              <button className="btn ghost" onClick={() => { setEditing(false); setUrl(saved); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {err && <p className="feed-err">⚠️ {err}</p>}
    </div>
  );
}
