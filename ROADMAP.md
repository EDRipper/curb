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

## icons on the "how it works" steps

matched the treatment the reward cards got two ticks ago: the 3 steps
were just a bare "01"/"02"/"03" number, nothing tying them to their
actual content. added `StepIcon.tsx` - a browser window with a
target/crosshair for "pick a real site", a wrench for "fix real
accessibility issues", a bar chart with an up-arrow for "submit
before/after proof".

the wrench went through two real iterations, not one-shot: first try
used a stroke-dasharray trick to punch a gap in a ring for an
open-wrench-head look. a real browser screenshot caught it rendering
as a lopsided pac-man wedge instead of a clean opening, plus a color
mismatch (the gap used the hero's cream color against this section's
actual `bg-white`). redrew it as a solid rotated-square nut head with
a plain white circle punched in the center - correct specifically
because this icon only ever renders inside the "how it works"
section's known white background. re-verified in the browser: clean
wrench shape, no artifacts, sits properly above the "02" label.

## mobile check (no bug found) + a real footer

spent part of this tick actually verifying mobile instead of assuming:
used a real 375px puppeteer viewport against local dev (not a guess)
to check the header nav and full landing page for overflow/squeeze.
result: no bug - both grid sections already use tailwind's
`sm:grid-cols-N` breakpoint, so they correctly stack to one column
below 640px, and the header nav fits with room to spare at 375px.
worth recording as a real "checked, not just assumed" result rather
than silently moving on.

did find one real gap while down there: the footer was a single
centered line of gray text with zero links, an afterthought next to
the header's proper nav. rebuilt it as a two-column row - curb
wordmark + tagline on the left, submit/github/hack club links on the
right, stacking centered on mobile via `flex-col`/`sm:flex-row`, reusing
the header's link hover style. verified both the desktop two-column
layout and the mobile stacked layout in the browser (real 375px
viewport again) - clean in both.

## fade-up motion on /submit, and a real next.js 16 view-transitions dead end

