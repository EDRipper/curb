import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRewardStatus } from "@/lib/rewards";
import { parseAuditDetails, summarizeViolations } from "@/lib/auditDetails";
import { runAudit } from "./actions";
import AuditButton from "./AuditButton";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-zinc-100 text-zinc-700",
  approved: "bg-green-100 text-green-800",
  needs_changes: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [submissions, me] = await Promise.all([
    db.submission.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findUnique({ where: { id: session.userId } }),
  ]);

  const approvedHours = submissions
    .filter((s) => s.status === "approved")
    .reduce((sum, s) => sum + s.hoursClaimed, 0);
  const reward = getRewardStatus(approvedHours);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-zinc-900">
      <p className="text-sm text-zinc-500">signed in with hack club</p>
      <h1 className="mt-1 text-2xl font-bold">hey, {session.name}</h1>
      <p className="mt-3 text-sm text-zinc-600">{session.email}</p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          new submission
        </Link>
        {me?.isReviewer && (
          <Link
            href="/review"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            review queue
          </Link>
        )}
        <a href="/logout" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
          sign out
        </a>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold">
          {approvedHours}h approved
          {reward.currentTier && (
            <> &middot; earned: {reward.currentTier.item}</>
          )}
        </p>
        {reward.nextTier ? (
          <p className="mt-1 text-xs text-zinc-500">
            {reward.hoursToNextTier}h more to unlock {reward.nextTier.item} (
            {reward.nextTier.hours}h)
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">
            top reward tier unlocked
          </p>
        )}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        your submissions
      </h2>

      {submissions.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">nothing submitted yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {submissions.map((s) => {
            const delta =
              s.afterAuditScore != null && s.beforeAuditScore != null
                ? s.afterAuditScore - s.beforeAuditScore
                : null;

            return (
              <li key={s.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <a
                    href={s.afterUrl}
                    className="font-medium underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.afterUrl}
                  </a>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_STYLE[s.status] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{s.description}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {s.hoursClaimed}h claimed &middot; submitted{" "}
                  {s.createdAt.toISOString().slice(0, 10)}
                </p>

                {s.reviewedAt && (
                  <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-600">
                    reviewed by {s.reviewedBy} &middot;{" "}
                    {s.reviewedAt.toISOString().slice(0, 10)}
                    {s.reviewNote && <> &mdash; &quot;{s.reviewNote}&quot;</>}
                  </p>
                )}

                <div className="mt-3 border-t border-zinc-100 pt-3">
                  {s.auditedAt && s.auditError && (
                    <p className="mb-2 text-sm text-red-600">
                      audit failed: {s.auditError.split("\n")[0]}
                    </p>
                  )}

                  {s.auditedAt && !s.auditError ? (
                    <p className="text-sm">
                      a11y score: <strong>{s.beforeAuditScore}</strong>{" "}
                      &rarr; <strong>{s.afterAuditScore}</strong>
                      {delta != null && (
                        <span
                          className={
                            delta >= 0
                              ? "ml-2 font-semibold text-green-700"
                              : "ml-2 font-semibold text-red-700"
                          }
                        >
                          ({delta >= 0 ? "+" : ""}
                          {delta})
                        </span>
                      )}
                    </p>
                  ) : (
                    <form action={runAudit.bind(null, s.id)}>
                      <AuditButton isRetry={Boolean(s.auditError)} />
                    </form>
                  )}

                  {(() => {
                    const details = parseAuditDetails(s.auditDetails);
                    if (!details) return null;
                    return (
                      <div className="mt-1 grid gap-0.5 text-xs text-zinc-500">
                        <p>before: {summarizeViolations(details.before)}</p>
                        <p>after: {summarizeViolations(details.after)}</p>
                      </div>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
