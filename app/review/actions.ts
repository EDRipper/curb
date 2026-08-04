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

  const note = String(formData.get("note") ?? "").trim();

  await db.submission.update({
    where: { id: submissionId },
    data: {
      status,
      reviewNote: note || null,
      reviewedBy: reviewer.name,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/review");
}
