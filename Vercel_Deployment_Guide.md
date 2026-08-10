# 🚀 Vercel Production Deployment Guide

Deploying your Shopify App to Vercel is a fantastic choice for production. Because Vercel is a "Serverless" environment (meaning it spins up and down instantly and has no local hard drive), **we cannot use the temporary SQLite database** we used for local testing. 

I have automatically switched your codebase back to **MySQL** as you originally requested!

Follow these exact steps to get your CRM live on Vercel:

## Step 1: Prepare your MySQL Database
Since Vercel doesn't host databases, you need a cloud MySQL database.
1. Create a free MySQL database on a provider like **[Aiven](https://aiven.io/)**, **[PlanetScale](https://planetscale.com/)**, or **[TiDB](https://en.pingcap.com/)**.
2. Copy the connection string (it will look something like `mysql://user:password@host:3306/dbname`).

## Step 2: Push your Code to GitHub
Vercel deploys directly from your GitHub repository.
1. Open your terminal in VS Code.
2. Run these commands to commit and push your code:
   ```bash
   git add .
   git commit -m "Ready for production on Vercel"
   git push origin main
   ```

## Step 3: Deploy to Vercel
1. Go to **[Vercel.com](https://vercel.com/)** and click **Add New Project**.
2. Import the GitHub repository for your Shopify app.
3. Open the **Environment Variables** section before clicking deploy, and add the following:
   - `SHOPIFY_API_KEY`: (Get this from your Shopify Partner Dashboard -> Client ID)
   - `SHOPIFY_API_SECRET`: (Get this from your Shopify Partner Dashboard -> Client Secret)
   - `SCOPES`: `write_customers,read_customers,write_orders,read_orders`
   - `DATABASE_URL`: (Paste your MySQL connection string from Step 1)
4. Click **Deploy**. Vercel will automatically detect Remix, build the app, and give you a live URL (e.g., `https://my-whatsapp-crm.vercel.app`).

## Step 4: Run Database Migrations in Production
Once deployed, Vercel needs to build your database schema on your remote MySQL server.
1. In your Vercel Dashboard, go to your project.
2. Go to **Settings** -> **Build & Development Settings**.
3. Change the **Build Command** to:
   ```bash
   npx prisma generate && npx prisma db push && remix vite:build
   ```
   *(This ensures every time you deploy, your database is kept in sync!)*
4. Trigger a new deployment to run this build command.

## Step 5: Update Shopify Partner Dashboard
Now that your app is live, you must tell Shopify where it lives!
1. Go to your **[Shopify Partner Dashboard](https://partners.shopify.com)**.
2. Click on **Apps** -> **crm** -> **Configuration**.
3. Under **URLs**, change the **App URL** to your Vercel URL: `https://my-whatsapp-crm.vercel.app`
4. Under **Allowed redirection URL(s)**, add:
   - `https://my-whatsapp-crm.vercel.app/auth/callback`
   - `https://my-whatsapp-crm.vercel.app/auth/shopify/callback`
   - `https://my-whatsapp-crm.vercel.app/api/auth/callback`
5. Click **Save and Release**.

> [!SUCCESS]
> **You're Done!**
> Go to your development store, find the app, and open it. It will now securely load your Vercel production server inside the Shopify admin!
