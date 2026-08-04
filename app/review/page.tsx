import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewSubmission } from "./actions";

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-zinc-100 text-zinc-700",
  approved: "bg-green-100 text-green-800",
  needs_changes: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function Review() {
  const session = await getSession();
  if (!session) redirect("/login");

  const reviewer = await db.user.findUnique({ where: { id: session.userId } });
  if (!reviewer?.isReviewer) redirect("/dashboard");

  const submissions = await db.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-zinc-900">
      <h1 className="text-2xl font-bold">review queue</h1>
      <p className="mt-2 text-sm text-zinc-600">
        signed in as {reviewer.name}, a reviewer.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600">nothing submitted yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {submissions.map((s) => {
            const delta =
              s.afterAuditScore != null && s.beforeAuditScore != null
                ? s.afterAuditScore - s.beforeAuditScore
                : null;

            return (
              <li key={s.id} className="rounded-lg border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {s.user.name}{" "}
                      <span className="font-normal text-zinc-500">
                        ({s.user.email})
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">{s.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[s.status] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-1 text-sm">
                  <a href={s.beforeUrl} target="_blank" rel="noreferrer" className="underline">
                    before: {s.beforeUrl}
                  </a>
                  <a href={s.afterUrl} target="_blank" rel="noreferrer" className="underline">
                    after: {s.afterUrl}
                  </a>
                  <a href={s.diffUrl} target="_blank" rel="noreferrer" className="underline">
                    diff: {s.diffUrl}
                  </a>
                </div>

                <p className="mt-2 text-sm text-zinc-600">
                  {s.hoursClaimed}h claimed
                  {s.auditedAt && !s.auditError && (
                    <>
                      {" "}
                      &middot; a11y score: <strong>{s.beforeAuditScore}</strong>{" "}
                      &rarr; <strong>{s.afterAuditScore}</strong>
                      {delta != null && (
                        <span
                          className={
                            delta >= 0
                              ? "ml-1 font-semibold text-green-700"
                              : "ml-1 font-semibold text-red-700"
                          }
                        >
                          ({delta >= 0 ? "+" : ""}
                          {delta})
                        </span>
                      )}
                    </>
                  )}
                  {!s.auditedAt && <> &middot; not audited yet</>}
                  {s.auditError && <> &middot; audit failed</>}
                </p>

                {s.reviewedAt && (
                  <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-600">
                    reviewed by {s.reviewedBy} &middot;{" "}
                    {s.reviewedAt.toISOString().slice(0, 10)}
                    {s.reviewNote && <> &mdash; &quot;{s.reviewNote}&quot;</>}
                  </p>
                )}

                <form className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    name="note"
                    placeholder="note (optional)"
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    formAction={reviewSubmission.bind(null, s.id, "approved")}
                    className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
                  >
                    approve
                  </button>
                  <button
                    formAction={reviewSubmission.bind(null, s.id, "needs_changes")}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                  >
                    needs changes
                  </button>
                  <button
                    formAction={reviewSubmission.bind(null, s.id, "rejected")}
                    className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                  >
                    reject
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
