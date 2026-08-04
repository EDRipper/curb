const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-zinc-100 text-zinc-700",
  approved: "bg-green-100 text-green-800",
  needs_changes: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

function StatusGlyph({ status }: { status: string }) {
  const common = { viewBox: "0 0 16 16", className: "h-3 w-3", "aria-hidden": true } as const;
  switch (status) {
    case "approved":
      return (
        <svg {...common}>
          <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "rejected":
      return (
        <svg {...common}>
          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "needs_changes":
      return (
        <svg {...common}>
          <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="12" r="1.1" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        STATUS_STYLE[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      <StatusGlyph status={status} />
      {status}
    </span>
  );
}
