# 🌌 Scheduler // 2026

A high-performance, mobile-first, cyberpunk-themed calendar application. Built for the neon-drenched streets of the future, optimized for the devices of today.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom Cyberpunk design system
- **Database**: [Prisma](https://www.prisma.io/) with SQLite
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

- [ ] **Drag & Drop**: Implement intuitive event rescheduling by dragging.
- [x] **Recurring Events**: Add support for daily/weekly/monthly routines.
- [x] **Data Export**: Export schedule to iCal or PDF format (iCal implemented).
- [ ] **Social Sharing**: Generate "Day at a Glance" images for social media.
- [ ] **Offline Mode**: Full PWA support for offline scheduling.
- [ ] **Voice Interface**: Add voice commands for hands-free entry.

## 🧪 Testing

Run our custom color-scheme and design system validation:
```bash
node __tests__/color-scheme.test.js
```
