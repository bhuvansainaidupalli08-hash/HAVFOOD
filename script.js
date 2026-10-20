(() => {
  // ============================================================================
  // HAVFOOD — CORE & IMPORTED MENU INITIALIZATION
  // ============================================================================
  const MEAL_TIMES = {
    Breakfast: ["07:30", "09:30"],
    Lunch: ["12:30", "14:30"],
    Snacks: ["16:30", "18:00"],
    Dinner: ["19:30", "21:30"]
  };
  const ALL_MEALS = ["Breakfast", "Lunch", "Snacks", "Dinner"];
  const $ = id => document.getElementById(id);

  function localISO(d) {
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  }


  // Load imported & cached monthly menus into window.HAVFOOD_MENU
  function loadImportedMenus() {
    try {
      // 1. Cached backend menu from shared online database (instant offline / startup render)
      const cachedBackend = localStorage.getItem("havfood_cached_backend_menu");
      if (cachedBackend) {
        const parsed = JSON.parse(cachedBackend);
        if (!window.HAVFOOD_MENU) window.HAVFOOD_MENU = {};
        for (const messType of Object.keys(parsed)) {
          if (!window.HAVFOOD_MENU[messType]) {
            window.HAVFOOD_MENU[messType] = {};
          }
          Object.assign(window.HAVFOOD_MENU[messType], parsed[messType]);
        }
      }

      // 2. Any local imported menus (if present)
      const raw = localStorage.getItem("havfood_imported_menus");
      if (raw) {
        const imported = JSON.parse(raw);
        if (!window.HAVFOOD_MENU) window.HAVFOOD_MENU = {};
        for (const messType of Object.keys(imported)) {
          if (!window.HAVFOOD_MENU[messType]) {
            window.HAVFOOD_MENU[messType] = {};
          }
          Object.assign(window.HAVFOOD_MENU[messType], imported[messType]);
        }
      }
    } catch (e) {
      console.warn("Could not load imported/cached menus:", e);
    }
  }
  loadImportedMenus();

  function getApiBaseUrl() {
    if (window.HAVFOOD_API_URL) return window.HAVFOOD_API_URL.replace(/\/+$/, "");
    const stored = localStorage.getItem("havfood_api_url");
    if (stored) return stored.replace(/\/+$/, "");
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }
    return "https://havfood-backend.onrender.com";
  }

  async function loadMenuFromBackend() {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/api/menu`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid menu data received from backend");
      }

      // Merge into window.HAVFOOD_MENU — never overwrite September 2026 built-in data!
      if (!window.HAVFOOD_MENU) window.HAVFOOD_MENU = {};
      for (const messType of Object.keys(result.data)) {
        if (!window.HAVFOOD_MENU[messType]) {
          window.HAVFOOD_MENU[messType] = {};
        }
        Object.assign(window.HAVFOOD_MENU[messType], result.data[messType]);
      }

      // Cache to localStorage for instant startup on future opens
      try {
        localStorage.setItem("havfood_cached_backend_menu", JSON.stringify(result.data));
      } catch (_) {}

      // Re-render UI with merged data
      if (activeProfile === "admin") {
        renderAdminDashboard();
      } else {
        render();
      }

      console.log("✅ HAVFOOD menu synced from shared online database");
    } catch (error) {
      console.warn("ℹ️ Background menu sync info:", error.message || error);
    }
  }

  // App State
  let selectedDate = localISO(new Date());
  let mess = localStorage.getItem("havfood_mess") || "Veg & Non-Veg";
  let activeProfile = sessionStorage.getItem("havfood_active_profile") || "student";

  // Reminder Preferences (belongs to Student Profile)
  let reminderMinutes = Number(localStorage.getItem("havfoodReminderMinutes") || 10);
  let mealEndReminderMinutes = Number(localStorage.getItem("havfoodMealEndReminderMinutes") || 15);
  let reminderMeals = (() => {
    try {
      const m = JSON.parse(localStorage.getItem("havfoodReminderMeals") || "null");
      return Array.isArray(m) && m.length ? m : [...ALL_MEALS];
    } catch (_) {
      return [...ALL_MEALS];
    }
  })();

  function normalizeRows(date) {
    const sheet = window.HAVFOOD_MENU?.[mess] || {};
    const day = sheet[date] || {};
    return {
      Breakfast: Array.isArray(day.Breakfast) ? day.Breakfast : [],
      Lunch: Array.isArray(day.Lunch) ? day.Lunch : [],
      Snacks: Array.isArray(day.Snacks) ? day.Snacks : [],
      Dinner: Array.isArray(day.Dinner) ? day.Dinner : []
    };
  }

  function fmt(date) {
    return new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  function isToday(date) {
    return date === localISO(new Date());
  }

  function mealState() {
    // Strict requirement: Current time ONLY controls meal state when selectedDate === today's local date
    if (!isToday(selectedDate)) {
      return {
        label: "MENU FOR",
        meal: fmt(selectedDate),
        time: "Full day menu",
        remaining: null
      };
    }
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();

    for (const [meal, [a, b]] of Object.entries(MEAL_TIMES)) {
      const [ah, am] = a.split(":").map(Number);
      const [bh, bm] = b.split(":").map(Number);
      const start = ah * 60 + am;
      const end = bh * 60 + bm;
      if (mins >= start && mins < end) {
        return {
          label: "SERVING NOW",
          meal,
          timeRange: `${a} – ${b}`,
          time: `${a} – ${b}`,
          remaining: (end - mins) * 60 - now.getSeconds()
        };
      }
    }

    const next = Object.entries(MEAL_TIMES).find(([, [a]]) => {
      const [h, m] = a.split(":").map(Number);
      return h * 60 + m > mins;
    });

    if (next) {
      const [a] = next[1];
      const [h, m] = a.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      return {
        label: "UP NEXT",
        meal: next[0],
        time: `${a} – ${MEAL_TIMES[next[0]][1]}`,
        remaining: Math.max(0, Math.floor((target - now) / 1000))
      };
    }

    return { label: "MENU FOR", meal: "Today's menu", time: "All meals", remaining: null };
  }

  function renderHeader() {
    $("heroDate").textContent = isToday(selectedDate) ? "Today" : fmt(selectedDate);
    $("heroSub").textContent = isToday(selectedDate) ? fmt(selectedDate) : "Viewing selected date";
    $("menuTitle").textContent = `${mess} Menu`;
  }

  function renderStatus() {
    const s = mealState();
    $("statusLabel").textContent = s.label;
    $("statusMeal").textContent = s.meal;
    $("statusTime").textContent = s.time || (isToday(selectedDate) ? "All meals" : "Full day menu");
    $("countdown").textContent = s.remaining == null ? "" : clock(s.remaining);

    // Meal-Wise Actor Card (Shah Rukh Khan, Allu Arjun, Mammootty, Bramhanandham)
    if (window.HAVFOOD_ACTOR && typeof window.HAVFOOD_ACTOR.render === "function") {
      window.HAVFOOD_ACTOR.render();
    }
  }

  function clock(sec) {
    sec = Math.max(0, sec);
    return `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor(sec % 3600 / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  function renderWeek() {
    const d = new Date(selectedDate + "T12:00:00");
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay() + 1); // Monday
    $("week").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      const iso = localISO(x);
      return `<button class="day ${iso === selectedDate ? "selected" : ""}" data-date="${iso}">
        <div class="dow">${x.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}</div>
        <div class="num">${x.getDate()}</div>
        <div class="dot"></div>
      </button>`;
    }).join("");

    document.querySelectorAll(".day").forEach(b => {
      b.onclick = () => {
        selectedDate = b.dataset.date;
        render();
      };
    });
  }

  function renderMenu() {
    const data = normalizeRows(selectedDate);
    let total = 0;
    let html = "";
    for (const [meal, dishes] of Object.entries(data)) {
      if (!dishes.length) continue;
      total += dishes.length;
      html += `<article class="meal-card">
        <div class="meal-top">
          <span class="meal-name">${meal}</span>
          <span class="meal-time">${MEAL_TIMES[meal]?.join(" – ") || ""}</span>
        </div>
        ${dishes.map(x => `<div class="dish"><span>${escapeHtml(x)}</span></div>`).join("")}
      </article>`;
    }
    $("menu").innerHTML = html || `<div class="empty">No menu items found for this date.</div>`;
    $("resultCount").textContent = total ? `${total} items` : "";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }

  function render() {
    renderHeader();
    renderStatus();
    renderWeek();
    renderMenu();
    if ($("datePicker")) $("datePicker").value = selectedDate;
  }

  // Jump to Date Modal & Today Button
  $("calendarBtn").onclick = () => {
    $("dateModal").classList.remove("hidden");
    $("datePicker").value = selectedDate;
  };
  $("applyDate").onclick = () => {
    const selected = $("datePicker").value;
    if (!selected) return;
    selectedDate = selected;
    $("dateModal").classList.add("hidden");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  $("todayBtn").onclick = () => {
    selectedDate = localISO(new Date());
    render();
  };

  // Mess Selection
  function updateMessUI() {
    document.querySelectorAll("[data-mess]").forEach(b => {
      b.classList.toggle("active", b.dataset.mess === mess);
    });
  }
  updateMessUI();

  document.querySelectorAll("[data-mess]").forEach(b => {
    b.onclick = () => {
      mess = b.dataset.mess;
      localStorage.setItem("havfood_mess", mess);
      updateMessUI();
      render();
    };
  });

  // Modal Generic Close Buttons
  document.querySelectorAll("[data-close]").forEach(b => {
    b.onclick = () => {
      const target = $(b.dataset.close);
      if (target) target.classList.add("hidden");
    };
  });
  document.querySelectorAll(".modal").forEach(m => {
    m.onclick = e => {
      if (e.target === m) m.classList.add("hidden");
    };
  });

  // ============================================================================
  // HAMBURGER MENU DRAWER
  // Options strictly: Reminder, Change Month, Queries & Suggestions
  // ============================================================================
  $("hfHamburger").onclick = () => {
    $("hfMenuOverlay").classList.remove("hidden");
  };
  $("hfMenuClose").onclick = () => {
    $("hfMenuOverlay").classList.add("hidden");
  };
  $("hfMenuOverlay").onclick = e => {
    if (e.target === $("hfMenuOverlay")) {
      $("hfMenuOverlay").classList.add("hidden");
    }
  };

  // ============================================================================
  // REMINDER SYSTEM FIX & MEAL-END REMINDERS
  // ============================================================================
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function syncPushSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return null;
    }
    if (Notification.permission !== "granted") {
      return null;
    }

    const startOn = localStorage.getItem("havfoodReminders") === "on";
    const endOn = localStorage.getItem("havfoodMealEndEnabled") === "on";
    if (!startOn && !endOn) {
      return null;
    }

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return null;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const keyRes = await fetch(`${baseUrl}/api/push/public-key`);
        if (!keyRes.ok) return null;
        const keyData = await keyRes.json();
        if (!keyData.success || !keyData.publicKey) return null;

        const convertedKey = urlBase64ToUint8Array(keyData.publicKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
      }

      if (!sub) return null;

      const rawSub = sub.toJSON ? sub.toJSON() : {};
      const subPayload = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: rawSub.keys?.p256dh || "",
          auth: rawSub.keys?.auth || ""
        }
      };

      const res = await fetch(`${baseUrl}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subPayload,
          preferences: {
            meals: reminderMeals,
            reminderMinutes: reminderMinutes,
            endReminderMinutes: mealEndReminderMinutes
          }
        })
      });

      if (res.ok) {
        console.log("✅ Web Push subscription synced with backend");
        return sub;
      }
    } catch (err) {
      console.warn("ℹ️ Web Push subscription sync:", err.message || err);
    }
    return null;
  }

  async function updatePermissionBadge() {
    const badge = $("notifPermStatus");
    if (!badge) return;
    if (!("Notification" in window)) {
      badge.className = "perm-badge denied";
      badge.textContent = "❌ Notifications not supported in this browser";
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") {
      badge.className = "perm-badge denied";
      badge.textContent = "⚠️ Blocked. Enable notifications in site/browser settings.";
      return;
    }
    const startOn = localStorage.getItem("havfoodReminders") === "on";
    const endOn = localStorage.getItem("havfoodMealEndEnabled") === "on";

    if (perm === "granted" && (startOn || endOn)) {
      let pushActive = false;
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) pushActive = true;
        } catch (_) {}
      }
      badge.className = "perm-badge granted";
      badge.textContent = pushActive
        ? "✅ Web Push & Meal Reminders Active"
        : "✅ In-App Meal Reminders Active";
    } else if (perm === "granted") {
      badge.className = "perm-badge default";
      badge.textContent = "🔔 Permission granted — toggle reminders below";
    } else {
      badge.className = "perm-badge default";
      badge.textContent = "🔔 Permission required for meal reminders";
    }
  }

  function setupReminders() {
    updatePermissionBadge();

    // 1. Meal selector chips (Breakfast, Lunch, Snacks, Dinner)
    const mealChips = $("reminderMealChips");
    if (mealChips) {
      mealChips.querySelectorAll(".meal-chip").forEach(b => {
        const m = b.dataset.meal;
        b.classList.toggle("active", reminderMeals.includes(m));
        b.onclick = () => {
          if (reminderMeals.includes(m)) {
            if (reminderMeals.length > 1) {
              reminderMeals = reminderMeals.filter(x => x !== m);
            } else {
              toast("At least one meal must be selected");
              return;
            }
          } else {
            reminderMeals.push(m);
          }
          localStorage.setItem("havfoodReminderMeals", JSON.stringify(reminderMeals));
          b.classList.toggle("active", reminderMeals.includes(m));
          syncPushSubscription();
        };
      });
    }

    // 2. Meal Start Options (5, 10, 15, 20, 30 min)
    const startOpts = [5, 10, 15, 20, 30];
    $("reminderOptions").innerHTML = startOpts.map(n =>
      `<button data-start-min="${n}" class="${n === reminderMinutes ? "active" : ""}">${n} min</button>`
    ).join("");
    $("reminderOptions").querySelectorAll("[data-start-min]").forEach(b => {
      b.onclick = () => {
        reminderMinutes = Number(b.dataset.startMin);
        localStorage.setItem("havfoodReminderMinutes", reminderMinutes);
        $("reminderOptions").querySelectorAll("[data-start-min]").forEach(x => x.classList.toggle("active", x === b));
        toast(`Meal-start reminder: ${reminderMinutes} min before`);
        syncPushSubscription();
      };
    });

    // 3. Meal End Options (5, 10, 15, 30 min)
    const endOpts = [5, 10, 15, 30];
    $("mealEndOptions").innerHTML = endOpts.map(n =>
      `<button data-end-min="${n}" class="${n === mealEndReminderMinutes ? "active" : ""}">${n} min</button>`
    ).join("");
    $("mealEndOptions").querySelectorAll("[data-end-min]").forEach(b => {
      b.onclick = () => {
        mealEndReminderMinutes = Number(b.dataset.endMin);
        localStorage.setItem("havfoodMealEndReminderMinutes", mealEndReminderMinutes);
        $("mealEndOptions").querySelectorAll("[data-end-min]").forEach(x => x.classList.toggle("active", x === b));
        toast(`Meal-end reminder: ${mealEndReminderMinutes} min before end`);
        syncPushSubscription();
      };
    });

    // 4. Main toggles
    const startToggle = $("reminderToggle");
    startToggle.checked = localStorage.getItem("havfoodReminders") === "on";
    startToggle.onchange = async () => {
      if (startToggle.checked) {
        const granted = await requestNotifPermission();
        if (granted) {
          localStorage.setItem("havfoodReminders", "on");
          toast("Meal-start reminders enabled");
          syncPushSubscription().finally(updatePermissionBadge);
        } else {
          startToggle.checked = false;
        }
      } else {
        localStorage.setItem("havfoodReminders", "off");
        toast("Meal-start reminders disabled");
      }
      updatePermissionBadge();
    };

    const endToggle = $("mealEndToggle");
    endToggle.checked = localStorage.getItem("havfoodMealEndEnabled") === "on";
    endToggle.onchange = async () => {
      if (endToggle.checked) {
        const granted = await requestNotifPermission();
        if (granted) {
          localStorage.setItem("havfoodMealEndEnabled", "on");
          toast("Meal-end reminders enabled");
          syncPushSubscription().finally(updatePermissionBadge);
        } else {
          endToggle.checked = false;
        }
      } else {
        localStorage.setItem("havfoodMealEndEnabled", "off");
        toast("Meal-end reminders disabled");
      }
      updatePermissionBadge();
    };
  }

  async function requestNotifPermission() {
    if (!("Notification" in window)) {
      toast("Browser notifications are not supported on this device.");
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission === "denied") {
      toast("Notifications are blocked in your browser settings. Please allow them manually.");
      updatePermissionBadge();
      return false;
    }
    const p = await Notification.requestPermission();
    updatePermissionBadge();
    if (p === "granted") {
      toast("Notification permission granted!");
      return true;
    } else {
      toast("Notification permission was denied.");
      return false;
    }
  }

  function fireNotification(title, body) {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: "icons/icon-192.png",
              badge: "icons/icon.svg",
              vibrate: [200, 100, 200],
              tag: title
            });
          }).catch(() => {
            new Notification(title, { body, icon: "icons/icon-192.png" });
          });
        } else {
          new Notification(title, { body, icon: "icons/icon-192.png" });
        }
      }
    } catch (e) {
      console.warn("Notification trigger issue:", e);
    }
    toast(`${title}: ${body}`);
  }

  // Active reminder loop checker (runs every 15s)
  function checkReminders() {
    const startOn = localStorage.getItem("havfoodReminders") === "on";
    const endOn = localStorage.getItem("havfoodMealEndEnabled") === "on";
    if (!startOn && !endOn) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const todayIso = localISO(now);

    for (const meal of reminderMeals) {
      const times = MEAL_TIMES[meal];
      if (!times) continue;
      const [startH, startM] = times[0].split(":").map(Number);
      const [endH, endM] = times[1].split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      // Meal Start Alert
      if (startOn) {
        const targetStart = startTotal - reminderMinutes;
        if (targetStart >= 0 && currentTotalMins >= targetStart && currentTotalMins <= targetStart + 2) {
          const key = `havfood_fired_start_${todayIso}_${meal}_${reminderMinutes}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            fireNotification(
              `HAVFOOD — ${meal} Starts Soon`,
              `${meal} starts in ${reminderMinutes} minutes (${times[0]} – ${times[1]}). Check today's menu!`
            );
          }
        }
      }

      // Meal End Alert
      if (endOn) {
        const targetEnd = endTotal - mealEndReminderMinutes;
        if (targetEnd >= 0 && currentTotalMins >= targetEnd && currentTotalMins <= targetEnd + 2) {
          const key = `havfood_fired_end_${todayIso}_${meal}_${mealEndReminderMinutes}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "1");
            fireNotification(
              `HAVFOOD — ${meal} Ending Soon`,
              `${meal} ends in ${mealEndReminderMinutes} minutes at ${times[1]}. Don't miss your meal!`
            );
          }
        }
      }
    }
  }

  function monthLabel(ym) {
    if (!ym || typeof ym !== "string" || !ym.includes("-")) return ym || "";
    const [y, m] = ym.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  }

  $("testNotifBtn").onclick = async () => {
    const granted = await requestNotifPermission();
    if (granted) {
      fireNotification("HAVFOOD Reminder Test", "Meal notifications are functioning properly on this device!");
      const baseUrl = getApiBaseUrl();
      if (baseUrl && "serviceWorker" in navigator && "PushManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const rawSub = sub.toJSON ? sub.toJSON() : {};
            fetch(`${baseUrl}/api/push/test`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription: {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: rawSub.keys?.p256dh || "",
                    auth: rawSub.keys?.auth || ""
                  }
                }
              })
            }).catch(() => {});
          }
        } catch (_) {}
      }
    }
  };

  $("hfReminderBtn").onclick = () => {
    $("hfMenuOverlay").classList.add("hidden");
    $("reminderModal").classList.remove("hidden");
    setupReminders();
  };

  // ============================================================================
  // CHANGE MONTH (Dynamic from menu data)
  // ============================================================================
  function getAvailableMonths() {
    const data = window.HAVFOOD_MENU || {};
    const months = new Set();
    Object.values(data).forEach(sheet => {
      if (sheet && typeof sheet === "object") {
        Object.keys(sheet).forEach(date => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            months.add(date.slice(0, 7));
          }
        });
      }
    });
    return Array.from(months).sort();
  }

  $("hfChangeMonthBtn").onclick = () => {
    $("hfMenuOverlay").classList.add("hidden");
    const select = $("hfMonthSelect");
    select.innerHTML = "";
    const months = getAvailableMonths();
    months.forEach(ym => {
      const [y, m] = ym.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const opt = document.createElement("option");
      opt.value = ym;
      opt.textContent = label;
      select.appendChild(opt);
    });
    const currentYm = selectedDate.slice(0, 7);
    if (select.querySelector(`option[value="${currentYm}"]`)) {
      select.value = currentYm;
    }
    $("hfMonthModal").classList.remove("hidden");
  };

  $("hfApplyMonth").onclick = () => {
    const chosenMonth = $("hfMonthSelect").value;
    if (!chosenMonth) return;
    const allDates = [];
    const data = window.HAVFOOD_MENU || {};
    Object.values(data).forEach(sheet => {
      if (sheet && typeof sheet === "object") {
        Object.keys(sheet).forEach(d => {
          if (d.startsWith(chosenMonth) && !allDates.includes(d)) {
            allDates.push(d);
          }
        });
      }
    });
    allDates.sort();
    if (!allDates.length) return;

    const todayLocal = localISO(new Date());
    if (todayLocal.startsWith(chosenMonth) && allDates.includes(todayLocal)) {
      selectedDate = todayLocal;
    } else {
      selectedDate = allDates[0];
    }

    $("hfMonthModal").classList.add("hidden");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const [y, m] = chosenMonth.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    toast(`Switched to ${label}`);
  };

  // ============================================================================
  // QUERIES & SUGGESTIONS
  // ============================================================================
  $("hfQueriesBtn").onclick = () => {
    $("hfMenuOverlay").classList.add("hidden");
    const statusEl = $("hfQuerySuccess");
    if (statusEl) statusEl.classList.add("hidden");
    $("hfQueryModal").classList.remove("hidden");
  };

  $("hfQueryForm").onsubmit = e => {
    e.preventDefault();
    const category = $("hfQueryCategory").value;
    const message = $("hfQueryMessage").value.trim();
    if (!message) return;

    const submission = {
      id: "Q" + Date.now(),
      category,
      message,
      createdAt: new Date().toISOString(),
      status: "Pending"
    };

    const stored = JSON.parse(localStorage.getItem("havfood_queries") || "[]");
    stored.push(submission);
    localStorage.setItem("havfood_queries", JSON.stringify(stored));

    $("hfQueryMessage").value = "";
    const statusEl = $("hfQuerySuccess");
    if (statusEl) {
      statusEl.textContent = "Your suggestion has been submitted successfully.";
      statusEl.classList.remove("hidden");
      setTimeout(() => {
        statusEl.classList.add("hidden");
        $("hfQueryModal").classList.add("hidden");
      }, 1600);
    } else {
      $("hfQueryModal").classList.add("hidden");
    }
    toast("Your suggestion has been submitted successfully.");
  };

  // ============================================================================
  // PROFILES: STUDENT PROFILE & ADMIN PROFILE
  // ============================================================================
  function ensureSheetJSLoaded() {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const s = document.createElement("script");
      s.src = "xlsx.mini.min.js";
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => reject(new Error("Failed to load Excel parser"));
      document.head.appendChild(s);
    });
  }

  function switchProfile(profile) {
    activeProfile = profile;
    sessionStorage.setItem("havfood_active_profile", profile);

    const isAdm = profile === "admin";
    $("studentView").classList.toggle("hidden", isAdm);
    $("adminView").classList.toggle("hidden", !isAdm);
    $("adminBadge").classList.toggle("hidden", !isAdm);

    // Update profile modal UI
    $("activeProfileName").textContent = isAdm ? "Admin Profile (mess_incharge)" : "Student Profile";
    $("optStudentProfile").classList.toggle("active", !isAdm);
    $("optAdminProfile").classList.toggle("active", isAdm);
    $("studentActiveMark").classList.toggle("hidden", isAdm);

    const admBtn = $("btnProfileAdminAction");
    if (isAdm) {
      admBtn.textContent = "Log Out";
      admBtn.onclick = logoutAdmin;
    } else {
      admBtn.textContent = "Log In";
      admBtn.onclick = () => {
        $("profileModal").classList.add("hidden");
        $("adminLoginModal").classList.remove("hidden");
      };
    }

    if (isAdm) {
      ensureSheetJSLoaded().catch(() => {});
      renderAdminDashboard();
    } else {
      render();
    }
  }

  $("profileBtn").onclick = () => {
    const isAdm = activeProfile === "admin";
    $("activeProfileName").textContent = isAdm ? "Admin Profile (mess_incharge)" : "Student Profile";
    $("optStudentProfile").classList.toggle("active", !isAdm);
    $("optAdminProfile").classList.toggle("active", isAdm);
    $("studentActiveMark").classList.toggle("hidden", isAdm);

    const admBtn = $("btnProfileAdminAction");
    if (isAdm) {
      admBtn.textContent = "Log Out";
      admBtn.onclick = logoutAdmin;
    } else {
      admBtn.textContent = "Log In";
      admBtn.onclick = () => {
        $("profileModal").classList.add("hidden");
        $("adminLoginModal").classList.remove("hidden");
      };
    }
    $("profileModal").classList.remove("hidden");
  };

  $("optStudentProfile").onclick = () => {
    if (activeProfile === "admin") {
      switchProfile("student");
      $("profileModal").classList.add("hidden");
      toast("Switched to Student Profile");
    }
  };

  // ============================================================================
  // ADMIN AUTHENTICATION
  // Credentials: mess_incharge / @VITmess123
  //
  // SECURITY LIMITATION NOTICE:
  // The login verification below is a frontend access gate appropriate for this
  // client-side static PWA. Production deployment authentication should be
  // migrated to Firebase Auth, Supabase, or another secure backend service.
  // ============================================================================
  const ADMIN_USER = "mess_incharge";
  const ADMIN_PASS = "@VITmess123";

  $("adminLoginForm").onsubmit = e => {
    e.preventDefault();
    const u = $("adminUser").value.trim();
    const p = $("adminPass").value;
    const errBox = $("adminLoginErr");

    if (u === ADMIN_USER && p === ADMIN_PASS) {
      errBox.classList.add("hidden");
      $("adminUser").value = "";
      $("adminPass").value = "";
      $("adminLoginModal").classList.add("hidden");
      switchProfile("admin");
      toast("Welcome, Mess Incharge! Admin Profile active.");
    } else {
      errBox.textContent = "Invalid username or password. Please verify your credentials.";
      errBox.classList.remove("hidden");
    }
  };

  function logoutAdmin() {
    $("profileModal").classList.add("hidden");
    switchProfile("student");
    toast("Logged out of Admin Profile");
  }

  $("adminLogoutBtn").onclick = logoutAdmin;
  $("adminBackToStudentBtn").onclick = () => {
    switchProfile("student");
    toast("Viewing Student Profile menu");
  };

  // ============================================================================
  // ============================================================================
  // ADMIN DASHBOARD & EXCEL MENU IMPORTER — BACKEND VERSION
  // ============================================================================
  // Excel files are now uploaded to the Node/Express backend.
  // The backend parses the workbook and stores the menu in SQLite.
  // This keeps the existing HAVFOOD UI, profile system, reminder system,
  // hamburger menu, PWA install flow and all other original functionality.
  // ============================================================================

  let selectedExcelFile = null;
  let adminSelectedMonth = "";

  function setExportButtonsState(enabled) {
    const ids = [
      "btnDownloadMenuJs",
      "btnCopyMenuJs",
      "btnSaveLocal"
    ];

    ids.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.disabled = !enabled;
    });
  }
  function renderAdminDashboard() {
    const monthEl = $("excelMonthInput");

    if (monthEl) {
      if (adminSelectedMonth) {
        monthEl.value = adminSelectedMonth;
      } else if (monthEl.value) {
        adminSelectedMonth = monthEl.value;
      } else {
        const now = new Date();
        const nextMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1
        );

        adminSelectedMonth = localISO(nextMonth).slice(0, 7);
        monthEl.value = adminSelectedMonth;
      }
    }

    renderStoredMonths();
    setExportButtonsState(false);
  }

  function renderStoredMonths() {
    const list = $("adminMonthsList");
    if (!list) return;

    const available = getAvailableMonths();

    list.innerHTML = available.map(ym => {
      const [y, m] = ym.split("-").map(Number);
      const label = new Date(y, m - 1, 1)
        .toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        });

      const isBuiltin = ym === "2026-09";

      return `
        <div class="month-item-card">
          <div class="month-item-info">
            <b>${label} (${ym})</b>
            <small>
              ${isBuiltin
                ? "Permanent Official Menu — Built-in"
                : "Stored in HAVFOOD Database"}
            </small>
          </div>

          <div class="month-item-actions">
            <span class="builtin-tag">
              ${isBuiltin ? "Built-in" : "Database"}
            </span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Database deletion is intentionally not exposed from the frontend yet.
  // This prevents accidentally deleting a month's shared database data.
  function deleteImportedMonth(ym) {
    toast(`${ym} is stored in the HAVFOOD database. No frontend deletion is enabled.`);
  }

  const dropLabel = $("excelDropLabel");
  const fileInput = $("excelFileInput");
  const monthInputEl = $("excelMonthInput");

  if (monthInputEl) {
    const syncMonth = () => {
      if (monthInputEl.value) {
        adminSelectedMonth = monthInputEl.value;
      }
    };
    monthInputEl.addEventListener("input", syncMonth);
    monthInputEl.addEventListener("change", syncMonth);
  }

  if (dropLabel) {
    ["dragenter", "dragover"].forEach(ev => {
      dropLabel.addEventListener(ev, e => {
        e.preventDefault();
        dropLabel.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(ev => {
      dropLabel.addEventListener(ev, e => {
        e.preventDefault();
        dropLabel.classList.remove("dragover");
      });
    });

    dropLabel.addEventListener("drop", e => {
      if (
        e.dataTransfer.files &&
        e.dataTransfer.files[0]
      ) {
        handleExcelFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", e => {
      if (
        e.target.files &&
        e.target.files[0]
      ) {
        handleExcelFile(e.target.files[0]);
      }
    });
  }

  function showValidation(type, message) {
    const box = $("excelValidationBox");
    if (!box) return;

    box.className = `validation-box ${type}`;
    box.innerHTML = message;
    box.classList.remove("hidden");
  }

  function resetExcelUI() {
    const preview = $("excelPreviewContainer");
    if (preview) preview.classList.add("hidden");

    const guide = $("githubPublishGuide");
    if (guide) guide.classList.add("hidden");

    const status = $("publishStatusText");
    if (status) {
      status.className = "status-pill pending";
      status.textContent = "Awaiting Excel Upload";
    }
  }

  function handleExcelFile(file) {
    const monthEl = $("excelMonthInput");
    const capturedMonth = (monthEl && monthEl.value) ? monthEl.value : adminSelectedMonth;
    if (capturedMonth && /^\d{4}-\d{2}$/.test(capturedMonth)) {
      adminSelectedMonth = capturedMonth;
    }
    selectedExcelFile = null;
    resetExcelUI();
    setExportButtonsState(false);

    // Explicitly guarantee that the month field in the DOM is preserved
    if (monthEl && adminSelectedMonth) {
      monthEl.value = adminSelectedMonth;
    }

    const selectedMonth = adminSelectedMonth || (monthEl ? monthEl.value : "");

    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
      showValidation(
        "error",
        "<b>Invalid File Format</b><br>Please select an Excel file (.xlsx or .xls)."
      );
      return;
    }

    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
      showValidation(
        "error",
        "<b>Select Month First</b><br>Please select a valid target month before uploading the Excel file."
      );
      return;
    }

    selectedExcelFile = file;

    const title = $("excelDropTitle");
    if (title) title.textContent = file.name;

    const sub = $("excelDropSub");
    if (sub) {
      sub.textContent =
        `${(file.size / 1024).toFixed(1)} KB — Selected for upload`;
    }

    showValidation(
      "loading",
      `Uploading <b>${escapeHtml(file.name)}</b> for <b>${escapeHtml(selectedMonth)}</b> to the HAVFOOD shared database...`
    );

    uploadExcelToBackend(file, selectedMonth);
  }

  async function uploadExcelToBackend(file, selectedMonth) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("month", selectedMonth);

      const apiUrl = `${getApiBaseUrl()}/api/admin/menu`;
      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          body: formData
        }
      );

      let result = null;

      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (!response.ok || !result || !result.success) {
        throw new Error(
          result?.message ||
          `Backend returned ${response.status}`
        );
      }

      const inserted =
        Number(result.itemsInserted || 0);

      showValidation(
        "success",
        `<b>Menu uploaded successfully!</b><br>` +
        `${escapeHtml(monthLabel(selectedMonth))} is now stored in the shared HAVFOOD database.` +
        `<br>${inserted} menu items saved.`
      );

      const status = $("publishStatusText");
      if (status) {
        status.className = "status-pill success";
        status.textContent = "✅ Published to Shared Database";
      }

      // Reload the frontend from the database so the new menu becomes visible.
      await loadMenuFromBackend();
      adminSelectedMonth = selectedMonth;
      renderAdminDashboard();
      const monthEl = $("excelMonthInput");
      if (monthEl) monthEl.value = adminSelectedMonth;

      toast(
        `✅ ${monthLabel(selectedMonth)} menu uploaded successfully.`
      );

    } catch (error) {
      console.error(
        "❌ HAVFOOD Excel upload failed:",
        error
      );

      showValidation(
        "error",
        `<b>Upload Failed</b><br>${escapeHtml(error.message || "Could not upload Excel file.")}`
      );

      const status = $("publishStatusText");
      if (status) {
        status.className = "status-pill pending";
        status.textContent = "⚠️ Upload Failed";
      }
    }
  }

  // The old browser-side Excel parser/export flow is intentionally disabled.
  // These compatibility functions prevent old HTML references from throwing.
  function processWorkbook() {
    showValidation(
      "error",
      "The Excel parser now runs on the HAVFOOD backend. Please select the Excel file again."
    );
  }

  function parseMenuRows() {
    return {};
  }

  function parseDateCell() {
    return null;
  }

  function parseDishesForDate(value) {
    if (value === undefined || value === null) return [];
    return String(value)
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function splitDishItems(value) {
    return parseDishesForDate(value);
  }

  // Old export buttons remain part of the existing HTML, but they are no longer
  // used because the database is now the source of truth.
  [
    "btnDownloadMenuJs",
    "btnCopyMenuJs"
  ].forEach(id => {
    const btn = $(id);
    if (!btn) return;

    btn.disabled = true;
    btn.onclick = e => {
      e.preventDefault();
      toast("Excel menus are now managed through the HAVFOOD database.");
    };
  });

  const saveLocalBtn = $("btnSaveLocal");
  if (saveLocalBtn) {
    saveLocalBtn.disabled = true;
    saveLocalBtn.onclick = e => {
      e.preventDefault();
      toast("Local menu export is disabled. The database is now the source of truth.");
    };
  }

  // Toast Utility
  function toast(t) {
    const el = $("toast");
    if (!el) return;
    el.textContent = t;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
  }

  // PWA Install Prompt
  let deferred;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferred = e;
    $("installBtn").classList.remove("hidden");
    $("installBtn").onclick = async () => {
      deferred.prompt();
      await deferred.userChoice;
      $("installBtn").classList.add("hidden");
    };
  });

  // ============================================================================
  // PWA SERVICE WORKER & RELIABLE MOBILE UPDATE LIFECYCLE
  // Active update checks, visibility change refresh, and safe single reload
  // ============================================================================
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then(reg => {
        // 1. Actively request an update check from the network on startup
        reg.update().catch(() => {});

        // 2. Check for updates whenever the mobile PWA is resumed from background
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        });

        // 3. Periodic background check every 30 minutes while app remains open
        setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);

        // Helper to prompt user when an updated worker is available
        const showUpdateBanner = () => {
          const banner = $("pwaUpdateBanner");
          if (banner) banner.classList.remove("hidden");
        };

        // If a worker is already waiting in background, display banner immediately
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }

        // Listen for new worker installs
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      }).catch(err => {
        console.warn("[PWA] Service Worker registration failed:", err);
      });

      // Safe, single-reload controller change handler (prevents reload loops)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const refreshBtn = $("pwaUpdateRefreshBtn");
      if (refreshBtn) {
        refreshBtn.onclick = () => {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (reg && reg.waiting) {
              reg.waiting.postMessage("skipWaiting");
            } else {
              window.location.reload();
            }
          });
        };
      }
    });
  }

  // Initialize Profile and Active Views
  if (activeProfile === "admin") {
    switchProfile("admin");
  } else {
    render();
  }

  // Asynchronously fetch latest menu from shared database in background (non-blocking)
  loadMenuFromBackend();

  // Background/Foreground sync: re-sync and check reminders when app becomes visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      loadMenuFromBackend();
      checkReminders();
    }
  });

  // Active Loops: Status clock (1s) & Reminders check (15s)
  setInterval(renderStatus, 1000);
  setInterval(checkReminders, 15000);
  checkReminders();
})();