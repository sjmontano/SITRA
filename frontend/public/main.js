document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // Count-up stats with IntersectionObserver
  const statValues = document.querySelectorAll(".stat-value");
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target.dataset.done !== "true") {
        entry.target.dataset.done = "true";
        const valueEl = entry.target.querySelector(".count");
        if (!valueEl) return;
        const valueContainer = entry.target.querySelector(".stat-value");
        const target = parseFloat(valueContainer.dataset.target);
        const decimals = parseInt(valueContainer.dataset.decimals, 10);
        const suffixEl = entry.target.querySelector(".suffix");
        const suffix = suffixEl ? suffixEl.textContent : "";
        const duration = 1500 + Math.floor(Math.random() * 500);
        const start = performance.now();

        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = easeOutCubic(progress);
          valueEl.textContent = (target * eased).toFixed(decimals);
          if (progress < 1) requestAnimationFrame(tick);
          else valueEl.textContent = target.toFixed(decimals);
        };
        requestAnimationFrame(tick);
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll(".stat").forEach((stat) => {
    observer.observe(stat);
  });

  // SITRA verify / transfer lookup
  const rid = document.getElementById("resourceId");
  const go = (base) => {
    const v = (rid && rid.value || "").trim();
    if (!v) { if (rid) rid.focus(); return; }
    window.location.href = base + encodeURIComponent(v);
  };
  const btnVerify = document.getElementById("btnVerify");
  const btnTransfer = document.getElementById("btnTransfer");
  const btnConsultar = document.getElementById("btnConsultar");
  if (btnVerify) btnVerify.addEventListener("click", () => go("/verify/"));
  if (btnTransfer) btnTransfer.addEventListener("click", () => go("/transferir/"));
  if (btnConsultar) btnConsultar.addEventListener("click", () => {
    const v = (rid && rid.value || "").trim();
    if (!v) { if (rid) rid.focus(); return; }
    window.location.href = "/consultar?id=" + encodeURIComponent(v);
  });
  if (rid) rid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const v = (rid.value || "").trim();
    if (v) window.location.href = "/consultar?id=" + encodeURIComponent(v);
  });

  // Mobile menu toggle (if exists)
  const menu = document.getElementById("mobileMenu");
  if (!menu) return;

  const burger = document.createElement("button");
  burger.className = "burger";
  burger.innerHTML = '<span></span><span></span><span></span>';
  burger.setAttribute("aria-label", "Menu");
  burger.setAttribute("aria-expanded", "false");
  document.querySelector(".header").appendChild(burger);

  burger.addEventListener("click", () => {
    const expanded = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", !expanded);
    menu.classList.toggle("open", !expanded);
    document.body.classList.toggle("menu-open", !expanded);
  });

  menu.addEventListener("click", (e) => {
    if (e.target === menu) closeMenu();
  });

  document.querySelectorAll(".menu-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMenu();
  });

  function closeMenu() {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
});