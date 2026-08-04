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
- [x] submission form (site url, PR/diff link, description, before/after
      screenshot urls, hours claimed) at `/submit`, gated behind sign-in.
      real Next.js Server Action (`app/submit/actions.ts`) validates input
      and writes a `Submission` row. dashboard now lists the signed-in
      user's own submissions with status. tested live end to end: signed
      in, filled out and submitted the real form, saw it appear on the
      dashboard immediately, confirmed the row existed in postgres, then
      deleted that test row so the DB only has real data.
- [ ] automated accessibility audit pipeline (axe-core, before/after score
      delta stored per submission)
- [ ] reviewer dashboard (approve / needs-changes / reject + notes)
- [ ] hours <-> reward catalog logic
- [ ] end-to-end click-through test pass on the live link
