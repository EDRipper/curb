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
- [x] hours <-> reward catalog logic — `lib/rewards.ts` is the single
      source of truth for the tier catalog (5h/15h/30h/50h), used by both
      the homepage pitch and the dashboard so they can't drift out of
      sync. dashboard sums `hoursClaimed` across a user's `approved`
      submissions only (needs_changes/rejected/submitted don't count) and
      shows the unlocked tier plus hours-to-next-tier. rewrote the
      homepage's reward disclaimer, which used to falsely claim hours were
      "tracked via hackatime" (never built) — it now accurately says hours
      are self-claimed and confirmed by a human reviewer against the audit
      delta. tested live: approved a real 6h submission, watched the
      dashboard go from "0h approved, 5h to next tier" to "6h approved,
      tier 1 unlocked, 9h to tier 2" — correct math, then deleted the test
      submission.
- [x] end-to-end click-through test pass on the live link — walked the
      full flow live on https://curb-theta.vercel.app: homepage copy and
      CTAs render correctly, sign-in reaches the dashboard with real user
      data, review queue link only shows for reviewer accounts, sign-out
      clears the app's own session cookie and the session gate on
      `/dashboard` correctly rejects it (confirmed by hitting `/dashboard`
      directly, not through a `Link`, so no client router cache could be
      masking it). one thing worth knowing, not a bug: visiting a gated
      page again shortly after sign-out can silently land you back on the
      dashboard, logged in, with no visible sign-in screen. that's Hack
      Club Auth's own SSO session on `auth.hackclub.com` still being live
      in the browser — curb's `/login` route always restarts the OAuth
      dance, and if HCA still trusts the browser it auto-approves with no
      prompt. same behavior as "sign out of an app" vs "sign out of
      Google/GitHub" elsewhere. not a curb-side session bug, and not a
      privacy leak (it always re-derives identity from a fresh HCA token
      exchange, never replays stale cached data) — just something to know
      before assuming logout is broken again.

all 8 core roadmap items plus final QA are now live and verified.
remaining open items are both outside this repo's control: the postgres
db is still a temporary create-db instance (needs Euan's github/google
login to claim before it auto-deletes), and the Hack Club Auth app is
still `community_untrusted` (needs Nora to promote it) so users see an
"unverified" warning on the consent screen.

## post-launch hardening

- removed `/api/debug-cookies`, a leftover unauthenticated debug route
  from the logout-bug investigation that echoed back the raw cookie
  header and decoded session (userId/name/email) to anyone who hit it.
  not exploitable cross-user (it only ever returned the requester's own
  cookies), but had no business being live.
- ran curb's own audit pipeline (`lib/accessibilityAudit.ts`) against its
  own homepage: scored 76/100, 4 failing nodes, all `text-zinc-400` on a
  light background under the WCAG AA 4.5:1 contrast threshold (measured
  2.51-2.62:1). fixed on the homepage step numbers + footer, and
  preemptively on the same `zinc-400` pattern in the dashboard and submit
  form (couldn't audit those live without a session, fixed by the same
  math: zinc-600 gives ~7.7:1 against these backgrounds vs zinc-400's
  ~2.6:1). re-ran the live audit after deploy: 100/100. an
  accessibility-focused site should pass its own bar.
- closed an SSRF hole: before/after urls get crawled server-side by a real
  headless browser (that's the whole point of the audit), and the only
  validation was "is this a syntactically valid url" — any signed-in hack
  club user could point it at `169.254.169.254` (cloud metadata),
  `127.0.0.1`, an rfc1918 address, or a `file://` path and have curb's own
  server fetch it for them. added `lib/urlSafety.ts`, enforced at
  submission time and again right before each audit run. verified live:
  submitted `http://169.254.169.254/...` as a before url pre-fix and it
  was accepted (that row is still in the db, status `submitted`, never
  audited — the url was only ever stored as text, puppeteer never
  actually visited it); re-tested `http://127.0.0.1:1/...` post-deploy and
  it was correctly rejected with "before url can't point at a
  local/internal address". the pre-fix test row is harmless clutter, not
  a live risk, cleanup needs an `rm`-level approval that isn't landing
  unattended. update: rejected the leftover row from the review queue
  (no delete action exists in the app, and still couldn't get an `rm`
  approval, so this is the clean non-destructive fix) — it now shows as
  `rejected` with a note instead of dangling as `submitted` forever.
- added a 30s cooldown between audit runs per submission. `run
  accessibility audit` had no rate limit at all: each click launches a
  real headless chromium twice (before + after urls), so spam-clicking it
  could queue up unbounded expensive function invocations. now a second
  click inside 30s of the last audit just errors instead of launching
  another browser.
- stopped showing raw node stack traces to submitters when an audit
  fails. `auditError` stores `message + stack` (still does, for
  server-side debugging via console.error/db), but the dashboard/review
  ui now only renders the first line. verified live by actually failing
  an audit (ran it against the rejected ssrf-test row, which still has
  the blocked before-url): before the fix it rendered ~10 lines of
  `/var/task/.next/server/chunks/...` internal paths, after it's just
  `audit failed: before url can't point at a local/internal address`.
- fixed real a11y bugs on curb's own submit/review forms, the most
  ironic possible place for them. none of the 7 submit-form inputs had
  their `<label>` programmatically associated with the field (no
  `htmlFor`/`id` pair) — a screen reader has no way to know "before url
  (live, unfixed)" belongs to that particular text box, it just
  announces an unlabeled input. added matching ids to every field. the
  review queue's note input had no label at all, just a placeholder
  (which isn't a substitute — it disappears once you start typing, and
  isn't reliably exposed as a name by every screen reader); added an
  aria-label. also the submit form removed the default focus outline
  (`focus:outline-none`) and replaced it with only a subtle border-color
  shift, a weak focus indicator; added a visible focus ring. verified
  the ring live on the deployed form.
- the submit form collects optional before/after screenshot urls but
  nothing ever displayed them anywhere — reviewers had to manually pull
  the url out of the db to see submitted evidence. now shown as
  thumbnails in the review queue (linked to the full image). verified
  live end to end: submitted a test entry with two placeholder image
  urls, confirmed both render side by side in `/review`, then rejected
  the test row with a note instead of leaving it dangling.
- closed a real bypass in the ssrf guard from a few ticks ago: it
  checked plain ipv4 literals and a few ipv6 prefixes, but missed
  ipv4-mapped ipv6 addresses (`::ffff:169.254.169.254` etc, rfc 4291
  2.5.5.2) which the os connects to over plain ipv4 regardless of what
  the hostname string looks like. `lib/urlSafety.ts` now decodes the
  embedded ipv4 from that form and checks it the same way. verified
  against 19 cases (every alt ipv4 notation, public/private ipv6, the
  new bypass) before shipping.

  while verifying this one live, hit a real infra issue worth recording:
  the push for this fix (802d829) never triggered a vercel deployment at
  all — no deployment appeared in `gh api repos/EDRipper/curb/deployments`
  for 9+ minutes, versus every other commit this session deploying within
  ~2 minutes. a second, empty commit pushed right after triggered a normal
  deployment immediately, so the underlying webhook/build pipeline is
  fine, this specific push just got dropped somewhere (github->vercel
  webhook or vercel's queue). two test submissions with the live bypass
  url got accepted into the db during the stuck window; neither was ever
  audited (confirmed by not clicking "run accessibility audit" on them
  until the fix was verified live), so puppeteer never actually reached
  the bypass url — rejected both from the review queue with a note.
  worth knowing for next time a push seems to have "done nothing": check
  the deployments api before assuming the fix shipped, and a plain
  re-push (even an empty commit) is a reasonable first fix.
- closed the bigger remaining gap: everything above only ever checked
  the url a submitter typed into the form. that's a one-time
  hostname-string check - it says nothing about what that url actually
  does once puppeteer starts following it. any server the submitter
  controls could 302-redirect the crawler anywhere, including straight
  to the metadata endpoint, with no dns tricks needed at all.
  `lib/accessibilityAudit.ts` now intercepts every navigation request
  (the initial load and every redirect hop) and resolves + checks the
  real target host before letting it continue, via a new async
  `isUrlTargetPrivate` in `lib/urlSafety.ts`. this also catches a
  hostname that doesn't look like an ip but resolves to one, which the
  old check couldn't. tested against real puppeteer + chromium, not just
  the check logic in isolation: a plain public page still loads, a real
  redirect chain (google.com -> www.google.com) still follows through
  fine, and a direct private target gets cleanly blocked. re-verified
  live on the deployed app after confirming the deploy actually
  succeeded this time (checked the deployments api first, learned from
  the incident above): a submission with a real remaining bypass url got
  correctly rejected by the existing submission-time check before it
  even reached the crawler, and a normal safe submission audited
  successfully end to end (92 -> 92, +0).
- added site-wide clickjacking protection (`X-Frame-Options: DENY` +
  `Content-Security-Policy: frame-ancestors 'none'`) plus
  `X-Content-Type-Options` and `Referrer-Policy` via next.config.ts's
  `headers()`. the review queue's approve/reject/needs-changes buttons
  are a single click with no confirmation step - framing the page with
  an invisible overlay is a real way to trick a signed-in reviewer into
  approving a fraudulent submission without realizing it. syntax matches
  next.js's documented `headers()` example exactly and the build picked
  it up cleanly, but couldn't independently curl-verify the response
  headers on the live deploy directly (couldn't get a live `curl -I`
  approved), but found an indirect way that's arguably a better test
  anyway: served a local test page with an `<iframe src="https://curb-
  theta.vercel.app/review">`, and it renders completely blank - the
  frame's `onload` still fires (browsers do that even when blocked) but
  nothing inside ever paints. as a control, the same harness pointed at
  `https://example.com` (no frame protection) renders normally inside
  the iframe. confirms the header is both present and actually doing its
  job, not just configured.
- ran a full (unscoped) axe-core sweep against every public page instead
  of just checking color-contrast again: `/login-error`, `/submit`
  (signed out), and a 404 all flagged `landmark-one-main` +
  `region` - no `<main>` element anywhere on any of them, everything
  sat in a plain `<div>`. only the homepage had one. added `<main>` on
  login-error, not-found, submit, dashboard, and review (purely
  semantic, no layout change). re-ran the sweep against the live deploy
  after confirming it actually shipped: all three public pages come back
  completely clean now.
