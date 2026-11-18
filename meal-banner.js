/**
 * DINELY — Meal Banner Module
 * Clean, food-focused meal greeting. No actors or celebrities.
 * Shows a motivational food message relevant to the current meal period.
 * Styled with approved DINELY brand palette: Forest Green, Lime, Cream, Peach, Dark.
 */

((window) => {
  "use strict";

  const MEAL_MESSAGES = {
    Breakfast: {
      emoji: "🌅",
      title: "Good Morning!",
      messages: [
        "Start your day right — a great breakfast fuels a great day.",
        "Breakfast is the most important meal. Make it count!",
        "Morning energy comes from a wholesome breakfast. Dig in!"
      ],
      hadMealQuery: "Had breakfast yet? Don't skip it — your brain needs fuel!",
      accentColor: "#D8F36A", // Lime
      badgeColor: "#D8F36A",
      gradientBg: "linear-gradient(135deg, #123C32 0%, #1a4f42 100%)",
      textColor: "#F8F8F2"
    },
    Lunch: {
      emoji: "☀️",
      title: "Lunchtime!",
      messages: [
        "Refuel and recharge — a good lunch powers your afternoon.",
        "Take a proper break and enjoy your midday meal.",
        "Lunch is your midday reset. Eat well, perform better."
      ],
      hadMealQuery: "Had lunch yet? Head to the mess — your meal is ready!",
      accentColor: "#D8F36A", // Lime
      badgeColor: "#D8F36A",
      gradientBg: "linear-gradient(135deg, #123C32 0%, #16463a 100%)",
      textColor: "#F8F8F2"
    },
    Snacks: {
      emoji: "☕",
      title: "Snack Break!",
      messages: [
        "Evening snacks — the perfect pick-me-up between classes.",
        "Take a breather. A warm snack keeps energy sharp and focused.",
        "Chai time! Step away, relax, and snack well."
      ],
      hadMealQuery: "Evening snacks are on! A quick bite goes a long way.",
      accentColor: "#E8A66A", // Peach
      badgeColor: "#E8A66A",
      gradientBg: "linear-gradient(135deg, #123C32 0%, #1d463b 100%)",
      textColor: "#F8F8F2"
    },
    Dinner: {
      emoji: "🌙",
      title: "Dinner Time!",
      messages: [
        "End your day with a wholesome dinner. You've earned it!",
        "A nourishing dinner sets you up for a productive tomorrow.",
        "Wrap up the day with a great meal. Dining well matters."
      ],
      hadMealQuery: "Dinner is being served! Don't miss your evening meal.",
      accentColor: "#D8F36A", // Lime
      badgeColor: "#D8F36A",
      gradientBg: "linear-gradient(135deg, #123C32 0%, #0e2f27 100%)",
      textColor: "#F8F8F2"
    }
  };

  const SCHEDULE = {
    Breakfast: { start: 7 * 60 + 30, end: 9 * 60 + 30, startStr: "07:30", endStr: "09:30" },
    Lunch:     { start: 12 * 60 + 30, end: 14 * 60 + 30, startStr: "12:30", endStr: "14:30" },
    Snacks:    { start: 16 * 60 + 30, end: 18 * 60 + 0,  startStr: "16:30", endStr: "18:00" },
    Dinner:    { start: 19 * 60 + 30, end: 21 * 60 + 30, startStr: "19:30", endStr: "21:30" }
  };

  function getCurrentMealState() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let activeMeal = null;
    let isFirst30Mins = false;
    let isDuringMeal = false;

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

    const info = MEAL_MESSAGES[activeMeal];
    const sched = SCHEDULE[activeMeal];

    // Pick a message based on time (deterministic per hour)
    const msgIndex = now.getHours() % info.messages.length;
    let messageText = isDuringMeal
      ? (isFirst30Mins ? info.hadMealQuery : info.messages[msgIndex])
      : info.messages[msgIndex];

    let statusBadge;
    if (isDuringMeal && isFirst30Mins) {
      statusBadge = `🔔 ${activeMeal} just started`;
    } else if (isDuringMeal) {
      statusBadge = `Serving Now · ${activeMeal}`;
    } else {
      statusBadge = `Next: ${activeMeal} at ${sched.startStr}`;
    }

    return {
      meal: activeMeal,
      info,
      messageText,
      statusBadge,
      isFirst30Mins,
      isDuringMeal
    };
  }

  let lastRenderedMeal = null;
  let lastWas30Min = null;

  function renderMealBanner() {
    const container = document.getElementById("dnMealBanner");
    if (!container) return;

    if (sessionStorage.getItem("dn_banner_dismissed") === "1") {
      container.classList.add("hidden");
      return;
    }

    const state = getCurrentMealState();

    if (
      lastRenderedMeal === state.meal &&
      lastWas30Min === state.isFirst30Mins &&
      !container.classList.contains("hidden")
    ) {
      return;
    }

    lastRenderedMeal = state.meal;
    lastWas30Min = state.isFirst30Mins;

    container.className = "dn-meal-banner";
    container.style.background = state.info.gradientBg;
    container.style.border = "1px solid rgba(18, 60, 50, 0.2)";
    container.style.color = state.info.textColor;

    container.innerHTML = `
      <div class="dn-banner-inner">
        <div class="dn-banner-left">
          <span class="dn-meal-emoji" aria-hidden="true">${state.info.emoji}</span>
          <div class="dn-banner-text">
            <span class="dn-banner-badge ${state.isFirst30Mins ? "dn-badge-alert" : ""}" style="color:${state.info.badgeColor}; font-weight:800; letter-spacing:0.8px;">
              ${state.statusBadge}
            </span>
            <p class="dn-banner-msg" style="color:#F8F8F2;">${state.messageText}</p>
          </div>
        </div>
        <button class="dn-banner-close" id="dnBannerCloseBtn" aria-label="Dismiss" style="color:rgba(248,248,242,0.7); border-color:rgba(248,248,242,0.25);">✕</button>
      </div>
    `;

    container.classList.remove("hidden");

    const closeBtn = document.getElementById("dnBannerCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        sessionStorage.setItem("dn_banner_dismissed", "1");
        container.classList.add("hidden");
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderMealBanner);
  } else {
    renderMealBanner();
  }

  window.DINELY_BANNER = {
    render: renderMealBanner,
    getState: getCurrentMealState
  };

})(window);
