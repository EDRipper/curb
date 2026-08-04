"use client";

import { useFormStatus } from "react-dom";

export default function AuditButton({ isRetry }: { isRetry: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending
        ? "running audit… (takes ~15-20s, crawls both urls)"
        : isRetry
          ? "retry audit"
          : "run accessibility audit"}
    </button>
  );
}
