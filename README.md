# HAVFOOD PRO — fresh starter

Open this folder in VS Code and run it with Live Server (or any static web server).

Included:
- responsive light Gen-Z UI
- today / past / future date handling
- 7-day quick view
- mess switcher
- search
- PWA manifest + service worker
- install prompt
- reminder settings (5/10/15/20/30 min) and browser notification permission
- original September 2026 workbook exported to menu-data.js

Important:
The reminder UI and browser notification permission are included, but guaranteed background push notifications while the app is fully closed require a Web Push backend/service. This static version does not pretend to provide that guarantee.

Approved HavFood HF logo integrated from the already-generated logo image; no new image generation is required.

Bug fix: menu data is now normalized directly from the workbook by date and meal, avoiding the earlier browser parser issue that could show an empty menu.
