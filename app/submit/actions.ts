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
    beforeUrl = requireUrl(formData.get("beforeUrl"), "before url");
    afterUrl = requireUrl(formData.get("afterUrl"), "after url");
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

  redirect("/dashboard");
}
