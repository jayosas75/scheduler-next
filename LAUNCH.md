# 🚀 Public Launch Plan

A prioritized, realistic checklist for opening **Scheduler // 2026** to hundreds of users on `laviestellaire.com`. Items are grouped by **when** they have to be done, not by topic, so the top of the list is always the next thing to ship.

> **Current state (2026-06-06):** auth + password reset + RLS + Resend transactional email all working in prod. Three users in DB. Calendar / import / events CRUD are functional. CSP + security headers shipped. In-memory rate-limit + sanitization in place.

---

## ⚠️ P0 — Must clear before public link goes out

Each item here is a real risk if you don't fix it. Estimated effort in parens.

> ### ▶ DO THIS NEXT
> The three auth-hardening items below are done but **not yet committed/deployed** (CVE patch + password policy shipped in commit `63f75c7`; the login rate-limit + its tests are still in the working tree). Order of operations:
> 1. **Commit & deploy** the working-tree changes — the rate-limit only protects prod once it's live.
> 2. **Stop leaking which emails are registered** (next unchecked item — ~20 min) and **strip the `console.log` in auth.ts** (~5 min). Two small changes that finish "lock the doors."
> 3. Then move to **reliability**: confirm Supabase backups → adopt `prisma migrate` → Sentry.

### Security

