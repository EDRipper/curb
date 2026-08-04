const STROKE = "#18181b";
const ACCENT = "#ffcf3f";

function Base({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9" aria-hidden="true">
      {children}
    </svg>
  );
}

function PickSiteIcon() {
  return (
    <Base>
      <rect x="6" y="10" width="36" height="26" rx="3" stroke={STROKE} strokeWidth="2.5" />
      <line x1="6" y1="17" x2="42" y2="17" stroke={STROKE} strokeWidth="2.5" />
      <circle cx="11" cy="13.5" r="1.4" fill={STROKE} />
      <circle cx="15" cy="13.5" r="1.4" fill={STROKE} />
      <circle cx="24" cy="27" r="6" stroke={ACCENT} strokeWidth="2.5" />
      <line x1="24" y1="23" x2="24" y2="31" stroke={ACCENT} strokeWidth="2" />
      <line x1="20" y1="27" x2="28" y2="27" stroke={ACCENT} strokeWidth="2" />
    </Base>
  );
}

function FixIcon() {
  {/* wrench: solid nut head with a punched hole, on a diagonal handle.
     the hole is a plain white circle drawn over the head - only correct
     because this icon is always used inside the "how it works" section's
     bg-white block, unlike the reusable reward/curb-cut icons. */}
  return (
    <Base>
      <line x1="14" y1="34" x2="25" y2="23" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <rect x="24" y="8" width="14" height="14" rx="3" transform="rotate(45 31 15)" fill={STROKE} />
      <circle cx="31" cy="15" r="3.5" fill="#ffffff" />
      <circle cx="14" cy="34" r="3" fill={ACCENT} stroke={STROKE} strokeWidth="2" />
    </Base>
  );
}

function ProofIcon() {
  return (
    <Base>
      <line x1="8" y1="38" x2="40" y2="38" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="12" y="28" width="7" height="10" fill="#e4e4e7" stroke={STROKE} strokeWidth="2" />
      <rect x="26" y="16" width="7" height="22" fill={ACCENT} stroke={STROKE} strokeWidth="2" />
      <path d="M20 24 L26 18" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 18 L26 18 L26 22" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  );
}

const ICONS = {
  pick: PickSiteIcon,
  fix: FixIcon,
  proof: ProofIcon,
};

export function StepIcon({ kind }: { kind: keyof typeof ICONS }) {
  const Icon = ICONS[kind];
  return <Icon />;
}