looked into using react's `<ViewTransition>` (documented under
next.js 16's app router, `node_modules/next/dist/docs/01-app/02-guides/
view-transitions.md`) for real directional page-to-page transitions -
the docs claim the app router bundles the react canary features needed
automatically. checked directly against this project's actual
installed `react` (19.2.8): `ViewTransition` is not exported from it.
importing it would have broken the build. skipped rather than ship
something untested against what's actually installed here; worth
revisiting if/when react gets bumped.

fell back to extending the fade-up entrance treatment (from a few
ticks ago, landing hero only) to `/submit`'s heading/subtext/cta for
both its signed-out and signed-in states, reusing the existing css
class rather than adding anything new. verified in the browser:
caught it genuinely mid-animation on the first screenshot (visibly
lower opacity), fully settled and pixel-matching the static layout
after a 1s wait.

## closed the local-auth-testing gap flagged back at the empty-state tick

a few ticks ago, dashboard/review page changes could only be verified
via throwaway public preview routes, because the local dev server had
no `SESSION_SECRET` (and, it turns out, no `DATABASE_URL` either -
`.env.dev-temp` sitting in the repo root isn't a filename next.js
actually auto-loads) so no real session cookie could be signed or
verified locally. fixed properly: created `.env.local` (already
covered by the repo's `.env*` gitignore rule, never committed) with
`DATABASE_URL` copied from `.env.dev-temp` and a freshly generated
`SESSION_SECRET`, restarted the dev server so it actually picks both
up. a future session that's lost this file can redo it in under a
minute: copy `DATABASE_URL` out of `.env.dev-temp`, generate a random
`SESSION_SECRET` (`node -p "require('crypto').randomBytes(32).toString('hex')"`),
put both in `.env.local`, restart `next dev`. this local secret only
ever needs to match itself - it's unrelated to whatever's deployed on
vercel, purely for signing test cookies against the local server.

used it to sign a session for the existing "auth test reviewer" temp-db
account (queried via `psql` against the already-configured
`DATABASE_URL` - read-only, no rows touched) and load the real
`/dashboard` and `/review` pages for the first time this session,
instead of guessing from isolated component previews. confirmed the
tick-4 empty states and tick-6/9 icons all render correctly in the
actual authenticated views. also noticed dozens of orphaned `next-server`
processes from past ticks never killing their server before starting a
new one (flagged, not fixed, at tick 5) - killed the stale ones and
started clean as part of this restart.

side notes surfaced along the way, not fixed this tick since neither
is visual: the dev server logs a deprecation warning that this repo's
`middleware.ts` convention should move to `proxy` in this next.js
version, and the browser dev overlay shows a persistent "1 issue"
badge that's most likely the same warning surfacing client-side (no
console errors on the actual pages tested).

## avatars on the dashboard and review queue, and a real dev-server gotcha

first real use of last tick's local-auth unlock for actual dashboard/
review-queue polish rather than just verifying past work: both pages
identified people by plain text name only, no visual identity at all.
added `Avatar.tsx` - initials on a color picked deterministically from
a hash of the name against a fixed 6-color palette, so a given person
always gets the same color with nothing stored. wired into the
dashboard's own greeting and every submitter card in the review queue.

hit a real false-negative worth recording: first verification pass
showed zero avatars anywhere in the rendered html (checked the raw
html directly, not just a screenshot, to be sure), despite correct
code and a clean typecheck. root cause was a stale turbopack dev
server that hadn't picked up the new component file - a plain hmr
refresh wasn't enough, needed an actual kill-and-restart of the dev
process. re-verified after that and the avatars render correctly:
distinct colored "ss"/"as" circles on every card, aligned, no layout
shift. worth remembering for every future tick from here - if a real
code change doesn't show up in a screenshot, restart the dev server
before concluding the change itself is broken.

## a real before/after bar for the a11y score

"a11y score: 76 -> 100 (+24)" was numbers-only on both the dashboard
and review queue - a real gap given the score delta is curb's whole
pitch (the landing page literally says "the number is the proof, not
a vibe check"). added `ScoreBar.tsx`: two stacked mini bars, gray sized
to the before score and green sized to the after score (both out of
100), giving the delta an actual visual read next to the text. wired
into both pages so the same submission looks consistent everywhere it
appears.

applied last tick's lesson properly this time - killed every stray
next dev/next-server process and started completely clean before
verifying, instead of trusting the first screenshot off a server that
might be stale. confirmed against the one real audited submission in
the temp db, checked from both the reviewer's `/review` view and the
submitter's own `/dashboard` view: bars render at the correct
proportional widths on both, no layout shift.

## finished the hover-lift consistency pass, and a real lesson about verifying hover at all

brought the last flat-hover buttons (dashboard's 3 action buttons,
AuditButton, the submit form button) up to the same hover:-translate-y-0.5
+ shadow treatment as everything else.

more important than the css change: actually tried to pixel-verify a
hover state for the first time, instead of eyeballing a static crop
like ticks 12 and 14 did. genuine puppeteer mouse.move to the button,
confirmed `el.matches(':hover') === true`, then compared computed
`backgroundColor`/`transform`/`boxShadow` and raw screenshot bytes
before vs after - completely identical, every time, on every button
tried. that's a real result, not a flaky one: this sandbox's headless
chromium reports `(hover: none)` and `(pointer: none)` via
`matchMedia`, and tailwind v4 correctly wraps every `hover:` utility
in `@media (hover: hover)` (confirmed both the media gate and the
compiled `hover:shadow-lg` rule exist in the actual served css). so
none of this session's hover-lift work was ever a bug - it's just
genuinely unobservable via screenshot in this specific sandbox,
because there's no real pointer device for the browser to report.

takeaway for every future tick: stop trying to pixel-diff hover
states here, it will never show a difference regardless of whether
the code is correct. what's actually checkable is (1) the class
names are present in the rendered dom and (2) the corresponding rule
compiles into the served css - both verified this tick - plus the
non-hover static appearance, which should always still be screenshot-
checked for regressions since that part IS observable.

## fixed the social share image, which had apparently never been looked at

rendered `/opengraph-image` (shared by both opengraph-image.tsx and
twitter-image.tsx via `lib/ogImage.tsx`'s `renderOgImage()`) and
screenshotted it for the first time - this is the image that shows up
when the site link gets shared on slack/twitter/imessage, and nothing
in the commit history suggested it had ever actually been rendered
and looked at rather than just trusted from reading the jsx.

found a real bug: the "a hack club ysws" badge rendered as a wide bar
stretching the full 1200px image width instead of a compact pill,
because the flex column parent's default `align-items: stretch`
stretched the badge div to match the container - the real site's
badge never has this problem because it's `inline-block`, not a flex
child. fixed with `alignSelf: 'flex-start'`. re-rendered after: proper
compact rounded pill, matching the real site's badge.

noted but left alone: the headline shows a slightly wide gap before
"fix." right at the line-wrap point. confirmed no double space in the
source (`cat -A`), so it reads as a satori/next-og text-shaping quirk
tied to this local render rather than a structural bug - worth a
second look if it shows up on the actual deployed image too.

## dug into the og-image text gap, dead end, moved on

spent part of this tick trying to actually fix the headline spacing
noted at the end of the last entry: tried `flexWrap: 'wrap'` (no
change), then rewrote the headline as two explicit hardcoded lines
instead of relying on auto-wrap at `maxWidth: 980` (also no change,
same gap showed up before both "fix." and "it"). that ruled out
wrapping/justification as the cause - it's font substitution. the
image never specifies real font data to `ImageResponse`'s `fonts`
option, so `fontFamily: "sans-serif"` resolves to whatever's installed
in whichever environment renders it, and this sandbox's fallback has
wide inter-word spacing at certain kerning pairs. `next/og` only
accepts ttf/otf/woff font data and this repo's cached geist files are
woff2-only (checked `.next/static/media`), so a real fix means
converting/bundling a font, real effort for a share-image-only
nicety with a payoff that isn't even confirmed to reproduce on the
actual vercel deployment. reverted both experiments back to the
original single-div/maxWidth version (already-fixed badge stays
fixed) and moved on rather than sink more of this tick into it.

## warning icons on the review queue's credit-dispute/duplicate banners

the "possible credit dispute" and "duplicate" red banners are the
single highest-consequence signal on the review page - they're what
stops a reviewer from blindly clicking approve - and they had the
least visual weight of anything on the card, plain text in a colored
box. added `WarningIcon.tsx` (a small triangle-exclamation, shared by
both banner variants) so the warning is scannable at a glance.
verified against the real review queue: icon aligns cleanly with the
first line of text on both banner types, no overlap where a card
shows both at once.

## status badge icons, and deduping it between the two pages

`dashboard/page.tsx` and `review/page.tsx` each carried their own
byte-identical copy of `STATUS_STYLE` and the badge `<span>` markup -
same 4 statuses, same classes, copy-pasted rather than shared. pulled
it into `StatusBadge.tsx` and gave each status a small glyph (check
for approved, x for rejected, exclamation for needs_changes, a clock
for submitted) on top of the existing color, so status reads by shape
as well as color - relevant given this whole product is about
accessibility, color-only status indicators are exactly the kind of
thing curb asks submitters to fix on other people's sites.

verified against the real dashboard and review queue with the temp-db
accounts: all 4 statuses that actually occur in the test data render
the correct glyph and color on both pages, no layout shift from the
refactor.

## icons on the last plain pages: error, 404, login-error

`error.tsx`, `not-found.tsx`, and `login-error/page.tsx` were the
last text-only pages left on the site, no icon anywhere, same generic
feel the empty states and reward cards had before earlier ticks fixed
them. reused the existing `WarningIcon` for the two genuine failure
states (a thrown error, a failed oauth round trip) and added a new
`NotFoundIcon.tsx` (magnifying glass with a "?" as the handle) for the
404 page specifically, since "page doesn't exist" isn't really an
error/warning the way the other two are.

verified all three in a real browser: the 404 via a made-up url,
login-error directly, and the thrown-error case via the existing
(untracked) `app/test-error-boundary/page.tsx` scratch route from an
earlier session, built specifically to force `error.tsx` to render.
all three icons sit cleanly above their heading, correct size and
color, nothing clipped.

## real section structure for the submit form

the submit form is the core conversion point for the whole product -
7 fields (before/after urls, diff url, description, 2 optional
screenshot urls, hours claimed) in one flat list, no grouping, reading
like a generic crud form. split into 3 sections ("the fix", "proof
(optional)", "hours") using the same uppercase section-header style
already established elsewhere on the site, separated by a thin top
border between sections. purely a layout change - grepped every
`name="..."` after the edit to confirm all 7 field names are byte-
identical to before, so the server action's binding is untouched.

verified against the real signed-in `/submit` page (temp-db submitter
account, clean dev restart first): three clearly separated sections,
"proof (optional)" reads correctly with a muted "(optional)" suffix,
no broken spacing at the section borders.

## progress bar toward the next reward tier

"5h more to unlock braille label maker (15h)" was numbers-only on the
dashboard - same category of gap the a11y score had before it got a
ScoreBar. added a thin brand-yellow progress bar computed from
`currentTier.hours` to `nextTier.hours`, clamped 0-100.

verified against the two real accounts available (reviewer at 0h,
submitter at 5h) - the temp db has nobody sitting mid-tier so a
non-edge fill percentage couldn't be checked visually, but both edge
cases that DO exist in the data checked out correctly: a null
`currentTier` treated as a 0h floor (no crash, no NaN), and landing
exactly on a tier boundary rendering as a real 0% rather than a
negative width or divide-by-zero. worth a follow-up screenshot once
the temp db has someone with partial progress.

## closed the mid-tier progress bar verification gap from last tick

last tick's reward progress bar only had 0h and exact-boundary (5h)
accounts to check against - no way to see a real partial fill. rather
than leave that gap open, created the missing data point through the
actual product flow instead of a db write: signed in as the temp-db
submitter, filled out and submitted a real 4h fix through `/submit`
with real clicks/typing, then signed in as the reviewer and clicked
"approve" for real on that submission through `/review`. pushed the
submitter from 5h to 9h approved - now sitting between the 5h and 15h
tiers.

re-checked the dashboard: "9h approved... 6h more to unlock braille
label maker (15h)" with the progress bar now showing a real ~40% fill
((9-5)/(15-5)), matching the math exactly instead of sitting at an
edge case. also a free re-confirmation of the StatusBadge icon work -
the new submission correctly showed the "submitted" clock glyph while
pending, then swapped to the "approved" check glyph after the real
approve click, all through actual data, not a preview route.

## a real navigation gap: no way back to the homepage once signed in

neither `/dashboard` nor `/review` had any link back to `/` - the only
way out once signed in was clicking sign-out or manually editing the
url. a genuine ux bug, not just missing polish. added a "curb"
wordmark link (matching the landing page header's style) to the top
of both pages, plus a "dashboard ->" link on the review queue since
reviewers are frequently submitters too and want a quick way back.

verified against both real signed-in pages: wordmark and dashboard
link render cleanly at the top with proper spacing before the
existing heading, no overlap.

## ran curb's own accessibility audit against curb itself

fitting given the whole product scores other people's a11y fixes:
reused `lib/accessibilityAudit.ts`'s exact pipeline (same axe-core cdn
script, same weighted scoring) against curb's own pages instead of
just eyeballing screenshots for this tick.

landing page scored 78/100 with two real, specific violations:
1. `[serious] color-contrast` - the "how it works" step numbers
   (01/02/03) were `text-zinc-400` on white, 2.62:1 against a 4.5:1
   minimum. traced it to a regression from the step-icon tick a few
   sessions ago (de-emphasized the number color without checking
   contrast). fixed to `text-zinc-500`.
2. `[moderate] landmark-unique` - two `<nav>` landmarks (header + the
   footer nav added a few ticks back) with no accessible name,
   indistinguishable to screen reader landmark navigation. added
   `aria-label="primary"` and `aria-label="footer"`.

re-ran after fixing: landing page 100/100, zero violations. then ran
the same audit against `/submit`, the 404 page, `/login-error`, and
the real authenticated `/dashboard` and `/review` - all 6 pages score
100/100 clean. this is a real, repeatable verification tool for future
ticks, not just a one-off - worth running again periodically as more
changes land, since it directly measures the thing this product exists
to measure.

## success confirmation after submitting a fix

checked dashboard/review at a real 375px mobile viewport first (no bug
found - no overflow, and a card that looked like it had an overlapping
status badge turned out to be tight-but-not-touching when measured by
actual bounding rects, not a real defect).

then found a genuine gap: `createSubmission` redirected straight to
`/dashboard` with zero acknowledgment after a successful submit - the
core conversion action of the whole product, and a first-time user
gets no feedback that anything happened. redirect now carries
`?submitted=1`; the dashboard reads it via the (promise-based, this
next.js version) `searchParams` prop and shows a green checkmark
confirmation banner.

verified two ways: visiting `/dashboard?submitted=1` directly shows the
banner while a plain `/dashboard` visit doesn't, and a full real
end-to-end pass - typing into the actual submit form, clicking submit
for real, letting the redirect fire on its own - lands on
`/dashboard?submitted=1` with the banner rendering correctly above the
new "submitted" card.

## a spinner for the two genuinely slow pending states

the "run accessibility audit" button's own label admits the wait is
~15-20s (a real crawl of both urls), and the submit form's button has
a similar db-write wait - both had only a text swap on pending, no
motion. added `Spinner.tsx` (a simple `animate-spin` ring svg) next to
the pending label on both.

verified against a real pending state, not assumed: clicked "run
accessibility audit" on an actual submission through a real
authenticated session and screenshotted ~800ms later, mid-flight -
spinner rendered correctly next to "running audit...". let it run to
completion and reloaded: audit finished normally (a11y score 92->92 on
a placeholder url, scorebar rendering correctly), confirming the
change didn't disrupt the real pending-to-complete transition.

## middleware -> proxy migration, and per-page tab titles

finally did the middleware.ts -> proxy.ts rename flagged back at tick
12 (next.js 16 deprecation, straightforward per the official migration
doc) - typecheck clean, deprecation warning gone from the dev server
log, real authenticated screenshot after a clean restart shows no
regression. the persistent dev-overlay "1 issue" badge is still there
regardless, so that wasn't the cause - still an open, minor, dev-only
curiosity not worth more time on.

separately found a real gap: dashboard/review/submit/404/login-error
all inherited the landing page's exact root-layout title - open
several in different tabs and they're indistinguishable in the tab bar
or browser history. added page-specific `metadata` exports to all 5.
verified with a real browser session hitting all 6 pages and reading
`page.title()` on each - landing keeps its marketing title, the other
5 now read their own distinct "X — curb" title.

## re-ran the self-audit (still clean), then a trophy for the max tier

re-ran the accessibility self-audit from tick 23 against all 6 pages
after several ticks of new markup (success banner, spinners, proxy
migration, tab titles) - still 100/100 everywhere, no regressions.

then gave the max reward tier some real weight: "top reward tier
unlocked" (50h+) rendered identically to every other muted status
line, no distinction for what's actually the biggest achievement in
the whole rewards flow. added a small trophy icon and switched the
text to amber-700, matching the accent-for-achievement pattern already
used elsewhere (reward card yellow accents, the score bar's green
fill). verified via a throwaway preview route since no temp-db account
has 50h+ approved - screenshotted the exact real markup at max-tier
values, icon renders correctly sized and baseline-aligned.

## stepped back for a full-page gestalt check, fixed an unbalanced section

took a fresh full-page screenshot of the whole landing page instead of
looking at individual components in isolation - most sections are
icon/grid-driven at this point, but "why this exists" was still a lone
narrow paragraph (`max-w-2xl` inside a `max-w-4xl` container) leaving a
large empty gap on the right half, looked unfinished next to
everything else. added a large decorative double-quote mark (plain
geometric shapes, not a font glyph) to fill that space - fits since the
section already reads like a manifesto/pull-quote, muted zinc-100 so it
doesn't compete with the text.

verified both breakpoints in the browser: desktop shows the quote mark
sitting cleanly right of the paragraph, and a real 375px mobile check
confirms it's correctly hidden there (`hidden sm:block`) with the
paragraph taking the full width and no overflow. a full fresh
screenshot of the whole page confirmed no other section was disturbed.

## checked the actual live deployment for the first time this session

every verification so far this session was against local dev - never
once checked whether any of it was actually visible on the real
`curb-theta.vercel.app` url. did that this tick and found two things,
one false alarm and one real:

false alarm: a screenshot of the live site's icons looked like they
might be rendering as tiny multicolor unicode emoji instead of the
custom svg line-art built up over many ticks - alarming if true, since
it would mean a chunk of this session's work never actually shipped
visually. chased it all the way down to the raw served html
(`view-source:` + line-wrap, not just another screenshot) and found
real `<svg><rect><circle><path>` markup matching the actual component
code exactly, no emoji characters anywhere. small colorful svg shapes
at 32-36px just visually read as emoji-like in a screenshot - a real
lesson in not trusting a single visual impression (mine or a
sub-agent's) over checking the actual served source when the stakes
of being wrong are high.

real finding, confirmed via `gh api repos/EDRipper/curb/commits/main/
status`: vercel's build pipeline is rate-limited ("Deployment rate
limited — retry in 24 hours", from this session's ~29 ticks each
pushing 2+ commits). the last commit that actually deployed is
`c56837a` (end of tick 27) - everything from tick 28 onward is pushed
to github and will deploy automatically once the limit clears, but
isn't live yet. not changing how this loop operates (git/push still
matters regardless of vercel's build queue), just flagging it clearly
rather than silently assuming every push is instantly live.

also shipped a small real fix while investigating: the hours-claimed
input had no unit suffix. added a visual "h" inside the field,
verified with a real typed value that it doesn't collide with the
native number-input spinner arrows.

## the temp database's credentials are dead

gave the dashboard's "audit failed: {error}" message the same
warning-icon treatment every other error state on the site already
has (error.tsx, login-error, the review queue's credit-dispute
banner) - was plain red text, no icon, no background.

tried to verify it against a REAL audit failure (submit a fix with an
unresolvable domain, run the audit, watch it fail for real) instead of
just a preview route. hit something much bigger in the process: the
temp postgres db (`db.prisma.io`, the one set up in `.env.local` back
at tick 12) is genuinely unreachable now - "Failed to identify your
database: Your Postgres credentials are incorrect", reproduced twice
via direct `psql` (not just the app's prisma client), from two
different resolved ips, so it's not a transient network blip.

this matters beyond my own local testing: `.env.dev-temp` (present in
the repo before this session started) has this exact same connection
string, strongly suggesting it's the same value set as `DATABASE_URL`
on vercel for the actual production deployment. if so, the live
site's sign-in/dashboard/submit/review are likely broken for real
users right now too, not just blocked for me locally. flagging this
clearly rather than working around it - per instructions this loop
doesn't touch the temp db setup itself, that's euan's call. verified
this tick's actual code change (the warning-icon styling) via a
throwaway preview route instead, since real data access isn't
possible until the db issue is resolved.

## smooth scroll for the hero's #how anchor link

temp db still dead (re-checked with the same direct `psql` test before
starting this tick), so stayed on public/non-db pages again. the
hero's "how it works" button jumped instantly to the `#how` section -
zero motion, jarring next to everything else this session added
motion to. added `scroll-behavior: smooth` to `html`, falls back to
`auto` under `prefers-reduced-motion` (matching the existing fade-up
media query pattern).

