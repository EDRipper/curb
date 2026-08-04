const COLORS = [
  { bg: "#ffcf3f", fg: "#18181b" },
  { bg: "#bae6a1", fg: "#18181b" },
  { bg: "#a8d8ff", fg: "#18181b" },
  { bg: "#ffc0cb", fg: "#18181b" },
  { bg: "#d8b4fe", fg: "#18181b" },
  { bg: "#fdba74", fg: "#18181b" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const { bg, fg } = colorFor(name);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, backgroundColor: bg, color: fg, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
