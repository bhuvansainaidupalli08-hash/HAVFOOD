# DINELY — Your Campus. Your Meals.

A modern, premium Campus Food-Tech PWA for VIT-AP students.

## Brand Identity

- **App Name:** DINELY
- **Tagline:** Your Campus. Your Meals.
- **Category:** Campus Food-Tech
- **Concept:** DINELY represents a simple, smart and convenient way for students to explore their daily campus meals.

## Features

### For Students
- 🍽️ **Mess Selection** — Choose between Veg Mess, Non-Veg Mess, or Special Mess
- 📅 **Date Navigation** — 7-day quick view + jump to any date
- ⏰ **Serving Now** — Live meal status with countdown timer
- 🔔 **Meal Reminders** — Pre-meal & meal-end notifications (5–30 min configurable)
- 👤 **Student Profile** — Name, ID, mess preference, all persistent
- 💡 **Queries & Suggestions** — Submit feedback, report menu issues
- 📱 **PWA** — Installable on Android & iOS, works offline

### For Admins
- 🛡️ **Secure Admin Login** — Mess Incharge authentication
- 📊 **Excel Upload** — Upload monthly menu workbooks (.xlsx/.xls)
- ✅ **Validation** — Validates data before publishing
- 👁️ **Preview** — Preview parsed menu before publishing to database
- 💬 **Query Management** — Review student submissions
- 📅 **Multi-month Support** — Manage menus across academic periods

## Tech Stack

- **Frontend:** Vanilla JS, CSS3, PWA (Service Worker, Web Push)
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL (shared, online) + SQLite (local fallback)
- **Push:** Web Push API + VAPID
- **Hosting:** Netlify (frontend) + Render (backend)

## Mess Categories

| Mess | Data |
|------|------|
| Veg Mess | Uses Veg & Non-Veg menu data |
| Non-Veg Mess | Uses Veg & Non-Veg menu data |
| Special Mess | Uses Special menu data |

> **Note:** Veg and Non-Veg menus share the same daily menu (as per VIT-AP mess structure). Special Mess has its own enriched menu.

## PWA Icons

All icons feature the DINELY brand mark — a **D** shape integrated with a **fork** symbol in Electric Mint (`#00F5A0`) on Carbon Black (`#121414`).

## Local Development

```bash
# Install backend dependencies
cd backend
npm install

# Start backend (serves frontend too)
node server.js
# → http://localhost:5000
```

## Deployment

The frontend is deployed automatically via Netlify on every push to `main`.

Backend is deployed on Render.com.

---

*Transformed from HAVFOOD v12 → DINELY v1 | November 2026*
