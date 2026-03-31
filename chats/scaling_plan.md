# Scaling Plan for Scheduler Application

## Goal
Scale the existing scheduler application to a fully functioning multi-user calendar system with data isolation, authentication, and external calendar import capabilities.

## 1. Authentication & User Management
**Objective:** Secure user creation and login, completely independent of third-party providers (Google/Apple), ensuring data privacy.

-   **Tech Stack:** `next-auth` (v5 / Auth.js) with generic Credentials Provider.
-   **Security:** `bcryptjs` for password hashing.
-   **Database Schema:**
    -   Create `User` model.
    -   Fields: `id`, `email` (unique), `password` (hashed), `name`, `createdAt`.

**Implementation Steps:**
1.  Install dependencies: `npm install next-auth bcryptjs`
2.  Update `prisma/schema.prisma` to include `User`.
3.  Create API route for Registration (`/api/auth/register`).
4.  Configure NextAuth with Credentials Provider.
5.  Create Sign Up and Sign In pages.

## 2. Calendar Data Model
**Objective:** Structure the database to support standard calendar events and complex schedules, linked to specific users.

-   **Database Schema:**
    -   Create `Event` model.
    -   Fields: `id`, `userId` (relation), `title`, `description`, `startDate`, `endDate`, `allDay` (bool), `location`.
    -   Create `Calendar` model (optional, for multiple calendars per user) or just default to main.
    -   *Migration Strategy:* Decide whether to keep existing `DaySchedule`/`TimeSlot` models or migrate them to `Event`. Given the request for "Import", a standard `Event` model is better.

## 3. UI/UX: Calendar Views
**Objective:** granular navigation through time as requested ("Tabs for weeks", "Tabs for months").

-   **Structure:**
    -   **Month Tabs:** A navigation bar or tab system to switch between months (Jan, Feb, ...).
    -   **Week Tabs:** Within a month view, tabs or toggles to switch between specific weeks (Week 1, Week 2, ...).
-   **Views:**
    -   **Month View:** Grid showing the whole month.
    -   **Week View:** Time-grid showing specific days of the selected week.
    -   **Day View**: Detailed hourly breakdown.

## 4. Import Functionality
**Objective:** Allow users to move data from Google/Apple by importing ICS files, without linking accounts.

-   **Tech Stack:** `ical.js` or `node-ical` for parsing.
-   **Workflow:**
    1.  User clicks "Import Calendar".
    2.  Uploads `.ics` file.
    3.  Server parses file.
    4.  Bulk creates `Event` records for the current user.
    5.  Feedback toast ("Successfully imported X events").

## 5. Deployment & Scaling
-   Ensure Database (SQLite for dev) is ready for Postgres/MySQL if needed for "scale" later, but start with SQLite for local ease.
-   Optimize queries to fetch only current month/week data.

---

## Action Plan (step-by-step)

1.  **Setup Auth**:
    -   Modify `schema.prisma`.
    -   Implement Auth logic.
2.  **Setup Calendar Core**:
    -   Create `Event` model.
    -   Build CRUD API for events.
3.  **Build UI**:
    -   Create Main Layout with Month/Week navigation.
    -   Implement Month Grid.
    -   Implement Week/Day Grid.
4.  **Implement Import**:
    -   Add file upload component.
    -   Implement parsing logic.
