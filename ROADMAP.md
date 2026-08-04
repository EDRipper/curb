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
- closed a real integrity gap, not an a11y one this time: nothing
  stopped a reviewer from approving their own submission.
  `reviewSubmission` checked `isReviewer` but never compared the
  submission's `userId` against the reviewer's own id. curb hands out
  real physical rewards gated on approval, so a reviewer account
  self-approving their own work is a genuine fraud vector, the same
  pattern human reviewers get watched for on beest. only 2 accounts have
  `isReviewer` today so nothing's actually been exploited, but the
  control needs to exist before more reviewers get added, not after.
  server action now throws on self-review; the review page shows "this
  is your own submission - another reviewer needs to review it" instead
  of approve/reject buttons for that case. verified live: the bot's own
  test rows in `/review` now show the notice with no action buttons.
- added duplicate/resubmission flagging to the review queue. nothing
  helped a reviewer notice the same user submitting the same pr (or the
  same before/after url pair) more than once - every submission renders
  independently with zero cross-reference to the others, and
  duplicate-checking is one of the easiest real review steps to skip
  when reading submissions one at a time. no schema change needed:
  groups submissions by `userId+diffUrl` and `userId+beforeUrl+afterUrl`
  at render time, shows a warning banner on anything in a group bigger
  than 1. purely informational, doesn't block a legitimate resubmission
  after "needs changes". verified live using the bot's own 4 leftover
  test rows (all same diffUrl) - each now correctly shows "duplicate:
  this user has 4 submissions with the same diff or before/after urls".

  considered instead: letting a reviewer approve at a different hours
  value than what the submitter claimed (mirrors how real review
  deflates inflated hours instead of a binary approve/reject). that
  needs a schema change (a new `approvedHours` column), and this
  session has no `DATABASE_URL` to actually run the migration against
  the live db - shipping the schema change without applying it would
  break every submission query in production the moment it deployed.
  noting this as a real gap for whenever db migration access is
  available again, not implementing it blind.
- added a 30s per-user cooldown on submission creation. the review queue
  has no pagination or per-user filtering (it just lists everything
  chronologically), so nothing stopped one account from flooding it with
  junk entries and degrading the queue for every reviewer, not just that
  user. no schema change needed, reuses `createdAt`. verified live: two
  submissions in a row, the second was correctly rejected with "you just
  submitted one, wait a bit before submitting another".

  side effect worth noting, not a bug: since the bot's own account is
  both a submitter (all the leftover test rows) and a reviewer, last
  tick's self-review guard now means the bot can't reject its own
  remaining test rows anymore - `/review` correctly shows "this is your
  own submission" for all of them instead of action buttons. they're
  harmless (clearly labeled test data, several already rejected earlier)
  but will need euan's account (the only other reviewer) to actually
  clear the couple that are still sitting as `submitted`.

## checkpoint: full regression pass (tick 25, no schema/db access needed)

16 ticks of changes since the last time everything got walked end to end
together rather than one fix at a time, so did a clean pass instead of
another isolated fix: signed out, signed back in through the real oauth
round trip (not just a persisted cookie), landed correctly on the
dashboard with real data; ran a fresh accessibility audit through the
full pipeline including the request-interception ssrf layer, completed
normally (92 -> 92); signed out again and confirmed `/submit` correctly
gates back to the sign-in prompt instead of showing stale cached state.
no regressions found. everything from the ssrf/a11y/integrity work across
the last several ticks is still working together, not just in isolation.

## docs

- README claimed the audit pipeline used "axe-core/Lighthouse" -
  lighthouse was never actually built, only axe-core. corrected to
  describe what's really running. also added the env vars local dev
  actually needs (nothing told a new contributor `npm run dev` would
  just fail without a `.env`), and replaced the stale "early build, in
  progress" status line with what's actually true now.

## reliability

