"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "../Spinner";

export default function AuditButton({ isRetry }: { isRetry: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending
        ? "running audit… (takes ~15-20s, crawls both urls)"
        : isRetry
          ? "retry audit"
          : "run accessibility audit"}
    </button>
  );
}
