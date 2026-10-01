(() => {
  const xhr = new XMLHttpRequest();

  xhr.open(
    "GET",
    "https://havfood-backend.onrender.com/api/menu",
    false
  );

  try {
    xhr.send();

    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      window.HAVFOOD_MENU = response.data || {};
      console.log("HAVFOOD: October menu loaded");
    } else {
      console.error("HAVFOOD menu loading failed:", xhr.status);
      window.HAVFOOD_MENU = {};
    }
  } catch (error) {
    console.error("HAVFOOD menu loading error:", error);
    window.HAVFOOD_MENU = {};
  }
})();
