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

// ── HERO CAROUSEL ────────────────────────────────────────────
(function () {
  const bgs = Array.from(document.querySelectorAll(".hero-bg"));
  const slides = Array.from(document.querySelectorAll(".hero-left-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  if (!slides.length) return;

  const total = slides.length;
  let current = 0;
  let timer = null;
  const AUTO_MS = 6500;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function show(index) {
    current = (index + total) % total;
    bgs.forEach((el) => el.classList.toggle("active", Number(el.dataset.slide) === current));
    slides.forEach((el) => el.classList.toggle("active", Number(el.dataset.slide) === current));
    dots.forEach((el, i) => el.classList.toggle("active", i === current));
  }

  function startAuto() {
    if (prefersReducedMotion.matches) return;
    stopAuto();
    timer = setInterval(() => show(current + 1), AUTO_MS);
  }
  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAuto() {
    stopAuto();
    startAuto();
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.slide));
      restartAuto();
    });
  });
  prevBtn?.addEventListener("click", () => {
    show(current - 1);
    restartAuto();
  });
  nextBtn?.addEventListener("click", () => {
    show(current + 1);
    restartAuto();
  });

  const heroEl = document.getElementById("home");
  heroEl?.addEventListener("mouseenter", stopAuto);
  heroEl?.addEventListener("mouseleave", startAuto);

  show(0);
  startAuto();
})();

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

// ── QR EXPAND (tap the small code to enlarge full-screen) ─────
(function () {
  try {
    const expandBtn = document.getElementById("qrExpandBtn");
    const expandOverlay = document.getElementById("qrExpandOverlay");
    const expandBox = document.getElementById("qrExpandBox");
    const expandClose = document.getElementById("qrExpandClose");
    if (!expandBtn || !expandOverlay || !expandBox || !expandClose) {
      console.warn("QR expand elements not found on page — skipping setup.");
      return;
    }

    function openExpand() {
      const regUrl = buildRegUrl();
      expandBox.innerHTML = "";
      if (window.QRCode) {
        new QRCode(expandBox, {
          text: regUrl,
          width: 320,
          height: 320,
          colorDark: "#1A4B9C",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.H,
        });
      } else {
        expandBox.innerHTML = `<a href="${regUrl}">Open registration form</a>`;
      }
      expandOverlay.classList.add("open");
      expandClose.focus();
    }
    function closeExpand() {
      expandOverlay.classList.remove("open");
      expandBtn.focus();
    }

    expandBtn.addEventListener("click", openExpand);
    expandBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openExpand();
      }
    });
    expandClose.addEventListener("click", closeExpand);
    expandOverlay.addEventListener("click", (e) => {
      if (e.target === expandOverlay) closeExpand();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && expandOverlay.classList.contains("open"))
        closeExpand();
    });
  } catch (e) {
    console.error("QR expand setup failed:", e);
  }
})();