- added `app/error.tsx`, a branded error boundary. the app had a
  branded 404 and oauth error page but nothing for a plain uncaught
  exception in a page/server component - that fell through to next's
  generic unstyled crash screen. verified for real, not just by reading
  the docs: built and ran the app locally (`next build && next start`)
  with a route that throws unconditionally, confirmed next's default
  error ui rendered before this change and the new branded one renders
  after, and that the "try again" button's `retry()` call correctly
  attempts a re-render instead of doing nothing. this next.js canary
  uses `retry()`, not the `reset()` api older docs/training data would
  suggest - checked `node_modules/next/dist/docs` directly per
  AGENTS.md's warning rather than assuming.
- gave the audit button real pending feedback. `run accessibility
  audit` launches two full headless chromium instances sequentially and
  takes 15-20s, but the button gave zero indication anything was
  happening - not disabled, no loading text, nothing. this isn't
  theoretical, it's something i personally ran into over and over this
  session, blind-polling the dashboard to check if an audit had
  finished. extracted `app/dashboard/AuditButton.tsx` as a client
  component using `useFormStatus` so it disables and says "running
  audit... (takes ~15-20s, crawls both urls)" while pending. verified
  live: clicked it and caught the exact disabled/pending state in a
  screenshot before it resolved.
- same fix applied to the review queue's approve/needs-changes/reject
  buttons: three separate buttons in one form, no pending state, nothing
  stopping a reviewer from firing two different status changes on the
  same submission in quick succession (impatient double-click, or
  approve-then-immediately-reject by mistake). extracted
  `app/review/ReviewActions.tsx`, same `useFormStatus` pattern, all
  three buttons disable together. build and lint are clean, but could
  NOT click-verify this one live the way the audit button got verified:
  every submission currently in the queue is one of the bot's own
  leftover test rows, and the self-review guard from a few ticks ago
  correctly hides the action buttons entirely for those. confirmed the
  page still renders with no errors post-deploy, but the actual
  click-and-watch-it-disable check needs either a non-bot submission or
  euan's reviewer account to do for real.

## discoverability

- added open graph / twitter card support - the site had zero social
  preview metadata, so any link posted anywhere (slack, twitter/x,
  discord) rendered as a bare title with no image, the same dead
  unfurl people scroll past without clicking. curb's whole submission
  pipeline depends on community visibility to get fixes in the door, so
  this isn't cosmetic. generated an on-brand card via next/og's
  `ImageResponse` (`app/opengraph-image.tsx` + `twitter-image.tsx`
  sharing `lib/ogImage.tsx`) instead of a generic placeholder - cream
  background, yellow badge, same headline as the homepage. added
  `metadataBase` plus `openGraph`/`twitter` fields to the root metadata
  so the tags resolve to real absolute urls instead of warning/breaking.
  verified for real: built and ran the app locally, viewed the
  generated image directly and fetched the homepage html to confirm
  `og:image`/`twitter:image` actually emit with correct urls, then
  re-checked the rendered image on the live deploy after confirming it
  shipped.
- **partial, not fully done**: `app/favicon.ico` is still the literal
  default vercel/next.js starter icon (a black-and-white triangle in a
  circle) - nothing to do with curb. added `app/icon.tsx` generating a
  real branded one (dark square, yellow "c"), and confirmed both it and
  the old favicon.ico now emit as `<link rel="icon">` tags, so most
  modern consumers (browser tabs, search engines, social platforms, pwa
  installs) should pick up the new one. but `app/favicon.ico` is still
  sitting there as an actual file, and plenty of tools fetch
  `/favicon.ico` directly as a hardcoded fallback regardless of what the
  `<link>` tags say - so the wrong icon can still surface in some
  contexts until that file is actually deleted. tried `rm` for this
  specifically and it's still not landing unattended (same pattern as
  every other rm attempt logged in this file) - this needs euan (or a
  future session with a live approver) to actually remove
  `app/favicon.ico`.

## review throughput

