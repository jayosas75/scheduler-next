# Scheduler // 2026 — User Guide

Everything you need to sign in, schedule your week, and bring in your existing events. Consolidated from the older `chats/*-instructions.md` files.

---

## 🔐 Getting in

### Create an account
1. Visit the login page — you'll see a **"Create Account"** link at the bottom.
2. Enter your name, email, and a password (8+ characters).
3. Submit → you're signed in and dropped at your empty calendar.

### Sign in
1. Go to the site — if you're not logged in, you're auto-redirected to `/login`.
2. Enter your email + password → click **⊕ LOG IN**.
3. You land on your calendar.

### Forgot password
1. On the login page, click **"Forgot password?"**.
2. Enter your email → check your inbox (and spam folder) for a reset link from `noreply@laviestellaire.com`.
3. The link is good for 1 hour. Click it, enter a new password, and you'll be signed in.
4. Out of caution, the site shows the same neutral message whether or not your email is on file — so don't worry if you don't get one immediately on a typo.

### Sign out
The **⊗ SIGN OUT** button in the header ends your session.

---

## 📅 Using the calendar

### Navigating time
- **← / →** arrows at the top — jump between weeks. The current week's date range is always shown in the header.
- **Day tabs** (Sun, Mon, Tue…) — click any tab to focus that day. The selected tab highlights in your active accent color; each weekday has its own.
- **Flip-clock display** — shows the active week visually.

### Viewing a day
- Hours are laid out vertically as time slots.
- The **current hour** has a live progress bar so you can see how far through it you are.
- Each event shows its **title**, optional **description**, and optional **location** (📍).
- Empty hours show *"No events"* in muted text.

### Adding + editing events
- Click an empty hour to add an event there.
- Click an existing event to edit its title, description, time, location, or category.
- **Drag and drop** an event onto a different hour or day to reschedule.
- **Recurring events** — set `daily`, `weekly`, or `monthly` recurrence with an optional end date.
- **Segments** — break a single hour into multiple labeled blocks (e.g. *"Work 45m / Break 15m"*) inside the segments modal.

### Categories + colors
Pick a category for each event — the color flows through into the calendar so you can read the week at a glance. Categories: work, personal, health, social, learning, misc.

### Themes
Hit the **palette** icon in the header to switch accent colors: Cyber Cyan, Matrix Green, Tokyo Pink, Cyberpunk Yellow, Synth Purple, Blood Orange, Glow White, or **Auto** (which tracks the active weekday's color).

### Sound effects
The header has a 🔊 / 🔇 toggle. Sounds are synthesized at runtime — no asset downloads. Your preference is remembered in `localStorage`.

### Exporting
- Header **Export** link → downloads an iCal (`.ics`) file with **every event in every week**.
- Drop the file into Apple Calendar, Google Calendar, Outlook, etc.

---

## 📥 Importing from another calendar

### Step 1 — Export from your existing calendar

**Google Calendar**
1. Open Google Calendar (desktop, not mobile).
2. Settings (⚙) → **Settings** → **Import & Export** in the left sidebar.
3. Click **Export** → download the `.zip`.
4. Unzip → grab the `.ics` file (one per calendar).

**Apple Calendar (Mac)**
1. Open the Calendar app.
2. Select the calendar in the sidebar.
3. **File → Export → Export…** → save the `.ics`.

**Outlook**
1. **File → Save Calendar**.
2. Choose **iCalendar Format (.ics)** → save.

### Step 2 — Upload to Scheduler
1. Click **Import** in the header (or go to `/import`).
2. Click the upload zone or drag your `.ics` file onto it.
3. File name + size shows once selected.
4. Click **⊕ IMPORT CALENDAR**.
5. Within a few seconds you'll see *"Successfully imported X events"*.

### Notes
- **Only `.ics` files** are supported.
- **Max size:** 1MB (≈10,000 events) — exports larger than that should be split.
- **Duplicates** are skipped automatically.
- **No account linking** — your Google/Apple credentials are never asked for or stored.
- **Your data stays here.** Imported events live in our Supabase Postgres, scoped to your account.

---

## 🛟 Troubleshooting

| Problem | What to try |
|---|---|
| *"Invalid credentials"* on login | Confirm email + password. Use **Forgot password?** if unsure. |
| Password reset email never arrives | Check spam. Wait 1 minute. Try again — the same email shows the same neutral message whether or not it's registered, so a typo silently fails. |
| Imported events don't appear | Make sure the week range you're viewing actually contains them — use the ◄ / ► nav. |
| Import fails | Verify the file is valid `.ics` (open in a text editor; should start with `BEGIN:VCALENDAR`). |
| Can't drag-and-drop | Mobile drag uses long-press; desktop is click-and-hold. |
| Drag/drop is laggy | Refresh the page — heavy weeks can briefly slow re-render. |
| Stuck somewhere weird | Sign out → sign back in. Worst case, clear cookies for the site. |

If something's broken or confusing in a way this guide doesn't cover, email **support@laviestellaire.com** and we'll dig in.

---

## 🔒 Your data, your privacy

- Passwords are hashed with bcrypt (never stored in plain text).
- Sessions use signed JWT cookies.
- The database has Row Level Security enabled.
- The reset-password link is a one-time, 1-hour token; we never see your raw token, only a SHA-256 hash.
- We don't link to Google/Apple Calendar APIs — your calendar data is yours.
- You can delete your account at any time (Settings → Delete account, coming soon — until it ships, email us).
