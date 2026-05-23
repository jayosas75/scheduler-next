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

### 🟢 Tier 1 — Quick Wins (low risk, high impact)

✅ **All cleared** — see the Completed section below.

### 🟡 Tier 2 — High Priority (core functionality & security, worth the extra care)

✅ **All cleared** — see the Completed section below.

### 🔵 Tier 3 — Larger Features (higher effort/risk, schedule deliberately)

- [ ] **Monthly View**: Add a month-grid (31-day) calendar view alongside the existing week/daily view. Triggered by the **"31 Days"** toggle already placed in the legend bar ([legend.tsx](src/components/legend.tsx)), which is currently a no-op placeholder.
- [ ] **Social Sharing**: Generate "Day at a Glance" images for social media (pairs with the share-links fix in Tier 1).
- [ ] **AI Netrunner Assistant**: A natural-language command bar to create, shift, or optimize schedules from text requests.
- [ ] **Offline Mode**: Full PWA support for offline scheduling.

### ✅ Completed

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
