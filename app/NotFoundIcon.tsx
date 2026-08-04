export function NotFoundIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className ?? "h-8 w-8"} aria-hidden="true">
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M11.5 11.5C11.5 9.8 12.9 8.5 14.5 8.5C16.1 8.5 17.5 9.6 17.5 11.2C17.5 12.9 15.6 13.1 14.7 14.5C14.4 14.9 14.3 15.4 14.3 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="14.3" cy="19" r="1" fill="currentColor" />
      <line x1="20.5" y1="20.5" x2="26" y2="26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
