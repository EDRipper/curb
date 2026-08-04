# curb

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

early build, in progress. see [ROADMAP.md](./ROADMAP.md) for the current
build plan and what's landed so far.

## stack

- Next.js (App Router) + TypeScript + Tailwind
- Hack Club Auth (`auth.hackclub.com`) for sign-in
- Postgres + Prisma for submissions
- headless axe-core/Lighthouse for the accessibility scoring pipeline
- deployed on Vercel

## local dev

```bash
npm install
npm run dev
```
