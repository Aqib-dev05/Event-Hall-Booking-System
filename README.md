# Event Hall Booking System

Full-stack booking platform for event halls in Pakistan — customers browse halls, pick a date, see the free
time slots and pay with Stripe; admins manage venues, bookings, users and revenue.

This repository is split into two independent apps:

| Folder | Stack | Owner |
|---|---|---|
| [`frontend/`](frontend) | Next.js 14 (App Router), TypeScript, Tailwind, NextAuth v5, Stripe Elements | frontend developer |
| [`backend/`](backend) | Node.js, Express, PostgreSQL, Prisma, Zod, Multer + Cloudinary, Stripe, Nodemailer (Gmail) — plain JavaScript | backend developer |

```
Browser ──► Next.js (frontend) ──server actions──► Express API (backend) ──► PostgreSQL
   │                                                  │      ├─► Stripe
   └── venue pictures (multipart) ───────────────────►┘      ├─► Cloudinary
                                                              └─► Gmail
```

## Quick start

1. **PostgreSQL**: create an empty database, e.g. `createdb eventhall`.
2. **Backend** — see [backend/README.md](backend/README.md)
   ```bash
   cd backend && npm install && cp .env.example .env     # edit .env
   npm run db:migrate && npm run seed && npm run dev      # http://localhost:5000
   ```
3. **Frontend** — see [frontend/README.md](frontend/README.md)
   ```bash
   cd frontend && npm install && cp .env.local.example .env.local   # edit .env.local
   npm run dev                                                      # http://localhost:3000
   ```

Demo accounts (created by `npm run seed`): `admin@eventhall.com / admin123` · `customer@test.com / test123`
· Stripe test card `4242 4242 4242 4242` (any future date, any CVC).

## The contract between the two halves

The API reference is in [backend/README.md](backend/README.md). Rules both developers rely on:

* Responses are `{ success: true, data, message? }` or `{ success: false, error }`; errors carry a human readable message.
* Auth is `Authorization: Bearer <jwt>`; the frontend keeps the token in its NextAuth session.
* Ids are UUID strings called `id`; dates are `YYYY-MM-DD` (event day) or ISO timestamps (created/updated).
* If the API changes, update `frontend/types/index.ts` and the matching wrapper in `frontend/actions/`.

## Deployment notes

* **Backend** (any Node host: Render, Railway, VPS …): build `npm install && npm run db:generate && npm run db:deploy`,
  start `npm start`, set all variables from `.env.example`, set `FRONTEND_URL` to the deployed frontend URL.
  It must be a long-running server (the daily 09:00 reminder job runs inside the process); point the Stripe
  webhook to `https://<backend>/api/payments/webhook`.
* **Frontend** (Vercel): set the four variables from `.env.local.example` with `NEXT_PUBLIC_API_URL=https://<backend>/api`.
