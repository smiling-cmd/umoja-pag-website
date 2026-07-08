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

  // rootMargin: push the top boundary down by navbar height so the
  // section is only "active" once it clears the fixed navbar.
  const navH = navbar ? navbar.offsetHeight : 80;
  const io = new IntersectionObserver(
    (entries) => {
      // pick the most visible intersecting section so only one nav link
      // becomes active even when neighboring sections partially intersect.
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) return;
      visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const primary = visible[0];
      links.forEach((a) => {
        a.classList.toggle(
          "active",
          a.getAttribute("href") === "#" + primary.target.id,
        );
      });
    },
    {
      // account for fixed navbar at top, and require a reasonable
      // portion of the section to be visible before activation.
      rootMargin: `-${navH + 4}px 0px -40% 0px`,
      threshold: [0.25, 0.5, 0.75],
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

// ministry carousel removed — gallery covers visual content

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function handleInvalidEmail() {
  if (!cloudwatchEmailField) return;
  cloudwatchEmailField.style.borderColor = "#EF4444";
  cloudwatchEmailField.focus();
  setCloudwatchClosed(false);
  setCloudwatchFrown(true);
  shakeCloudwatch();
  setCloudwatchMessage("Kindly enter correct details", {
    resetAfter: 2400,
  });
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
      cloudwatchEmailField.style.borderColor = "";
      if (
        cloudwatchCopy &&
        cloudwatchCopy.textContent.trim() === "Kindly enter correct details"
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
  if (!reduceMotion.matches) window.setInterval(blinkCloudwatch, 3000);
}

// ── QR CODE ───────────────────────────────────────────────────
// Use a stored public base URL when available so the QR points to a
// reachable HTTP(S) address instead of a local file:// URL.
function getSiteBase() {
  try {
    const stored = localStorage.getItem("umoja_site_base");
    if (stored) return stored.replace(/\/+$/, "");
  } catch (e) {}
  try {
    if (location.protocol && location.protocol.startsWith("http"))
      return location.origin + location.pathname;
  } catch (e) {}
  return null;
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
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xpqgrdvw";

function getRegistrationPayload() {
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    ageGroup: document.getElementById("ageGroup").value.trim(),
    area: document.getElementById("area").value.trim(),
    regFor: document.getElementById("regFor").value.trim(),
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
  const btn = document.getElementById("submitBtn");
  const err = document.getElementById("formError");
  const emailField = document.getElementById("email");
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
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showRegistrationSuccess(
        "Thank you for registering. Our team will be in touch shortly. God bless you!",
      );
    } else {
      throw new Error((data.errors || []).map((e) => e.message).join(", ") || "Submission failed.");
    }
  } catch (e) {
    saveRegistrationDraft(payload);
    err.textContent = "Could not send your registration. Please try again or contact us directly.";
    err.style.display = "block";
    console.error("Formspree submission error:", e);
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Registration →";
  }
}

// FIX: removed broken fragment line ['ageGroup','regFor'].forE
function resetForm() {
  ["firstName", "lastName", "phone", "email", "area", "notes"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  ["ageGroup", "regFor"].forEach((id) => {
    document.getElementById(id).selectedIndex = 0;
  });
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

  // create lightbox markup
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

  // light-weight throttle
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
    // small delay to allow other handlers to toggle `.active`
    setTimeout(syncAria, 40);
  });
})();

// Initial on-load active-link check: choose the section with the largest
// visible area and mark the corresponding nav link as active. This helps
// when the page is loaded with a hash or when IntersectionObserver hasn't
// yet fired for the current position.
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
      // keep aria in sync
      document.querySelectorAll('.nav-links a').forEach((a) => a.removeAttribute('aria-current'));
      const active = document.querySelector('.nav-links a.active');
      if (active) active.setAttribute('aria-current', 'page');
    }
  }

  window.addEventListener('load', () => setTimeout(setActiveByVisibility, 80));
  window.addEventListener('resize', () => setTimeout(setActiveByVisibility, 120));
})();