- [x] **Patch dependency CVEs.** *(done 2026-06-09)* Audit had grown to 7 (4 high / 3 moderate). `npm audit fix` cleared 5 transitive dev-tooling vulns; bumped `next`/`eslint-config-next` `16.1.4 → 16.2.9` (closes the middleware-bypass `GHSA-492v-c6pp-mqqv` + the rest of the Next.js high set). `--force` was **not** used — it tried to downgrade Next to 9.3.3. The last moderate (PostCSS XSS `GHSA-qx2v-qp2m-jg93`) was Next's hard-pinned bundled `postcss@8.4.31`; pinned it up via an `overrides: { "postcss": "8.5.15" }` entry, which dedupes the whole tree to one patched copy. `npm audit` → **0 vulnerabilities**, `next build` ✓, `npm test` ✓ (19 suites). **Still TODO: redeploy** to ship the patched build. (Note: Next 16.2 now warns the `middleware` file convention is deprecated in favor of `proxy` — non-blocking, ties into the P1 middleware/auth.config reconciliation item.)
- [x] **Raise password minimum to 8 chars + basic complexity.** *(done 2026-06-09)* New shared policy in [password-policy.ts](src/lib/password-policy.ts): min 8 / max 72 (bcrypt-truncation guard), rejects single-repeated-char and a small common-password denylist (`password`, `12345678`, `qwerty`, …). Enforced where passwords are *set* — [register](src/app/api/auth/register/route.ts) + [reset-password](src/app/api/auth/reset-password/route.ts) — via the shared `passwordSchema`. **Login ([auth.ts](src/auth.ts)) is deliberately verify-only** (`min(1)`, non-empty): re-imposing the creation policy there would lock out existing accounts made under the old 6-char rule; the strong rules already gate every path that creates/changes a password. Client hints bumped to 8 in the register/reset forms; the login form's `minLength` was dropped so legacy passwords can still be entered. Added unit test [password-policy.test.ts](__tests__/password-policy.test.ts) (17 assertions). Verified in-browser: register API returns the policy messages with 400 and no DB write; `build` ✓, `npm test` ✓ (20 suites).
- [x] **Rate-limit the login path.** *(done 2026-06-10)* IP-keyed cap inside `authorize()` ([auth.ts](src/auth.ts)) using the existing limiter: **10/min** + **50/hr** (two windows catch bursts and slow grinding). Over the cap it throws a `CredentialsSignin` subclass with `code: 'rate_limited'`; [actions.ts](src/lib/actions.ts) maps that to a distinct *"Too many login attempts…"* message while every other failure stays the vague *"Incorrect email or password."* (attacker-opaque). IP comes from `x-forwarded-for` (Vercel); locally it buckets as `unknown`. Verified in-browser (the form flips to the rate-limit message at the 10th attempt/min, then recovers) and with a dedicated [login-rate-limit.test.ts](__tests__/login-rate-limit.test.ts) that proves the cap engages at 11 *and* is per-IP — it isolates itself via a unique `x-forwarded-for` per run, so it never trips the other auth tests. Full suite green (21). ⚠️ *Note: the limiter is per-IP in-memory, so the auth/reset e2e tests (which all hit localhost from one IP) can 429 if you run `npm test` many times within an hour against a long-lived dev server — restart the server to clear buckets. CI is unaffected (those tests skip with no server up). Migrating to Upstash (P1) makes this distributed.*
- [ ] **Stop leaking which emails are registered.** [register/route.ts:35](src/app/api/auth/register/route.ts#L35) returns `"User already exists"`. Change to the same neutral 200 the forgot-password route uses, or send a "this address already has an account, sign in instead" email via Resend. *(20 min)*
- [ ] **Strip `console.log('Invalid credentials')` from auth.ts.** Noise that ends up in Vercel logs on every failed attempt. Replace with structured `console.warn` carrying just the IP, not the email. *(5 min)*

### Reliability + recovery

- [ ] **Confirm Supabase auto-backups are on.** Free tier = 1 daily backup, 7-day retention. Paid (Pro, $25/mo) = point-in-time recovery. For real users, upgrade or take a manual `pg_dump` weekly. *(15 min decision; depends on tier)*
- [ ] **Move from `prisma db push` to `prisma migrate`.** Today schema drift between local and prod is silent — that's how the `PasswordResetToken` table got missed. Initialize migrations once (`prisma migrate dev --name init` against a fresh DB), then `prisma migrate deploy` in your Vercel build step. *(1 hr, including a careful first-migration check)*
- [ ] **Error tracking.** Sign up for Sentry (free tier: 5k errors/mo). Drop the Next.js SDK in, wrap the API routes. Without this you only learn things break when a user complains. *(45 min)*

### Operational hygiene

- [ ] **Privacy policy + Terms of Service.** Even a 1-page generic one (Termly, iubenda, or your own draft). Required by law in CA/EU, and Resend recipients can report you for sending without one. *(1-2 hr or $0 with a generator)*
- [ ] **Domain DMARC reporting.** You set `v=DMARC1; p=none;` — add `rua=mailto:dmarc@laviestellaire.com` so you get aggregate reports if anyone spoofs your domain. *(10 min)*
- [ ] **Verify HSTS posture.** Currently `max-age=31536000` only. Once you're sure all subdomains are HTTPS, add `includeSubDomains; preload` in [next.config.ts:14](next.config.ts#L14). *(5 min, but commit only when ready)*

---

## 🟡 P1 — First week after launch

Important for confidence and growth, but won't kill you on day 1.

### Anti-abuse + observability

- [ ] **Distributed rate-limiting via Upstash Redis.** The current [rate-limit.ts](src/lib/rate-limit.ts) is in-memory — useless on Vercel serverless where state resets on cold starts. Upstash has a generous free tier and a 5-line integration. Migrate the same keys (`register:ip`, `login:ip`, `forgot:email`, `reset:ip`). *(2 hr)*
- [ ] **CAPTCHA on register + forgot-password.** Cloudflare Turnstile (free, privacy-friendly, no Google brand). Stops scripted signups and the email-bombing path. *(1 hr)*
- [ ] **Email verification before first login.** Anyone can register `victim@example.com` today. Send a verification link via Resend, gate `/calendar` behind `emailVerified IS NOT NULL`. Reuse the `PasswordResetToken` pattern for the token model. *(3-4 hr)*
- [ ] **Uptime monitoring.** Better Stack or UptimeRobot, free. Ping `/api/auth/csrf` every 5 min, alert via email/Slack on 2 consecutive failures. *(20 min)*
- [ ] **Resend webhook → log delivery failures.** Today if Resend bounces an email you'll never know. Wire `https://laviestellaire.com/api/resend/webhook` to capture `email.bounced`, `email.complained`, `email.delivery_delayed`. *(45 min)*

### Email alerts you asked about

- [ ] **New-user signup alert.** Add a `notify(...)` call at the end of `/api/auth/register` that fires a Resend email to `you@laviestellaire.com` with the new user's email + signup time + IP. Cheap, immediate. *(20 min)*
- [ ] **Suspicious-activity alerts.** Wrap rate-limit denials and failed-login bursts: if a single IP trips >3 rate-limits in 10min, or >20 failed logins in 1hr, email yourself. Same `notify()` helper. *(1 hr after Upstash is in)*
- [ ] **Daily ops digest** (optional but nice): one email per morning with last 24h signups, login counts, error counts. Cron via Vercel Scheduled Functions (free tier: 2 cron jobs). *(1 hr)*

### DDoS / volumetric attack posture

You're already partly protected. Vercel sits behind their own anycast network that absorbs volumetric L3/L4 attacks automatically — you don't need Cloudflare in front for that. Real risks:

- **L7 application floods** (lots of valid-looking requests). The Upstash rate-limiter handles this once you've migrated off the in-memory limiter.
- **Credential stuffing.** Login rate-limit (P0 above) + email verification (P1 above) covers it.
- **Resource exhaustion via expensive endpoints.** `/api/import` accepts arbitrary `.ics` and parses on the server with `ical.js` — a 100MB file would chew up serverless memory.

- [ ] **Cap `/api/import` upload size.** Reject anything over 1MB (= ~10k events). Add a Zod check on `file.size` and return 413. *(15 min)*
- [ ] **Add Vercel Firewall rules** (Pro plan only — skip if you're on Hobby). Geo-block / IP allow-list / per-path limits. *(only if you upgrade)*

### Account lifecycle

- [ ] **Account deletion UI.** Users have to be able to delete their own account (GDPR Article 17, CCPA right to delete). Settings page → "Delete account" button → confirmation → `prisma.user.delete(...)` (events cascade). *(2 hr)*
- [ ] **Data export.** "Download my data" button → returns a JSON dump of their events. Trivial since the iCal export already exists. *(1 hr)*
- [ ] **Reconcile [auth.config.ts](src/auth.config.ts) with [middleware.ts](src/middleware.ts).** Both have route-protection logic and they're slightly different (auth.config returns `Response.redirect`, middleware uses `NextResponse.redirect`). Pick one source of truth. Middleware is the right home; thin auth.config. *(30 min)*

---

## 🔵 P2 — First month after launch

Quality-of-life and growth, not blocking. Do once the above is stable.

### Security depth

- [ ] **2FA / TOTP** via `otplib`. Optional for users initially, required for admins. *(1 day)*
- [ ] **Session config audit.** NextAuth defaults to 30-day JWT. Decide if you want shorter (e.g. 14 days), idle timeout, "remember me" toggle. *(30 min decision + small code change)*
- [ ] **Have I Been Pwned** integration on register/reset — reject passwords found in known breaches. `zxcvbn` for strength meter. *(2 hr)*
- [ ] **OAuth providers** (Google / Apple). Friction-killing for new signups, also dodges the password-policy debate entirely for those users. *(half day each)*
- [ ] **Admin role + admin dashboard.** A `User.role` enum (`user | admin`), gate a `/admin` route by it. Lets you read recent signups, ban a user, etc. without `psql`-ing into Supabase. *(1 day)*

### UI / UX

- [ ] **Loading + error states audit.** Walk every form (login, register, forgot, reset, event create, import) — are pending states clear? Are server errors surfaced in human English, not raw JSON? *(half day)*
- [ ] **Accessibility pass.** Run axe DevTools, fix contrast / keyboard nav / aria-label gaps. Especially the calendar grid keyboard navigation. *(1 day)*
- [ ] **Mobile testing matrix.** Beyond responsive CSS — actually use Safari iOS, Chrome Android, on small screens, with one-handed thumb reach in mind. *(half day)*
- [ ] **Empty states + onboarding hint.** First time a user lands on `/calendar`, they see an empty grid. Add a "Welcome → try adding an event or importing your calendar" overlay that dismisses on first interaction. *(2 hr)*
- [ ] **Cool landing tweaks.** The marketing page is already strong (per README changelog) — add a public demo screenshot, social-proof line ("100+ users"), and a single visible "Get Started" CTA above the fold. *(half day)*

### Growth

- [ ] **Analytics.** Vercel Analytics (free, privacy-friendly) or Plausible ($9/mo, no cookie banner needed). Track signup conversion, weekly active users, calendar usage. *(20 min)*
- [ ] **Resend domain warm-up.** First 50-100 emails from a new domain often land in spam. Send a slow ramp (10/day for a week) before any blast. Resend has a guide. *(awareness, no code)*
- [ ] **SEO basics.** `og:` meta tags, `sitemap.ts` ([Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)), structured data for the landing page. *(2 hr)*

---

## 📚 User-facing documentation

Replaces and consolidates `chats/calendar-instructions.md`, `chats/login-instructions.md`, `chats/import-instructions.md`. New location: [docs/USER_GUIDE.md](docs/USER_GUIDE.md). Link to it from the `/about` page and from the empty-state on `/calendar`.

- [ ] Wire a "Help" link in the header → `/about` (or a new `/help` page rendering the guide).
- [ ] Add a "What's new" / changelog page so users can see ongoing improvements.

---

## 🧰 Tools to sign up for

All have free tiers that cover hundreds of users:

| Tool | Purpose | Tier you need | Setup time |
|---|---|---|---|
| **Sentry** | Error tracking | Free (5k errors/mo) | 45 min |
| **Upstash Redis** | Rate limiting | Free (10k commands/day) | 30 min |
| **Cloudflare Turnstile** | CAPTCHA | Free | 30 min |
| **Better Stack** or **UptimeRobot** | Uptime ping | Free (10 monitors) | 20 min |
| **Vercel Analytics** | Traffic / web vitals | Free with Hobby plan | 5 min |
| **Resend** | Transactional email | Free (100/day, 3k/mo) | ✅ done |
| **Supabase** | Postgres + auth | Free → Pro ($25/mo) for PITR backups | Already in |

Total monthly cost at "hundreds of users" scale: **$0** on free tiers; **~$25/mo** once you upgrade Supabase for backups; **~$45/mo** if you also add Vercel Pro for Firewall + analytics retention.

---

## 🗓️ Realistic rollout schedule

A pragmatic week-by-week, assuming this is a side project (~10 hr/week).

### Week 1 — Lock the doors
Patch CVEs · raise password floor · login rate-limit · email enumeration fix · Sentry · privacy policy · DMARC reporting. **Outcome:** safe to share with friends/family for closed beta.

### Week 2 — Move to "I trust this in prod"
Migrations · Upstash · CAPTCHA · email verification · uptime monitor · new-user alert email · suspicious-activity alerts · import size cap. **Outcome:** safe to put on a social post.

### Week 3 — Operational confidence
Resend webhook · account delete + data export · admin role + dashboard · auth.config / middleware reconciliation. **Outcome:** can handle real customer support without DB diving.

### Week 4 — Growth + polish
Analytics · UX audit · landing CTA · onboarding overlay · changelog page · SEO meta · `/help` page link. **Outcome:** ready for organic growth.

After that, P2 backlog as time allows.

---

## 📁 Doc cleanup

- ✅ `chats/scaling_plan.md` — superseded by this file and the README changelog (every item is done). **Archive or delete.**
- ✅ `chats/calendar-instructions.md`, `login-instructions.md`, `import-instructions.md` — merged into [docs/USER_GUIDE.md](docs/USER_GUIDE.md). **Delete originals.**
- ✅ `README.md` — keep as-is. Tier 1/2 sections are done, Tier 3 still useful as a feature roadmap. The poem stays for morale.
- ✅ `.agents/rules/only-use-cmd.md` — unrelated meta-rule, leave alone.