// ── PRINT QR (hidden iframe — works around mobile popup blockers) ──
function printQR() {
  try {
    const canvas = document.querySelector("#qrCanvas canvas");
    if (!canvas) {
      alert("QR code is not ready yet. Please try again in a moment.");
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.error("QR print failed:", e);
          alert("Sorry, printing isn't available right now. Please try again.");
        } finally {
          setTimeout(cleanup, 1000);
        }
      }, 150);
    };

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <title>Umoja P.A.G Church — Scan to Register</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding-top: 60px; }
            h2 { color: #1A4B9C; margin: 0 0 4px; }
            p.tag { color: #D4A017; margin: 0 0 24px; font-size: 14px; }
            img { width: 260px; height: 260px; }
          </style>
        </head>
        <body>
          <h2>Umoja P.A.G Church</h2>
          <p class="tag">Scan to Register</p>
          <img src="${dataUrl}" alt="QR code to register" />
        </body>
      </html>
    `);
    doc.close();
  } catch (e) {
    console.error("printQR failed:", e);
    alert("Sorry, printing isn't available right now. Please try again.");
  }
}

// ── REGISTRATION FORM ─────────────────────────────────────────
const REGISTER_ENDPOINT = "/api/register";

function normalizeKenyanPhoneClient(phone) {
  const cleaned = phone.replace(/[\s().-]+/g, "");
  if (/^0(7|1)\d{8}$/.test(cleaned)) return "+254" + cleaned.slice(1);
  if (/^254(7|1)\d{8}$/.test(cleaned)) return "+" + cleaned;
  return cleaned;
}

function isValidKenyanPhone(phone) {
  return /^\+254(7|1)\d{8}$/.test(normalizeKenyanPhoneClient(phone));
}

function getRegistrationPayload() {
  const regFor = document.getElementById("regFor").value.trim();
  return {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    ageGroup: document.getElementById("ageGroup").value.trim(),
    area: document.getElementById("area").value.trim(),
    regFor,
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
  if (!isValidKenyanPhone(document.getElementById("phone").value.trim())) {
    err.textContent = "Please enter a valid Kenyan phone number (e.g. 0712345678).";
    err.style.display = "block";
    return;
  }
  btn.disabled = true;
  btn.textContent = "Sending...";
  const payload = getRegistrationPayload();
  try {
    const res = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showRegistrationSuccess(
        "Thank you for signing up. Our team will be in touch with details ahead of the event. God bless you!",
      );
    } else {
      const message = Array.isArray(data.errors) && data.errors.length
        ? data.errors.join(" ")
        : (data.message || "Submission failed.");
      throw new Error(message);
    }
  } catch (e) {
    saveRegistrationDraft(payload);
    const isDuplicate = /already registered/i.test(String(e.message || ""));
    if (isDuplicate) {
      err.textContent = e.message;
    } else {
      err.innerHTML = 'Could not send your registration online. Your details were saved on this device, but please also reach us directly so we don\'t miss you: <a href="tel:+254796752298" style="color:#fecaca;text-decoration:underline;">call 0796 752 298</a> or <a href="mailto:info@umojapagchurch.org" style="color:#fecaca;text-decoration:underline;">email us</a>.';
    }
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
  ["ageGroup", "regFor"].forEach((id) => {
    document.getElementById(id).selectedIndex = 0;
  });
  document.getElementById("formError").style.display = "none";
  document.getElementById("formSuccess").style.display = "none";
  document.getElementById("formContent").style.display = "block";
  const successText = document.getElementById("formSuccessText");
  if (successText)
    successText.textContent =
      "Thank you for signing up. Our team will be in touch with details ahead of the event. God bless you!";
}


// ── LEAVE A MESSAGE (CONTACT) FORM ─────────────────────────────
const CONTACT_MESSAGE_ENDPOINT = "/api/contact-message";

async function submitContactMessage() {
  const btn = document.getElementById("messageSubmitBtn");
  const err = document.getElementById("messageFormError");
  const nameEl = document.getElementById("msgName");
  const emailEl = document.getElementById("msgEmail");
  const subjectEl = document.getElementById("msgSubject");
  const messageEl = document.getElementById("msgMessage");
  err.style.display = "none";

  if (
    !nameEl.value.trim() ||
    !emailEl.value.trim() ||
    !subjectEl.value.trim() ||
    !messageEl.value.trim()
  ) {
    err.textContent = "Please fill in all required fields.";
    err.style.display = "block";
    return;
  }
  if (!isValidEmail(emailEl.value.trim())) {
    err.textContent = "Please enter a valid email address.";
    err.style.display = "block";
    emailEl.focus();
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    email: emailEl.value.trim(),
    subject: subjectEl.value.trim(),
    message: messageEl.value.trim(),
    honeypot: document.getElementById("msgCompany").value,
  };

  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const res = await fetch(CONTACT_MESSAGE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!(res.ok && data.success)) {
      throw new Error(data.message || "Submission failed.");
    }
  } catch (e) {
    try {
      const key = "umoja_contact_message_drafts";
      const drafts = JSON.parse(localStorage.getItem(key) || "[]");
      drafts.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(drafts));
    } catch {
      // localStorage unavailable
    }
    console.error("Contact message submission error:", e);
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Message →";
    document.getElementById("messageFormContent").style.display = "none";
    document.getElementById("messageFormSuccess").style.display = "block";
  }
}

function resetContactMessageForm() {
  document.getElementById("msgName").value = "";
  document.getElementById("msgEmail").value = "";
  document.getElementById("msgSubject").value = "";
  document.getElementById("msgMessage").value = "";
  document.getElementById("messageFormError").style.display = "none";
  document.getElementById("messageFormSuccess").style.display = "none";
  document.getElementById("messageFormContent").style.display = "block";
}

// ── PRAYER REQUEST FORM ────────────────────────────────────────
const PRAYER_ENDPOINT = "/api/prayer-request";

async function submitPrayerRequest() {
  const btn = document.getElementById("prayerSubmitBtn");
  const err = document.getElementById("prayerFormError");
  const nameEl = document.getElementById("prayerName");
  const reqEl = document.getElementById("prayerRequest");
  err.style.display = "none";

  if (!nameEl.value.trim() || !reqEl.value.trim()) {
    err.textContent = "Please fill in your name and prayer request.";
    err.style.display = "block";
    (nameEl.value.trim() ? reqEl : nameEl).focus();
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    request: reqEl.value.trim(),
    honeypot: document.getElementById("prayerCompany").value,
  };

  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const res = await fetch(PRAYER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!(res.ok && data.success)) {
      throw new Error(data.message || "Submission failed.");
    }
  } catch (e) {
    try {
      const key = "umoja_prayer_drafts";
      const drafts = JSON.parse(localStorage.getItem(key) || "[]");
      drafts.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(drafts));
    } catch {
      // localStorage unavailable
    }
    console.error("Prayer request submission error:", e);
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Prayer Request →";
    document.getElementById("prayerFormContent").style.display = "none";
    document.getElementById("prayerFormSuccess").style.display = "block";
  }
}

function resetPrayerForm() {
  document.getElementById("prayerName").value = "";
  document.getElementById("prayerRequest").value = "";
  document.getElementById("prayerFormError").style.display = "none";
  document.getElementById("prayerFormSuccess").style.display = "none";
  document.getElementById("prayerFormContent").style.display = "block";
}

// ── PASTORAL CARE REQUEST FORM ─────────────────────────────────
const PASTORAL_CARE_ENDPOINT = "/api/pastoral-care";

async function submitPastoralCare() {
  const btn = document.getElementById("careSubmitBtn");
  const err = document.getElementById("careFormError");
  const nameEl = document.getElementById("careName");
  const emailEl = document.getElementById("careEmail");
  const reqEl = document.getElementById("careRequest");
  err.style.display = "none";

  if (!nameEl.value.trim() || !emailEl.value.trim() || !reqEl.value.trim()) {
    err.textContent = "Please fill in your name, email, and request.";
    err.style.display = "block";
    return;
  }
  if (!isValidEmail(emailEl.value.trim())) {
    err.textContent = "Please enter a valid email address.";
    err.style.display = "block";
    emailEl.focus();
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    email: emailEl.value.trim(),
    request: reqEl.value.trim(),
    honeypot: document.getElementById("careCompany").value,
  };

  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const res = await fetch(PASTORAL_CARE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!(res.ok && data.success)) {
      throw new Error(data.message || "Submission failed.");
    }
  } catch (e) {
    try {
      const key = "umoja_pastoral_care_drafts";
      const drafts = JSON.parse(localStorage.getItem(key) || "[]");
      drafts.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(drafts));
    } catch {
      // localStorage unavailable
    }
    console.error("Pastoral care submission error:", e);
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Request →";
    document.getElementById("careFormContent").style.display = "none";
    document.getElementById("careFormSuccess").style.display = "block";
  }
}

function resetCareForm() {
  document.getElementById("careName").value = "";
  document.getElementById("careEmail").value = "";
  document.getElementById("careRequest").value = "";
  document.getElementById("careFormError").style.display = "none";
  document.getElementById("careFormSuccess").style.display = "none";
  document.getElementById("careFormContent").style.display = "block";
}

// ── LEADERSHIP DETAIL MODAL ────────────────────────────────
const LEADER_INFO = {
  secretary: {
    role: "Secretary",
    photo: "images/secretary.jpg",
    bio: [
      "Coordinates church records, correspondence, and communication between leadership and the congregation, keeping the ministry organized and every member in the loop.",
    ],
    tags: ["Administration", "Communication", "Church Records"],
  },
  deacon: {
    role: "Deacon",
    photo: "images/deacon.jpg",
    bio: [
      "Serves the church through practical support, care for members, and assisting in worship and church operations, helping every service and gathering run smoothly.",
    ],
    tags: ["Pastoral Support", "Worship", "Operations"],
  },
  motherDirector: {
    role: "Mother Director",
    photo: "images/women director.jpg",
    bio: [
      "Leads and mentors the Women's Guild, guiding fellowship, prayer, and outreach among the church's women, and nurturing a strong sense of sisterhood in Christ.",
    ],
    tags: ["Women's Guild", "Mentorship", "Outreach"],
  },
  treasurer: {
    role: "Treasurer",
    photo: "images/Treasurer.jpg",
    bio: [
      "Oversees church finances, giving, and stewardship with transparency and faithfulness, ensuring every offering is accounted for and put to good use.",
    ],
    tags: ["Stewardship", "Finance", "Transparency"],
  },
  youthLeader: {
    role: "Youth Leader",
    photo: "images/youth leader.jpg",
    bio: [
      "Guides and disciples the church's youth, building a strong foundation of faith for the next generation through mentorship, fellowship, and hands-on ministry.",
    ],
    tags: ["Youth Ministry", "Discipleship", "Mentorship"],
  },
};

function openLeaderModal(key) {
  const info = LEADER_INFO[key];
  if (!info) return;
  const bioParagraphs = Array.isArray(info.bio) ? info.bio : [info.bio];
  document.getElementById("leaderModalImg").src = info.photo;
  document.getElementById("leaderModalImg").alt = info.name;
  document.getElementById("leaderModalRole").textContent = info.role;
  document.getElementById("leaderModalName").textContent = info.name;
  document.getElementById("leaderModalBio").innerHTML = bioParagraphs
    .map((p) => `<p>${p}</p>`)
    .join("");
  document.getElementById("leaderModalTags").innerHTML = (info.tags || [])
    .map((tag) => `<span class="pastor-tag">${tag}</span>`)
    .join("");
  document.getElementById("leaderModalOverlay").classList.add("open");
}

function closeLeaderModal() {
  document.getElementById("leaderModalOverlay").classList.remove("open");
}

(function () {
  const overlay = document.getElementById("leaderModalOverlay");
  const closeBtn = document.getElementById("leaderModalClose");
  if (!overlay || !closeBtn) return;

  closeBtn.addEventListener("click", closeLeaderModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLeaderModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open"))
      closeLeaderModal();
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
// ── EVENTS & UPDATES ────────────────────────────────────────────
// Add or edit entries in CHURCH_ITEMS below to control what shows up.
// date must be "YYYY-MM-DD" — for announcements, use the target/expiry
// date, since that's what moves it from "Upcoming" to "Past" once it's
// gone. type is "event" (has a time/location) or "announcement"
// (ongoing project, no fixed time/location). category drives the
// filter pills and card badge; give an item an image (e.g.
// "images/kesha-night.jpg") to show a real poster instead of the
// placeholder icon.
(function () {
  try {
    const CHURCH_ITEMS = [
      {
        type: "event",
        date: "2026-06-20",
        title: "Kesha Night",
        category: "Prayer & Worship",
        time: "7:00 PM",
        location: "Umoja P.A.G Church",
        description:
          "A powerful night of prayer, worship, and seeking God's presence together as a church family — open to the whole congregation, no registration needed. Come expectant for a fresh encounter with God through praise, intercession, and the Word.",
        link: "#contact",
        linkText: "Ask a question",
      },
      {
        type: "event",
        date: "2026-05-11",
        title: "Women's Fellowship Week",
        category: "Women's Fellowship",
        time: "5:00 PM Daily",
        location: "Umoja P.A.G Church",
        description:
          "A week of dedicated fellowship, teaching, and prayer for the women of the church — daily evening sessions built around encouragement, testimony, and sisterhood in faith.",
      },
      {
        type: "event",
        date: "2026-04-13",
        title: "Men's Fellowship Week",
        category: "Men's Fellowship",
        time: "6:00 PM Daily",
        location: "Umoja P.A.G Church",
        description:
          "A week of teaching and fellowship for the men of the church, focused on discipleship, accountability, and leading well at home and in the community.",
      },
      {
        type: "event",
        date: "2026-03-09",
        title: "Evangelism Week",
        category: "Evangelism & Outreach",
        time: "All Day",
        location: "Umoja & Surrounding Estates",
        description:
          "A week of door-to-door outreach, street evangelism, and community service across Umoja and neighbouring estates, closing with a combined outreach service inviting new visitors to church.",
      },
      {
        // TODO: confirm the exact Youth Camp date with the church office —
        // currently a placeholder within the announced "August 2026" window.
        type: "event",
        date: "2026-08-15",
        title: "Youth Camp & Family Fun Day",
        category: "Youth",
        time: "All Day",
        location: "Umoja P.A.G Church",
        description:
          "Annual Youth Camp followed by a Family Fun Day open to the whole congregation — games, music, team challenges, and a shared meal to close out the summer season. Open to all ages; the Youth Camp portion is geared toward teens and young adults, with family activities for everyone else. Spots are limited, so register early.",
        link: "#register",
        linkText: "Register for the event",
      },
    ];

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const ICON_CAL =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const ICON_CLOCK =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const ICON_PIN =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>';

    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = (() => {
      const t = new Date();
      return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    })();

    function buildCard(ev) {
      const [y, m, d] = ev.date.split("-").map(Number);
      const dateLabel = `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
      const media = ev.image
        ? `<img src="${ev.image}" alt="${ev.title}" />`
        : ICON_CAL.replace('width="13" height="13"', 'width="40" height="40"');
      return `
        <div class="event-card">
          <div class="event-card-media">
            <span class="event-card-badge">${ev.category}</span>
            ${media}
          </div>
          <div class="event-card-body">
            <h4>${ev.title}</h4>
            <div class="event-card-meta">
              <span class="event-card-meta-item">${ICON_CAL} ${dateLabel}</span>
              ${ev.time ? `<span class="event-card-meta-item">${ICON_CLOCK} ${ev.time}</span>` : ""}
              ${ev.location ? `<span class="event-card-meta-item">${ICON_PIN} ${ev.location}</span>` : ""}
            </div>
            ${ev.description ? `<p class="event-card-desc">${ev.description}</p>` : ""}
            ${ev.link ? `<a href="${ev.link}" class="event-card-link">${ev.linkText || "Learn more"}</a>` : ""}
          </div>
        </div>`;
    }

    function renderGroups(list, container, emptyMessage) {
      if (!container) return;
      if (!list.length) {
        container.innerHTML = `<p class="events-empty-state">${emptyMessage}</p>`;
        return;
      }
      const groups = new Map();
      list.forEach((ev) => {
        const [y, m] = ev.date.split("-").map(Number);
        const key = `${y}-${pad(m)}`;
        if (!groups.has(key)) groups.set(key, { y, m, events: [] });
        groups.get(key).events.push(ev);
      });

      container.innerHTML = Array.from(groups.values())
        .map(
          ({ y, m, events }) => `
          <div class="events-month-group">
            <div class="events-month-group-header">
              <h4>${MONTH_NAMES[m - 1]} ${y}</h4>
              <div class="events-month-rule"></div>
              <span class="events-month-count">${events.length} Item${events.length > 1 ? "s" : ""}</span>
            </div>
            <div class="events-grid">${events.map(buildCard).join("")}</div>
          </div>`,
        )
        .join("");
    }

    const pillsWrap = document.getElementById("eventsFilterPills");
    const upcomingWrap = document.getElementById("eventsByMonth");
    const pastWrap = document.getElementById("pastEventsByMonth");
    const pastRow = document.getElementById("pastEventsRow");
    const pastToggle = document.getElementById("pastEventsToggle");
    if (!pillsWrap || !upcomingWrap) return;

    const categories = [
      "All",
      ...Array.from(new Set(CHURCH_ITEMS.map((ev) => ev.category))),
    ];
    let activeCategory = "All";

    function renderPills() {
      pillsWrap.innerHTML = categories
        .map(
          (cat) => `
            <button type="button" class="filter-pill${cat === activeCategory ? " is-active" : ""}" data-category="${cat}">
              ${cat.toUpperCase()}
            </button>`,
        )
        .join("");
    }

    function render() {
      const inCategory = CHURCH_ITEMS.filter(
        (ev) => activeCategory === "All" || ev.category === activeCategory,
      );
      const upcoming = inCategory
        .filter((ev) => ev.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date));
      const past = inCategory
        .filter((ev) => ev.date < todayStr)
        .sort((a, b) => b.date.localeCompare(a.date));

      renderGroups(
        upcoming,
        upcomingWrap,
        "Nothing upcoming in this category right now.",
      );

      if (pastRow && pastWrap && pastToggle) {
        if (past.length) {
          pastRow.hidden = false;
          renderGroups(past, pastWrap, "No past events in this category.");
        } else {
          pastRow.hidden = true;
          pastWrap.hidden = true;
          pastWrap.innerHTML = "";
          pastToggle.textContent = "View Past Events";
        }
      }
    }

    pillsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      activeCategory = btn.dataset.category;
      renderPills();
      render();
    });

    if (pastToggle && pastWrap) {
      pastToggle.addEventListener("click", () => {
        const showing = pastWrap.hidden;
        pastWrap.hidden = !showing;
        pastToggle.textContent = showing ? "Hide Past Events" : "View Past Events";
      });
    }

    renderPills();
    render();
  } catch (err) {
    console.error("Events render error:", err);
  }
})();