# roadmap

built iteratively, in the open. checked items are live on the deployed
link, not just merged.

- [x] repo + scaffold (Next.js/TS/Tailwind)
- [x] landing page with real program pitch (not lorem ipsum)
- [x] deployed: https://edripper.github.io/curb/ (GitHub Pages, static shell)
- [ ] move hosting to Vercel once server routes are needed (OAuth callback,
      DB-backed API) — vercel.com signup via browser is currently getting
      blocked by bot detection with no account created and no email
      received, needs a human to complete it once
- [ ] Hack Club Auth (`auth.hackclub.com`) sign-in
- [ ] Postgres + Prisma submission model
- [ ] submission form (site url, PR/diff link, before/after screenshots)
- [ ] automated accessibility audit pipeline (axe-core, before/after score
      delta stored per submission)
- [ ] reviewer dashboard (approve / needs-changes / reject + notes)
- [ ] hours <-> reward catalog logic
- [ ] end-to-end click-through test pass on the live link
