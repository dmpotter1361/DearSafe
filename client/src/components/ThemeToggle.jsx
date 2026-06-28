// Light/dark toggle — sun/moon, pill-styled.
export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="pill"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{ cursor: 'pointer', border: 0 }}
    >
      {theme === 'light' ? '🌙 Night' : '☀️ Day'}
    </button>
  );
}
