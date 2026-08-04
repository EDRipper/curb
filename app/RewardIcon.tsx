const STROKE = "#18181b";
const ACCENT = "#ffcf3f";

function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8" aria-hidden="true">
      {children}
    </svg>
  );
}

function SwitchIcon() {
  return (
    <Base>
      <rect x="8" y="18" width="32" height="20" rx="4" stroke={STROKE} strokeWidth="2.5" />
      <circle cx="24" cy="28" r="7" fill={ACCENT} stroke={STROKE} strokeWidth="2.5" />
      <line x1="24" y1="18" x2="24" y2="10" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
    </Base>
  );
}

function BrailleIcon() {
  return (
    <Base>
      <rect x="10" y="10" width="28" height="28" rx="4" stroke={STROKE} strokeWidth="2.5" />
      <circle cx="19" cy="19" r="2.2" fill={STROKE} />
      <circle cx="29" cy="19" r="2.2" fill={ACCENT} stroke={STROKE} strokeWidth="1.5" />
      <circle cx="19" cy="24" r="2.2" fill={ACCENT} stroke={STROKE} strokeWidth="1.5" />
      <circle cx="29" cy="24" r="2.2" fill={STROKE} />
      <circle cx="19" cy="29" r="2.2" fill={STROKE} />
      <circle cx="29" cy="29" r="2.2" fill={ACCENT} stroke={STROKE} strokeWidth="1.5" />
    </Base>
  );
}

function KeyboardIcon() {
  return (
    <Base>
      <path
        d="M6 16 L18 14 L18 34 L6 32 Z"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M42 16 L30 14 L30 34 L42 32 Z"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="10" y="19" width="4" height="4" rx="1" fill={ACCENT} />
      <rect x="10" y="25" width="4" height="4" rx="1" fill={STROKE} />
      <rect x="34" y="19" width="4" height="4" rx="1" fill={STROKE} />
      <rect x="34" y="25" width="4" height="4" rx="1" fill={ACCENT} />
    </Base>
  );
}

function MagnifierIcon() {
  return (
    <Base>
      <rect x="6" y="8" width="26" height="20" rx="2" stroke={STROKE} strokeWidth="2.5" />
      <line x1="12" y1="14" x2="26" y2="14" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="22" y2="19" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="8" stroke={STROKE} strokeWidth="2.5" fill="#fdfaf3" />
      <line x1="37.5" y1="37.5" x2="43" y2="43" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
    </Base>
  );
}

const ICONS = {
  switch: SwitchIcon,
  braille: BrailleIcon,
  keyboard: KeyboardIcon,
  magnifier: MagnifierIcon,
};

export function RewardIcon({ kind }: { kind: keyof typeof ICONS }) {
  const Icon = ICONS[kind];
  return <Icon />;
}