- split the review queue into "needs review" and "already reviewed"
  sections instead of one flat chronological list. fine at low volume,
  but exactly the kind of thing that slows reviewers down as it grows -
  scanning past decided items to find the couple that actually need
  attention. no schema change, just groups the already-fetched list by
  status and shows counts per section. caught a real typescript bug
  before it shipped: pulling the per-item render logic into a helper
  function broke null-narrowing on `reviewer` (a function declaration
  closure doesn't retain control-flow narrowing from the outer scope the
  way an inline arrow function does) - `next build` actually failed on
  this, fixed by extracting `reviewer.id` into its own const right after
  the redirect check. verified live: `/review` now shows "needs review
  (1)" and "already reviewed (4)" as separate sections with the pending
  bot test row correctly sorted to the top.
- extended duplicate detection to catch a case it was missing: the
  original version (a few ticks ago) only grouped by
  `userId+diffUrl`/`userId+beforeUrl+afterUrl`, so it caught the same
  person resubmitting but completely missed a *different* user
  submitting the same pr or urls - the more concerning case (claiming
  credit for someone else's fix, or two people racing the same
  open-source issue). added a second, userId-less grouping and a
  distinct "possible credit dispute" banner for it, separate from the
  existing same-user notice. tested the grouping logic standalone with 5
  cases (same-user resubmit, cross-user from both sides, clean no-dupes)
  before shipping - all passed. couldn't live-test the actual cross-user
  banner though: every submission in the queue right now is the bot's
  own test data, so there's no second real user to trigger it against.
  confirmed live that the existing same-user case still renders
  correctly and nothing broke.

## checkpoint: second full regression pass (tick 34)

9 ticks since the last one (see the tick-25 checkpoint above), and a lot
landed in between - review queue restructuring, cross-user dedup,
favicon, og image, error boundary, both pending-state fixes. did a
fresh walkthrough instead of trusting it all still fits together: signed
out, back in through the real oauth flow, hit real client-side
validation by submitting with a required field empty (confirmed it
actually blocks instead of silently failing), submitted a real test
entry, watched the new audit pending state render correctly, ran it to
completion (92 -> 92), then checked `/review` - "needs review (2)" /
"already reviewed (4)" grouping correct, the same-user duplicate banner
still correct with the new submission counted in, self-review guard
still hiding action buttons. no regressions.

## data quality

- reject submissions where before url and after url are the same. this
  was a real gap, not a hypothetical: my own test data has done exactly
  this a bunch this session for unrelated tests (submitting
  `example.com`/`example.com` to test other things), which is a decent
  sign it's realistic to hit by accident, not just adversarially. before
  this it would run a fully real audit (real chromium, real axe scores)
  against the same page twice and produce a legitimate-looking 0 delta
  that proves nothing was actually fixed. simple equality check at
  submission time, no schema change. verified live: submitting
  `example.com` for both fields now correctly shows "before url and
  after url can't be the same" instead of going through.
- finished the favicon work from a couple ticks ago: added
  `app/apple-icon.tsx` (180x180, ios's recommended touch-icon size)
  alongside the existing `app/icon.tsx`, refactored both into a shared
  `lib/appIcon.tsx` instead of duplicating the jsx. apple-icon skips the
  pre-rounded corners `icon.tsx` uses, since ios applies its own
  rounding mask to home-screen icons - a pre-rounded source image shows
  square corners bleeding through that mask. verified for real: built
  and ran locally, viewed both generated images (32x32 unchanged after
  the refactor, 180x180 clean), confirmed `apple-touch-icon` actually
  emits in the page head, then re-checked the 180x180 image on the live
  deploy after confirming it shipped.
- a genuinely significant gap, not polish: the submitter's own dashboard
  never showed the reviewer's note, or who reviewed it, or when. the
  review note field exists specifically so a reviewer can explain a
  decision, but it was only ever rendered on `/review` - a teen whose
  submission got rejected or sent back saw a flat gray badge and nothing
  else, no way to know why or how to fix it and resubmit. added the same
  "reviewed by X on date - note" block already used on the review page,
  and color-coded the status badge (green/amber/red/gray) to match
  instead of everything reading as the same flat gray regardless of
  outcome. verified live using real historical data, not a fresh test
  row: the bot's own "retest 2" submission (rejected several ticks ago
  with a real note attached) now correctly shows "reviewed by 2an Ripper
  ... - 'pre-forced-redeploy ssrf bypass test...'" on the dashboard,
  where before this it showed nothing beyond the status badge.
