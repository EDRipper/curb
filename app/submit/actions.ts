"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertSafeCrawlUrl } from "@/lib/urlSafety";

export type SubmitFormState = { error: string } | undefined;

function requireUrl(value: FormDataEntryValue | null, field: string): string {
  const str = String(value ?? "").trim();
  if (!str) throw new Error(`${field} is required`);
  try {
    new URL(str);
  } catch {
    throw new Error(`${field} must be a valid url`);
  }
  return str;
}

// before/after urls get crawled server-side by the audit pipeline, so they
// need the stricter check (no local/internal addresses) on top of requireUrl.
function requireCrawlUrl(value: FormDataEntryValue | null, field: string): string {
  const str = requireUrl(value, field);
  assertSafeCrawlUrl(str, field);
  return str;
}

function optionalUrl(value: FormDataEntryValue | null, field: string): string | undefined {
  const str = String(value ?? "").trim();
  if (!str) return undefined;
  try {
    new URL(str);
  } catch {
    throw new Error(`${field} must be a valid url`);
  }
  return str;
}

export async function createSubmission(
  _prevState: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  let beforeUrl: string, afterUrl: string, diffUrl: string;
  let beforeScreenshotUrl: string | undefined, afterScreenshotUrl: string | undefined;
  const description = String(formData.get("description") ?? "").trim();
  const hoursClaimed = Number(formData.get("hoursClaimed"));

  try {
    beforeUrl = requireCrawlUrl(formData.get("beforeUrl"), "before url");
    afterUrl = requireCrawlUrl(formData.get("afterUrl"), "after url");
    diffUrl = requireUrl(formData.get("diffUrl"), "diff/PR url");
    beforeScreenshotUrl = optionalUrl(formData.get("beforeScreenshotUrl"), "before screenshot url");
    afterScreenshotUrl = optionalUrl(formData.get("afterScreenshotUrl"), "after screenshot url");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "invalid input" };
  }

  if (!description) {
    return { error: "description is required" };
  }
  if (!Number.isFinite(hoursClaimed) || hoursClaimed <= 0) {
    return { error: "hours claimed must be a positive number" };
  }
  if (beforeUrl === afterUrl) {
    return { error: "before url and after url can't be the same" };
  }

  // the review queue has no pagination or per-user filtering - it just
  // lists every submission. nothing stopped one account from flooding it
  // with junk entries, which would degrade the queue for every reviewer,
  // not just that user. a modest per-user cooldown is enough to stop
  // rapid-fire spam without getting in the way of someone submitting a
  // few genuinely different fixes.
  const SUBMIT_COOLDOWN_MS = 30_000;
  const lastSubmission = await db.submission.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (lastSubmission && Date.now() - lastSubmission.createdAt.getTime() < SUBMIT_COOLDOWN_MS) {
    return { error: "you just submitted one, wait a bit before submitting another" };
  }

  await db.submission.create({
    data: {
      userId: session.userId,
      beforeUrl,
      afterUrl,
      diffUrl,
      description,
      beforeScreenshotUrl,
      afterScreenshotUrl,
      hoursClaimed,
    },
  });

  redirect("/dashboard?submitted=1");
}
