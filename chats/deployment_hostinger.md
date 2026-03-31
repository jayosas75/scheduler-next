# 🚀 Deploying Next.js to Hostinger Shared Hosting

This guide covers how to deploy your Next.js application (**Scheduler // 2026**) to a Hostinger Shared Hosting plan.

Since you are using **Next.js** with **Prisma (SQLite)** and API routes, you cannot simply deploy a static HTML export. You need a Node.js runtime environment. Fortunately, Hostinger Shared Hosting supports Node.js apps.

---

## 📋 Prerequisites

1.  **Hostinger Plan**: A shared hosting plan that includes **Node.js** support (You need at least **Business Web Hosting**, or **Cloud Hosting** plans. **Note: Premium Web Hosting does NOT support Node.js**).
2.  **Access**: Access to your Hostinger **hPanel** and **SSH** (recommended) or **File Manager**.
3.  **Domain**: A domain or subdomain set up on Hostinger (e.g., `scheduler.yourdomain.com`).

---

## 🛠️ Step 1: Prepare Your Application

Before uploading, we need to ensure the app is ready for production.

1.  **Check `package.json`**: Ensure you have a `start` script.
    ```json
    "scripts": {
      "build": "next build",
      "start": "next start"
    }
    ```

2.  **Environment Variables**: Prepare your `.env` variables.
    *   **DATABASE_URL**: Since we use SQLite (`file:./dev.db`), this file will live on the server. Make sure the path is correct or just keep it relative.
    *   **AUTH_SECRET**: Generate a strong secret.

3.  **Prisma**: Ensure `prisma` is listed in `dependencies` (not just `devDependencies`) because we need to run the client on the server. (It is already correctly in `dependencies` in your project).

---

## ☁️ Step 2: Setup Node.js in hPanel

1.  Log in to **Hostinger hPanel**.
2.  Go to **Websites** -> **Manage** (for your chosen domain).
3.  Find the **Advanced** section and click on **Node.js**.
4.  **Create Application**:
    *   **Node.js Version**: Select **v18** or **v20** (Recommended: v20 if available, matches our local dev best).
    *   **Application Mode**: **Production**.
    *   **Application Root**: `public_html/scheduler` (or just `scheduler` outside public_html if you prefer security, but `public_html` is easier for first-timers). Let's assume you put it in a folder named `scheduler` in your root.
    *   **Application URL**: Select your domain.
    *   **Application Startup File**: `server.js` (We will create this later).
5.  Click **Create**.

---

## 📦 Step 3: Custom Server Entry Point

Hostinger's Passenger runner often works best with a custom `server.js` to boot Next.js. Create a file named `server.js` in your **local project root**:

```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```
*Note: This is a standard Next.js custom server example.*

---

## 📤 Step 4: Build and Upload

You have two options: **Build Locally** (Faster upload) or **Build on Server** (Requires SSH/RAM). We recommend **Building Locally**.

1.  **Build Locally**:
    ```bash
    npm run build
    ```
    This creates a `.next` folder.

2.  **Zip Your Files**:
    Select the following files/folders and zip them into `scheduler.zip`:
    *   `.next` (Folder - The build output)
    *   `public` (Folder - Static assets)
    *   `prisma` (Folder - Database schema)
    *   `.env` (Make sure this has production values!)
    *   `package.json`
    *   `server.js` (The file we created above)
    *   `next.config.mjs` (or .js)

    *Note: Do NOT upload `node_modules`. We will install them on the server.*

3.  **Upload to Hostinger**:
    *   Go to **File Manager** in hPanel.
    *   Navigate to the **Application Root** folder you defined in Step 2 (e.g., `scheduler`).
    *   Upload `scheduler.zip`.
    *   Right-click and **Extract**.

---

## 🔧 Step 5: Install Dependencies & Start

1.  Go back to the **Node.js** section in hPanel.
2.  You should see a button labeled **NPM Install**.
    *   Click it. This will look at your `package.json` and install dependencies into a `node_modules` folder on the server.
    *   *Note: This might take a few minutes.*
3.  **Database Setup (Important)**:
    Since we use SQLite, we need to ensure the DB file exists and schema is pushed.
    *   If you uploaded your local `dev.db` inside `prisma` folder (not recommended for production but easy for shared hosting), it might work.
    *   **Better Way via SSH**:
        1.  Enable SSH Access in hPanel.
        2.  Connect: `ssh u123456789@your-ip`.
        3.  `cd` to your app folder.
        4.  Run: `npx prisma migrate deploy` (This updates the DB schema).
        5.  Run: `npx prisma generate` (Updates the client).

4.  **Start the App**:
    In the Node.js section of hPanel, click **Restart**.

---

## ⚠️ Troubleshooting Common Issues

*   **500 Internal Server Error**:
    *   Check **stderr.log** in your application folder/logs.
    *   Often caused by missing dependencies or wrong Node version.
*   **"App Not Started"**:
    *   Ensure `server.js` is set as the startup file in hPanel settings.
*   **Database Locked/Error**:
    *   SQLite on shared hosting can sometimes be tricky with file permissions. Ensure the user (`u123...`) has read/write permission to the `dev.db` file and the folder containing it.
    *   If SQLite causes persistent issues due to file locking on shared drives, consider switching `DATABASE_URL` to use a **MySQL** database (Hostinger provides these for free). You would update `.env`, change `provider = "sqlite"` to `"mysql"` in `schema.prisma`, and re-run migrations.

---

## 🔄 Updating in the Future

1.  Make changes locally.
2.  `npm run build`.
3.  Zip `.next`, `public`, `package.json`.
4.  Upload and overwrite on server.
5.  Click **Restart** in hPanel.
