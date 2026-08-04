# roadmap

built iteratively, in the open. checked items are live on the deployed
link, not just merged.

- [x] repo + scaffold (Next.js/TS/Tailwind)
- [x] landing page with real program pitch (not lorem ipsum)
- [x] deployed: https://edripper.github.io/curb/ (GitHub Pages, static shell)
- [ ] move hosting to Vercel once server routes are needed (OAuth callback,
      DB-backed API) — vercel.com signup via browser is currently getting
      blocked by bot detection with no account created and no email
      received, needs a human to complete it once (asked Euan for a
      personal access token as the workaround, since that skips browser
      login entirely)
- [ ] Hack Club Auth (`auth.hackclub.com`) sign-in — app registration at
      auth.hackclub.com/developer/apps returned "You're not authorized to
      do that" for this account (2an Ripper / rippereuan@gmail.com), account
      profile shows 0/3 complete (no ID verification). Not attempting ID
      verification as a bot. Building the OAuth client code now so it's
      ready to wire up once either the account is authorized or Euan
      registers the app himself and hands over client id/secret.
- [x] Postgres + Prisma submission model — schema in `prisma/schema.prisma`
      (User, Submission with before/after audit score fields), real DB
      provisioned via `npx create-db` (Prisma-hosted Postgres, no browser
      signup needed unlike vercel/neon/supabase), migrated, and
      smoke-tested with a real write+read+delete. NOT yet connected to the
      live site since there's no server hosting to run it on. this DB is
      temporary (auto-deletes if unclaimed) and claiming it hits the same
      GitHub/Google-only login wall as vercel — needs Euan's login or a
      permanent DB once hosting is sorted.
- [ ] submission form (site url, PR/diff link, before/after screenshots)
- [ ] automated accessibility audit pipeline (axe-core, before/after score
      delta stored per submission)
- [ ] reviewer dashboard (approve / needs-changes / reject + notes)
- [ ] hours <-> reward catalog logic
- [ ] end-to-end click-through test pass on the live link
