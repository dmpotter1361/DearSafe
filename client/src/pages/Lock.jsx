import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_VERSION } from '../version';
import { api } from '../api';
import './Lock.css';

// Lock / first-run setup screen, wired to the real API.
export default function Lock({ onUnlocked }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('loading'); // loading | unlock | setup | recovery
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dev, setDev] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [savedAck, setSavedAck] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, cfg] = await Promise.all([api.setupStatus(), api.config()]);
        setDev(cfg.dev);
        setMode(s.setup ? 'unlock' : 'setup');
      } catch {
        setMode('unlock');
      }
    })();
  }, []);

  const finish = async () => {
    await onUnlocked();
    navigate('/today');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'unlock') {
        await api.unlock(pw);
        await finish();
      } else if (mode === 'setup') {
        if (pw.length < 6) throw new Error('Password must be at least 6 characters');
        const { recoveryKey: rk } = await api.setup(pw);
        setRecoveryKey(rk);
        setMode('recovery'); // show the recovery card before continuing
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'loading') {
    return <div className="lock-screen center"><span className="muted">Loading…</span></div>;
  }

  // Recovery-card reveal (first run, after setup)
  if (mode === 'recovery') {
    return (
      <div className="lock-screen">
        <div className="lock-card">
          <div className="lock-heart">🔒💗</div>
          <h1 className="lock-title">Save your recovery card</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            This is the <b>only</b> way back in if you forget your password. No one — not even
            the server — can recover your entries without it.
          </p>
          <pre className="recovery-key">{recoveryKey}</pre>
          <div className="recovery-actions">
            <button
              className="btn ghost"
              onClick={() => navigator.clipboard?.writeText(recoveryKey)}
            >
              📋 Copy
            </button>
          </div>
          <label className="saved-check">
            <input type="checkbox" checked={savedAck} onChange={(e) => setSavedAck(e.target.checked)} />
            I’ve saved my recovery key somewhere safe
          </label>
          <button className="btn" style={{ width: '100%' }} disabled={!savedAck} onClick={finish}>
            Enter my journal →
          </button>
        </div>
        <div className="lock-version muted">v{APP_VERSION}</div>
      </div>
    );
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <div className="lock-heart">🔒💗</div>
        <h1 className="lock-title">DearSafe</h1>
        <p className="lock-hello handwritten">
          {mode === 'setup' ? 'Let’s set up your journal 🌸' : 'Welcome back 🌸'}
        </p>

        <div className="field">
          <span aria-hidden>🔑</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={mode === 'setup' ? 'Create a password' : 'Your password'}
            autoFocus
          />
        </div>

        {error && <div className="lock-error">⚠️ {error}</div>}

        <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 10 }}>
          {busy ? 'Please wait…' : mode === 'setup' ? 'Create journal' : 'Unlock'}
        </button>

        <div className="lock-links muted">
          {dev && <span>🧪 Dev mode — password is <b>dearsafe</b></span>}
          {mode === 'unlock' && <span>Lost your password? Use your recovery card.</span>}
          <span>🔒 Your entries are encrypted &amp; private.</span>
        </div>
      </form>
      <div className="lock-version muted">v{APP_VERSION}</div>
    </div>
  );
}
