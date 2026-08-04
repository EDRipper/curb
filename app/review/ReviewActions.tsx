"use client";

import { useFormStatus } from "react-dom";
import { reviewSubmission } from "./actions";

export default function ReviewActions({
  submissionId,
  hoursClaimed,
}: {
  submissionId: string;
  hoursClaimed: number;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input
        name="note"
        aria-label="review note (optional)"
        placeholder="note (optional)"
        disabled={pending}
        className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50"
      />
      <input
        name="approvedHours"
        aria-label="hours to credit if approved"
        title="hours to credit if approved (defaults to hours claimed)"
        type="number"
        step="0.5"
        min="0.5"
        defaultValue={hoursClaimed}
        disabled={pending}
        className="w-20 rounded-md border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-50"
      />
      <button
        formAction={reviewSubmission.bind(null, submissionId, "approved")}
        disabled={pending}
        className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "approve"}
      </button>
      <button
        formAction={reviewSubmission.bind(null, submissionId, "needs_changes")}
        disabled={pending}
        className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "needs changes"}
      </button>
      <button
        formAction={reviewSubmission.bind(null, submissionId, "rejected")}
        disabled={pending}
        className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "working…" : "reject"}
      </button>
    </>
  );
}