- similar theme, bigger data: the audit pipeline has captured the full
  violation list (rule id, impact, node count) for both urls since it
  was first built, and written it to the db's `auditDetails` column
  this whole time - nothing ever read it back. reviewers had to trust a
  bare "score: 76 -> 100" with zero visibility into what was actually
  wrong or fixed, which is a real gap for a review process whose whole
  pitch is "the number is the proof, not a screenshot" - except the
  number alone doesn't actually show what the number is measuring.
  added `lib/auditDetails.ts` (defensive parsing, since the field is an
  untyped `Json` column and a legacy or future shape shouldn't crash the
  page) and wired a compact summary into both `/review` and the
  dashboard: "before: 4 violations (1 critical, 2 serious, 1 moderate) —
  color-contrast, image-alt, ...". tested the summarizer against 5 cases
  (empty, single, mixed-impact, >4-violation truncation, null impact)
  before shipping, then verified live against real historical audited
  data on both pages - genuinely revealed something true along the way:
  the bot's own `example.com`/`example.com` test rows actually do carry
  2 real moderate violations (`landmark-one-main`, `region`) on
  google's/whoever's example.com page, not just placeholder zeros.
- another captured-but-never-shown field: hack club auth returns
  `slack_id` and curb has stored it on every user since the oauth flow
  was built, upserted on every login - never surfaced. reviewers only
  had an email to identify/reach a submitter, a slow way to reach
  someone in a community that actually runs on slack (asking a
  clarifying question, flagging a concern before rejecting outright).
  added a "slack" link next to the name/email on `/review`, using the
  standard `hackclub.slack.com/team/<id>` deep link, only rendered when
  present (it's optional in the oauth response). verified the link
  renders and is clickable live; didn't independently verify the
  destination resolves correctly by actually landing on the profile
  (would need to be signed into that slack workspace in this browser
  context) - confidence instead comes from the href being a plain
  template literal with no transformation logic to get wrong, over a
  `slackId` value whose correctness was already established when the
  oauth callback code was reviewed.
- one more piece of missing reviewer context, this time computed rather
  than stored: nothing showed a submitter's track record. is this
  someone's first-ever submission, or their tenth with an established
  history of legit approved work? the only way to find out was manually
  scrolling "already reviewed" hunting for the same name. free to add -
  the full submissions list across all users is already loaded in
  memory for the duplicate-detection check - sums approved
  `hoursClaimed` per `userId` and shows "Xh approved so far" under the
  description. verified live: correctly shows "0h approved so far" for
  the bot's own rows, which is accurate (every bot submission is test
  data that's been rejected or never audited, never approved).

## verification: no contrast regression from recent additions

the last several ticks added a lot of new `text-zinc-500` usage to
`/review` and the dashboard (slack link, "Xh approved so far", audit
violation summaries) - and tick 10's contrast fix specifically
established that `zinc-400` fails wcag aa on this app's backgrounds and
`zinc-600` was the safe replacement. that raised a real question: does
`zinc-500` - a shade in between, never explicitly measured - actually
pass? couldn't test `/review` or the dashboard directly (both need a
real session, still no way to run axe against an authenticated page
this session), but the same `text-zinc-500` pattern already exists on
`/submit` and the homepage, both of which share the same white/cream
background family. re-ran the full axe sweep fresh against all three
public pages right now rather than trusting the old tick-10/21 results:
all still come back completely clean. no regression - `zinc-500` is
fine on this background, tick-10's finding was specifically about
`zinc-400`, not the whole 400-600 range.

## reviewer hours override - ready on a branch, NOT deployed

the "let a reviewer approve at a different hours value than claimed"
idea flagged as blocked several ticks ago (needs a schema change, no
`DATABASE_URL` this session to apply a migration) is now built and
tested, on branch `feature/reviewer-hours-override`, deliberately not
merged to `main`.

