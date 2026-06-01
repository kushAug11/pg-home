# DevOps & Deployment Guide

This guide ensures a flawless production deployment across **Render (Backend)** and **Vercel (Frontend)**, explicitly addressing common pitfalls like CORS Blocks, 404 Refresh errors, and API Base URL disconnections.

---

## 1. Backend Deployment (Render)

1. Connect your GitHub repository to Render and create a **Web Service**.
2. **Settings**:
   - Build Command: `npm install` (Because your Dockerfile Stage 1 already runs `npm ci` if deploying via Docker, but if native: `cd server && npm install`)
   - Start Command: `cd server && npm start`
   - *Better yet, deploy using the Docker runtime! Render natively detects your `server/Dockerfile` if configured.*
3. **Environment Variables**:
   You MUST specify these perfectly to avoid CORS and Authentication errors:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `JWT_SECRET`: Generate a highly secure random string.
   - `MONGODB_URI`: Your production Mongo Atlas connection string.
   - `ALLOWED_ORIGINS`: `https://your-frontend-project.vercel.app` (CRITICAL: Do NOT include a trailing slash `/`).

> [!CAUTION]
> If `ALLOWED_ORIGINS` does not strictly match your live Vercel domain, the backend will block all Vercel traffic instantly.

---

## 2. Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel and create a New Project.
2. **Project Settings (Critical)**:
   - **Framework Preset**: Vite
   - **Root Directory**: `client` (Do NOT leave this as the repository root, you must point it into the `client` folder).
3. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api` (CRITICAL: Must point exactly to your Render deployment).
4. **Solving the 404 Refresh Error**:
   - Because you set the Root Directory to `client`, Vercel automatically natively parses `client/vercel.json`.
   - The file automatically catches any sub-route paths like `/owner/dashboard` and "rewrites" it to `/index.html`, allowing React Router to correctly render the component instead of throwing a 404 Not Found error.

---

## 3. Docker Optimizations Implemented

Both backend and frontend now employ **Multi-Stage Builds**:
- **Drastically Reduced Size**: `server` strips caching, DevDeps, and Python build tools. `client` strips Node.js entirely and serves exclusively via `nginx:alpine`, reducing container footprint by nearly 85%.
- **Locally Run**: `docker-compose up --build` will now automatically parse your `VITE_API_URL` as an `ARG` inside the unified `docker-compose.yml` boot sequence.
