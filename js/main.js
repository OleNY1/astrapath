(function () {
  const root = document.documentElement;
  const banner = document.getElementById("banner");
  const header = document.getElementById("header");
  const hero = document.querySelector(".hero");
  const menu = document.getElementById("menu");
  const search = document.getElementById("search");
  const menuButton = document.getElementById("menu-open");
  const searchButton = document.getElementById("search-open");
  const queryInput = document.getElementById("route-query");
  const result = document.getElementById("route-result");
  const suggestions = document.getElementById("suggestions");

  function syncChrome() {
    if (!banner) return;
    const height = root.classList.contains("banner-off") ? 0 : banner.offsetHeight;
    root.style.setProperty("--banner-h", height + "px");
  }

  document.getElementById("banner-close").addEventListener("click", function () {
    root.classList.add("banner-off");
    try { sessionStorage.setItem("astrapath-banner", "off"); } catch (e) {}
    syncChrome();
    onScroll();
  });

  function onScroll() {
    const y = window.scrollY;
    const pastHero = hero.getBoundingClientRect().bottom <= header.offsetHeight + 8;
    header.classList.toggle("is-scrolled", y > 8);
    header.classList.toggle("is-light", pastHero);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    syncChrome();
    onScroll();
  });
  syncChrome();
  onScroll();

  function closeMenu() {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    root.classList.remove("nav-open");
  }

  function openMenu() {
    closeSearch();
    menu.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute("aria-label", "Close menu");
    root.classList.add("nav-open");
    const first = menu.querySelector("a");
    if (first) first.focus();
  }

  function closeSearch() {
    search.hidden = true;
    searchButton.setAttribute("aria-expanded", "false");
    root.classList.remove("search-open");
  }

  function openSearch(prefill) {
    closeMenu();
    search.hidden = false;
    searchButton.setAttribute("aria-expanded", "true");
    root.classList.add("search-open");
    if (typeof prefill === "string") {
      queryInput.value = prefill;
      renderRoute(prefill);
    }
    queryInput.focus();
  }

  menuButton.addEventListener("click", function () {
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  searchButton.addEventListener("click", function () {
    if (search.hidden) openSearch();
    else closeSearch();
  });

  document.getElementById("search-close").addEventListener("click", function () {
    closeSearch();
    searchButton.focus();
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
      closeSearch();
    });
  });

  document.querySelectorAll("[data-open-search]").forEach(function (button) {
    button.addEventListener("click", function () { openSearch(); });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!search.hidden) {
      closeSearch();
      searchButton.focus();
    } else if (!menu.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });

  const routes = [
    {
      test: function (q) { return /405|hamilton|discussion|dead end/.test(q); },
      place: "Room 405",
      from: "Floor 4 · from the stairs",
      steps: [
        "Turn left at the top of the stairs.",
        "405 is around the corner, on your left."
      ],
      note: "Illustration, from a Columbia first-year’s account. Past 410 is a dead end."
    },
    {
      test: function (q) { return /quiet|wait|mudd|print|restroom|2\s?pm/.test(q); },
      place: "Somewhere quiet before 2 pm",
      from: "Mudd · asked in plain words",
      steps: [
        "AI reads this as a place to wait, not a room number.",
        "The map returns a real seat on the way to the next room.",
        "Follow-up questions stay in plain words. The hallway still comes from the map."
      ],
      note: "AI never invents a hallway. If the building model has no match, AstraPath says so."
    },
    {
      test: function (q) { return /fountain|water|northwest|west gate|floor 5|library/.test(q); },
      place: "Water fountain, library side",
      from: "Northwest Corner · West Gate, floor 1",
      steps: [
        "Stairs from floor 1 to floor 2.",
        "Escalator from floor 2 to floor 4.",
        "Library stairs to floor 5."
      ],
      note: "A real Columbia demo route. 7 steps · about 2 min · 3 rides · 2 changes."
    },
    {
      test: function (q) { return /step|elevator|accessible|ramp|512|wheelchair/.test(q); },
      place: "Room 512",
      from: "Step-free",
      steps: [
        "Elevator to 5. This car serves floors 1, 3, and 5.",
        "Turn right.",
        "512 is the third door on your right."
      ],
      note: "Step-free is its own route. The elevator is named, and so are the floors it reaches."
    }
  ];

  function renderRoute(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) {
      result.innerHTML = "";
      suggestions.hidden = false;
      return;
    }
    const match = routes.find(function (route) { return route.test(q); });
    suggestions.hidden = true;
    if (!match) {
      result.innerHTML = '<p class="route-empty">This preview only answers a few Columbia examples. Routes on the live map come from the building itself. Try 405, a fountain on floor 5, or a step-free way to 512.</p>';
      return;
    }
    const steps = match.steps.map(function (step, index) {
      const n = String(index + 1).padStart(2, "0");
      return "<li><span>" + n + "</span><p>" + step + "</p></li>";
    }).join("");
    result.innerHTML =
      '<article class="route-card"><p class="kicker">Preview route</p><h3>' + match.place + "</h3><p class=\"route-from\">" + match.from + "</p><ol>" + steps + "</ol><p class=\"route-note\">" + match.note + "</p></article>";
  }

  queryInput.addEventListener("input", function () { renderRoute(queryInput.value); });

  document.querySelectorAll("[data-query]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const value = chip.getAttribute("data-query");
      queryInput.value = value;
      renderRoute(value);
      queryInput.focus();
    });
  });

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(function (tab) {
    return document.getElementById(tab.getAttribute("aria-controls"));
  });

  function selectTab(index) {
    tabs.forEach(function (tab, i) {
      const selected = i === index;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { selectTab(index); });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const next = event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
      selectTab(next);
      tabs[next].focus();
    });
  });

  document.getElementById("feature-next").addEventListener("click", function () {
    const current = tabs.findIndex(function (tab) { return tab.getAttribute("aria-selected") === "true"; });
    selectTab((current + 1) % tabs.length);
  });

  document.getElementById("feature-prev").addEventListener("click", function () {
    const current = tabs.findIndex(function (tab) { return tab.getAttribute("aria-selected") === "true"; });
    selectTab((current - 1 + tabs.length) % tabs.length);
  });

  const form = document.getElementById("waitlist");
  const error = document.getElementById("form-error");
  const thanks = document.getElementById("thanks");
  const thanksCopy = document.getElementById("thanks-copy");

  function showError(message) {
    error.hidden = false;
    error.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    error.hidden = true;
    const data = new FormData(form);
    if (String(data.get("company") || "").trim()) {
      form.hidden = true;
      thanks.hidden = false;
      thanksCopy.textContent = "Thanks. We’ll be in touch.";
      thanks.focus();
      return;
    }
    const email = String(data.get("email") || "").trim();
    if (!email) {
      showError("Enter an email address.");
      document.getElementById("email").focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("That email doesn’t look complete.");
      document.getElementById("email").focus();
      return;
    }
    const audience = String(data.get("audience") || "walker");
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem("astrapath-waitlist") || "[]"); } catch (e) {}
    const already = existing.some(function (item) { return item.email.toLowerCase() === email.toLowerCase(); });
    if (!already) {
      existing.push({ email: email, audience: audience, at: new Date().toISOString() });
      try { localStorage.setItem("astrapath-waitlist", JSON.stringify(existing)); } catch (e) {}
    }
    form.hidden = true;
    thanks.hidden = false;
    if (already) {
      thanksCopy.textContent = "This email is already on the list in this browser.";
    } else if (audience === "building") {
      thanksCopy.textContent = "Thanks. We’ll follow up about your building.";
    } else {
      thanksCopy.textContent = "We’ll email you when your building is mapped.";
    }
    thanks.focus();
  });

  document.getElementById("waitlist-reset").addEventListener("click", function () {
    form.hidden = false;
    thanks.hidden = true;
    form.reset();
    document.getElementById("email").focus();
  });

  const heroVideo = document.getElementById("hero-video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }
})();