why not just merge it: this repo has no staging step - every push to
`main` deploys straight to production. merging a schema change with no
way to also apply the matching migration to the real database would
crash every submission query the moment it deployed. so instead: spun
up a disposable temp postgres via `npx create-db` (same tool used
earlier in this project's history, no signup, auto-deletes), developed
and migrated against *that*, and pushed the branch only.

what's on the branch: nullable `Submission.approvedHours`, a single
additive `ALTER TABLE ADD COLUMN` migration (non-destructive, safe to
apply whenever real db access exists), an hours input on the approve
action defaulting to the claimed amount, and both dashboard/review
reward math switched to `approvedHours ?? hoursClaimed`.

this is the most rigorously tested feature of the whole session, because
for once there was a real database to test against instead of just
static analysis: ran a full scenario end to end against the temp db -
create a submission claiming 10h, approve it at a deflated 3h, confirm
the dashboard reward sum uses 3h not 10h; approve a second submission
with no override and confirm it correctly falls back to its claimed 5h;
combined total correctly 8h, not 15h.

to ship this: someone with production `DATABASE_URL` access needs to
run `prisma migrate deploy` against it, then merge the branch. everything
else is done and tested.

(unrelated but worth a note: leaving a scratch `.ts` file untracked in
the repo root broke `next build`'s typecheck on `main` after switching
branches back, since tsconfig includes all `.ts` files project-wide
regardless of git tracking status - moved it to `/tmp` rather than
leaving it. `.mjs` scratch files don't have this problem; `.ts`/`.mts`
ones do.)

## a real, live bug only reachable through an authenticated page

everything this session that used axe-core against a live/local server
could only ever reach public, unauthenticated pages - `/dashboard` and
`/review` need a real session, and there was never a way to get one
without actual hack club auth credentials. that's been a standing,
repeatedly-noted gap (see the tick-21, 34, and 41 entries above).

the temp postgres from the hours-override work made this fixable: since
the session cookie is just a jwt signed with `SESSION_SECRET` (an env
var i can set to anything for my own local server), created a real
reviewer user in the temp db, signed a valid session token with this
app's own `signSession()` logic, ran a local build against the temp db,
and set the session cookie directly via puppeteer instead of going
through oauth at all.

first thing this found: **`bg-amber-600` with white text on the "needs
changes" button failed color-contrast** (serious impact, flagged
immediately). this has been live in production the whole time that
button has existed, completely invisible to every check this session
could actually run, because none of them could reach an authenticated
page. bumped to `amber-700` to match the `-700` shade already used by
the approve/reject buttons next to it (which had already been passing).
rebuilt, re-ran the identical authenticated audit against the fix: both
`/dashboard` and `/review` now come back completely clean.

update: went back and closed that scope gap in the same tick rather than
leaving it open. added a second submitter, a cross-user duplicate (same
diffUrl as the first submitter's pull/1, to actually trigger the
"possible credit dispute" banner instead of just trusting the code
path), a rejected submission with a review note, and a needs_changes
submission with a review note - then re-ran the authenticated audit
against all of it at once. still completely clean, and confirmed by
reading the actual rendered text (not just "0 violations", which could
mean a broken render nothing was checking) that every one of those
states genuinely rendered: the credit-dispute banner text, both review
notes, the status badges, "0h approved so far". this was a real,
substantially richer sweep, not just the original one-reviewer/
one-submission case - genuinely good confidence now, not just the
technique being proven.

## real mobile viewport testing, another first for this session

the mcp browser tool used for all live verification this session has no
viewport control - every screenshot all session has been at the same
desktop-ish size. a raw puppeteer script does have full control, so
with the local authenticated server already running, screenshotted the
homepage, submit form, dashboard, and review queue at a real 375x812
mobile viewport (iphone-sized) and checked for horizontal overflow.

