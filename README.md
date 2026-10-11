# HAVFOOD — VIT-AP Mess Menu PWA

**App name:** HAVFOOD  
**Architecture:** ₹0 static PWA — GitHub + Netlify, zero cloud database costs  
**Menu data file:** `menu-data.js`

---

## ₹0 Shared Menu Update Workflow

```
Admin uploads Excel
        ↓
In-browser Excel validation and menu data generation (menu-data.js)
        ↓
Admin downloads the generated menu-data.js file
        ↓
Replace the project's menu-data.js with the downloaded file
        ↓
git add menu-data.js  →  git commit  →  git push origin main
        ↓
Netlify detects the GitHub push and auto-deploys (~30 seconds)
        ↓
All students open HAVFOOD — new month appears in "Change Month"
```

---

## Admin: How to Upload and Publish a New Month's Menu

### Step 1 — Open Admin Profile
1. Tap the 👤 profile button in the top-right corner.
2. Select **Admin Profile** and log in with the Mess Incharge credentials.

### Step 2 — Insert New Menu
1. In the Admin Dashboard, locate the **"Insert New Menu"** card.
2. **Select the target month** using the month picker (e.g. `2026-10` for October 2026).
3. **Select the mess type** or leave it on *Auto-detect*:
   - `Veg & Non-Veg` — Regular mess
   - `Special` — Special mess
4. **Upload the Excel file** (.xlsx or .xls) by clicking or dragging into the upload zone.

### Step 3 — Validate and Preview
- The workbook is parsed **entirely in-browser** — no data is sent to any server.
- A **validation result** is shown immediately:
  - ✅ Green = passed. Proceed to export.
  - 🔴 Red = error. Check the message and fix the file or settings.
- A **preview table** shows the first 5 dates parsed from the workbook.
- **Duplicate month guard:** If you select a month that already exists (including the built-in September 2026 data), the upload is blocked and an error message is shown. Delete the existing month first from "Available Monthly Menus" if you need to replace it.

### Step 4 — Export the Generated Menu File
After validation passes, three export actions are available:

| Button | What it does |
|--------|-------------|
| **📥 Export & Download Updated menu-data.js** | Downloads the complete merged `menu-data.js` file to your computer. Use this file to deploy. |
| **📋 Copy menu-data.js Code** | Copies the full file content to your clipboard. |
| **💾 Save & Preview on This Device** | Saves to this browser's localStorage so you can preview the menu immediately — **visible only on this device, NOT published to students.** |

> **Important:** The menu is **not published to all students** until the GitHub + Netlify deployment steps below are completed.

### Step 5 — Replace the Project File
1. Take the downloaded `menu-data.js` file.
2. Place it in your local project folder, replacing:
   ```
   HAVFOOD_FINAL_ONE_AND_DONE/menu-data.js
   ```

### Step 6 — Commit and Push to GitHub
Open a terminal in the project folder and run:
```bash
git add menu-data.js
git commit -m "Update menu: Add October 2026 menu"
git push origin main
```

> The Admin Dashboard generates the exact git commit command with the correct month label automatically.

### Step 7 — Netlify Deploys Automatically (₹0)
- Netlify monitors your GitHub repository.
- When it detects the push, it automatically rebuilds and deploys the site (~30 seconds).
- **No manual action needed on Netlify** after the push.

### Step 8 — Students See the Updated Menu
- The next time any student opens HAVFOOD (or refreshes), the new month appears in **Change Month**.
- The PWA update banner ("New HAVFOOD update available") may also appear on devices that have the app installed.

---

## Which Parts Are Manual and Which Are Automatic?

| Step | Type |
|------|------|
| Upload Excel in Admin Profile | **Manual** |
| Excel parsing and validation | **Automatic** (in-browser) |
| Preview display | **Automatic** |
| Download generated menu-data.js | **Manual** |
| Replace file in local project | **Manual** |
| `git add`, `git commit`, `git push` | **Manual** |
| Netlify deployment on push | **Automatic** |
| Students seeing the new menu | **Automatic** (on next page load/refresh) |

---

## Project File Reference

```
HAVFOOD_FINAL_ONE_AND_DONE/
├── index.html          — App shell (HTML, admin/student views, modals)
├── style.css           — All styling
├── script.js           — App logic, admin Excel importer, export handlers
├── menu-data.js        — ← THE FILE TO UPDATE when publishing a new month
├── xlsx.mini.min.js    — Bundled SheetJS for in-browser Excel parsing (₹0)
├── manifest.json       — PWA manifest
├── sw.js               — Service worker for offline support
└── icons/              — App icons
```

**`menu-data.js` format:**
```js
window.HAVFOOD_MENU = {
  "Veg & Non-Veg": {
    "2026-09-01": { "Breakfast": [...], "Lunch": [...], "Snacks": [...], "Dinner": [...] },
    ...
  },
  "Special": {
    "2026-09-01": { "Breakfast": [...], ... },
    ...
  }
};
```

---

## Security and Cost Notes

- No Supabase, Firebase, or any paid cloud backend is used.
- No GitHub access tokens or passwords are stored in frontend JavaScript.
- The admin login (`mess_incharge / @VITmess123`) is a **frontend access gate** appropriate for a client-side static PWA. It is not a substitute for backend authentication.
- All Excel parsing happens entirely in-browser using the bundled SheetJS library.
- September 2026 menu data is permanently protected — it is built into `menu-data.js` and cannot be overwritten through the uploader.

---

## Running Locally

Open this folder in VS Code and run with Live Server (or any static web server). No build step, no Node.js required.

```bash
# Optional: serve with Python
python -m http.server 8080
```

---

## PWA Features Preserved

- Installable (Add to Home Screen)
- Offline support via service worker
- Meal reminders (browser notifications)
- 7-Day Quick View
- Change Month
- Mess selector (Veg & Non-Veg / Special)
- Queries & Suggestions
