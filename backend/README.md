# Event Hall Booking — Backend (Express + PostgreSQL + Prisma)

REST API for the Event Hall Booking System. Plain JavaScript (CommonJS), validation with **Zod**,
images with **Multer → Cloudinary**, payments with **Stripe**, emails with **Nodemailer (Gmail)**.

```
backend/
├── config/        env.js (validated env) · db.js (Prisma) · cloudinary.js · stripe.js
├── controllers/   auth · user · venue · booking · payment · admin · cron
├── middleware/    auth (JWT + admin guard) · validate (Zod) · upload (Multer) · error
├── routes/        one file per resource, mounted under /api (routes/index.js)
├── validators/    Zod schemas (also the single source of truth for input "types" via JSDoc @typedef)
├── utils/         slots (time-slot rules) · dates · availability · email · images (Cloudinary) · response
├── prisma/        schema.prisma
├── seed/          seed.js  (demo admin, customer and 5 venues)
├── app.js         Express app          server.js  boot + daily 9 AM reminder cron
```

## Setup

```bash
cd backend
npm install
cp .env.example .env        # fill in the values (see below)
npm run db:migrate          # creates the tables (asks for a migration name, e.g. "init") and generates the Prisma client
npm run seed                # demo data
npm run dev                 # http://localhost:5000/api/health
```

If you only pulled new code and the schema did not change, run `npm run db:generate` after `npm install`.

### Environment (`.env`)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/eventhall?schema=public` (create the database first) |
| `JWT_SECRET` | any random string ≥ 16 chars |
| `FRONTEND_URL` | browser origin allowed by CORS, e.g. `http://localhost:3000` (comma separated for several) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe dashboard (test mode) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API keys |
| `CLOUDINARY_ROOT_FOLDER` | root folder for all project pictures, default `event-hall-booking` (venue pictures go to `event-hall-booking/venues`) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Google Account → Security → 2-Step Verification → App passwords |
| `ADMIN_EMAIL` | optional, receives "new booking" alerts (defaults to `GMAIL_USER`) |
| `CRON_SECRET` | optional, protects `GET /api/cron/send-reminders` |
| `TIMEZONE` | default `Asia/Karachi` |

Stripe / Cloudinary / Gmail are optional while developing: the server starts without them and the
related endpoints answer with a clear `503` (emails are simply skipped).

Stripe webhook (local): `stripe listen --forward-to localhost:5000/api/payments/webhook`

## Conventions

* Every response: `{ success: true, data, message? }` or `{ success: false, error }`.
* Auth: `Authorization: Bearer <jwt>` (returned by `POST /api/auth/login`, valid `JWT_EXPIRES_IN`).
* Ids are UUID strings named `id`. `eventDate` is a calendar day (`YYYY-MM-DD`, stored as Postgres `DATE`).
* Prices are calculated on the server only (`utils/slots.js`): slot hours × price per hour + 10 % service fee.

## API

| Method & path | Access | Notes |
|---|---|---|
| `POST /api/auth/register` | public | `{ name, email, password, phone? }` |
| `POST /api/auth/login` | public | → `{ token, user }` |
| `GET /api/auth/me` | user | |
| `GET /api/users/me` · `PATCH /api/users/me` | user | profile (`{ name, phone? }`) |
| `PUT /api/users/me/password` | user | `{ oldPassword, newPassword }` |
| `GET /api/users/me/stats` | user | dashboard numbers + next 3 bookings |
| `GET /api/venues` | public | query: `search, category, city, minCapacity, maxCapacity, minPrice, maxPrice, date` (`date` = only venues with ≥ 1 free slot) |
| `GET /api/venues/featured` | public | top 3 by rating |
| `GET /api/venues/:id` | public | |
| `GET /api/venues/:id/slots?date=YYYY-MM-DD` | public | per-slot availability |
| `GET /api/venues/:id/reviews` | public | latest 10 |
| `POST /api/venues` | admin | `multipart/form-data`, pictures in field `images` (max 5, JPG/PNG/WEBP, 5 MB each) |
| `PUT /api/venues/:id` | admin | multipart or JSON. `existingImages` = JSON array of URLs to keep; new files are appended; the rest is deleted from Cloudinary |
| `PATCH /api/venues/:id/status` | admin | `{ isAvailable }` |
| `DELETE /api/venues/:id` | admin | refused (409) if the venue has bookings — deactivate instead |
| `POST /api/payments/create-intent` | user | `{ venueId, bookingType, eventDate }` → `{ clientSecret, amount }` |
| `POST /api/payments/webhook` | Stripe | raw body, signature checked |
| `POST /api/bookings` | user | `{ venueId, eventType, eventDate, bookingType, guestCount, specialRequests?, paymentIntentId }` |
| `GET /api/bookings/my` · `GET /api/bookings/:id` | user | `:id` only for the owner or an admin |
| `PATCH /api/bookings/:id/cancel` | user | customers: > 48 h before the event; refunds the Stripe payment |
| `POST /api/bookings/review` | user | `{ bookingId, venueId, rating, comment }` — completed bookings only |
| `GET /api/admin/stats` · `/venues` · `/users` · `/bookings?search=` | admin | |
| `PATCH /api/admin/bookings/:id/status` | admin | `{ status }` |
| `GET /api/cron/send-reminders` | `Bearer CRON_SECRET` | the server also runs this by itself daily at 09:00 |

### Business rules (unchanged from the original project)

* Slots: Morning 08–12, Afternoon 13–17, Evening 17–22, Full Day 08–22.
* Full Day booked → every slot blocked · any single slot booked → Full Day blocked · each slot only blocks itself.
* Only `pending` + `confirmed` bookings occupy a slot; `cancelled` ones are ignored.

### Behaviour that is stricter than the old Next.js version

* A booking is only created after the backend asked Stripe and confirmed the payment **succeeded** for the same
  user / venue / slot / date / amount. One payment can only be used for one booking.
* Booking creation runs in a `Serializable` transaction, so two people paying for the same slot at the same
  moment can never both get it. The loser's payment is refunded automatically.
* Cancelling a paid booking really refunds the payment in Stripe (previously it only changed the status).
* Past event dates are rejected.