homepage/submit/dashboard were clean. review queue had a real bug: the
note input (`flex-1 min-w-0`) shrank down to a couple visible characters
wide instead of wrapping to its own line, because `min-w-0` explicitly
disables the flex item's natural minimum width that would otherwise
force `flex-wrap` to break the row - the placeholder text "note
(optional)" was rendering essentially illegibly in a ~30px box squeezed
next to three action buttons. fixed by making the input full-width by
default (forces its own line, buttons wrap below it) and restoring the
inline `flex-1` behavior only at the `sm:` breakpoint, matching the
mobile-first pattern already used elsewhere in the app. rebuilt,
re-shot the identical viewport: note field now renders full-width with
legible text, buttons cleanly wrap underneath.

## real keyboard navigation testing on the review queue

axe-core's static analysis catches a lot but not everything about
keyboard operability - logical tab order and whether a custom-styled
button actually activates on Enter both need real interaction, not just
dom inspection. with the local authenticated server still up, drove
`/review` with `page.keyboard.press("Tab")` only (no mouse) and recorded
every stop: the before/after/diff links, the note input, then
approve/needs-changes/reject, repeating per submission card in that
same logical order - matches dom order, no keyboard traps, nothing
skipped. every single stop had a real visible focus outline (browser
default, nothing in this app removes it here). then tabbed to a "needs
changes" button specifically and activated it with `Enter` alone, no
click - it fired correctly and the page still rendered normally after.

clean result, no bug found this time - but a real, mission-relevant
check to actually run rather than assume, given curb's own pitch
literally lists "keyboard navigation... focus order" as the kind of
thing submitters are expected to get right.

## kept the reviewer-hours-override branch current with main

