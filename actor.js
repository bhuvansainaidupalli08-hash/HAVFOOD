/**
 * HAVFOOD — Meal-Wise Actor Module
 * Lightweight, replaceable, zero external dependencies.
 *
 * Mappings:
 *  - Breakfast (07:30 – 09:30): Shah Rukh Khan
 *  - Lunch (12:30 – 14:30): Allu Arjun
 *  - Snacks (16:30 – 18:00): Mammootty
 *  - Dinner (19:30 – 21:30): Dr. G. Viswanathan (VIT Founder)
 */

((window) => {
  "use strict";

  const ACTORS = {
    Breakfast: {
      name: "Shah Rukh Khan",
      title: "Bollywood Icon",
      tagline: "Breakfast with King Khan",
      greeting: "Good morning! Start your day with great food and high spirits.",
      hadMealQuery: "Had your meal? Don't underestimate the power of a nutritious breakfast!",
      stickerImg: "assets/actors/shah_rukh_khan.png",
      avatarBg: "linear-gradient(135deg, #ff7a45, #ff4d4f)",
      badgeIcon: "👑",
      accentColor: "#ef6c3d"
    },
    Lunch: {
      name: "Allu Arjun",
      title: "Icon Star",
      tagline: "Afternoon Boost with Bunny",
      greeting: "Lunch time! Refuel your body and conquer the rest of your day.",
      hadMealQuery: "Had your meal? 'Taggedhe Le' — grab your lunch on time!",
      stickerImg: "assets/actors/allu_arjun.png",
      avatarBg: "linear-gradient(135deg, #10b981, #059669)",
      badgeIcon: "🔥",
      accentColor: "#10b981"
    },
    Snacks: {
      name: "Mammootty",
      title: "The Megastar",
      tagline: "Evening Chai with Mammookka",
      greeting: "Chai and snack break! Take a deep breath and unwind.",
      hadMealQuery: "Had your meal? A warm snack keeps your energy sharp and focused.",
      stickerImg: "assets/actors/mammootty.png",
      avatarBg: "linear-gradient(135deg, #8b5cf6, #6366f1)",
      badgeIcon: "⭐",
      accentColor: "#8b5cf6"
    },
    Dinner: {
      name: "Brahmanandam",
      title: "King of Comedy",
      tagline: "Dinner Time with Brahmanandam",
      greeting: "Good evening! A wholesome dinner nourishes tomorrow's excellence.",
      hadMealQuery: "Had your meal? Take good care of your health — success naturally follows.",
      stickerImg: "assets/actors/brahmanandam.png",
      avatarBg: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      badgeIcon: "🌟",
      accentColor: "#2563eb"
    }
  };

  const SCHEDULE = {
    Breakfast: { start: 7 * 60 + 30, end: 9 * 60 + 30, startStr: "07:30", endStr: "09:30" },
    Lunch:     { start: 12 * 60 + 30, end: 14 * 60 + 30, startStr: "12:30", endStr: "14:30" },
    Snacks:    { start: 16 * 60 + 30, end: 18 * 60 + 0,  startStr: "16:30", endStr: "18:00" },
    Dinner:    { start: 19 * 60 + 30, end: 21 * 60 + 30, startStr: "19:30", endStr: "21:30" }
  };

  function getCurrentActorState() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let activeMeal = null;
    let isFirst30Mins = false;
    let isDuringMeal = false;

    // Check if within any meal period
    for (const meal of ["Breakfast", "Lunch", "Snacks", "Dinner"]) {
      const times = SCHEDULE[meal];
      if (currentMins >= times.start && currentMins < times.end) {
        activeMeal = meal;
        isDuringMeal = true;
        if (currentMins < times.start + 30) {
          isFirst30Mins = true;
        }
        break;
      }
    }

    // If between meals, find next upcoming meal
    if (!activeMeal) {
      if (currentMins < SCHEDULE.Breakfast.start || currentMins >= SCHEDULE.Dinner.end) {
        activeMeal = "Breakfast";
      } else if (currentMins < SCHEDULE.Lunch.start) {
        activeMeal = "Lunch";
      } else if (currentMins < SCHEDULE.Snacks.start) {
        activeMeal = "Snacks";
      } else {
        activeMeal = "Dinner";
      }
    }

    const actor = ACTORS[activeMeal];
    const sched = SCHEDULE[activeMeal];

    let messageText = actor.greeting;
    let statusBadgeText = `${activeMeal} (${sched.startStr} – ${sched.endStr})`;

    if (isFirst30Mins) {
      messageText = actor.hadMealQuery;
      statusBadgeText = `🔔 Had your meal? • ${activeMeal} started`;
    } else if (isDuringMeal) {
      messageText = actor.greeting;
      statusBadgeText = `Serving Now • ${activeMeal}`;
    } else {
      statusBadgeText = `Next: ${activeMeal} at ${sched.startStr}`;
    }

    return {
      meal: activeMeal,
      actor,
      messageText,
      statusBadgeText,
      isFirst30Mins,
      isDuringMeal
    };
  }

  let lastRenderedMeal = null;
  let lastWas30Min = null;

  function renderActorCard() {
    const container = document.getElementById("hfActorCard");
    if (!container) return;

    // Session-based check: if dismissed by user in this session, keep hidden
    if (sessionStorage.getItem("hf_actor_dismissed") === "1") {
      container.classList.add("hidden");
      return;
    }

    const state = getCurrentActorState();

    // Prevent rebuilding DOM if state has not meaningfully shifted
    if (lastRenderedMeal === state.meal && lastWas30Min === state.isFirst30Mins && !container.classList.contains("hidden")) {
      return;
    }

    lastRenderedMeal = state.meal;
    lastWas30Min = state.isFirst30Mins;

    const initials = state.actor.name.split(" ").map(w => w[0]).join("").slice(0, 2);

    container.className = "hf-actor-card";
    container.innerHTML = `
      <div class="hf-actor-header">
        <div class="hf-actor-meta">
          <span class="hf-actor-badge ${state.isFirst30Mins ? "hf-badge-alert" : ""}">
            ${state.statusBadgeText}
          </span>
          <span class="hf-actor-name">${state.actor.name} <small class="hf-actor-role">(${state.actor.title})</small></span>
        </div>
        <button class="hf-actor-close-btn" id="hfActorCloseBtn" aria-label="Dismiss character greeting for this session">✕</button>
      </div>

      <div class="hf-actor-stage">
        <!-- Cloud-shaped Thought Bubble -->
        <div class="hf-thought-bubble-container">
          <div class="hf-thought-cloud ${state.isFirst30Mins ? "hf-thought-alert" : ""}" role="region" aria-label="Actor thought message">
            <p class="hf-thought-text">${state.messageText}</p>
            <div class="hf-thought-puff hf-puff-1" aria-hidden="true"></div>
            <div class="hf-thought-puff hf-puff-2" aria-hidden="true"></div>
            <div class="hf-thought-puff hf-puff-3" aria-hidden="true"></div>
          </div>
          <div class="hf-thought-trail" aria-hidden="true">
            <span class="hf-thought-dot hf-dot-lg"></span>
            <span class="hf-thought-dot hf-dot-md"></span>
            <span class="hf-thought-dot hf-dot-sm"></span>
          </div>
        </div>

        <!-- Realistic Full-Body PNG Character Sticker -->
        <div class="hf-actor-sticker-wrap">
          <img
            src="${state.actor.stickerImg}"
            alt="${state.actor.name} full-body sticker"
            class="hf-actor-sticker-img"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none'; var fb=document.getElementById('hfActorFallbackAvatar'); if(fb) fb.style.display='flex';"
          />
          <!-- Graceful Fallback Avatar (shown only if image fails to load) -->
          <div id="hfActorFallbackAvatar" class="hf-actor-avatar-wrap hf-actor-fallback" style="background:${state.actor.avatarBg}; display:none;" aria-hidden="true">
            <span class="hf-actor-avatar-icon">${state.actor.badgeIcon}</span>
            <span class="hf-actor-initials">${initials}</span>
          </div>
        </div>
      </div>
    `;

    container.classList.remove("hidden");

    const closeBtn = document.getElementById("hfActorCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        sessionStorage.setItem("hf_actor_dismissed", "1");
        container.classList.add("hidden");
      };
    }
  }

  // Auto-render on DOM ready to avoid blocking app initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderActorCard);
  } else {
    renderActorCard();
  }

  // Export to window for HAVFOOD core integration
  window.HAVFOOD_ACTOR = {
    render: renderActorCard,
    getState: getCurrentActorState,
    getActors: () => ACTORS
  };

})(window);
