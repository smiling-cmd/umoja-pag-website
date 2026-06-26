// ── NAVBAR SCROLL ──────────────────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener(
  "scroll",
  () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
    let current = "home";
    document.querySelectorAll("section[id]").forEach((s) => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    document.querySelectorAll(".nav-links a").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === "#" + current);
    });
  },
  { passive: true },
);

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("navbarMenu");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
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

// ── MINISTRY CATALOGUE CAROUSEL ───────────────────────────────
(function () {
  const track = document.getElementById("catTrack");
  const window_ = document.getElementById("catWindow");
  const prevBtn = document.getElementById("catPrev");
  const nextBtn = document.getElementById("catNext");
  const dotsWrap = document.getElementById("catDots");
  const catalogue = document.getElementById("ministryCatalogue");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!track || !window_ || !prevBtn || !nextBtn || !dotsWrap || !catalogue)
    return;

  const cards = Array.from(track.children);
  const GAP = 18;
  let currentPage = 0;
  let dots = [];
  let pageCount = 1;
  let cardsPerView = 1;
  let autoTimer = null;

  function getCardsPerView() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    dots = [];
    pageCount = Math.max(1, Math.ceil(cards.length / cardsPerView));
    for (let i = 0; i < pageCount; i += 1) {
      const d = document.createElement("button");
      d.className = "catalogue-dot" + (i === currentPage ? " active" : "");
      d.setAttribute("aria-label", "Go to showcase page " + (i + 1));
      d.addEventListener("click", () => {
        goTo(i);
        restartAuto();
      });
      dotsWrap.appendChild(d);
      dots.push(d);
    }
  }

  function maxOffset() {
    return Math.max(0, track.scrollWidth - window_.clientWidth);
  }

  function pageOffset(page) {
    const firstCard = cards[0];
    if (!firstCard) return 0;
    const step = firstCard.offsetWidth + GAP;
    return Math.min(page * step * cardsPerView, maxOffset());
  }

  function goTo(page) {
    currentPage = ((page % pageCount) + pageCount) % pageCount;
    track.style.transform = `translateX(-${pageOffset(currentPage)}px)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === currentPage));
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function restartAuto() {
    stopAuto();
    if (reducedMotion.matches || pageCount <= 1) return;
    autoTimer = window.setInterval(() => goTo(currentPage + 1), 4200);
  }

  function refreshCarousel() {
    cardsPerView = getCardsPerView();
    catalogue.style.setProperty("--catalog-columns", String(cardsPerView));
    currentPage = Math.min(
      currentPage,
      Math.max(0, Math.ceil(cards.length / cardsPerView) - 1),
    );
    buildDots();
    goTo(currentPage);
    restartAuto();
  }

  prevBtn.addEventListener("click", () => {
    goTo(currentPage - 1);
    restartAuto();
  });
  nextBtn.addEventListener("click", () => {
    goTo(currentPage + 1);
    restartAuto();
  });

  window_.tabIndex = 0;
  window_.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      goTo(currentPage - 1);
      restartAuto();
    }
    if (e.key === "ArrowRight") {
      goTo(currentPage + 1);
      restartAuto();
    }
  });

  catalogue.addEventListener("mouseenter", stopAuto);
  catalogue.addEventListener("mouseleave", restartAuto);
  catalogue.addEventListener("focusin", stopAuto);
  catalogue.addEventListener("focusout", restartAuto);
  reducedMotion.addEventListener("change", refreshCarousel);

  refreshCarousel();
  window.addEventListener("resize", refreshCarousel, { passive: true });
})();

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
  } catch (e) {}
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
  ctx.fillText("Umoja Innercore, Nairobi", 160, 272);
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
const churchEmail = "info@umojapagchurch.org";

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

function openRegistrationEmail(payload) {
  const subject = `Umoja P.A.G Registration - ${payload.firstName} ${payload.lastName}`;
  const body = [
    "New registration details:",
    "",
    `Name: ${payload.firstName} ${payload.lastName}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email || "Not provided"}`,
    `Age Group: ${payload.ageGroup}`,
    `Area / Estate: ${payload.area || "Not provided"}`,
    `Registering For: ${payload.regFor}`,
    `Notes: ${payload.notes || "None"}`,
  ].join("\n");
  window.location.href = `mailto:${churchEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
    const res = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showRegistrationSuccess(
        "Thank you for registering. Our team will be in touch shortly. God bless you!",
      );
    } else {
      throw new Error(data.message || "Registration failed.");
    }
  } catch {
    saveRegistrationDraft(payload);
    openRegistrationEmail(payload);
    showRegistrationSuccess(
      "Your details were prepared in an email. Please send it to complete your registration.",
    );
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