`feature/reviewer-hours-override` was branched before the amber-600
contrast fix and the note-field mobile fix, and its own changes touch
the exact same file (`app/review/ReviewActions.tsx`) as both of those.
left alone, whoever eventually merges that branch could have silently
reintroduced one or both bugs depending on how any conflict got
resolved. merged `main` into the feature branch now, while the context
for all three changes is still fresh: git's 3-way merge resolved it with
no conflict markers, and verified (not just trusted the "clean merge"
message) that all three survived together - grepped for both the
`amber-700` class and the mobile `w-full`/`sm:flex-1` classes
post-merge, then rebuilt and re-ran the full authenticated axe sweep and
the mobile viewport screenshot against the merged code on the temp db.
both still completely clean, and the new hours-override input renders
correctly on mobile too (wraps to its own line, pre-filled with each
submission's actual claimed hours). pushed the updated branch, still not
touching `main`.

## first real end-to-end test of the approve flow, this whole session

every prior tick that touched `/review`'s approve/reject/needs-changes
buttons on *production* was blocked from ever clicking "approve" for
real: all the test data was the bot's own submissions, and the
self-review guard (added around tick 22) correctly refuses to let a
reviewer approve their own work. reject and needs-changes both got
exercised plenty; approve never did, on production, this entire session.

with separate reviewer/submitter test accounts on the temp db, finally
closed that gap: checked the submitter's dashboard first (0h approved),
switched to the reviewer's session, clicked the real "approve" button
with an actual mouse click (not keyboard, not a direct db write), then
switched back to the submitter's session and confirmed the dashboard
picked it up correctly - "0h approved" became "5h approved - earned:
adaptive switch + adapter kit", the first reward tier unlocking exactly
as it should for a 5-claimed-hour submission. this is the actual core
value loop curb exists to deliver (fix something, get it reviewed, get
credited, unlock a reward) and it had never been verified end to end
through the real ui with a genuine click before this tick.

## reject, by real click too - all three review actions now genuinely tested

rounded out the previous tick's approve test: created one more fresh
submission from a second test submitter, found its specific card in a
queue that now has several items (not just clicking the first "reject"
button on the page - matched by the submission's own description text
first, same way a person would identify the right card), clicked
"reject" for real, confirmed the review page shows that exact card as
rejected and the submitter's own dashboard picks up the change with the
reviewer's name attached. combined with last tick's approve-by-click and
tick 45's needs-changes-by-keyboard, all three review outcomes have now
been exercised through genuine interaction at least once, not just
inferred from reading `reviewSubmission`'s source.

## checkpoint: third full production regression pass (tick 49)

14 ticks since the last one (see the tick-34 checkpoint above), and the
review queue in particular changed a lot in between - grouping, dedup,
slack links, track record, violation summaries, the contrast and mobile
fixes. walked the live site fresh one more time before this loop's
budget runs out: signed in through the real oauth round trip, checked
`/dashboard` (violation summaries, reward tier math all correct),
checked `/review` (grouping, duplicate banner, slack link, "approved so
far", violation summaries all rendering together correctly on the same
cards), signed out cleanly, confirmed `/dashboard` re-gates afterward
(same well-documented hack club sso auto-relogin behavior from tick 10 -
not a bug). everything from this session's full run holds together on
the actual live site, not just in the local test harness.

## new session: visual polish pass, starting with a real typography bug

new goal for this loop: the site reads as a plain default next.js
starter next to other hack club sites (macondo, beest, fallout,
horizons). working through concrete visual/UX gaps one at a time,
verifying each in a real browser before moving on, instead of batching
untested changes.

first fix wasn't cosmetic tuning, it was a real bug: `globals.css` set
`body { font-family: Arial, Helvetica, sans-serif }`, which silently
overrode the Geist Sans font `next/font` was already loading and
exposing as `--font-sans` in the tailwind theme (`layout.tsx` sets the
`--font-geist-sans` variable on `<html>`, but nothing outside
`@theme inline` ever referenced it). the entire site had been rendering
in the browser's default Arial the whole time instead of the distinctive
Geist typeface the setup was built for - explains a good chunk of the
"looks like a generic starter" read on its own. fixed to
`font-family: var(--font-sans), Arial, Helvetica, sans-serif`, confirmed
in a real browser screenshot against the local dev server that headings
and body copy now render in Geist Sans.

## added a real custom illustration to the hero, not just copy tweaks

the landing page had no custom art at all - just the yellow badge pill
and text, which reads generic next to hack club sites that lean on
hand-drawn/illustrated hero art. added `CurbCutIcon.tsx`: a small
line-art svg of the literal curb cut (the program's namesake) - a
sidewalk ramp cut down to street level, with a wheelchair figure
rolling down it and motion dashes trailing the wheel. built from plain
svg primitives (circle/line/polygon) with real coordinates chosen by
hand for the shape, not an opaque generated bezier blob. sits in the
hero's right column on `sm:` and up, hidden on mobile where there's no
room for it. also added hover lift + shadow transitions to the two
hero cta buttons, replacing the flat color-swap-only hover state.
verified in a real browser screenshot against local dev: renders
clean, no overlap with the heading/body copy, matches the site's
minimal line-art style.

## made the cream brand background site-wide, not landing-only

every page except the landing page (`dashboard`, `submit`, `review`,
`error`, `not-found`, `login-error`) rendered on plain white with none
of the landing page's cream+yellow identity - the whole logged-in app
felt like a generic admin panel bolted onto a nicer marketing page.

first pass added `bg-[#fdfaf3]` directly to each page's
max-w-constrained `<main>`. a real browser screenshot caught that this
only colors a narrow centered column on short pages (404,
login-error), leaving the rest of the viewport white - looked like a
cream card floating in a white sea instead of a consistent page.
fixed properly by moving the cream color into `globals.css`'s
`--background` css var, so `body` carries it everywhere by default and
no page needs its own background class. re-verified all three
previously-broken cases (landing, `/submit`, the 404 page) in the
browser: cream now fills the full viewport edge-to-edge on every one,
text contrast holds up fine against it.

## real empty states on the dashboard and review queue

both "nothing submitted yet." and "nothing pending." were a single
line of gray text - generic-crud-app filler, and the dashboard's empty
state in particular gave a brand new user zero path forward. added
`EmptyState.tsx`: a dashed-border card with a small line-art icon
(clipboard for "nothing here yet", a green check for "all caught up"),
a real heading and body copy, and on the dashboard's case a cta button
straight to `/submit`.

verification note: this repo's local dev environment doesn't have
`SESSION_SECRET` set, so a real signed session cookie can't be minted
locally right now and the authenticated dashboard/review pages can't
be loaded through a normal browser flow in this sandbox - a real gap,
worth fixing (either document how to pull it via `vercel env pull`, or
seed a fixed dev-only secret) rather than something to route around
silently. verified the component itself instead: rendered both
variants on a throwaway public preview route, screenshotted it in a
real browser (icons crisp and centered, cta matches the existing
button style), then left that preview file uncommitted/untracked
rather than wiring it into the real dashboard/review pages blind.

## real loading states for dashboard and review, instead of a blank flash

neither route had a `loading.tsx`, so next.js showed nothing at all
during the server component's db fetch on every navigation to
`/dashboard` or `/review` - a real, generic-feeling gap, not just a
cosmetic one. added `Skeleton.tsx` (a pulsing gray placeholder block)
and a `loading.tsx` per route built out of it, shaped roughly like
each page's real content (header lines, the two action buttons, card
blocks) rather than a generic centered spinner.

verified the skeleton markup itself in the browser via a throwaway
preview route - rendered cleanly, correct proportions, no
overlapping/zero-height blocks. the automatic swap-in behavior is
next.js's own suspense-boundary mechanism for `loading.tsx`, not
custom code, so didn't fake a slow db response just to watch it fire.

## icons on the reward cards, the program's actual core hook

the "what you get" cards (5h/15h/30h/50h+) were just a bold number and
a text label - flat for the section that's arguably the whole reason
someone signs up. added `RewardIcon.tsx`: 4 small hand-drawn line-art
icons matched to the real item at each tier - a toggle switch for the
adaptive switch, a braille dot grid for the label maker, a split
keyboard, a magnifying glass over a screen for the cctv reader. mapped
by `REWARD_CATALOG` index since the tier order is fixed. cards also
got the same hover lift used on the hero buttons instead of sitting
static. verified in a real browser screenshot: all 4 render distinct
and fully contained, no clipping, aligned consistently in the row.

## fixed a real accessibility bug: invisible text in os dark mode

`globals.css` still had the leftover create-next-app
`@media (prefers-color-scheme: dark)` block, flipping body's
background to near-black for anyone with system dark mode on. nothing
else in the app is dark-mode aware - every page's text uses hardcoded
tailwind classes (`text-zinc-900`, `text-zinc-600`) built for a light
background, no `dark:` variants anywhere. net effect: near-black text
on a near-black background on every page except the landing page
(which forces its own light bg directly, so it happened to be spared).

reproduced it for real before touching anything: temporarily forced
the dark branch's colors into `:root` and screenshotted the 404 page
in the browser - heading and body copy were confirmed genuinely
near-invisible, not just theoretically low-contrast. removed the media
query so the site stays on its one designed light theme regardless of
os preference, added `color-scheme: light` to `:root` so the browser
stops trying to dark-theme its own scrollbars/form controls against a
page with no dark styling for them. re-verified the 404 and landing
pages after the fix: cream background, fully readable text on both.

notable given curb's own pitch is literally about accessibility - this
would have failed a contrast audit for a meaningful chunk of visitors.

## staggered fade-up entrance animation on the hero

the site had zero motion anywhere before this session's own hover
transitions - everything just snapped into place, flat next to sites
that use motion for polish. added a `.fade-up` css keyframe (opacity +
small translateY, ~0.6s) to globals.css, applied to the hero's
badge/headline/subtext/buttons/illustration with staggered
`animation-delay` (0-240ms) so they settle in sequence instead of all
at once. disabled outright under `prefers-reduced-motion: reduce`.

verified in the browser: screenshotted immediately on navigation and
again after a 1.5s wait - the settled state matches the known-good
pre-animation layout exactly, confirming the animation doesn't leave
anything stuck invisible or offset, even though a screenshot can't
reliably catch the ~0.6s transition itself mid-flight.
