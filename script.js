(() => {
  const RAW = window.HAVFOOD_MENU || {};
  const MEAL_TIMES = {
    Breakfast: ["07:30", "09:30"],
    Lunch: ["12:30", "14:30"],
    Snacks: ["16:30", "18:00"],
    Dinner: ["19:30", "21:30"]
  };
  const $ = id => document.getElementById(id);

  function localISO(d) {
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  }

  let selectedDate = localISO(new Date());
  let mess = "Veg & Non-Veg";
  let reminderMinutes = Number(localStorage.getItem("havfoodReminderMinutes") || 10);

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
  document.querySelectorAll("[data-mess]").forEach(b => {
    b.onclick = () => {
      mess = b.dataset.mess;
      document.querySelectorAll("[data-mess]").forEach(x => x.classList.toggle("active", x === b));
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

  // HAMBURGER MENU DRAWER
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

  // 1. REMINDERS (Preserving existing logic via Hamburger)
  function setupReminders() {
    const opts = [5, 10, 15, 20, 30];
    $("reminderOptions").innerHTML = opts.map(n => `<button data-min="${n}" class="${n === reminderMinutes ? "active" : ""}">${n} min</button>`).join("");
    document.querySelectorAll("[data-min]").forEach(b => {
      b.onclick = () => {
        reminderMinutes = Number(b.dataset.min);
        localStorage.setItem("havfoodReminderMinutes", reminderMinutes);
        document.querySelectorAll("[data-min]").forEach(x => x.classList.toggle("active", x === b));
        toast(`Reminder set to ${reminderMinutes} minutes before`);
      };
    });
    const toggle = $("reminderToggle");
    toggle.checked = localStorage.getItem("havfoodReminders") === "on";
    toggle.onchange = async () => {
      if (toggle.checked) {
        if (!("Notification" in window)) {
          toast("Notifications are not supported here");
          toggle.checked = false;
          return;
        }
        const p = await Notification.requestPermission();
        if (p !== "granted") {
          toast("Notification permission was not granted");
          toggle.checked = false;
          return;
        }
        localStorage.setItem("havfoodReminders", "on");
        toast("Reminders enabled");
      } else {
        localStorage.setItem("havfoodReminders", "off");
        toast("Reminders disabled");
      }
    };
  }

  $("hfReminderBtn").onclick = () => {
    $("hfMenuOverlay").classList.add("hidden");
    $("reminderModal").classList.remove("hidden");
    setupReminders();
  };

  // 2. CHANGE MONTH (Dynamic from menu data)
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

  // 3. QUERIES & SUGGESTIONS (Local storage & ready for future backend)
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

  // Toast Utility
  function toast(t) {
    $("toast").textContent = t;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2200);
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

  // Service Worker Registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // Initial Render & Timer Loop
  render();
  setInterval(renderStatus, 1000);
})();