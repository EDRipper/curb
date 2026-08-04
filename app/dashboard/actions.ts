"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditPair } from "@/lib/accessibilityAudit";
import { assertSafeCrawlUrl } from "@/lib/urlSafety";

export async function runAudit(submissionId: string) {
  const session = await getSession();
  if (!session) throw new Error("not signed in");

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.userId !== session.userId) {
    throw new Error("not found");
  }

  // each run launches a real headless browser twice (before + after), which
  // is expensive to spin up. block spam-clicking rather than let someone
  // queue up unlimited chromium launches from one submission.
  const AUDIT_COOLDOWN_MS = 30_000;
  if (submission.auditedAt && Date.now() - submission.auditedAt.getTime() < AUDIT_COOLDOWN_MS) {
    throw new Error("audit already ran recently, wait a bit before retrying");
  }

  try {
    // defense in depth: submit/actions.ts already checks this at write time,
    // but re-check here too in case a row predates that check.
    assertSafeCrawlUrl(submission.beforeUrl, "before url");
    assertSafeCrawlUrl(submission.afterUrl, "after url");

    const { before, after } = await auditPair(submission.beforeUrl, submission.afterUrl);

    await db.submission.update({
      where: { id: submissionId },
      data: {
        beforeAuditScore: before.score,
        afterAuditScore: after.score,
        auditDetails: { before, after } as object,
        auditError: null,
        auditedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("audit failed for submission", submissionId, err);
    const detail =
      err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    await db.submission.update({
      where: { id: submissionId },
      data: {
        auditError: detail.slice(0, 2000),
        auditedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard");
}
