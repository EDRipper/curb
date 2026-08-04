export function CurbCutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* street */}
      <line x1="0" y1="130" x2="240" y2="130" stroke="#d4d4d8" strokeWidth="2" />

      {/* sidewalk with the ramp cut into the curb */}
      <polygon
        points="0,60 90,60 140,130 0,130"
        fill="#fdfaf3"
        stroke="#18181b"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* motion dashes trailing the wheel, pulsing to suggest continuous movement */}
      <line className="curb-cut-trail" x1="35" y1="120" x2="55" y2="120" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: "0ms" }} />
      <line className="curb-cut-trail" x1="60" y1="120" x2="75" y2="120" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: "150ms" }} />
      <line className="curb-cut-trail" x1="80" y1="120" x2="90" y2="120" stroke="#d4d4d8" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: "300ms" }} />

      {/* wheelchair: wheel (slowly spinning), frame, small rider head */}
      <g className="curb-cut-wheel">
        <circle cx="115" cy="118" r="14" fill="#ffcf3f" stroke="#18181b" strokeWidth="3" />
        <circle cx="115" cy="118" r="3" fill="#18181b" />
        <line x1="115" y1="108" x2="115" y2="128" stroke="#18181b" strokeWidth="1.5" />
        <line x1="105" y1="118" x2="125" y2="118" stroke="#18181b" strokeWidth="1.5" />
      </g>
      <line x1="115" y1="104" x2="146" y2="78" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
      <line x1="146" y1="78" x2="146" y2="60" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="150" cy="52" r="9" fill="#fdfaf3" stroke="#18181b" strokeWidth="3" />
    </svg>
  );
}
