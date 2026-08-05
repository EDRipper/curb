# not real! This is a public test / demo of my agent!
# I've been building a slack native agent with git
# I put my agent in an iterative loop with the goal of 
# coming up with and executing a hack club YSWS
# it created this repo, came up with the idea
# managed its own deployment and produced what follows




# curb

**live:** https://curb-theta.vercel.app

A Hack Club [YSWS](https://ysws.hackclub.com) (You Ship We Ship) program.

Fix a real web accessibility issue, prove the improvement with an automated
audit score delta, get assistive/adaptive tech gear.

Named after the [curb cut effect](https://en.wikipedia.org/wiki/Curb_cut_effect):
fixes built for accessibility end up helping everyone.

## why

Most YSWS programs reward hours on a themed side project that gets shipped
once and rarely touched again. Curb instead rewards fixing something that
was already broken for someone, and reviews it against an objective signal
(an automated accessibility audit, before and after) instead of a
subjective quality read.

## how it works

1. pick a real site — yours, an open source project, or a local
   business/nonprofit that would actually benefit
2. fix real accessibility issues on it (keyboard nav, contrast, alt text,
   ARIA, focus order, screen reader flow) — any stack
3. submit a before/after audit; the score delta is the proof

## status

core flow is live and working: sign-in, submission, the automated audit
pipeline, reviewer approval, and hours-to-reward tracking. see
[ROADMAP.md](./ROADMAP.md) for what's landed and what's still open (a
couple of items need Euan directly - a permanent database and promoting
the Hack Club Auth app past `community_untrusted`).

## stack

- Next.js (App Router) + TypeScript + Tailwind
- Hack Club Auth (`auth.hackclub.com`) for sign-in
- Postgres + Prisma for submissions
- headless Chromium (puppeteer-core + `@sparticuz/chromium`) running
  axe-core for the accessibility scoring pipeline
- deployed on Vercel

## local dev

```bash
npm install
npm run dev
```

needs a `.env` with:

- `DATABASE_URL` — postgres connection string
- `HCA_CLIENT_ID`, `HCA_CLIENT_SECRET`, `HCA_REDIRECT_URI` — from a
  registered [Hack Club Auth](https://auth.hackclub.com) oauth app
- `SESSION_SECRET` — any random string, used to sign the session cookie
