"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["approved", "needs_changes", "rejected"] as const;
type ReviewStatus = (typeof VALID_STATUSES)[number];

export async function reviewSubmission(
  submissionId: string,
  status: ReviewStatus,
  formData: FormData,
) {
  const session = await getSession();
  if (!session) throw new Error("not signed in");

  const reviewer = await db.user.findUnique({ where: { id: session.userId } });
  if (!reviewer?.isReviewer) throw new Error("not a reviewer");

  if (!VALID_STATUSES.includes(status)) throw new Error("invalid status");

  const submission = await db.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new Error("not found");
  if (submission.userId === reviewer.id) {
    throw new Error("can't review your own submission");
  }

  const note = String(formData.get("note") ?? "").trim();

  // only meaningful on approval - lets a reviewer credit a different
  // amount than what was claimed (deflating an inflated claim) instead of
  // a blunt approve-at-face-value-or-reject choice. blank/invalid falls
  // back to the claimed hours rather than blocking the approval outright.
  let approvedHours: number | null = null;
  if (status === "approved") {
    const raw = Number(formData.get("approvedHours"));
    approvedHours = Number.isFinite(raw) && raw > 0 ? raw : submission.hoursClaimed;
  }

  await db.submission.update({
    where: { id: submissionId },
    data: {
      status,
      approvedHours,
      reviewNote: note || null,
      reviewedBy: reviewer.name,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/review");
  revalidatePath("/dashboard");
}