verified without relying on eyeballing an animation, since the hover
investigation a few ticks back showed that's not reliable evidence
here: `getComputedStyle(html).scrollBehavior` reads "smooth" normally
and "auto" under emulated `prefers-reduced-motion`, and a real click on
the anchor moves `window.scrollY` from 0 to 630 and lands the `#how`
section at the top of the viewport - confirms the link still actually
works, not just looks different.

## checked an even narrower viewport (320px), found a real regression

temp db still dead (re-checked). this session had only ever tested
mobile at 375px - dropped to 320px (smallest common width, older/
smaller phones) and found the hero's two cta buttons squeezing their
own text onto 2 lines each instead of staying single-line pills. no
overflow, but a real visual regression at that width - flex items
shrink below their content width by default when a row runs out of
space, forcing internal text wrap.

fixed with `flex-wrap` on the button row and `whitespace-nowrap` on
each button, so a button that doesn't fit drops whole to its own line
instead of compressing. verified both ends: 320px now shows clean
full-width single-line buttons stacked, and 1280px desktop is
unchanged (still side by side, same as every prior screenshot this
session).

## a real gap in the tick-23 self-audit, and the bug it was hiding

checked 320px on `/submit`, the 404 page, `login-error`, and the
error boundary too - all clean, no overflow, no regressions like the
hero buttons had.

