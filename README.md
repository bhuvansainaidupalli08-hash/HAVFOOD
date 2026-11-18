# DINELY — Your Campus. Your Meals.

A modern, premium Campus Food-Tech PWA for campus dining exploration.

## Brand Identity

- **App Name:** DINELY
- **Tagline:** Your Campus. Your Meals.
- **Brand Meaning:** A smarter way to dine.
- **Category:** Campus Food-Tech PWA
- **Concept:** DINELY represents a simple, smart and convenient way for students to explore their daily campus meals.

## Approved Brand Color Palette

- **Forest Green:** `#123C32` — Header, navigation, primary brand surfaces.
- **Lime:** `#D8F36A` — Primary buttons, highlights, active states, important indicators.
- **Cream:** `#F8F8F2` — Main application background and light surfaces.
- **Peach:** `#E8A66A` — Special Mess, special meals, and special highlights.
- **Dark:** `#202722` — Primary text, headings, and readable labels.

## Features

### For Students
- 🍽️ **3-Way Mess Selection** — Seamlessly toggle between Veg Mess, Non-Veg Mess, or Special Mess
- 📅 **Date Navigation** — 7-day quick view + calendar picker to jump to any day
- ⏰ **Serving Now** — Live meal status with real-time countdown timer
- 🔔 **Meal Reminders** — Pre-meal and meal-end notifications with configurable 5–30 min lead times
- 👤 **Student Profile** — Persistent student name, ID, mess preferences, and query history
- 💡 **Queries & Suggestions** — Submit feedback, menu improvements, and error reports
- 📱 **PWA & Offline First** — Installable on Android & iOS home screens, complete offline menu access

### For Admins
- 🛡️ **Secure Admin Login** — Dedicated Mess Incharge authentication
- 📊 **Excel Menu Upload** — Upload monthly menu workbooks (`.xlsx` / `.xls`)
- ✅ **Strict Validation** — Validates dates, meal periods, and menu integrity before publishing
- 👁️ **Preview Mode** — Interactive preview of parsed menu records before database commit
- 💬 **Query Management** — Review and update status of student queries and suggestions
- 📅 **Multi-month Support** — Switch and manage menus across academic periods

## Architecture

- **Frontend:** Pure HTML5, CSS3 (Custom Properties & Design Tokens), Modern Vanilla JavaScript (ES2022)
- **Service Worker:** `sw.js` (Cache-first offline engine, background Web Push handler)
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL + SQLite local sync
- **Push:** Web Push API (VAPID)

## Mess Categories

| Mess | Menu Data Source |
|------|------------------|
| Veg Mess | Standard daily menu records |
| Non-Veg Mess | Standard daily menu records |
| Special Mess | Dedicated Special Mess menu records |

## PWA Manifest

- **Name:** DINELY – Your Campus. Your Meals.
- **Short Name:** DINELY
- **Theme Color:** `#123C32`
- **Background Color:** `#F8F8F2`
- **Icons:** 192px, 512px, maskable-192, maskable-512, apple-touch-icon
