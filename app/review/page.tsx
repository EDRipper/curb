import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseAuditDetails, summarizeViolations } from "@/lib/auditDetails";
import { Avatar } from "../Avatar";
import { EmptyState } from "../EmptyState";
import { ScoreBar } from "../ScoreBar";
import { StatusBadge } from "../StatusBadge";
import { WarningIcon } from "../WarningIcon";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function Review() {
  const session = await getSession();
  if (!session) redirect("/login");

  const reviewer = await db.user.findUnique({ where: { id: session.userId } });
  if (!reviewer?.isReviewer) redirect("/dashboard");
  const reviewerId = reviewer.id;

  const submissions = await db.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  // flag possible duplicates two ways: the same user resubmitting the same
  // pr/urls (often legitimate - a resubmission after "needs changes"), and
  // *different* users submitting the same pr/urls (much more concerning -
  // someone claiming credit for someone else's work, or two people racing
  // the same open-source fix). nothing upstream prevents either, so this is
  // purely a heads-up for the reviewer, not an enforced block.
  function groupBy(keyFn: (s: (typeof submissions)[number]) => string) {
    const map = new Map<string, (typeof submissions)[number][]>();
    for (const s of submissions) {
      const key = keyFn(s);
      const group = map.get(key);
      if (group) group.push(s);
      else map.set(key, [s]);
    }
    return map;
  }
  const byDiffUrlSameUser = groupBy((s) => `${s.userId}::${s.diffUrl}`);
  const byUrlPairSameUser = groupBy((s) => `${s.userId}::${s.beforeUrl}::${s.afterUrl}`);
  const byDiffUrlAnyUser = groupBy((s) => s.diffUrl);
  const byUrlPairAnyUser = groupBy((s) => `${s.beforeUrl}::${s.afterUrl}`);

  function duplicateInfo(s: (typeof submissions)[number]) {
    const sameUserCount = Math.max(
      (byDiffUrlSameUser.get(`${s.userId}::${s.diffUrl}`) ?? []).length,
      (byUrlPairSameUser.get(`${s.userId}::${s.beforeUrl}::${s.afterUrl}`) ?? []).length,
    );
    const crossUserGroup = [
      ...(byDiffUrlAnyUser.get(s.diffUrl) ?? []),
      ...(byUrlPairAnyUser.get(`${s.beforeUrl}::${s.afterUrl}`) ?? []),
    ];
    const distinctOtherUsers = new Set(
      crossUserGroup.filter((o) => o.userId !== s.userId).map((o) => o.userId),
    );
    return { sameUserCount, otherUserCount: distinctOtherUsers.size };
  }

  // track record: how many hours has this submitter already had approved,
  // across everything else in the queue. useful context a reviewer would
  // otherwise have to reconstruct by scrolling through "already reviewed"
  // looking for the same name - free to compute, the full list is already
  // loaded for the duplicate check above.
  const approvedHoursByUser = new Map<string, number>();
  for (const s of submissions) {
    if (s.status === "approved") {
      approvedHoursByUser.set(
        s.userId,
        (approvedHoursByUser.get(s.userId) ?? 0) + s.hoursClaimed,
      );
    }
  }

  // as the queue grows, already-decided submissions drown out the ones that
  // actually need a reviewer's attention - separate them instead of one
  // flat chronological list.
  const pendingSubmissions = submissions.filter((s) => s.status === "submitted");
  const reviewedSubmissions = submissions.filter((s) => s.status !== "submitted");

  function renderSubmission(s: (typeof submissions)[number]) {
    const delta =
      s.afterAuditScore != null && s.beforeAuditScore != null
        ? s.afterAuditScore - s.beforeAuditScore
        : null;
    const { sameUserCount, otherUserCount } = duplicateInfo(s);

    return (
      <li key={s.id} className="rounded-lg border border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar name={s.user.name} />
            <div>
            <p className="font-semibold">
              {s.user.name}{" "}
              <span className="font-normal text-zinc-500">({s.user.email})</span>
              {s.user.slackId && (
                <>
                  {" "}
                  &middot;{" "}
                  <a
                    href={`https://hackclub.slack.com/team/${s.user.slackId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-normal text-zinc-500 underline"
                  >
                    slack
                  </a>
                </>
              )}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{s.description}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {approvedHoursByUser.get(s.userId) ?? 0}h approved so far
            </p>
            </div>
          </div>
          <StatusBadge status={s.status} />
        </div>

        {otherUserCount > 0 && (
          <p className="mt-2 flex items-start gap-1.5 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
            <WarningIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              possible credit dispute: {otherUserCount} other account
              {otherUserCount > 1 ? "s have" : " has"} submitted this same
              diff or before/after urls &mdash; verify who actually did the
              work before approving.
            </span>
          </p>
        )}
        {sameUserCount > 1 && (
          <p className="mt-2 flex items-start gap-1.5 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
            <WarningIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              duplicate: this user has {sameUserCount} submissions with the
              same diff or before/after urls &mdash; check the others before
              approving.
            </span>
          </p>
        )}

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

        {(s.beforeScreenshotUrl || s.afterScreenshotUrl) && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {s.beforeScreenshotUrl && (
              <a href={s.beforeScreenshotUrl} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary submitter-provided host, can't allowlist for next/image */}
                <img
                  src={s.beforeScreenshotUrl}
                  alt={`before screenshot submitted by ${s.user.name}`}
                  className="w-full rounded-md border border-zinc-200"
                />
              </a>
            )}
            {s.afterScreenshotUrl && (
              <a href={s.afterScreenshotUrl} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary submitter-provided host, can't allowlist for next/image */}
                <img
                  src={s.afterScreenshotUrl}
                  alt={`after screenshot submitted by ${s.user.name}`}
                  className="w-full rounded-md border border-zinc-200"
                />
              </a>
            )}
          </div>
        )}

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
        {s.auditedAt && !s.auditError && s.beforeAuditScore != null && s.afterAuditScore != null && (
          <ScoreBar before={s.beforeAuditScore} after={s.afterAuditScore} />
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

        {s.reviewedAt && (
          <p className="mt-2 rounded bg-zinc-50 p-2 text-xs text-zinc-600">
            reviewed by {s.reviewedBy} &middot;{" "}
            {s.reviewedAt.toISOString().slice(0, 10)}
            {s.reviewNote && <> &mdash; &quot;{s.reviewNote}&quot;</>}
          </p>
        )}

        {s.userId === reviewerId ? (
          <p className="mt-3 text-xs text-zinc-500">
            this is your own submission &mdash; another reviewer needs to review it.
          </p>
        ) : (
          <form className="mt-3 flex flex-wrap items-center gap-2">
            <ReviewActions submissionId={s.id} />
          </form>
        )}
      </li>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16 text-zinc-900">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight hover:text-zinc-600">
          curb
        </Link>
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">
          dashboard &rarr;
        </Link>
      </div>
      <h1 className="mt-8 text-2xl font-bold">review queue</h1>
      <p className="mt-2 text-sm text-zinc-600">
        signed in as {reviewer.name}, a reviewer.
      </p>

      {submissions.length === 0 ? (
        <EmptyState
          icon="clipboard"
          title="no submissions yet"
          body="nothing's come into the queue yet. check back once someone submits a fix."
        />
      ) : (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            needs review ({pendingSubmissions.length})
          </h2>
          {pendingSubmissions.length === 0 ? (
            <EmptyState
              icon="check"
              title="all caught up"
              body="nothing pending review right now."
            />
          ) : (
            <ul className="mt-3 space-y-4">{pendingSubmissions.map(renderSubmission)}</ul>
          )}

          {reviewedSubmissions.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                already reviewed ({reviewedSubmissions.length})
              </h2>
              <ul className="mt-3 space-y-4">{reviewedSubmissions.map(renderSubmission)}</ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
