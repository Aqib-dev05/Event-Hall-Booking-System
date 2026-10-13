# Event Hall Booking — Frontend (Next.js 14)

Next.js 14 (App Router) + TypeScript + Tailwind CSS. It has **no database and no secrets of its own** — every
piece of data comes from the Express API in `../backend`.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local     # fill in the values
npm run dev                          # http://localhost:3000   (start the backend first)
```

| Variable | Notes |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | backend base URL **including `/api`**, e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…`) |

## How it talks to the backend

* `lib/api.ts` – server-side helper (`apiRequest`) used by the server actions. It sends the backend JWT from the
  NextAuth session as `Authorization: Bearer …` and returns `{ success, data?, error?, message? }`.
* `actions/*.ts` – the same server actions the UI always used (`getVenues`, `createBooking`, …); they are now thin
  wrappers over the REST API, so pages/components did not have to change.
* `lib/auth.ts` – NextAuth credentials login calls `POST /auth/login` on the backend and stores the returned JWT in
  the session (`session.accessToken`). The session lasts 7 days, exactly like the backend token.
* `lib/venueUpload.ts` – the only place where the **browser** calls the API directly: admin venue create/edit
  with pictures (`multipart/form-data`). Files never pass through Next.js (server actions are limited to 1 MB and
  Vercel functions to 4.5 MB). The backend must allow the site's origin (`FRONTEND_URL` in the backend `.env`).
* Types in `types/index.ts` describe the API responses (ids are strings called `id`).
