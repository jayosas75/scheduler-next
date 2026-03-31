# 🚀 Deployment Guide: Hostinger

Deploying a Next.js application with Prisma and NextAuth to Hostinger requires a few specific steps depending on your hosting plan.

## 1. Hosting Type Recommendation

### VPS Hosting (Highly Recommended)
- **Why**: Gives you full control over the server. You can install Node.js, PM2 (process manager), and manage the database easily.
- **Next.js Integration**: Works perfectly with `npm start` and PM2 to keep the app running 24/7.

### Shared/Web Hosting
- **Why**: Cheaper, but more restrictive.
- **Limitations**: You may have trouble running the Next.js server directly. You might needs to export to a "Static Site" (`output: 'export'`), but this **breaks NextAuth and Prisma** (which require a server).
- **Recommendation**: If using Shared hosting, use their "Node.js" selector if available, or upgrade to a VPS for this specific app.

---

## 2. Pre-Deployment Checklist

### Environment Variables
In your Hostinger Panel (or via SSH), set the following:
```env
AUTH_SECRET="your-super-secret-key"
DATABASE_URL="file:./dev.db" # If using SQLite
# Or if using MariaDB/MySQL on Hostinger:
# DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

### NextAuth Configuration
Ensure `AUTH_URL` is set to your actual domain:
```env
AUTH_URL="https://yourdomain.com"
```

---

## 3. SSH Deployment Steps (VPS)

1. **Connect to your VPS**:
   ```bash
   ssh root@your_vps_ip
   ```

2. **Clone and Install**:
   ```bash
   git clone [your-repo-url]
   cd scheduler-next
   npm install
   ```

3. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Build the App**:
   ```bash
   npm run build
   ```

5. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "scheduler" -- start
   pm2 save
   pm2 startup
   ```

---

## 4. Hostinger Specific Tips

- **Node.js Version**: Ensure the Node.js version on the server matches your local version (v18+ recommended).
- **SQLite Permissions**: If using SQLite, ensure the `prisma` folder and `dev.db` have write permissions for the Node.js user.
- **Port Mapping**: Hostinger's Node.js selector usually maps to a specific port. If using a VPS, you might need to use a Reverse Proxy (Nginx) to map Port 80/443 to Port 3000.
