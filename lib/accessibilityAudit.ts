import type { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { isUrlTargetPrivate } from "./urlSafety";

const AXE_SCRIPT_URL =
  "https://cdn.jsdelivr.net/npm/axe-core@4.12.1/axe.min.js";

export type AuditResult = {
  score: number;
  violationCount: number;
  passCount: number;
  violations: {
    id: string;
    impact: string | null;
    description: string;
    nodeCount: number;
  }[];
};

const IMPACT_WEIGHT: Record<string, number> = {
  minor: 1,
  moderate: 2,
  serious: 3,
  critical: 4,
};

async function launchBrowser(): Promise<Browser> {
  chromium.setGraphicsMode = false;
  return puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
    executablePath: await chromium.executablePath(),
    headless: "shell",
  });
}

async function auditWithBrowser(browser: Browser, url: string): Promise<AuditResult> {
  const page = await browser.newPage();
  try {
    // the caller already rejects an obviously-private submitted url, but
    // that's a one-time hostname-string check. a redirect chain (or a
    // hostname that only resolves to a private address) would sail right
    // past that and straight into puppeteer's page.goto - so re-check
    // every navigation hop here, where we can see where it's actually
    // connecting.
    let blockedUrl: string | null = null;
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (!request.isNavigationRequest()) {
        request.continue();
        return;
      }
      isUrlTargetPrivate(request.url())
        .then((isPrivate) => {
          if (isPrivate) {
            blockedUrl = request.url();
            request.abort("blockedbyclient");
          } else {
            request.continue();
          }
        })
        .catch(() => {
          blockedUrl = request.url();
          request.abort("blockedbyclient");
        });
    });

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    } catch (err) {
      if (blockedUrl) {
        throw new Error(`blocked: ${blockedUrl} resolves to a local/internal address`);
      }
      throw err;
    }

    await page.addScriptTag({ url: AXE_SCRIPT_URL });

    const results = await page.evaluate(async () => {
      // @ts-expect-error axe is injected into the page global scope above
      return await axe.run();
    });

    const violations = results.violations as {
      id: string;
      impact: string | null;
      description: string;
      nodes: unknown[];
    }[];

    const weightedPenalty = violations.reduce((sum, v) => {
      const weight = IMPACT_WEIGHT[v.impact ?? "minor"] ?? 1;
      return sum + weight * v.nodes.length;
    }, 0);

    const score = Math.max(0, Math.round(100 - weightedPenalty * 2));

    return {
      score,
      violationCount: violations.length,
      passCount: (results.passes as unknown[]).length,
      violations: violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodeCount: v.nodes.length,
      })),
    };
  } finally {
    await page.close();
  }
}

export async function auditUrl(url: string): Promise<AuditResult> {
  const browser = await launchBrowser();
  try {
    return await auditWithBrowser(browser, url);
  } finally {
    await browser.close();
  }
}

export async function auditPair(
  beforeUrl: string,
  afterUrl: string,
): Promise<{ before: AuditResult; after: AuditResult }> {
  const browser = await launchBrowser();
  try {
    const before = await auditWithBrowser(browser, beforeUrl);
    const after = await auditWithBrowser(browser, afterUrl);
    return { before, after };
  } finally {
    await browser.close();
  }
}
