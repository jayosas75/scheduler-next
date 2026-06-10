# 🌌 Scheduler // 2026

A high-performance, mobile-first, cyberpunk-themed calendar application. Built for the neon-drenched streets of the future, optimized for the devices of today.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom Cyberpunk design system
- **Database**: [Prisma](https://www.prisma.io/) with SQLite (local dev) and PostgreSQL/Supabase (production)
- **Authentication**: [NextAuth.js v5 Beta](https://authjs.dev/) (Credentials Provider)
- **Validation**: [Zod](https://zod.dev/)
- **Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Calendar Parsing**: [ical.js](https://github.com/kewisch/ical.js)

## 🚀 Getting Started

Follow these steps to jack into the matrix:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   Initialize your local SQLite database and run migrations:
   ```bash
   npx prisma migrate dev
   ```

3. **Environment Variables**
   Create a `.env` file in the root:
   ```env
   AUTH_SECRET="your-super-secret-key-here"
   DATABASE_URL="file:./dev.db"
   ```

4. **Boot Up**
   Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to view the app.

## 🗄️ Database Management

To view and edit your database entries directly, run:
```bash
npx prisma studio
```
This will open a local interface at [http://localhost:5555](http://localhost:5555).

## 🌐 Production Deployment (Supabase & Vercel)

To deploy the scheduler to a live production environment on Vercel with a Supabase PostgreSQL database:

1. **Prisma Configuration**
   The production database provider is set to PostgreSQL. Verify that [schema.prisma](file:///c:/Users/jayos/Documents/Projects/scheduler-next/prisma/schema.prisma) uses `provider = "postgresql"`.

2. **Configure Vercel Environment Variables**
   Add the following environment variables in your Vercel project Settings:
   - `AUTH_SECRET`: A long secure secret key used by NextAuth to sign tokens (e.g. `super-secret-random-key-change-me`).
   - `DATABASE_URL`: Your Supabase **Transaction Pooler** connection string (port `6543`), ending with `?pgbouncer=true`.
   - `DIRECT_URL`: Your Supabase **Direct Connection** string (port `5432`).

3. **Deploy & Push Database Schema**
   To create the tables in your production Supabase database, run the following command from the root of the project:
   ```bash
   npx prisma db push
   ```

---

## ☕ The Chronicler's Brew

> [!NOTE]
> *A poem for the caffeine-fueled DM...*

In the halls of Winterfell, where the winter is near,  
The Maester grinds beans, dispelling his fear.  
Not a Raven he sends, nor a dragon he calls,  
Just a double-shot latte within the stone walls.

"Roll for Initiative!" the Night King might cry,  
But my AeroPress coffee is the reason I fly.  
With a +5 to Focus and a d20 of hope,  
I schedule my battles and learn how to cope.

The Iron Throne sits, cold and jagged and mean,  
But my cup is quite warm, and my calendar's clean.  
From the Wall to the Reach, the appointments appear,  
Synced by the Chronos... the end is not here!

```text
         _______
        |       |
        |  ☕   |___
        |       |   |
        |_______|___|
    [ SYSTEM: STIMULANT LOADED ]
    [ STATUS: WINTER IS BREWING ]
```

---

## 📅 Roadmap / TODO

Ordered by **risk vs. priority** — safe, high-impact quick wins first; larger or riskier work later.

### 🔴 Tier 0 — Public Launch Plan (#1 priority — blocks going public)

The prioritized pre-launch checklist (P0 / P1 / P2 tiers, weekly rollout, tool list, cost table) lives in its own file so it stays scannable:

📄 **[LAUNCH.md](LAUNCH.md)** — full plan, updated as items ship.

**The P0 headlines** (must clear before the public link goes out):
1. Patch Next.js + PostCSS CVEs (`npm audit fix --force`)
2. Raise password floor 6 → 8 chars, reject obvious garbage
3. Rate-limit the login path (only register/forgot/reset are throttled today)
4. Stop leaking which emails are registered on `/api/auth/register`
5. Sentry + uptime monitor + Supabase backup tier confirmation
6. Adopt `prisma migrate` (no more silent schema drift)
7. Privacy policy + ToS + DMARC reporting

**P1 (week 1)** covers Upstash rate-limit, CAPTCHA, email verification, the new-user / suspicious-activity email alerts, account deletion, and the `/api/import` size cap. **P2 (first month)** covers 2FA, OAuth, admin role, a11y, analytics, SEO.

---

### 🟢 Tier 1 — Quick Wins (low risk, high impact)

✅ **All cleared** — see the Completed section below.

### 🟡 Tier 2 — High Priority (core functionality & security, worth the extra care)

✅ **All cleared** — see the Completed section below.

### 🔵 Tier 3 — Larger Features (higher effort/risk, schedule deliberately)

- [ ] **Finalize Week View**: Polish and complete the day/week view ([daily-view.tsx](src/components/daily-view.tsx)) before transferring its logic to the month view. Subitems below are ordered roughly by dependency.

  - [ ] **Rework Segments Display**: Today an hour's segments collapse into one joined text label (e.g. `"Work (45m) / Break (15m)"`) with a thin left gradient strip ([daily-view.tsx](src/components/daily-view.tsx) ~L633-648). Rework into proportional, category-colored blocks within the hour row so each segment's share of the hour and its label read at a glance.

  - [ ] **Sticky Header**: The hours grid already scrolls in its own container, but the temporal-range nav and day-tab selector scroll away with the page. Pin the day tabs (and ideally the active-day context) to the top of the viewport so the user always knows which day they're editing while scrolling the schedule.

  - [ ] **Rework Segments Modal**: Redesign [segments-modal.tsx](src/components/segments-modal.tsx) — replace the stacked duration/category/label dropdown rows with a clearer visual timeline of the hour and more intuitive duration controls, smoothing the add/edit/remove flow.

  - [ ] **Inspiration Quote / Daily Fact**: Add a small rotating quote/daily-fact component sourced from a local list (CSP-safe, no external API), surfaced somewhere unobtrusive such as the legend bar or an empty-hours state, refreshing per day or per load.

  - [ ] **All-Day Events Strip** *(blocked — needs groundwork)*: There is no all-day concept yet; the `Event` model and `Segment` type are hour-bound (minute offsets 0-60). First introduce an `allDay` flag plus a way to create such events, then render them in a dedicated strip along the top border of the hours grid, separate from the timed slots.

  - [ ] **Login Security & Identity Protection**: Registration is IP rate-limited but the login path ([auth.ts](src/auth.ts)) has no brute-force protection and only a 6-char password minimum. Add login-attempt lockout/rate limiting and stronger password rules, and audit what user data API responses expose; optionally add email verification.

- [ ] **Monthly View**: Add a month-grid (31-day) calendar view alongside the existing week/daily view. Triggered by the **"31 Days"** toggle already placed in the legend bar ([legend.tsx](src/components/legend.tsx)), which is currently a no-op placeholder. Build on top of finalized week view logic.
- [ ] **Export Format Overhaul**: Harden the iCal (`.ics`) generation in [calendar.ts](src/lib/calendar.ts) (`generateICal`) so exports import seamlessly into **Apple Calendar (Mac/iOS)** and **Google Calendar (Android)** — spec-correct `VCALENDAR`/`VEVENT` structure, timezone handling (`VTIMEZONE`/`TZID` instead of naive local times), stable `UID` + `DTSTAMP`, 75-octet line folding, and full recurrence (`RRULE`) fidelity. Test round-trips on real Mac and Android calendar apps.
- [ ] **Social Sharing**: Generate "Day at a Glance" images for social media (pairs with the share-links fix in Tier 1).
- [ ] **AI Netrunner Assistant**: A natural-language command bar to create, shift, or optimize schedules from text requests.
- [ ] **Offline Mode**: Full PWA support for offline scheduling.

### ✅ Completed

- [x] **Temporal Range & Day-Color Refresh**: Old-school split-flap **flip-clock** week-date display ([flip-date.tsx](src/components/flip-date.tsx)) with a stacked `20`/`26` year card and equal card heights; **7 per-day tab colors** (one per weekday, incl. a Glow White); a new **Glow White** accent theme plus an **Auto** option that tracks the current weekday's color ([theme-switcher.tsx](src/components/theme-switcher.tsx), [globals.css](src/app/globals.css)); more legible mono time labels; and a centered nav bar whose Download icon became a labelled **Export** link with an explanatory tooltip ([daily-view.tsx](src/components/daily-view.tsx)).
- [x] **UI Sound Effects**: Retro-cyberpunk sounds synthesized at runtime via the Web Audio API ([sound.ts](src/lib/sound.ts)) — no asset files, offline-friendly, CSP-safe. Covers clicks, modal slide-ins, drag pickup/drop, save/delete/error, with an easily accessible global mute button ([sound-toggle.tsx](src/components/sound-toggle.tsx)) in the header, persisted to `localStorage`.
- [x] **Advanced Security & Anti-Abuse**: Best-effort in-memory rate limiting ([rate-limit.ts](src/lib/rate-limit.ts)) on account creation (`POST /api/auth/register`) and the credentials login callback; input sanitization of event title/description/location/segment labels and the register name ([sanitize.ts](src/lib/sanitize.ts)), plus RFC-5545 escaping of iCal export fields; and a production Content Security Policy with hardening headers ([next.config.ts](next.config.ts), CSP relaxed in dev for HMR, per-request nonce generated in [middleware.ts](src/middleware.ts) so the App Router's inline RSC scripts are trusted).
- [x] **Fix Week Navigation Data Loading**: `DailyView` now fetches the full event set on mount (`GET /api/events`) instead of only the server-seeded current week, so one-off events in any week appear when navigating ◄ / ► and **"Export All to iCal"** now covers every week.
- [x] **Retro Unique Visitor Counter**: Vintage 60s space-age odometer in the footer ([visitor-counter.tsx](src/components/visitor-counter.tsx)), backed by `/api/visitors` (`GlobalState`); counts unique browsers via a `localStorage` flag.
- [x] **Footer Cleanup**: Removed the fake `localStorage` "global likes" counter; replaced the dead TikTok/X/Instagram links with a native Web Share button (clipboard fallback on desktop); fixed the version label to `v1.3.0`.
- [x] **Legend "31 Days" Trigger**: Replaced the dead V-Sync/Grid toggles with a single **"31 Days"** control — a placeholder for the upcoming **Monthly View** (Tier 3).
- [x] **Removed Orphaned Scheduler Code**: Deleted the unused `SchedulerApp.tsx` and the unscoped `/api/schedule` route, closing a latent multi-user data-leak.
- [x] **Cool Landing Page**: Vibrant, premium landing page inspired by [Tricks Stickers](https://tricks-stickers.webflow.io/) — dynamic parallax, scroll-reveal, rhythm animations, bold typography.
- [x] **Neon Accents Customization**: Header palette picker with six themes (Cyber Cyan, Matrix Green, Tokyo Pink, Cyberpunk Yellow, Synth Purple, Blood Orange), persisted to `localStorage` and applied before paint (no flash).
- [x] **Get Deployment on Vercel Complete**: Resolved build errors and verified production environment.
- [x] **Drag & Drop**: Intuitive event rescheduling by dragging.
- [x] **Recurring Events**: Daily/weekly/monthly routines.
- [x] **Data Export**: Export schedule to iCal (PDF still open).
- [x] **Voice Interface**: Voice commands for hands-free entry.
- [x] **Live Hour Progress**: Real-time cyberpunk progress bar on the current hour slot.

## 🧪 Testing

Run our custom color-scheme and design system validation:
```bash
node __tests__/color-scheme.test.js
```

Run responsive layout and functional logic tests:
```bash
node __tests__/functional.test.js
```

Run drag & drop reschedule logic tests:
```bash
node __tests__/drag-drop.test.js
```

Run recurrence UI tests:
```bash
node __tests__/recurrence-ui.test.js
```

Run user creation logic tests:
```bash
node __tests__/user-creation.test.js
```
