# Laser Tag Scheduler

A full-stack web app for managing laser tag sessions — public booking page + admin panel.

## Features

- **Public side**: Browse sessions, see available spots, book 1 or more spots at once
- **Two payment types**: Pay at location (instant confirm) or Interac e-Transfer (self-validate)
- **Admin panel** (password protected): Create/edit/delete sessions, view all bookings, mark payments

## Local Development

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your local PostgreSQL connection string
```

### 3. Start dev servers

```bash
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

> The frontend dev server proxies `/api` requests to the backend automatically.

## Deployment (GitHub + Render)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create laser-tag-scheduler --public --push --source=.
```

### 2. Deploy on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect `render.yaml` and automatically create:
   - A **Web Service** for the app
   - A **PostgreSQL database**
5. Click **Apply** — your app will be live in ~5 minutes

The database tables are created automatically on first startup.

## Updating the Frontend

The frontend is pre-built and committed to the repo (in `client/dist/`). After making frontend changes:

```bash
cd client && npm run build && cd ..
git add client/dist/ && git commit -m "rebuild frontend" && git push
```

Render will automatically redeploy when you push.

## Admin Panel

Access at `/admin/login` — password is configured in your environment variables.

### What you can do:
- Create sessions (date, time, location, spots, payment type, price)
- Activate/deactivate sessions
- View all bookings per session
- For Interac sessions: see who validated vs who is pending
- Mark payments manually / unmark / cancel / delete bookings

## Payment Flow (Interac)

1. Player fills in their info and selects spots
2. They review the total amount owed
3. They reserve their spot (status: "placeholder")
4. They send the Interac e-Transfer to `lucasnavilloz@gmail.com`
5. They click "I've sent the payment" → status becomes "validated"
6. You verify in your bank, then optionally adjust in admin if needed

Players who forget to validate can use the **Validate Payment** page with their Booking ID + last name.