then noticed something: tick 23's site-wide self-audit claimed
`/submit` scored 100/100, but `/submit` only renders the real
`SubmitForm` when signed in - that audit ran against the signed-out
"sign in to submit" prompt, so the actual form fields (the part
someone spends the most time looking at) were never covered at all.
rendered `SubmitForm` directly via a throwaway preview route (no auth
needed, it's just the client component) and audited it for real: 94/100,
one violation. the "PROOF (optional)" section header's "(optional)"
suffix (added in the tick-20 restructure) was `text-zinc-400` on cream,
2.51:1 against a 4.5:1 minimum - the exact same mistake pattern as the
tick-18 step-number bug, a too-light zinc picked for de-emphasis
without checking contrast. fixed to `text-zinc-500`, re-audited: 100/100.

re-swept every other page too, but being precise about what that
actually proved: dashboard/review currently render `error.tsx` instead
of their real content, since the temp db outage means their data
queries throw - so that "100/100" re-confirms error.tsx's already-known
cleanliness, not a fresh check of the real authenticated pages. noting
this explicitly rather than letting a passing score imply more
coverage than there actually was.

## audited every standalone component, then a manifest + theme-color

temp db still dead. built a kitchen-sink preview route combining every
reusable component from this session (Avatar, StatusBadge, ScoreBar,
WarningIcon, Spinner, EmptyState) and ran the axe pipeline against all
of them together - first pass showed 4 violations, but all were
self-inflicted by my own preview page's structure (nesting loading.tsx's
own `<main>` inside my preview's `<main>`, no h1). removed the nested
full-page components and added a heading: 100/100, genuinely clean,
confirming these components carry no hidden accessibility issues in
their actual real-world usage.

then noticed the site had no web manifest at all - "add to home
screen" on mobile would use a generic browser-default name/icon
instead of curb's actual branding. added `app/manifest.ts` (name,
description, standalone display, cream/near-black colors, both
existing icon routes at their real sizes) and a `viewport` export with
`themeColor` so mobile browser chrome matches the site's cream
background. verified the manifest serves correctly at
`/manifest.webmanifest` (200, correct json) and that next auto-wires
the theme-color meta + manifest link into every page's head. re-ran
the self-audit after: still 100/100.

