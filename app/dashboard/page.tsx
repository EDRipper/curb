import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRewardStatus } from "@/lib/rewards";
import { parseAuditDetails, summarizeViolations } from "@/lib/auditDetails";
import { Avatar } from "../Avatar";
import { EmptyState } from "../EmptyState";
import { ScoreBar } from "../ScoreBar";
import { StatusBadge } from "../StatusBadge";
import { WarningIcon } from "../WarningIcon";
import { runAudit } from "./actions";
import AuditButton from "./AuditButton";

export const metadata: Metadata = {
  title: "dashboard — curb",
};

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const justSubmitted = (await searchParams).submitted === "1";

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
      <Link href="/" className="font-display text-lg font-bold tracking-tight hover:text-zinc-600">
        curb
      </Link>

      {justSubmitted && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6.5 10.5L8.75 12.75L13.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          your fix was submitted — a reviewer will take a look soon.
        </div>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Avatar name={session.name} size={44} />
        <div>
          <p className="text-sm text-zinc-500">signed in with hack club</p>
          <h1 className="text-2xl font-bold">hey, {session.name}</h1>
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-600">{session.email}</p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
        >
          new submission
        </Link>
        {me?.isReviewer && (
          <Link
            href="/review"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-md"
          >
            review queue
          </Link>
        )}
        <a href="/logout" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-md">
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
          <>
            <p className="mt-1 text-xs text-zinc-500">
              {reward.hoursToNextTier}h more to unlock {reward.nextTier.item} (
              {reward.nextTier.hours}h)
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-zinc-200">
              <div
                className="h-1.5 rounded-full bg-[#ffcf3f]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      ((approvedHours - (reward.currentTier?.hours ?? 0)) /
                        (reward.nextTier.hours - (reward.currentTier?.hours ?? 0))) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path
                d="M6 3H14V8C14 10.2 12.2 12 10 12C7.8 12 6 10.2 6 8V3Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path d="M6 4.5H3.5V6C3.5 7.4 4.6 8.5 6 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M14 4.5H16.5V6C16.5 7.4 15.4 8.5 14 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="12" x2="10" y2="15" stroke="currentColor" strokeWidth="1.4" />
              <line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="15" x2="10" y2="17" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            top reward tier unlocked
          </p>
        )}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        your submissions
      </h2>

      {submissions.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="no submissions yet"
          body="fix a real accessibility issue on a site, then submit the before/after and we'll audit it."
          actionHref="/submit"
          actionLabel="submit your first fix"
        />
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
                  <StatusBadge status={s.status} />
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
                    <p className="mb-2 flex items-start gap-1.5 rounded bg-red-50 px-2 py-1.5 text-sm text-red-700">
                      <WarningIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>audit failed: {s.auditError.split("\n")[0]}</span>
                    </p>
                  )}

                  {s.auditedAt && !s.auditError ? (
                    <>
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
                      {s.beforeAuditScore != null && s.afterAuditScore != null && (
                        <ScoreBar before={s.beforeAuditScore} after={s.afterAuditScore} />
                      )}
                    </>
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
