/* Fills every [data-t] element in index.html with its text from config.js */
document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = T(el.dataset.t); });
for (const a of ["aria-label", "placeholder", "alt", "content"])
  document.querySelectorAll(`[data-t-${a}]`).forEach((el) => el.setAttribute(a, T(el.getAttribute(`data-t-${a}`))));
