import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './useTheme';
import { APP_VERSION } from './version';
import { api } from './api';
import Lock from './pages/Lock';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import './app.css';

// Shell for in-app pages (everything except the lock screen).
function AppFrame({ theme, toggle, dev, children }) {
  const navigate = useNavigate();
  const lock = async () => {
    try {
      await api.lock();
    } finally {
      navigate('/');
    }
  };
  return (
    <div className="frame">
      {dev && (
        <div className="devbar">⚠️ DEV MODE — not secure. Don’t store real private entries.</div>
      )}
      <header className="topnav">
        <Logo size={20} />
        <nav className="nav-links">
          <NavLink to="/today" className={({ isActive }) => (isActive ? 'on' : '')}>
            ✍️ Today
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'on' : '')}>
            📅 Calendar
          </NavLink>
        </nav>
        <div className="nav-right">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button className="lock-btn" onClick={lock} title="Lock now">🔒</button>
        </div>
      </header>
      <main className="content">{children}</main>
      <footer className="appfoot muted">DearSafe v{APP_VERSION} · your private journal</footer>
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [auth, setAuth] = useState(null); // null = loading

  const refresh = useCallback(async () => {
    try {
      const s = await api.authStatus();
      setAuth(s);
    } catch {
      setAuth({ setup: false, unlocked: false, dev: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!auth) {
    return (
      <div className="center" style={{ height: '100%' }}>
        <span className="muted">Loading…</span>
      </div>
    );
  }

  const frame = (el) =>
    auth.unlocked ? (
      <AppFrame theme={theme} toggle={toggle} dev={auth.dev}>
        {el}
      </AppFrame>
    ) : (
      <Navigate to="/" replace />
    );

  return (
    <Routes>
      <Route
        path="/"
        element={auth.unlocked ? <Navigate to="/today" replace /> : <Lock onUnlocked={refresh} />}
      />
      <Route path="/today" element={frame(<Today />)} />
      <Route path="/calendar" element={frame(<Calendar />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
