"use client";

import { useFormStatus } from "react-dom";
import { reviewSubmission } from "./actions";

export default function ReviewActions({ submissionId }: { submissionId: string }) {
  const { pending } = useFormStatus();

  return (
    <>
      <input
        name="note"
        aria-label="review note (optional)"
        placeholder="note (optional)"
        disabled={pending}
        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 sm:min-w-0 sm:flex-1"
      />
      <button
        formAction={reviewSubmission.bind(null, submissionId, "approved")}
        disabled={pending}
        className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "approve"}
      </button>
      <button
        formAction={reviewSubmission.bind(null, submissionId, "needs_changes")}
        disabled={pending}
        className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-amber-800 hover:shadow-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "needs changes"}
      </button>
      <button
        formAction={reviewSubmission.bind(null, submissionId, "rejected")}
        disabled={pending}
        className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-md disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "reject"}
      </button>
    </>
  );
}
