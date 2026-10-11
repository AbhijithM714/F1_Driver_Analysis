# Production Deployment Guide

This guide covers deploying the **Formula 1 Race Analytics Platform (v1.0.0)** to **Vercel**, **Netlify**, or **Docker**.

---

## 1. Environment Variables

Configure the following environment variables in your hosting provider (or `.env.local` for local production builds):

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `Formula 1 Race Analytics Platform` | Server application title |
| `APP_VERSION` | `1.0.0` | Release version tag |
| `NEXT_PUBLIC_BASE_URL` | `https://f1-race-analytics.vercel.app` | Canonical public URL used for SEO, OpenGraph, and Sitemap |
| `NEXT_PUBLIC_API_URL` | `/api` | Base path for client API requests |
| `DATA_DIRECTORY` | `data` | Directory containing CSV and GeoJSON datasets |
| `NEXT_PUBLIC_AUTHOR_NAME` | `Abhijith` | Author attribution in Footer and metadata |
| `NEXT_PUBLIC_GITHUB_URL` | `https://github.com/abhijith/f1-race-analytics-platform` | Public GitHub repository link |
| `NEXT_PUBLIC_LIVE_DEMO_URL` | `https://f1-race-analytics.vercel.app` | Public live demo link |

---

## 2. Deploying to Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Vercel automatically detects `vercel.json` and Next.js 14:
   - **Install Command**: `npm install`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variables from `.env.example` and click **Deploy**.

---

## 3. Deploying with Docker & Docker Compose

### Using Docker Compose
```bash
docker compose up -d --build
```
The platform will be available at `http://localhost:3000`. The `./data` folder is mounted read-only into `/app/data`.

### Using Standalone Docker
```bash
docker build -t f1-race-analytics:1.0.0 .
docker run -p 3000:3000 -e NEXT_PUBLIC_BASE_URL=http://localhost:3000 f1-race-analytics:1.0.0
```

---

## 4. Deploying to Netlify

1. Connect the GitHub repository to Netlify.
2. Netlify reads `netlify.toml` automatically:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Node Version**: `20`

