"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

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

export async function createSubmission(
  _prevState: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  let siteUrl: string, diffUrl: string, beforeUrl: string, afterUrl: string;
  const description = String(formData.get("description") ?? "").trim();
  const hoursClaimed = Number(formData.get("hoursClaimed"));

  try {
    siteUrl = requireUrl(formData.get("siteUrl"), "site url");
    diffUrl = requireUrl(formData.get("diffUrl"), "diff/PR url");
    beforeUrl = requireUrl(formData.get("beforeScreenshotUrl"), "before screenshot url");
    afterUrl = requireUrl(formData.get("afterScreenshotUrl"), "after screenshot url");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "invalid input" };
  }

  if (!description) {
    return { error: "description is required" };
  }
  if (!Number.isFinite(hoursClaimed) || hoursClaimed <= 0) {
    return { error: "hours claimed must be a positive number" };
  }

  await db.submission.create({
    data: {
      userId: session.userId,
      siteUrl,
      diffUrl,
      description,
      beforeScreenshotUrl: beforeUrl,
      afterScreenshotUrl: afterUrl,
      hoursClaimed,
    },
  });

  redirect("/dashboard");
}
