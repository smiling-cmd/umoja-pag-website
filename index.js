// ── NAVBAR SCROLL ──────────────────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener(
  "scroll",
  () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
  },
  { passive: true },
);

// ── ACTIVE NAV LINK (IntersectionObserver — smooth & accurate) ──
(function () {
  const links = document.querySelectorAll(".nav-links a[href^='#']");
  const sections = Array.from(document.querySelectorAll("section[id]"));
  if (!sections.length || !links.length) return;

  const navH = navbar ? navbar.offsetHeight : 80;
  const io = new IntersectionObserver(
    (entries) => {
      function visibleHeight(el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const top = Math.max(0, r.top);
        const bottom = Math.min(vh, r.bottom);
        return Math.max(0, bottom - top);
      }

      let best = null;
      let bestScore = 0;
      sections.forEach((s) => {
        const score = visibleHeight(s);
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      });
      if (!best) return;
      links.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + best.id);
      });
    },
    {
      rootMargin: `-${navH + 4}px 0px -40% 0px`,
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    },
  );
  sections.forEach((s) => io.observe(s));
})();

// ── MOBILE NAV TOGGLE ────────────────────────────────────────
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const navOverlay = document.getElementById("navOverlay");

function closeMobileNav() {
  navToggle.classList.remove("open");
  navLinks.classList.remove("open");
  navOverlay.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
}

function toggleMobileNav() {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navOverlay.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

if (navToggle && navLinks && navOverlay) {
  navToggle.addEventListener("click", toggleMobileNav);
  navOverlay.addEventListener("click", closeMobileNav);
  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeMobileNav);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────
if (!window.IntersectionObserver) {
  document
    .querySelectorAll(".reveal")
    .forEach((el) => el.classList.add("visible"));
} else {
  const ro = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          ro.unobserve(e.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el) => ro.observe(el));
}

// ── DIRECTIONS LINK ───────────────────────────────────────────
const directionsCard = document.getElementById("directionsCard");
const heroDirectionsLink = document.getElementById("heroDirectionsLink");
if (heroDirectionsLink && directionsCard) {
  heroDirectionsLink.addEventListener("click", () => {
    directionsCard.open = true;
  });
}

