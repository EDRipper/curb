import type { AuditResult } from "./accessibilityAudit";

type StoredAuditDetails = { before: AuditResult; after: AuditResult };

function isAuditResult(value: unknown): value is AuditResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.violations) && typeof v.score === "number";
}

// the db field is an untyped Json column, and rows from before this shape
// existed (or a future shape change) shouldn't crash the page - parse
// defensively and just omit the section if it doesn't look right.
export function parseAuditDetails(raw: unknown): StoredAuditDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (isAuditResult(v.before) && isAuditResult(v.after)) {
    return { before: v.before, after: v.after };
  }
  return null;
}

const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"];

export function summarizeViolations(result: AuditResult): string {
  if (result.violations.length === 0) return "0 violations";
  const byImpact = new Map<string, number>();
  for (const v of result.violations) {
    const impact = v.impact ?? "minor";
    byImpact.set(impact, (byImpact.get(impact) ?? 0) + 1);
  }
  const parts = IMPACT_ORDER.filter((i) => byImpact.has(i)).map(
    (i) => `${byImpact.get(i)} ${i}`,
  );
  const ids = result.violations.map((v) => v.id).slice(0, 4).join(", ");
  const more = result.violations.length > 4 ? `, +${result.violations.length - 4} more` : "";
  return `${result.violations.length} violation${result.violations.length === 1 ? "" : "s"} (${parts.join(", ")}) — ${ids}${more}`;
}
