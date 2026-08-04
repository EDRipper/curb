import Link from "next/link";
import { REWARD_CATALOG } from "@/lib/rewards";
import { CurbCutIcon } from "./CurbCutIcon";
import { RewardIcon } from "./RewardIcon";
import { StepIcon } from "./StepIcon";

const REWARD_ICON_ORDER = ["switch", "braille", "keyboard", "magnifier"] as const;

const steps = [
  {
    n: "01",
    icon: "pick" as const,
    title: "Pick a real site",
    body: "Yours, an open source project, or a local business/nonprofit that would actually benefit. No throwaway demo pages.",
  },
  {
    n: "02",
    icon: "fix" as const,
    title: "Fix real accessibility issues",
    body: "Keyboard navigation, contrast, alt text, ARIA, focus order, screen reader flow — whatever the site is actually missing. Any stack.",
  },
  {
    n: "03",
    icon: "proof" as const,
    title: "Submit before/after proof",
    body: "We run an automated accessibility audit against both versions and score the delta. The number is the proof, not a screenshot.",
  },
];

const rewards = REWARD_CATALOG.map((tier, i) => ({
  hours: i === REWARD_CATALOG.length - 1 ? `${tier.hours}h+` : `${tier.hours}h`,
  item: tier.item,
  icon: REWARD_ICON_ORDER[i] ?? "switch",
}));

export default function Home() {
  return (
    <div className="dot-grid-bg min-h-screen bg-[#fdfaf3] text-zinc-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        skip to content
      </a>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight">curb</span>
        <nav aria-label="primary" className="flex items-center gap-6 text-sm font-medium text-zinc-600">
          <Link href="/submit" className="hover:text-zinc-900">
            submit
          </Link>
          <a
            href="https://github.com/EDRipper/curb"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900"
          >
            github
          </a>
          <Link
            href="/login"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700"
          >
            sign in
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="mx-auto flex max-w-4xl items-center gap-8 px-6 pt-16 pb-20">
          <div className="min-w-0">
          <p className="fade-up mb-4 inline-block rounded-full bg-[#ffcf3f] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-900">
            a hack club YSWS
          </p>
          <h1 className="fade-up font-display max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 [animation-delay:80ms]">
            Ship an accessibility fix. Prove it with numbers.
          </h1>
          <p className="fade-up mt-6 max-w-xl text-lg leading-7 text-zinc-600 [animation-delay:160ms]">
            Curb is a You Ship We Ship program for teens who make the web
            usable for people who currently can&apos;t use it. Named after the
            curb cut effect: fixes built for accessibility end up helping
            everyone.
          </p>
          <div className="fade-up mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link
              href="/login"
              className="whitespace-nowrap rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-zinc-700 hover:shadow-lg"
            >
              sign in with hack club
            </Link>
            <a
              href="#how"
              className="whitespace-nowrap rounded-md border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-md"
            >
              how it works
            </a>
          </div>
          </div>
          <CurbCutIcon className="fade-up hidden w-full max-w-xs shrink-0 sm:block [animation-delay:120ms]" />
        </section>

        <section id="how" className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              how it works
            </h2>
            <div className="mt-8 grid gap-10 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n}>
                  <div className="flex items-center gap-3">
                    <StepIcon kind={s.icon} />
                    <div className="text-sm font-bold text-zinc-500">{s.n}</div>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              what you get
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {rewards.map((r) => (
                <div
                  key={r.hours}
                  className="rounded-lg border border-zinc-200 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <RewardIcon kind={r.icon} />
                  <div className="mt-3 text-2xl font-bold text-zinc-900">
                    {r.hours}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">{r.item}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-xs text-zinc-500">
              hours are self-claimed at submission and confirmed by a human
              reviewer, who sees your before/after audit score delta
              alongside the claim. rewards unlock once your total approved
              hours cross a tier. this program is in early build.
            </p>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-start gap-8 px-6 py-16">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                why this exists
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700">
                Most YSWS programs reward hours on a themed side project that
                gets shipped once and never touched again. Curb rewards fixing
                something that was already broken for someone — and the
                review isn&apos;t a vibe check, it&apos;s an automated
                accessibility score, before and after, on the record.
              </p>
            </div>
            <svg
              viewBox="0 0 64 48"
              fill="none"
              className="hidden h-20 w-24 shrink-0 text-zinc-100 sm:block"
              aria-hidden="true"
            >
              <path
                d="M0 28C0 14 9 3 22 0V8C14 11 10 17 10 24H22V44H0V28Z"
                fill="currentColor"
              />
              <path
                d="M34 28C34 14 43 3 56 0V8C48 11 44 17 44 24H56V44H34V28Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span className="font-display text-sm font-bold tracking-tight text-zinc-900">curb</span>
            <p className="mt-1 text-xs text-zinc-500">
              built by hack club. a work in progress, built in the open.
            </p>
          </div>
          <nav aria-label="footer" className="flex items-center gap-5 text-xs font-medium text-zinc-600">
            <Link href="/submit" className="hover:text-zinc-900">
              submit
            </Link>
            <a
              href="https://github.com/EDRipper/curb"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900"
            >
              github
            </a>
            <a
              href="https://hackclub.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900"
            >
              hack club
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
