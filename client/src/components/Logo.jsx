// DearSafe wordmark with the padlock-heart mark.
export default function Logo({ size = 22 }) {
  return (
    <span className="brand" style={{ fontSize: size }}>
      <span className="mark" style={{ fontSize: size * 0.92 }}>
        🔒💗
      </span>
      DearSafe
    </span>
  );
}