// ── CLOUDWATCH (eye-follower) ─────────────────────────────────
const cloudwatchAvatar = document.getElementById("cloudwatchAvatar");
const cloudwatchCopy = document.getElementById("cloudwatchCopy");
const cloudwatchPupils = Array.from(
  document.querySelectorAll(".cloudwatch-pupil"),
);
const cloudwatchPrivateFields = ["phone", "email"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const cloudwatchEmailField = document.getElementById("email");
const cloudwatchPhoneField = document.getElementById("phone");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let cloudwatchBlinkTimeout = null;
let cloudwatchMessageTimeout = null;
const cloudwatchDefaultMessage = cloudwatchCopy ? cloudwatchCopy.innerHTML : "";

function shakeCloudwatch() {
  if (!cloudwatchAvatar || reduceMotion.matches) return;
  cloudwatchAvatar.classList.remove("is-shaking");
  void cloudwatchAvatar.offsetWidth;
  cloudwatchAvatar.classList.add("is-shaking");
  window.setTimeout(() => cloudwatchAvatar.classList.remove("is-shaking"), 900);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function normalizePhoneNumber(phone) {
  const cleaned = phone.replace(/[\s().-]/g, "");
  if (/^0(7|1)\d{8}$/.test(cleaned)) return "+254" + cleaned.slice(1);
  if (/^254(7|1)\d{8}$/.test(cleaned)) return "+" + cleaned;
  return cleaned;
}
function isValidPhoneNumber(phone) {
  return /^\+254(7|1)\d{8}$/.test(normalizePhoneNumber(phone));
}
function showFieldError(field, message) {
  if (!field) return;
  field.style.borderColor = "#EF4444";
  field.focus();
  setCloudwatchClosed(false);
  setCloudwatchFrown(true);
  shakeCloudwatch();
  setCloudwatchMessage(message, { resetAfter: 2600 });
}
function clearFieldError(field) {
  if (!field) return;
  field.style.borderColor = "";
  setCloudwatchFrown(false);
}
function handleInvalidEmail() {
  showFieldError(cloudwatchEmailField, "Please enter a valid email address.");
}
function handleInvalidPhone() {
  showFieldError(
    cloudwatchPhoneField,
    "Please enter a valid Kenyan phone number.",
  );
}

function setCloudwatchClosed(closed) {
  if (!cloudwatchAvatar) return;
  cloudwatchAvatar.classList.toggle("eyes-closed", closed);
}
function setCloudwatchFrown(frown) {
  if (!cloudwatchAvatar) return;
  cloudwatchAvatar.classList.toggle("frown", frown);
}
function setCloudwatchMessage(
  message,
  { isHtml = false, resetAfter = 0 } = {},
) {
  if (!cloudwatchCopy) return;
  cloudwatchCopy[isHtml ? "innerHTML" : "textContent"] = message;
  clearTimeout(cloudwatchMessageTimeout);
  if (resetAfter > 0) {
    cloudwatchMessageTimeout = setTimeout(() => {
      cloudwatchCopy.innerHTML = cloudwatchDefaultMessage;
      setCloudwatchFrown(false);
    }, resetAfter);
  }
}
function updateCloudwatchEyes(e) {
  if (!cloudwatchAvatar || reduceMotion.matches) return;
  const ox = (e.clientX / window.innerWidth - 0.5) * 12;
  const oy = (e.clientY / window.innerHeight - 0.5) * 6;
  cloudwatchPupils.forEach((p) => {
    p.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px)`;
  });
}
function blinkCloudwatch() {
  if (!cloudwatchAvatar) return;
  if (cloudwatchPrivateFields.some((f) => document.activeElement === f)) return;
  setCloudwatchClosed(true);
  clearTimeout(cloudwatchBlinkTimeout);
  cloudwatchBlinkTimeout = setTimeout(() => setCloudwatchClosed(false), 180);
}
if (cloudwatchAvatar) {
  document.addEventListener("mousemove", updateCloudwatchEyes, {
    passive: true,
  });
  cloudwatchPrivateFields.forEach((f) => {
    f.addEventListener("focus", () => setCloudwatchClosed(true));
    f.addEventListener("blur", () => {
      setTimeout(() => {
        if (!cloudwatchPrivateFields.some((c) => document.activeElement === c))
          setCloudwatchClosed(false);
      }, 0);
    });
  });
  if (cloudwatchEmailField) {
    cloudwatchEmailField.addEventListener("input", () => {
      clearFieldError(cloudwatchEmailField);
      if (
        cloudwatchCopy &&
        cloudwatchCopy.textContent.trim() ===
          "Please enter a valid email address."
      ) {
        clearTimeout(cloudwatchMessageTimeout);
        cloudwatchCopy.innerHTML = cloudwatchDefaultMessage;
        setCloudwatchFrown(false);
      }
    });
    cloudwatchEmailField.addEventListener("blur", () => {
      const emailValue = cloudwatchEmailField.value.trim();
      if (emailValue && !isValidEmail(emailValue)) handleInvalidEmail();
    });
  }
  if (cloudwatchPhoneField) {
    cloudwatchPhoneField.addEventListener("input", () =>
      clearFieldError(cloudwatchPhoneField),
    );
    cloudwatchPhoneField.addEventListener("blur", () => {
      const phoneValue = cloudwatchPhoneField.value.trim();
      if (phoneValue && !isValidPhoneNumber(phoneValue)) handleInvalidPhone();
    });
  }
  if (!reduceMotion.matches) window.setInterval(blinkCloudwatch, 3000);
}

// ── QR CODE ───────────────────────────────────────────────────
// Default public site URL. Used whenever no per-browser override has been
// set via "Set public URL for QR" and we're not already being served from
// a real http(s) origin. Update this if the production domain changes.
const DEFAULT_SITE_BASE = "https://umojapagchurch.org";

function getSiteBase() {
  try {
    const stored = localStorage.getItem("umoja_site_base");
    if (stored) return stored.replace(/\/+$/, "");
  } catch (e) {}
  try {
    if (location.protocol && location.protocol.startsWith("http"))
      return location.origin + location.pathname;
  } catch (e) {}
  return DEFAULT_SITE_BASE;
}

function setSiteUrl() {
  const current = getSiteBase() || "";
  const val = window.prompt(
    "Enter the public base URL to encode in the QR (e.g. https://example.com). Leave blank to use current file URL:",
    current,
  );
  if (val === null) return; // cancelled
  try {
    if (val.trim())
      localStorage.setItem("umoja_site_base", val.trim().replace(/\/+$/, ""));
    else localStorage.removeItem("umoja_site_base");
  } catch (e) {
    console.warn("Could not save site URL to localStorage:", e);
  }
  renderQRCode();
}

function buildRegUrl() {
  const base = getSiteBase();
  if (base) return base.split("#")[0] + "#register";
  return window.location.href.split("#")[0] + "#register";
}

function renderQRCode() {
  const regUrl = buildRegUrl();
  const qrCanvas = document.getElementById("qrCanvas");
  if (!qrCanvas) return;
  qrCanvas.innerHTML = "";
  if (window.QRCode) {
    new QRCode(qrCanvas, {
      text: regUrl,
      width: 180,
      height: 180,
      colorDark: "#1A4B9C",
      colorLight: "#FFFFFF",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } else {
    qrCanvas.innerHTML = `<a href="${regUrl}">Open registration form</a>`;
  }
  const hint = document.getElementById("qrHint");
  if (hint)
    hint.style.display = location.protocol === "file:" ? "block" : "none";
}

// regenerate QR on load
renderQRCode();

// ── QR CODE MODAL (toggled via "Get QR Code to Print" button) ──
(function () {
  const toggleBtn = document.getElementById("qrToggleBtn");
  const overlay = document.getElementById("qrModalOverlay");
  const closeBtn = document.getElementById("qrModalClose");
  if (!toggleBtn || !overlay || !closeBtn) return;

  function openQrModal() {
    overlay.classList.add("open");
    closeBtn.focus();
  }
  function closeQrModal() {
    overlay.classList.remove("open");
    toggleBtn.focus();
  }

  toggleBtn.addEventListener("click", openQrModal);
  closeBtn.addEventListener("click", closeQrModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeQrModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open"))
      closeQrModal();
  });
})();

function shareWhatsApp() {
  const regUrl = buildRegUrl();
  window.open(
    "https://wa.me/?text=" +
      encodeURIComponent("✦ Register with Umoja P.A.G Church!\n\n" + regUrl),
    "_blank",
  );
}

function downloadQR() {
  const canvas = document.querySelector("#qrCanvas canvas");
  if (!canvas) {
    alert(
      "QR code is not ready yet. Please check your internet connection and try again.",
    );
    return;
  }
  const out = document.createElement("canvas");
  out.width = 320;
  out.height = 360;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 320, 360);
  ctx.fillStyle = "#D4A017";
  ctx.fillRect(0, 0, 320, 18);
  ctx.fillStyle = "#1A4B9C";
  ctx.fillRect(0, 342, 320, 18);
  ctx.drawImage(canvas, 70, 28, 180, 180);
  ctx.fillStyle = "#1A4B9C";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Umoja P.A.G Church", 160, 232);
  ctx.fillStyle = "#D4A017";
  ctx.font = "12px sans-serif";
  ctx.fillText("Scan to Register", 160, 252);
  ctx.fillStyle = "#6B7280";
  ctx.font = "11px sans-serif";
  ctx.fillText("Umoja, Nairobi", 160, 272);
  const a = document.createElement("a");
  a.download = "umoja-pag-register-qr.png";
  a.href = out.toDataURL();
  a.click();
}

function copyLink() {
  const btn = document.querySelector(".qr-cp");
  const regUrl = buildRegUrl();
  const showCopied = () => {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = "✅ Copied!";
    btn.style.background = "#D1FAE5";
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = "";
    }, 2000);
  };
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(regUrl)
      .then(showCopied)
      .catch(() => window.prompt("Copy this link:", regUrl));
  } else {
    window.prompt("Copy this link:", regUrl);
  }
}

// ── REGISTRATION FORM ─────────────────────────────────────────
const REGISTER_ENDPOINT = "/api/register";

// Show the "Which Cell Group?" selector only when it's relevant —
// cell groups are location-based, so new members need to pick one too.
const CELL_GROUP_TRIGGERS = ["Cell Group", "New Member Registration"];
const regForSelect = document.getElementById("regFor");
const cellGroupGroup = document.getElementById("cellGroupGroup");
const cellGroupSelect = document.getElementById("cellGroup");

function isCellGroupFieldNeeded() {
  return CELL_GROUP_TRIGGERS.includes(regForSelect ? regForSelect.value : "");
}

function syncCellGroupField() {
  if (!regForSelect || !cellGroupGroup || !cellGroupSelect) return;
  const needed = isCellGroupFieldNeeded();
  cellGroupGroup.style.display = needed ? "block" : "none";
  if (!needed) {
    cellGroupSelect.style.borderColor = "";
    cellGroupSelect.selectedIndex = 0;
  }
}

if (regForSelect) {
  regForSelect.addEventListener("change", syncCellGroupField);
  syncCellGroupField();
}
if (cellGroupSelect) {
  cellGroupSelect.addEventListener("change", () => {
    cellGroupSelect.style.borderColor = "";
  });
}

// Best-effort duplicate guard: a person shouldn't end up registered with
// two different cell groups. This only recognizes returning visitors on
// the same browser/device (via localStorage) — the authoritative check
// should also live server-side against phone number in the admin backend.
const CELL_GROUP_RECORDS_KEY = "umoja_cell_group_registrations";

function getCellGroupRecords() {
  try {
    return JSON.parse(localStorage.getItem(CELL_GROUP_RECORDS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getExistingCellGroupForPhone(phone) {
  if (!phone) return null;
  return getCellGroupRecords()[phone] || null;
}

function rememberCellGroupRegistration(phone, cellGroup) {
  if (!phone || !cellGroup) return;
  try {
    const records = getCellGroupRecords();
    records[phone] = cellGroup;
    localStorage.setItem(CELL_GROUP_RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Some browsers block localStorage in private or file modes.
  }
}

function getRegistrationPayload() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    phone: normalizePhoneNumber(document.getElementById("phone").value.trim()),
    email: document.getElementById("email").value.trim(),
    ageGroup: document.getElementById("ageGroup").value.trim(),
    area: document.getElementById("area").value.trim(),
    regFor: document.getElementById("regFor").value.trim(),
    cellGroup: isCellGroupFieldNeeded()
      ? document.getElementById("cellGroup").value.trim()
      : "",
    notes: document.getElementById("notes").value.trim(),
  };
}

function showRegistrationSuccess(message) {
  const successText = document.getElementById("formSuccessText");
  if (successText && message) successText.textContent = message;
  document.getElementById("formContent").style.display = "none";
  const s = document.getElementById("formSuccess");
  s.style.display = "block";
  s.scrollIntoView({ behavior: "smooth", block: "center" });
}

function saveRegistrationDraft(payload) {
  try {
    const key = "umoja_registration_drafts";
    const drafts = JSON.parse(localStorage.getItem(key) || "[]");
    drafts.push({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(drafts));
  } catch {
    // Some browsers block localStorage in private or file modes.
  }
}

async function submitForm() {
  const required = ["firstName", "lastName", "phone", "ageGroup", "regFor"];
  if (isCellGroupFieldNeeded()) required.push("cellGroup");
  const btn = document.getElementById("submitBtn");
  const err = document.getElementById("formError");
  const emailField = document.getElementById("email");
  const phoneField = document.getElementById("phone");
  err.style.display = "none";
  for (const id of required) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.style.borderColor = "#EF4444";
      el.focus();
      el.addEventListener(
        "input",
        () => {
          el.style.borderColor = "";
          setCloudwatchFrown(false);
        },
        { once: true },
      );
      setCloudwatchFrown(true);
      shakeCloudwatch();
      setCloudwatchMessage("Please complete all required fields.", {
        resetAfter: 2400,
      });
      return;
    }
  }
  if (!isValidPhoneNumber(phoneField.value.trim())) {
    err.textContent =
      "Please enter a valid Kenyan phone number, for example 0700 000 000 or +254 700 000 000.";
    err.style.display = "block";
    handleInvalidPhone();
    return;
  }
  const normalizedPhone = normalizePhoneNumber(phoneField.value.trim());
  if (isCellGroupFieldNeeded()) {
    const chosenCellGroup = cellGroupSelect.value.trim();
    const existingCellGroup = getExistingCellGroupForPhone(normalizedPhone);
    if (existingCellGroup && existingCellGroup !== chosenCellGroup) {
      err.textContent = `This phone number is already registered with the ${existingCellGroup} Cell Group. One person can only belong to one cell group — please contact the church office if you need to switch.`;
      err.style.display = "block";
      cellGroupSelect.style.borderColor = "#EF4444";
      cellGroupSelect.focus();
      return;
    }
  }
  if (emailField.value.trim() && !isValidEmail(emailField.value.trim())) {
    err.textContent = "Please enter a valid email address.";
    err.style.display = "block";
    handleInvalidEmail();
    return;
  }
  btn.disabled = true;
  btn.textContent = "Sending...";
  const payload = getRegistrationPayload();
  try {
    const res = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (payload.cellGroup) {
        rememberCellGroupRegistration(normalizedPhone, payload.cellGroup);
      }
      showRegistrationSuccess(
        "Thank you for registering. Our team will be in touch shortly. God bless you!",
      );
    } else {
      throw new Error((data.errors || []).join(", ") || data.message || "Submission failed.");
    }
  } catch (e) {
    saveRegistrationDraft(payload);
    err.innerHTML = 'Could not send your registration online. Your details were saved on this device, but please also reach us directly so we don\'t miss you: <a href="tel:+254796752298" style="color:#fecaca;text-decoration:underline;">call 0796 752 298</a> or <a href="mailto:info@umojapagchurch.org" style="color:#fecaca;text-decoration:underline;">email us</a>.';
    err.style.display = "block";
    console.error("Registration submission error:", e);
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Registration →";
  }
}

function resetForm() {
  ["firstName", "lastName", "phone", "email", "area", "notes"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  ["ageGroup", "regFor", "cellGroup"].forEach((id) => {
    document.getElementById(id).selectedIndex = 0;
  });
  syncCellGroupField();
  document.getElementById("formError").style.display = "none";
  document.getElementById("formSuccess").style.display = "none";
  document.getElementById("formContent").style.display = "block";
  const successText = document.getElementById("formSuccessText");
  if (successText)
    successText.textContent =
      "Thank you for registering. Our team will be in touch shortly. God bless you!";
}

// ── GALLERY LIGHTBOX ───────────────────────────────────────
(function () {
  const imgs = Array.from(document.querySelectorAll("#gallery img"));
  if (!imgs.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox hidden";
  lb.innerHTML = `
    <button class="close" aria-label="Close">✕</button>
    <button class="nav prev" aria-label="Previous">❮</button>
    <img src="" alt="" />
    <button class="nav next" aria-label="Next">❯</button>
  `;
  document.body.appendChild(lb);

  const lbImg = lb.querySelector("img");
  const btnClose = lb.querySelector(".close");
  const btnPrev = lb.querySelector(".prev");
  const btnNext = lb.querySelector(".next");

  let current = 0;

  function show(index) {
    current = (index + imgs.length) % imgs.length;
    const el = imgs[current];
    lbImg.src = el.src;
    lbImg.alt = el.alt || "Gallery image";
    lb.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function hide() {
    lb.classList.add("hidden");
    document.body.style.overflow = "";
  }

  imgs.forEach((img, i) => {
    img.addEventListener("click", () => show(i));
  });

  btnClose.addEventListener("click", hide);
  btnPrev.addEventListener("click", () => show(current - 1));
  btnNext.addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) hide();
  });
  window.addEventListener("keydown", (e) => {
    if (lb.classList.contains("hidden")) return;
    if (e.key === "Escape") hide();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });
})();

// Keep aria-current in sync with the visible `.active` nav link
(function () {
  const navLinks = document.querySelectorAll(".nav-links a");
  if (!navLinks.length) return;

  function syncAria() {
    navLinks.forEach((a) => a.removeAttribute("aria-current"));
    const active = document.querySelector(".nav-links a.active");
    if (active) active.setAttribute("aria-current", "page");
  }

  let t = 0;
  function throttledSync() {
    const now = Date.now();
    if (now - t > 120) {
      t = now;
      syncAria();
    }
  }

  document.addEventListener("DOMContentLoaded", syncAria);
  window.addEventListener("scroll", throttledSync, { passive: true });
  document.getElementById("navLinks")?.addEventListener("click", () => {
    setTimeout(syncAria, 40);
  });
})();

// Initial on-load active-link check
(function () {
  const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!links.length || !sections.length) return;

  function computeVisibleSize(rect) {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const top = Math.max(0, rect.top);
    const bottom = Math.min(vh, rect.bottom);
    return Math.max(0, bottom - top) * rect.width;
  }

  function setActiveByVisibility() {
    let best = null;
    let bestScore = 0;
    sections.forEach((s) => {
      const r = s.getBoundingClientRect();
      const score = computeVisibleSize(r);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    });
    if (best) {
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + best.id));
      document.querySelectorAll('.nav-links a').forEach((a) => a.removeAttribute('aria-current'));
      const active = document.querySelector('.nav-links a.active');
      if (active) active.setAttribute('aria-current', 'page');
    }
  }

  window.addEventListener('load', () => setTimeout(setActiveByVisibility, 80));
  window.addEventListener('resize', () => setTimeout(setActiveByVisibility, 120));
})();

// Sliding nav underline indicator
(function () {
  const navLinksEl = document.getElementById("navLinks");
  if (!navLinksEl) return;

  const indicator = document.createElement("div");
  indicator.className = "nav-indicator";
  navLinksEl.appendChild(indicator);

  function updateIndicator() {
    const active = navLinksEl.querySelector("a.active");
    if (!active) {
      indicator.style.opacity = "0";
      return;
    }
    const linkRect = active.getBoundingClientRect();
    const containerRect = navLinksEl.getBoundingClientRect();
    const targetWidth = Math.max(18, Math.round(linkRect.width * 0.5));
    const x = Math.round(linkRect.left - containerRect.left + (linkRect.width - targetWidth) / 2);
    indicator.style.width = targetWidth + "px";
    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.opacity = "1";
  }

  let last = 0;
  function throttled() {
    const now = Date.now();
    if (now - last > 80) {
      last = now;
      updateIndicator();
    }
  }

  window.addEventListener("resize", throttled);
  window.addEventListener("scroll", throttled, { passive: true });
  window.addEventListener("load", () => setTimeout(updateIndicator, 60));
  document.addEventListener("DOMContentLoaded", () => setTimeout(updateIndicator, 20));
  navLinksEl.addEventListener("click", () => setTimeout(updateIndicator, 60));

  const mo = new MutationObserver(() => setTimeout(updateIndicator, 24));
  mo.observe(navLinksEl, { subtree: true, attributes: true, attributeFilter: ["class"] });

  setTimeout(updateIndicator, 120);
})();