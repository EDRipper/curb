"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditPair } from "@/lib/accessibilityAudit";

export async function runAudit(submissionId: string) {
  const session = await getSession();
  if (!session) throw new Error("not signed in");

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.userId !== session.userId) {
    throw new Error("not found");
  }

  try {
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
