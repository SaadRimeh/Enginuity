# Backend — Enginuity

A concise, production-oriented README for the backend API powering the Admin Dashboard and app.

---

## Overview

This repository contains the backend for the XcodeFullStack project. It exposes REST endpoints mounted under `/api` (e.g. `/api/users`, `/api/posts`, `/api/comments`, `/api/notifications`) and a static admin dashboard UI (`index.html`) used for moderation and reporting.

Key features
- User management and Clerk sync
- Posts, comments and reporting flows
- Admin routes for moderation (delete post, ban user)
- Cloudinary integration for image uploads
- Simple dashboard endpoint returning counts, reported posts, time-series and light analysis

---

## Quick start (development)

1. Copy the example env file and fill the values:

```powershell
Copy-Item .env.example .env
# then open .env and fill values for MONGO_URI, CLOUDINARY_*, CLERK_*, etc.
```

2. Install dependencies:

```powershell
npm install
```

3. Start the development server (uses nodemon/your dev script):

```powershell
npm run dev
# or if your package.json uses 'start:dev' or similar:
# npm start dev
```

4. Open the admin UI:

```powershell
Start-Process "index.html"
```

> Note: make sure your backend `API_BASE` matches the address where your server runs (default: `http://localhost:5001/api`) — this value appears in `index.html` for the static admin UI.

---

## Environment variables

The backend reads environment variables from `process.env` (and `./src/config/env.js`). A `.env.example` is included with the common variables. Important variables:

- `PORT` — server port (default commonly `5001`)
- `MONGO_URI` — MongoDB connection string
- `NODE_ENV` — `development` or `production`
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk authentication keys (if used)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Cloudinary credentials for uploading images
- `ARCJET_KEY` — optional

If Cloudinary keys are not set, the app will start but cloudinary uploads will fail with a clear error message (see troubleshooting).

---

## Important files & layout

- `index.html` — static admin dashboard UI (in project root). Edit `API_BASE` in this file to point the UI at the running backend.
- `src/server.js` — Express app entry; routes are mounted under `/api/*`.
- `src/routes/` — route definitions for users, posts, comments, notifications.
- `src/controllers/` — controller logic for routes
- `src/models/` — Mongoose models (User, Post, Comment, Notification)
- `src/config/cloudinary.js` — cloudinary setup & safe fallback
- `.env.example` — example env file with placeholders

---

## Dashboard endpoint (admin)

The primary admin endpoint used by the dashboard UI is:

- GET `/api/users/dashboard` — returns:
  - `users` (count), `userList` (lightweight list of users), `posts`, `comments`, `notifications`
  - `reportedPosts` (array of most recent reported posts)
  - `usersByDay`, `postsByDay` — time series (last 30 days)
  - `analysis` — simple heuristics (avg posts/user, peak days)

Example (curl):

```powershell
Invoke-RestMethod 'http://localhost:5001/api/users/dashboard' | ConvertTo-Json -Depth 4
```

Admin actions exposed by the API:
- DELETE `/api/users/admin/posts/:postId` — delete a post (admin endpoint)
- POST `/api/users/admin/users/:userId/ban` — ban a user for N minutes (body: `{ minutes, reason }`)

> Server-side routes should enforce admin permissions. The controllers currently include comments where you should add real admin checks.

---

## Cloudinary & uploads

- The project uses Cloudinary for storing images. Credentials must be set via environment variables (see above).
- If credentials are missing the app will start but cloudinary `upload()` calls will throw an informative error (useful for dev if you don't need uploads).
- To enable uploads, set:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

---

## Development tips

- Use `nodemon` or your preferred dev server to auto-reload on changes.
- Use MongoDB locally for development (or point `MONGO_URI` to a hosted database).
- The admin HTML (`index.html`) is static — you can host it separately or open locally; remember CORS is enabled in `server.js`.

---

## Troubleshooting

- "Must supply api_key" or similar Cloudinary errors:
  - Ensure `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set in `.env` or your environment.
  - If you intentionally don't want Cloudinary in dev, you can leave them empty; uploads will report a clear error when attempted.

- Server fails to start due to DB errors:
  - Check `MONGO_URI` and make sure MongoDB is reachable.

- Dashboard shows empty data / 404 for `/api/users/dashboard`:
  - Confirm backend is running and that `API_BASE` in `index.html` matches the server address (e.g., `http://localhost:5001/api`).

- Lint/HTML parsing warnings in your editor:
  - Some editors may try to parse `index.html` as another filetype; open it in a browser to validate actual runtime behavior.

---


