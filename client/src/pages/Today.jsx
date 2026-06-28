import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import './Today.css';

const TOOLS = ['B', 'I', 'U', 'A⁺', '🎨', '≣', '•', '🔗', '😊', '📷'];
const MOODS = ['😐', '🙂', '😄', '🥰', '😌'];
const THEMES = [
  { id: 'beach', label: '🏖️ Beach' },
  { id: 'rain', label: '☔ Rain' },
  { id: 'plain', label: '🌸 Plain' },
  { id: 'night', label: '🌙 Night' },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const weekday = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' });
const longDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  });

export default function Today() {
  const [params, setParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [current, setCurrent] = useState(null); // selected entry object (the draft)
  const [save, setSave] = useState('idle'); // idle | saving | saved
  const timer = useRef(null);

  // initial load
  useEffect(() => {
    (async () => {
      const list = await api.listEntries();
      setEntries(list);
      const wanted = params.get('id');
      setCurrent(list.find((e) => e.id === wanted) || list[0] || null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleSave = (next) => {
    setCurrent(next);
    setSave('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await api.updateEntry(next.id, {
        date: next.date, title: next.title, body: next.body,
        mood: next.mood, tags: next.tags, theme: next.theme,
      });
      setEntries((list) => list.map((e) => (e.id === next.id ? next : e)));
      setSave('saved');
    }, 600);
  };

  const patch = (p) => current && scheduleSave({ ...current, ...p });

  const newEntry = async () => {
    const { id } = await api.createEntry({ date: todayISO(), title: '', body: '', theme: 'plain', tags: [] });
    const list = await api.listEntries();
    setEntries(list);
    setCurrent(list.find((e) => e.id === id) || null);
    setParams({});
  };

  const removeEntry = async () => {
    if (!current) return;
    await api.deleteEntry(current.id);
    const list = await api.listEntries();
    setEntries(list);
    setCurrent(list[0] || null);
  };

  const addTag = () => {
    const t = prompt('Add a tag (no #):');
    if (t && current) patch({ tags: [...(current.tags || []), t.trim().replace(/^#/, '')] });
  };

  if (!current) {
    return (
      <div className="empty-state">
        <div className="empty-heart">🌸</div>
        <h2>Your journal is waiting</h2>
        <p className="muted">Start your first entry — write a little, add a photo, pick a theme.</p>
        <button className="btn" onClick={newEntry}>✍️ New entry</button>
      </div>
    );
  }

  return (
    <div className={`today theme-${current.theme}`}>
      <aside className="entry-list">
        <button className="btn new-btn" onClick={newEntry}>＋ New</button>
        {entries.map((e) => (
          <button
            key={e.id}
            className={`entry-list-item ${e.id === current.id ? 'sel' : ''}`}
            onClick={() => setCurrent(e)}
          >
            <span className="eli-mood">{e.mood || '📓'}</span>
            <span className="eli-text">
              <b>{e.title || 'Untitled'}</b>
              <small className="muted">{e.date}</small>
            </span>
          </button>
        ))}
      </aside>

      <div className="editor">
        <div className="editor-head">
          <div className="editor-date">
            <span className="handwritten big">{weekday(current.date)}</span>
            <small className="muted">{longDate(current.date)}</small>
          </div>
          <div className="theme-picker">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`chip ${current.theme === t.id ? 'sel' : ''}`}
                onClick={() => patch({ theme: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar" role="toolbar" aria-label="Formatting (coming soon)">
          {TOOLS.map((t, i) => (
            <button key={i} className={`tool t${i}`} tabIndex={-1} title="Rich formatting — coming soon">
              {t}
            </button>
          ))}
        </div>

        <article className="entry-card card">
          <input
            className="entry-title"
            value={current.title || ''}
            placeholder="Title your day…"
            onChange={(e) => patch({ title: e.target.value })}
          />
          <textarea
            className="entry-body"
            value={current.body || ''}
            placeholder="Dear diary…  ✨"
            onChange={(e) => patch({ body: e.target.value })}
          />

          <div className="entry-meta">
            <div className="mood">
              <span className="muted">Mood:</span>
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`m ${current.mood === m ? 'sel' : ''}`}
                  onClick={() => patch({ mood: m })}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="tags">
              {(current.tags || []).map((t) => (
                <span
                  key={t}
                  className="tag"
                  title="Remove"
                  onClick={() => patch({ tags: current.tags.filter((x) => x !== t) })}
                >
                  #{t} ✕
                </span>
              ))}
              <button className="tag add" onClick={addTag}>+ tag</button>
            </div>
          </div>
        </article>

        <div className="savebar">
          <span className={`dot ${save}`} />{' '}
          {save === 'saving' ? 'Saving…' : save === 'saved' ? 'Saved just now' : 'All changes saved'}
          <button className="trash-btn muted" onClick={removeEntry} title="Move to trash">🗑️</button>
        </div>
      </div>
    </div>
  );
}
