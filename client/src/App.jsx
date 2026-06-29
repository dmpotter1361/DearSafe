import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import Logo from './components/Logo';
import ThemeToggle from './components/ThemeToggle';
import WallpaperPicker from './components/WallpaperPicker';
import { useTheme } from './useTheme';
import { wallpaperById } from './wallpapers';
import { APP_VERSION } from './version';
import { api } from './api';
import Lock from './pages/Lock';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import './app.css';

// Shell for in-app pages (everything except the lock screen).
function AppFrame({ theme, toggle, dev, wallpaper, onWallpaper, children }) {
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
          <WallpaperPicker value={wallpaper} onChange={onWallpaper} />
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
  const [wallpaper, setWallpaper] = useState('default');

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

  // Load the saved wallpaper once unlocked.
  useEffect(() => {
    if (!auth?.unlocked) return;
    api.getSettings().then((s) => setWallpaper(s.wallpaper || 'default')).catch(() => {});
  }, [auth?.unlocked]);

  // Apply the wallpaper to the page background (only while unlocked).
  useEffect(() => {
    const b = document.body.style;
    const wp = wallpaperById(wallpaper);
    if (auth?.unlocked && wp.css) {
      b.background = wp.css;
      b.backgroundSize = wp.size || 'cover';
      b.backgroundAttachment = 'fixed';
    } else {
      b.background = '';
      b.backgroundSize = '';
      b.backgroundAttachment = '';
    }
  }, [wallpaper, auth?.unlocked]);

  const changeWallpaper = (id) => {
    setWallpaper(id);
    api.saveSettings({ wallpaper: id }).catch(() => {});
  };

  if (!auth) {
    return (
      <div className="center" style={{ height: '100%' }}>
        <span className="muted">Loading…</span>
      </div>
    );
  }

  const frame = (el) =>
    auth.unlocked ? (
      <AppFrame
        theme={theme}
        toggle={toggle}
        dev={auth.dev}
        wallpaper={wallpaper}
        onWallpaper={changeWallpaper}
      >
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
