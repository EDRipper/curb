export function ScoreBar({ before, after }: { before: number; after: number }) {
  return (
    <div className="mt-1.5 flex w-28 flex-col gap-1" aria-hidden="true">
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-zinc-400"
          style={{ width: `${Math.max(0, Math.min(100, before))}%` }}
        />
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-green-600"
          style={{ width: `${Math.max(0, Math.min(100, after))}%` }}
        />
      </div>
    </div>
  );
}
