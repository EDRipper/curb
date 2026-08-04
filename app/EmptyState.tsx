import Link from "next/link";

export function EmptyState({
  icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  icon: "clipboard" | "check";
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center">
      {icon === "clipboard" ? <ClipboardIcon /> : <CheckIcon />}
      <p className="mt-4 text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
      <rect x="10" y="8" width="28" height="34" rx="3" stroke="#a1a1aa" strokeWidth="2.5" />
      <rect x="17" y="4" width="14" height="8" rx="2" fill="#fdfaf3" stroke="#a1a1aa" strokeWidth="2.5" />
      <line x1="16" y1="20" x2="32" y2="20" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="27" x2="32" y2="27" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="34" x2="25" y2="34" stroke="#d4d4d8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="#fdfaf3" stroke="#a1a1aa" strokeWidth="2.5" />
      <path
        d="M16 24.5L21.5 30L32 18"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
