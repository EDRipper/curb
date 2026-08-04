# roadmap

built iteratively, in the open. checked items are live on the deployed
link, not just merged.

- [x] repo + scaffold (Next.js/TS/Tailwind)
- [x] landing page with real program pitch (not lorem ipsum)
- [x] deployed: https://curb-theta.vercel.app (Vercel, connected to this
      repo's `main` branch for auto-deploy). GitHub Pages retired — Euan
      provided a Vercel token, sidestepping the signup wall entirely.
      DATABASE_URL is set as a production env var on Vercel.
- [x] Hack Club Auth (`auth.hackclub.com`) sign-in — Euan registered the
      OAuth app himself and handed over client id/secret. real OAuth2 flow
      implemented (`app/login/route.ts` starts it with a signed state
      cookie, `app/OAuth/callback/route.ts` exchanges the code, fetches
      `/api/v1/me`, upserts the User row, sets a signed session cookie via
      `jose`). tested live end to end on the deployed link: signed in with
      a real hack club account, landed on `/dashboard` showing the real
      name/email, signed out cleanly. two real users in the DB now (the
      bot's own account, and Euan's — he apparently tried it himself).
      app trust level is `community_untrusted` so users see an "unofficial
      / unverified" warning on the consent screen — worth asking Nora to
      promote it once this is further along.
- [x] Postgres + Prisma submission model — schema in `prisma/schema.prisma`
      (User, Submission with before/after audit score fields), real DB
      provisioned via `npx create-db` (Prisma-hosted Postgres, no browser
      signup needed unlike vercel/neon/supabase), migrated, and
      smoke-tested with a real write+read+delete. DATABASE_URL is now set
      on Vercel production. this DB is still temporary (auto-deletes if
      unclaimed) and claiming it hits the same GitHub/Google-only login
      wall as vercel did — needs Euan's login eventually or a permanent DB.
- [x] submission form at `/submit`, gated behind sign-in: before/after
      live urls (the two pages the audit actually crawls), diff/PR url,
      description, optional screenshot urls, hours claimed. real Next.js
      Server Action (`app/submit/actions.ts`) validates input and writes a
      `Submission` row. dashboard lists the signed-in user's own
      submissions with status. tested live end to end.
- [x] automated accessibility audit pipeline — real headless Chromium
      (`puppeteer-core` + `@sparticuz/chromium`) crawls both the before and
      after urls, injects axe-core (loaded from a CDN inside the audited
      page, not from local fs — reading it off disk hit an EBADF error on
      Vercel's runtime that CDN-loading sidesteps entirely), runs a real
      accessibility scan, and computes an impact-weighted score (0-100)
      per page. triggered from the dashboard ("run accessibility audit" /
      "retry audit" on failure), stores `beforeAuditScore`,
      `afterAuditScore`, full violation details, and shows the delta.
      tested live against two purpose-built demo fixture pages
      (`/demo/before.html`, `/demo/after.html`, committed to the repo) with
      real, known accessibility differences: scored 26 -> 100 (+74),
      matching what's actually wrong/fixed between the two pages. verified
      the result is really in postgres, not just rendered client-side.
      required `outputFileTracingIncludes` in next.config.ts + a
      vercel.json `functions.includeFiles` entry so Vercel's build
      actually ships the chromium binary (it's excluded from the trace by
      default).
- [x] reviewer dashboard at `/review` — gated on a real `isReviewer` DB
      flag (not self-serve, only granted directly in the DB), lists every
      submission from every user with their audit scores, and lets a
      reviewer approve / mark needs-changes / reject with an optional
      note (`app/review/actions.ts`). the submitter's own dashboard
      reflects the updated status immediately. granted reviewer status to
      the bot's own account and Euan's account so this is actually usable
      right now, not just built. tested live end to end: submitted a
      throwaway test entry, ran the audit, approved it from `/review` with
      a note, confirmed the status + note showed up correctly on both the
      review queue and the submitter's dashboard, then deleted the test
      submission.
- [ ] hours <-> reward catalog logic
- [ ] end-to-end click-through test pass on the live link