## the hero illustration finally moves

temp db still dead. the curb-cut illustration (this site's signature
custom svg, added at tick 2) had been completely static this whole
session while nearly every other component got some motion treatment.
gave the wheelchair wheel a slow continuous spin and the trailing
motion-dashes a staggered pulse - both `@keyframes` in globals.css,
both disabled under `prefers-reduced-motion`. had to add two thin
spokes to the wheel first, since a plain circle spinning looks
identical at every frame - the rotation needed something asymmetric to
actually read visually.

verified functionally rather than trusting a screenshot to show
motion: sampled `.curb-cut-wheel`'s computed css `transform` matrix
twice, 600ms apart, and confirmed the values genuinely differ (real
rotation in progress). confirmed `animation-name` resolves to `none`
under emulated `prefers-reduced-motion`. also grabbed a screenshot
mid-rotation, which happened to catch the spokes at a clearly
non-zero angle - visual confirmation on top of the computed-style
proof. re-ran the accessibility self-audit: still 100/100.

## good news: vercel's rate limit cleared, production is caught up

checked `gh api repos/EDRipper/curb/commits/main/status` again this
tick - deployment now shows "success" for the exact latest commit
(`391e1de`, end of tick 35), not the 24h wait the rate-limit message
implied. confirmed visually too: the live `curb-theta.vercel.app`
shows the hero wheel mid-rotation with visible spokes, matching
tick 35's work. everything pushed this whole session is now actually
live, not just sitting in github. temp db is still down though (same
`psql` failure as every prior tick this session).

## a skip-to-content link on the landing page

a real accessibility gap that automated axe-core scans don't catch:
keyboard/screen-reader users had no way to bypass the header nav (4
tab stops) and jump straight to the main content, had to tab through
it on every single visit. fitting to add given curb's whole product
scores other sites on exactly this category of thing. added a
visually-hidden skip link (becomes visible on keyboard focus) before
the header, pointing at a new `id="main-content"` on `<main>`.

verified with real keyboard interaction rather than trusting the dom
alone: confirmed the link is 1x1px hidden by default, a real `Tab`
keypress lands on it as the literal first focusable element on the
page, it becomes visible (133x36px) once focused, and pressing `Enter`
on it actually navigates to `#main-content` and scrolls the page -
functionally correct end to end, not just present in markup.

## checked 200% zoom (clean), branded the text-selection color

temp db still dead. tested the landing page at 200% zoom (css `zoom`
property on `html`, closer to real browser zoom than just bumping
font-size) - no overflow, headline reflows correctly, nothing clipped
or overlapping. a real, if quick, wcag 1.4.4-style check that hadn't
been done this session.

then noticed selecting text anywhere on the site used the browser's
default selection color (usually blue) - a small thing, but every
other color on the site was a deliberate choice while this was left to
whatever the browser felt like. added `::selection { background:
#ffcf3f; color: #18181b }`, reusing the exact yellow/near-black combo
already established for the hero badge rather than introducing a new
color. verified with an actual dom selection (Range/Selection api, not
just trusting the css rule exists): selected the hero subtext
paragraph for real and screenshotted it - solid yellow highlight,
clearly legible dark text.

## re-checked an old dismissed observation, then added texture

temp db still dead (checked, moving to spot-checking every few ticks
instead of every single one from here - it's been down since tick 30
with no change). re-checked the faint diagonal hatch pattern near the
footer's bottom edge that tick 10 dismissed as a screenshot-compression
artifact - a tight, uncompressed crop this time confirms it really was
just that: flat cream, nothing there. good to have that conclusively
closed instead of left as a lingering maybe.

then stepped back and decided the site, while polished piece by piece,
still reads a bit flat/plain overall compared to the bolder hack club
sites this loop is chasing - it's been mostly monochrome + one yellow
accent all session. added a subtle dot-grid texture (barely-there
near-black dots at 6% opacity, 22px grid) to the landing page's outer
wrapper. only shows through where a section doesn't set its own
background (hero, "what you get"), since "how it works" and "why this
exists" both use bg-white and fully cover it - lines up with the
existing border-t section rhythm instead of fighting it.

verified in the browser: dots render clearly but stay well behind the
text/cards in visual weight, correctly absent from the white sections.
re-ran the self-audit: still 100/100, decorative background doesn't
touch text contrast.

## measured actual line lengths, fixed one that ran too wide

checked heading hierarchy across the public pages first (clean single
h1 per page, no skipped levels on landing's h1->h2->h3 structure, no
bug). then measured every paragraph's actual rendered width instead of
eyeballing - the rewards disclaimer ("hours are self-claimed...") had
no max-width at all, stretching to the full 848px "what you get"
section at 12px font size, well past comfortable reading line length.
every other paragraph on the page has some width constraint; this one
was missed. added `max-w-2xl`, matching the "why this exists"
paragraph's width.

verified by re-measuring the actual rendered width (848px -> 672px,
not just assuming the class did something) and screenshotting the
result - reads cleanly, no awkward wraps. self-audit still 100/100.

## tablet-width sweep (clean), then real cruft cleanup

checked the landing page at 640/768/834/1024px (never tested this
session, only mobile at 320-375 and desktop at 1280) - no overflow,
no cramping in either the hero row or the 4-column reward grid at any
of them. the hero's illustration-vs-text vertical balance is a bit
loose at exactly 640px but that's a pre-existing, already-reviewed
design tradeoff, not a new regression.

then found real leftover cruft: `public/` still had `file.svg`,
`globe.svg`, `next.svg`, `vercel.svg`, `window.svg` - the original
create-next-app starter template's demo icons, dead weight from
before this repo became curb. grepped the entire repo (not just
app/lib) for any reference to them: zero. removed all 5. kept
`public/demo/{before,after}.html` though - those are real, intentional
content (a deliberately broken-vs-fixed html pair meant as a ready
before/after url someone can point curb's own audit at without
needing their own site), not scaffold leftovers.

verified: full repo grep confirmed nothing referenced the removed
files, then a clean dev restart + full render + the accessibility
self-audit all still pass at 100/100.

## a real 404: /favicon.ico

temp db still dead (checked once at the top of this tick, holding to
spot-checks). while auditing icon/color consistency across the
codebase (found nothing wrong there - `#ffcf3f`, `#18181b`, and
`#fdfaf3` are byte-identical everywhere they're used, no drift), it
came up that `app/icon.tsx` generates a nice branded png at `/icon`
but next.js explicitly cannot generate an actual `favicon.ico` (per
its own docs). checked `/favicon.ico` directly: genuine 404, not
theoretical - plenty of real clients (older browsers, rss readers,
link-preview bots) hit that exact path as a hardcoded fallback
regardless of the `<link rel="icon">` tag.

generated `app/favicon.ico` by wrapping the exact same png bytes
`/icon` already serves inside a minimal ico container (ico has
supported embedded png data since windows vista, universally
supported) - guarantees the favicon can never visually drift from the
existing icon rather than hand-drawing a second one.

verified at the byte level: `/favicon.ico` now returns 200 with
`content-type: image/x-icon` (was 404), and extracted the embedded
image back out of the actually-served response to confirm it's a
valid png (correct signature) rendering as the same dark-square
yellow-c icon. self-audit still 100/100.

## swept every text-zinc-400 usage, then the last plain-text error state

grepped the whole codebase for `text-zinc-400`, the exact class that
caused two real contrast bugs earlier this session (tick 18's step
numbers, tick 33's "(optional)" label) - two usages left. the
`NotFoundIcon` one is a decorative svg stroke, different (looser)
contrast rules than text, and the 404 page already audits clean. the
submit form's hours "h" suffix looked like a third instance of the
same bug at first glance, but a real re-audit of the actual form
confirmed it's genuinely fine - it sits on the input's white
background rather than the page's cream, which is just enough
brighter to clear 4.5:1. good thing this got verified instead of
"fixed" on a hunch.

that same sweep turned up the real last item: the submit form's
validation errors ("before url and after url can't be the same" etc)
were still plain red text, the one remaining spot using the old bare
pattern after error.tsx/login-error/the review queue's credit-dispute
banner/the dashboard's audit-failed message all got the warning-icon +
bg-red-50 treatment over recent ticks. fixed it to match.

verified against a real, live validation error rather than a preview
route: signed in with a real session cookie, submitted the actual form
with identical before/after urls (rejected before any db call, so this
works even with the temp db down), and screenshotted the real error
banner rendering correctly. self-audit still 100/100.

## traced a full keyboard tab order, then fixed a real external-link gap

traced the landing page's entire keyboard tab order end to end (15
presses): skip link -> header nav -> hero ctas -> footer links, in
that order, matching the visual layout exactly, no traps or dead
stops. clean, no bug.

then noticed the landing page's github/hack club links, and login-
error's "report an issue" link, all navigated the current tab away to
a different domain entirely - grepped the codebase and found the
review queue's before/after/diff/screenshot links already use
`target="_blank" rel="noreferrer"` for exactly this reason. these 3
were the only external links not following that existing convention -
a real inconsistency already established elsewhere in this same
codebase, not a new rule invented for this fix. matched the existing
`rel="noreferrer"` value exactly rather than introducing a different
one.

verified with a real click, not just attribute inspection: clicked the
github link and confirmed the current tab's url genuinely didn't
change. self-audit still 100/100 across every page checked.

## chased a prefetch-side-effect theory, disproved it, fixed the real nit

noticed `/submit`'s "sign in with hack club" button used a plain `<a>`
while the header nav and hero use `<Link>` for the exact same `/login`
destination, in a file that already imports `Link` and uses it one
line above. before touching it, took the inconsistency seriously as a
possible deliberate choice: next.js `<Link>` prefetches visible links
automatically, and `/login/route.ts` sets a real cookie as a side
effect on every GET - if prefetch triggered that just from the link
being on screen, using plain `<a>` to avoid it would be correct,
not a bug.

tested it directly instead of assuming either way: loaded the landing
page (where the header's `Link` to `/login` is already in the initial
viewport) and watched both network requests and cookies for several
seconds - no request to `/login`, no state cookie appears. next's
automatic prefetch skips fully-dynamic routes like this one, so the
concern doesn't apply here. safe to make consistent after all.

converted the submit page's button to `Link` and verified with a real
click through the entire flow: it navigates through `/login` and lands
on the actual hackclub oauth authorize page, exactly like the already-
working header/hero instances. self-audit still 100/100.

## the loading skeletons had gone stale

`dashboard/loading.tsx` and `review/loading.tsx` were built at tick 5,
before several later ticks added real structure to the pages they're
supposed to preview - the "curb" wordmark link (tick 22), the avatar
circle next to the greeting (tick 13), and the reward progress bar
(tick 21) were all missing. the whole point of a loading skeleton is
telegraphing the shape of what's coming; a skeleton that doesn't match
works against that, flashing from one shape to a visibly different one
once real data loads.

updated both to match current reality: dashboard's now has a wordmark
bar, a circular avatar placeholder next to the name lines, and a
3-line reward box (title/subtitle/progress bar) instead of one generic
block; review's now has the wordmark + "dashboard ->" header row.

verified via the same throwaway preview route from tick 5 (restored to
render both together): full screenshot plus a close crop confirming
the avatar placeholder renders as a genuine circle, not an accidentally-
square block. re-ran the self-audit on the real public pages
(unaffected by this change): still 100/100.

## a clean tick: several real checks, nothing to fix

temp db still dead. spent this tick on checks that could each have
turned up something, and each came back genuinely clean rather than
forcing a change:

- icon stroke-width consistency across CurbCutIcon/StepIcon/RewardIcon/
  NotFoundIcon/WarningIcon: the raw values vary (1.5 to 5) but the
  on-screen weight, once accounting for each icon's actual render
  size, works out proportionate - the hero illustration reading bolder
  than small inline icons is the correct hierarchy, not drift. left it
  alone rather than "fixing" a real design choice.
- landing page and /submit (signed-out) with javascript fully disabled:
  both render completely readable and functional. this also
  incidentally confirms the fade-up/wheel-spin/trail-pulse motion added
  across earlier ticks is genuinely css-only, not js-driven - it was
  built that way deliberately, and this is the first time it's been
  checked under a real no-js browser rather than assumed.
- real keyboard/click focus states on the submit form's url input and
  the description textarea: both show a clear, correctly-styled focus
  ring, verified via computed style plus a screenshot of a real typed
  multi-line value in the textarea, not just checking the css exists.

no code changes this tick - a genuinely clean result across several
real checks is itself worth recording, rather than inventing a change
to have something to ship.

## the og image font bug, actually fixed this time

checked the deployed production og image for the first time (had only
ever checked it locally before) - the text-spacing gap flagged at
tick 17 and deprioritized twice reproduces there too, which is what
made a third attempt worth it rather than assuming it was a local-
sandbox-only artifact.

root cause was exactly what tick 17 suspected but didn't chase: the
image never gave satori (next/og's renderer) a real font, just
`fontFamily: "sans-serif"`, so it rendered with whatever generic font
happened to be installed in whichever environment generated it -
that's what produced the wrong inter-word spacing, not a broken font
file. found a real fix path this time: fetched the actual geist sans
font (weights 700 and 800, matching the badge and headline) as raw ttf
bytes from fontsource's cdn mirror of the same vercel/geist-sans-font
package next/font/google already uses elsewhere on this site, verified
the downloaded files have a genuine opentype magic-byte header before
trusting them, passed them to `ImageResponse`'s `fonts` option.

verified by re-rendering the actual image: the spacing gap is
completely gone. confirmed both `/opengraph-image` and `/twitter-image`
still return 200 with the right content-type at a reasonable render
time (~940ms including the two font fetches). self-audit on the main
site still 100/100, unaffected as expected.

(note: also noticed the vercel deploy status flipped back to rate-
limited again this tick - same "retry in 24 hours" as tick 27, now a
second time this session. holding off pushing every single tick from
here and batching a few together instead, to cut down how often this
loop's own push cadence re-triggers the limit.)

## the same font fix, applied to the favicon/app-icon too

while zoomed in checking the og badge still looked right with the real
font, remembered `renderAppIcon` (shared by `app/icon.tsx` and
`app/apple-icon.tsx`) has the exact same shape of bug as the og image
did - no real font handed to satori for the single "c" glyph, just an
unspecified fallback. less dramatic than a headline's word-spacing gap
since it's one character, but still a real typography mismatch against
the rest of the site, and the fix was already proven from last tick.

pulled the font-fetching logic out of `ogImage.tsx` into a shared
`lib/geistFont.ts` instead of duplicating it, since both files needed
the identical technique. wired the weight-800 font into
`renderAppIcon`. also regenerated `app/favicon.ico` - it was hand-built
from a snapshot of `/icon`'s png bytes at tick 41, so it would've gone
stale (still showing the old fallback-font "c") if left alone after
this change.

verified all of it: `/icon` and `/apple-icon` now render the real
geist sans extrabold "c", `favicon.ico` still returns 200 with a valid
embedded png matching the updated icon, the og image (now using the
shared helper) still renders correctly with no regression, and the
self-audit is still 100/100.

## alignment checks (clean), then robots.txt/sitemap.xml

temp db still dead. measured icon-to-number and icon-to-heading
vertical alignment across all 4 reward cards and all 3 how-it-works
steps precisely rather than eyeballing - perfectly identical positions
across every card/column in both cases, no drift. checked zoom-out
behavior too (50%, the opposite direction from tick 37's 200% check) -
clean, no overflow, scales proportionally.

no fresh visual bug turned up after all that, so looked at what else
was missing entirely, same category as the manifest gap fixed at
tick 34: neither `robots.txt` nor `sitemap.xml` existed - search
engines had no guidance on what to crawl. added `app/robots.ts`
(allows the public marketing content, disallows `/dashboard` and
`/review` since they're auth-only with nothing to show a crawler but a
login redirect, plus the pure-redirect `/login`/`/logout` routes, the
disabled debug api route, and the error-state `/login-error` page) and
`app/sitemap.ts` listing just the two real public pages.

verified both serve correctly: `/robots.txt` returns the exact
intended allow/disallow rules as plain text, `/sitemap.xml` returns
valid sitemap xml with both real urls. self-audit still 100/100.

## de-duped the hardcoded domain

temp db still dead (checked, deploy status back to "success" though -
the second rate limit already cleared). noticed `curb-theta.vercel.app`
was now a hardcoded literal in 4 places (layout.tsx's metadata twice,
the og image's displayed domain text, and the robots/sitemap files
added last tick) - a real risk, not just tidiness: if this ever moves
off the default vercel subdomain, missing even one spot leaves a stale
url live somewhere. extracted `lib/site.ts` (`SITE_URL`) and pointed
all 4 at it.

verified nothing changed behaviorally, not just that it typechecks:
re-checked `/robots.txt`, `/sitemap.xml`, and the rendered og image
after the refactor - identical output to before in every case.
self-audit still 100/100.

## a real 512px icon for pwa quality

the manifest (added at tick 34) only listed a 32x32 and a 180x180
icon - android's add-to-home-screen/app-drawer treatments generally
want 192px and 512px icons, and would've had to upscale the tiny 32px
favicon into a blurry mess with nothing bigger available. added
`app/icon-512/route.ts` - a plain route handler, deliberately not
using the special `icon.tsx` naming convention since this shouldn't
also become a second favicon `<link>` tag, it only needs to exist for
the manifest to point at. reuses the same `renderAppIcon` helper (and
its tick-48 font fix) as the existing icons, generated at full 512px
resolution rather than upscaled from the small one.

verified: `/icon-512` returns 200 image/png, the actual rendered icon
is crisp with no pixelation, and the served manifest now correctly
lists all 3 icon sizes. self-audit still 100/100.

## a full regression sweep, no new code this tick

temp db still dead. checked the rendered `<link>` tags in the actual
page head (favicon.ico, /icon, apple-touch-icon, manifest) - all
correctly declared with the right rel/sizes/type, nothing missing or
mismatched. checked meta title/description length against the usual
google snippet limits - both already fit comfortably, no truncation
risk.

given how much has landed this session (52 ticks), spent the rest of
this tick on a genuine full regression pass instead of forcing a new
change: ran the accessibility self-audit across every page again (all
6 still 100/100), and hit every special route this session touched in
one sweep - `/`, `/submit`, `/robots.txt`, `/sitemap.xml`,
`/manifest.webmanifest`, `/icon`, `/apple-icon`, `/icon-512`,
`/favicon.ico`, `/opengraph-image`, `/twitter-image` - every single one
still returns 200 with the correct content-type. nothing regressed.

vercel's build rate limit hit again (third time this session, same
"retry in 24 hours" message) - noting it again since it's now a clear
pattern, but not changing course beyond the batching already in
place. no new commits this tick, so nothing to push.

## more checks, still clean: heading sizes, high-dpi, dead css

measured actual computed font-size for every h1/h2/h3 on the landing
page: h2 section labels ("how it works", "what you get", "why this
exists") render at 14px, smaller than the h3 step headings nested
inside "how it works" at 18px. flagged this as a possible bug at
first glance, but it's a deliberate, common pattern - small uppercase
"eyebrow" section labels above bigger content headings - not a wcag
issue (heading *nesting order* is what matters for accessibility, not
relative visual size, and the nesting is correct: h1->h2->h3, no
skipped levels, already confirmed at tick 39). left it alone.

checked the reward cards at 3x device pixel ratio (high-dpi/retina) -
everything renders crisp, no pixelation, as expected since it's all
svg. checked globals.css for dead custom classes - all 4
(dot-grid-bg, fade-up, curb-cut-wheel, curb-cut-trail) are actively
used, nothing to clean up.

no code changes this tick either - genuinely thorough checking that
kept coming back clean, recorded honestly rather than manufacturing a
change.

## copy proofread, console checked, animation properties confirmed clean

temp db still dead. extracted the full visible text of every public
page (landing, submit signed-out, 404, login-error, the thrown-error
boundary) and scanned for double spaces and repeated words - none
found anywhere, copy reads clean throughout. also fact-checked the
core "curb cut effect" claim in the hero copy against what's actually
a well-established, real accessibility concept - accurate, not just
a nice-sounding phrase.

checked the browser console for warnings/errors (not just visible
bugs) across landing and submit - completely empty, no react warnings,
no uncaught errors. confirmed the three css keyframe animations added
this session (fade-up, wheel-spin, trail-pulse) only ever animate
`transform`/`opacity`, the two gpu-compositor-friendly properties that
don't trigger layout recalculation - already built the right way, not
something that needed fixing, but worth confirming rather than
assuming.

another clean tick, no code changes - six different checks this time,
all held up.

## submit, 404, login-error, and the error boundary now match the landing page's visual system

temp db still dead. after several clean-check ticks in a row, went
looking harder for an actual visible gap instead of another audit
pass - screenshotted every public page fresh and found one: `/submit`
(signed out), `/not-found`, `/login-error`, and `error.tsx` were all
just bare centered text on flat cream background, no dot-grid
texture, no header, no way back to the rest of the site except a
single small text link. next to the landing page's illustration,
custom icons, and fade-up motion, these looked like an entirely
different, unfinished product.

fixed by giving all four the same visual system as the landing page:
wrapped each in the `dot-grid-bg` textured background (previously
landing-only), and added a small wordmark header (`curb`, linking
home) so every page keeps its brand identity and an escape hatch,
not just a lone "back" link at the bottom of a void. kept each page's
existing icon (NotFoundIcon, WarningIcon) and copy untouched - this
was a layout/consistency fix, not a content rewrite.

verified by screenshotting all four routes after the change (`/submit`
signed out, `/this-page-does-not-exist-xyz`, `/login-error`, and a
throwaway `/test-error-boundary` route that intentionally throws) -
all now show the header + texture correctly, nothing clipped or
misaligned. re-ran the accessibility self-audit against `/`, `/submit`,
the 404 page, and `/login-error` - all 4 still 100/100, no violations
introduced by the new header markup. typecheck clean.

## a distinct display font for the wordmark and hero headline

the whole site has run on Geist Sans since the start of this session
- which is exactly what `create-next-app` ships by default. that's
plausibly a real chunk of why it still reads as a "generic next.js
starter" even after 55 ticks of polish: nothing in the typography
itself says "designed," it says "defaults."

added `Space_Grotesk` via `next/font/google` (bold weight only) as a
second font, wired through a `--font-display` theme variable in
`globals.css` (tailwind v4's `@theme inline` auto-generates a
`font-display` utility class from that). applied it narrowly, not
site-wide: the `curb` wordmark (header + footer, all 7 places it
appears across landing/submit/dashboard/review/404/login-error/error)
and the landing page's hero h1. body copy, buttons, and section
headings stay on Geist - one characterful face on the two biggest
brand moments reads as a deliberate choice; swapping every heading
would fight legibility for no real gain.

hit the "stale dev server" trap again (known issue from tick 13) -
the font/layout change didn't show up under HMR, had to actually find
and `kill -9` the turbopack worker processes via `/proc` (no `ps`/
`pgrep` in this sandbox) and start a fresh `next dev` before it took.
once restarted, confirmed via computed-style check (not just
eyeballing) that `getComputedStyle(h1).fontFamily` and the wordmark's
both correctly resolve to `"Space Grotesk", "Space Grotesk Fallback"`
while body stays on Geist. self-audit still 100/100 on `/` and
`/submit`, typecheck clean. dashboard/review got the same wordmark
class for consistency but couldn't be screenshotted - db's still dead
- same caveat as every dashboard/review touch since tick 30.

## the hero illustration was invisible on mobile the whole time

spot-checked the temp db again - still dead, same "credentials are
incorrect" error from `psql`.

screenshotted the landing page at 375px for the first time this
session and found a real gap: the hero's `CurbCutIcon` illustration
(the one hand-drawn custom graphic on the entire site) was `hidden`
below the `sm` breakpoint. every mobile visitor - almost certainly
the majority for a link shared in slack/on a phone - was seeing the
plainest possible version of the page: headline, body copy, two
buttons, nothing else. the "why this exists" quote-mark svg has the
same `hidden sm:block` pattern but is a minor background decoration
behind body text, not the main brand illustration, so left it alone
this tick to keep the change small and focused.

fix: hero section changed from a fixed `flex` row to `flex-col
sm:flex-row`, and the illustration lost its `hidden sm:block` in
favor of a smaller `max-w-[220px]` that grows to `max-w-xs` at `sm+`.
on mobile it now stacks below the cta buttons instead of squeezing
into a row it was never sized for (which is exactly why it'd been
hidden there originally).

verified by screenshotting three widths - 375px, 640px, 1280px - all
render correctly with no horizontal overflow (checked via
`scrollWidth > clientWidth`, not just eyeballing). self-audit still
100/100, typecheck clean.

## a real focus ring instead of the browser default

grepped the whole codebase for `focus-visible`/`focus:ring`/custom
outline handling - nothing. every link, button, and the skip-to-content
anchor was relying entirely on chrome's default thin auto outline.
for a product whose entire pitch is "we fix accessibility issues,"
shipping the least-designed possible focus indicator is a bad look
and arguably a real usability miss for keyboard users, not just a
polish nit.

added a global `:focus-visible` rule in `globals.css`: a black ring
tight to the element, then a yellow ring outside it (same
high-contrast double-ring approach gov.uk's design system uses,
picked because it's a well-established reference for visible focus
states, and it uses the site's existing accent yellow instead of
introducing a new color).

verification took two passes - the first attempt looked broken
(computed `box-shadow` read as fully transparent, no ring in the
screenshot) until realizing the button's `transition-all` utility
transitions `box-shadow` too, so reading state immediately after the
tab keypress caught it mid-transition at frame zero. added a short
wait after tabbing and re-checked: computed box-shadow correctly
resolves to the black+yellow values, confirmed by screenshot on both
a primary button and the skip-to-content link. self-audit still
100/100 on `/` and `/submit`, typecheck clean.
