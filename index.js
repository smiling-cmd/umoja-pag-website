(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  // ── Shared helpers ─────────────────────────────────────────────
  function getFocusable(container) {
    return $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container,
    ).filter((el) => !el.hidden && el.getClientRects().length > 0);
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;

    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent.trim();
    }

    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));
    button.textContent = busy ? busyLabel : button.dataset.defaultLabel;
  }

  function safeMessage(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    return text && text.length <= 240 ? text : fallback;
  }

  // ── Navbar ─────────────────────────────────────────────────────
  const navbar = $("#navbar");
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  const navOverlay = $("#navOverlay");
  const mobileNavQuery = window.matchMedia("(max-width: 1200px)");

  let navReturnFocus = null;

  function updateNavbarAppearance() {
    if (!navbar) return;

    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 24 ||
        document.body.classList.contains("secondary-page"),
    );
  }

  function setMobileNavAccessibility(isOpen) {
    if (!navLinks) return;

    navLinks.setAttribute(
      "aria-hidden",
      mobileNavQuery.matches && !isOpen ? "true" : "false",
    );

    if (navOverlay) {
      navOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  }

  function openMobileNav() {
    if (
      !navToggle ||
      !navLinks ||
      !navOverlay ||
      !mobileNavQuery.matches
    ) {
      return;
    }

    navReturnFocus = document.activeElement;

    navToggle.classList.add("open");
    navLinks.classList.add("open");
    navOverlay.classList.add("open");
    document.body.classList.add("nav-open");

    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");

    setMobileNavAccessibility(true);

    const firstLink = $("a", navLinks);

    if (firstLink) {
      firstLink.focus();
    }
  }

  function closeMobileNav({ restoreFocus = false } = {}) {
    if (!navToggle || !navLinks || !navOverlay) return;

    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navOverlay.classList.remove("open");
    document.body.classList.remove("nav-open");

    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");

    setMobileNavAccessibility(false);

    if (
      restoreFocus &&
      navReturnFocus instanceof HTMLElement
    ) {
      navReturnFocus.focus();
    }
  }

  function toggleMobileNav() {
    if (!navLinks) return;

    navLinks.classList.contains("open")
      ? closeMobileNav({ restoreFocus: true })
      : openMobileNav();
  }

  updateNavbarAppearance();
  setMobileNavAccessibility(false);

  window.addEventListener("scroll", updateNavbarAppearance, {
    passive: true,
  });

  if (navToggle && navLinks && navOverlay) {
    navToggle.addEventListener("click", toggleMobileNav);

    navOverlay.addEventListener("click", () =>
      closeMobileNav({ restoreFocus: true }),
    );

    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMobileNav();
      }
    });

    mobileNavQuery.addEventListener("change", () =>
      closeMobileNav(),
    );
  }

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navLinks?.classList.contains("open")
    ) {
      event.preventDefault();
      closeMobileNav({ restoreFocus: true });
      return;
    }

    if (
      event.key === "Tab" &&
      navLinks?.classList.contains("open")
    ) {
      const focusable = getFocusable(navLinks);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // ── Active navigation and underline ────────────────────────────
  const samePageLinks = document.body.classList.contains("home-page")
    ? $$('.nav-links a[href^="#"]')
    : [];

  const samePageSections = samePageLinks
    .map((link) =>
      document.getElementById(
        link.getAttribute("href").slice(1),
      ),
    )
    .filter(Boolean);

  const navIndicator = navLinks
    ? document.createElement("span")
    : null;

  let navTicking = false;

  if (
    navIndicator &&
    navLinks &&
    samePageLinks.length
  ) {
    navIndicator.className = "nav-indicator";
    navIndicator.setAttribute("aria-hidden", "true");
    navLinks.append(navIndicator);
  }

  function updateNavIndicator() {
    if (
      !navIndicator ||
      !navLinks ||
      mobileNavQuery.matches
    ) {
      if (navIndicator) {
        navIndicator.style.opacity = "0";
      }

      return;
    }

    const active = $("a.active", navLinks);

    if (!active) {
      navIndicator.style.opacity = "0";
      return;
    }

    const linkRect = active.getBoundingClientRect();
    const listRect = navLinks.getBoundingClientRect();

    const width = Math.max(
      20,
      Math.round(linkRect.width * 0.52),
    );

    const x = Math.round(
      linkRect.left -
        listRect.left +
        (linkRect.width - width) / 2,
    );

    navIndicator.style.width = `${width}px`;
    navIndicator.style.transform = `translateX(${x}px)`;
    navIndicator.style.opacity = "1";
  }

  function updateActiveNav() {
    navTicking = false;

    if (!samePageSections.length) return;

    const marker =
      window.scrollY +
      (navbar?.offsetHeight || 80) +
      140;

    let activeSection = samePageSections[0];

    samePageSections.forEach((section) => {
      if (section.offsetTop <= marker) {
        activeSection = section;
      }
    });

    samePageLinks.forEach((link) => {
      const active =
        link.getAttribute("href") ===
        `#${activeSection.id}`;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    updateNavIndicator();
  }

  function requestNavUpdate() {
    if (navTicking) return;

    navTicking = true;
    requestAnimationFrame(updateActiveNav);
  }

  updateActiveNav();

  window.addEventListener("scroll", requestNavUpdate, {
    passive: true,
  });

  window.addEventListener("resize", requestNavUpdate);

  navLinks?.addEventListener("click", () =>
    window.setTimeout(updateActiveNav, 80),
  );

  // ── Reveal animations ──────────────────────────────────────────
  const revealItems = $$(".reveal");

  if (
    reduceMotion.matches ||
    !("IntersectionObserver" in window)
  ) {
    revealItems.forEach((item) =>
      item.classList.add("visible"),
    );
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -36px 0px",
      },
    );

    revealItems.forEach((item) =>
      revealObserver.observe(item),
    );
  }

  // ── Accessible hero carousel ───────────────────────────────────
  (() => {
    const hero = $("#home");
    const slides = $$(".hero-left-slide", hero || document);
    const dots = $$(".hero-dot", hero || document);
    const prev = $("#heroPrev");
    const next = $("#heroNext");
    const pause = $("#heroPause");
    const status = $("#heroStatus");

    if (!hero || !slides.length) return;

    let current = 0;
    let timer = null;
    let userPaused = false;
    let pointerInside = false;
    let focusInside = false;
    let heroVisible = true;

    const intervalMs = 7000;

    function show(index, { announce = false } = {}) {
      current =
        (index + slides.length) %
        slides.length;

      slides.forEach((slide, i) => {
        const active = i === current;

        slide.classList.toggle("active", active);
        slide.setAttribute(
          "aria-hidden",
          String(!active),
        );

        slide.toggleAttribute("inert", !active);
      });

      dots.forEach((dot, i) => {
        const active = i === current;

        dot.classList.toggle("active", active);

        if (active) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (announce && status) {
        status.textContent =
          `Showing featured message ${current + 1} of ${slides.length}.`;
      }
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = null;
    }

    function canAutoPlay() {
      return (
        !reduceMotion.matches &&
        !userPaused &&
        !pointerInside &&
        !focusInside &&
        heroVisible &&
        !document.hidden
      );
    }

    function start() {
      stop();

      if (canAutoPlay()) {
        timer = window.setInterval(
          () => show(current + 1),
          intervalMs,
        );
      }
    }

    function updatePauseButton() {
      if (!pause) return;

      const label = userPaused
        ? "Resume automatic slide rotation"
        : "Pause automatic slide rotation";

      pause.setAttribute(
        "aria-pressed",
        String(userPaused),
      );

      pause.setAttribute("aria-label", label);

      const icon = pause.querySelector(
        '[aria-hidden="true"]',
      );

      const text = pause.querySelector(".sr-only");

      if (icon) {
        icon.textContent = userPaused ? "▶" : "Ⅱ";
      }

      if (text) {
        text.textContent = label;
      }
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        show(Number(dot.dataset.slide), {
          announce: true,
        });

        start();
      });
    });

    prev?.addEventListener("click", () => {
      show(current - 1, { announce: true });
      start();
    });

    next?.addEventListener("click", () => {
      show(current + 1, { announce: true });
      start();
    });

    pause?.addEventListener("click", () => {
      userPaused = !userPaused;
      updatePauseButton();

      userPaused ? stop() : start();
    });

    hero.addEventListener("pointerenter", () => {
      pointerInside = true;
      stop();
    });

    hero.addEventListener("pointerleave", () => {
      pointerInside = false;
      start();
    });

    hero.addEventListener("focusin", () => {
      focusInside = true;
      stop();
    });

    hero.addEventListener("focusout", () => {
      window.setTimeout(() => {
        focusInside = hero.contains(
          document.activeElement,
        );

        start();
      }, 0);
    });

    document.addEventListener(
      "visibilitychange",
      start,
    );

    reduceMotion.addEventListener("change", start);

    if ("IntersectionObserver" in window) {
      const visibilityObserver =
        new IntersectionObserver(
          ([entry]) => {
            heroVisible = Boolean(
              entry?.isIntersecting,
            );

            start();
          },
          { threshold: 0.15 },
        );

      visibilityObserver.observe(hero);
    }

    show(0);
    updatePauseButton();
    start();
  })();

  // ── Click-to-load Google Map ───────────────────────────────────
  (() => {
    const frame = $("#mapFrame");
    const button = $("#loadMapBtn");

    if (!frame || !button) return;

    const src =
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120.59!2d36.8938387!3d-1.2849086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f138dc6b5156b%3A0x4a4bc064c62c9fb0!2sUmoja%20P.%20A.%20G%20School!5e0!3m2!1sen!2ske!4v1719500000000!5m2!1sen!2ske";

    button.addEventListener("click", () => {
      setBusy(button, true, "Loading map...");

      const iframe =
        document.createElement("iframe");

      iframe.src = src;
      iframe.title = "Map to Umoja P.A.G Church";
      iframe.loading = "lazy";
      iframe.referrerPolicy =
        "no-referrer-when-downgrade";
      iframe.allowFullscreen = true;

      iframe.addEventListener(
        "load",
        () => frame.classList.add("map-loaded"),
        { once: true },
      );

      frame.replaceChildren(iframe);
    });
  })();

  // ── Registration helper character ──────────────────────────────
  (() => {
    const avatar = $("#cloudwatchAvatar");
    const copy = $("#cloudwatchCopy");
    const pupils = $$(".cloudwatch-pupil");

    const privateFields = [
      $("#phone"),
      $("#email"),
    ].filter(Boolean);

    if (!avatar) return;

    const defaultCopy = copy?.innerHTML || "";

    let messageTimer = null;

    function setClosed(value) {
      avatar.classList.toggle(
        "eyes-closed",
        value,
      );
    }

    function setFrown(value) {
      avatar.classList.toggle("frown", value);
    }

    function setMessage(message, resetAfter = 0) {
      if (!copy) return;

      copy.textContent = message;
      window.clearTimeout(messageTimer);

      if (resetAfter) {
        messageTimer = window.setTimeout(() => {
          copy.innerHTML = defaultCopy;
          setFrown(false);
        }, resetAfter);
      }
    }

    function nudgeInvalid(message) {
      setClosed(false);
      setFrown(true);
      setMessage(message, 2600);

      if (!reduceMotion.matches) {
        avatar.classList.remove("is-shaking");

        void avatar.offsetWidth;

        avatar.classList.add("is-shaking");
      }
    }

    window.addEventListener(
      "umoja:registration-invalid",
      (event) => {
        nudgeInvalid(
          event.detail?.message ||
            "Please check the highlighted details.",
        );
      },
    );

    if (!reduceMotion.matches) {
      document.addEventListener(
        "pointermove",
        (event) => {
          const x =
            (event.clientX / window.innerWidth -
              0.5) *
            12;

          const y =
            (event.clientY /
              window.innerHeight -
              0.5) *
            6;

          pupils.forEach((pupil) => {
            pupil.style.transform =
              `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          });
        },
        { passive: true },
      );

      window.setInterval(() => {
        if (
          privateFields.some(
            (field) =>
              document.activeElement === field,
          )
        ) {
          return;
        }

        setClosed(true);

        window.setTimeout(
          () => setClosed(false),
          180,
        );
      }, 3600);
    }

    privateFields.forEach((field) => {
      field.addEventListener("focus", () =>
        setClosed(true),
      );

      field.addEventListener("blur", () =>
        setClosed(false),
      );
    });
  })();

  // ── Accessible modal manager ───────────────────────────────────
  const modalStack = [];

  function openModal(
    overlay,
    trigger = document.activeElement,
  ) {
    if (!overlay) return;

    const dialog = overlay.matches(
      '[role="dialog"]',
    )
      ? overlay
      : $('[role="dialog"]', overlay);

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("open");

    document.body.classList.add("modal-open");

    modalStack.push({ overlay, trigger });

    const preferred = $(
      "[data-autofocus], .qr-modal-close",
      dialog || overlay,
    );

    (preferred || dialog || overlay).focus();
  }

  function closeModal(
    overlay,
    { restoreFocus = true } = {},
  ) {
    if (!overlay) return;

    const index = modalStack.findLastIndex(
      (item) => item.overlay === overlay,
    );

    const record =
      index >= 0
        ? modalStack.splice(index, 1)[0]
        : null;

    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;

    if (!modalStack.length) {
      document.body.classList.remove(
        "modal-open",
      );
    }

    if (
      restoreFocus &&
      record?.trigger instanceof HTMLElement
    ) {
      record.trigger.focus();
    }
  }

  document.addEventListener("keydown", (event) => {
    const top =
      modalStack[modalStack.length - 1];

    if (!top) return;

    const dialog = top.overlay.matches(
      '[role="dialog"]',
    )
      ? top.overlay
      : $('[role="dialog"]', top.overlay);

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal(top.overlay);
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusable(
      dialog || top.overlay,
    );

    if (!focusable.length) {
      event.preventDefault();
      (dialog || top.overlay).focus();
      return;
    }

    const first = focusable[0];
    const last =
      focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  });

  // ── Leadership details ─────────────────────────────────────────
  const LEADER_INFO = {
    secretary: {
      name: "Mr. Sam Kavai",
      role: "Secretary",
      photo: "images/secretary.jpg",
      bio: [
        "Coordinates church records, correspondence, and communication between leadership and the congregation, helping the ministry remain organised and keeping members informed.",
      ],
      tags: [
        "Administration",
        "Communication",
        "Church Records",
      ],
    },

    deacon: {
      name: "Mr. Paul Mosira",
      role: "Deacon",
      photo: "images/deacon.jpg",
      bio: [
        "Serves the church through practical support, care for members, and assistance with worship and church operations.",
      ],
      tags: [
        "Pastoral Support",
        "Worship",
        "Operations",
      ],
    },

    motherDirector: {
      name: "Lady Linet Lukiri",
      role: "Mother Director",
      photo: "images/women director.jpg",
      bio: [
        "Leads and mentors the women’s fellowship, guiding prayer, discipleship, outreach, and mutual support among the church’s women.",
      ],
      tags: [
        "Women’s Fellowship",
        "Mentorship",
        "Outreach",
      ],
    },

    treasurer: {
      name: "Mr. Paul Mwangi",
      role: "Treasurer",
      photo: "images/Treasurer.jpg",
      bio: [
        "Supports faithful stewardship by overseeing church finances, giving records, and financial accountability.",
      ],
      tags: [
        "Stewardship",
        "Finance",
        "Accountability",
      ],
    },

    youthLeader: {
      name: "Ms. Florence Atino",
      role: "Youth Leader",
      photo: "images/youth leader.jpg",
      bio: [
        "Guides and disciples the church’s young people through worship, mentorship, fellowship, and practical ministry opportunities.",
      ],
      tags: [
        "Youth Ministry",
        "Discipleship",
        "Mentorship",
      ],
    },
  };

  (() => {
    const overlay = $("#leaderModalOverlay");
    const close = $("#leaderModalClose");
    const image = $("#leaderModalImg");
    const role = $("#leaderModalRole");
    const name = $("#leaderModalName");
    const bio = $("#leaderModalBio");
    const tags = $("#leaderModalTags");

    if (!overlay) return;

    $$(".leadership-more[data-leader]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          const info =
            LEADER_INFO[button.dataset.leader];

          if (!info) return;

          if (image) {
            image.src = info.photo;
            image.alt = info.name;
          }

          if (role) {
            role.textContent = info.role;
          }

          if (name) {
            name.textContent = info.name;
          }

          if (bio) {
            bio.replaceChildren(
              ...info.bio.map((paragraph) => {
                const p =
                  document.createElement("p");

                p.textContent = paragraph;

                return p;
              }),
            );
          }

          if (tags) {
            tags.replaceChildren(
              ...info.tags.map((label) => {
                const span =
                  document.createElement("span");

                span.className = "pastor-tag";
                span.textContent = label;

                return span;
              }),
            );
          }

          openModal(overlay, button);
        });
      },
    );

    close?.addEventListener("click", () =>
      closeModal(overlay),
    );

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal(overlay);
      }
    });
  })();

  // ── QR code, loaded only on demand ─────────────────────────────
  (() => {
    const toggle = $("#qrToggleBtn");
    const overlay = $("#qrModalOverlay");
    const close = $("#qrModalClose");
    const canvas = $("#qrCanvas");
    const hint = $("#qrHint");
    const expandButton = $("#qrExpandBtn");
    const expandOverlay = $("#qrExpandOverlay");
    const expandClose = $("#qrExpandClose");
    const expandBox = $("#qrExpandBox");
    const printButton = $("#qrPrintBtn");

    if (!toggle || !overlay || !canvas) return;

    const qrLibraryUrl =
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

    let libraryPromise = null;

    function registrationUrl() {
      try {
        const url = new URL(
          window.location.href,
        );

        if (
          url.protocol === "http:" ||
          url.protocol === "https:"
        ) {
          url.hash = "register";
          return url.href;
        }
      } catch (_) {
        // Fall through to the public URL.
      }

      return "https://umojapagchurch.org/#register";
    }

    function loadLibrary() {
      if (window.QRCode) {
        return Promise.resolve(window.QRCode);
      }

      if (libraryPromise) {
        return libraryPromise;
      }

      libraryPromise = new Promise(
        (resolve, reject) => {
          const script =
            document.createElement("script");

          script.src = qrLibraryUrl;
          script.async = true;
          script.crossOrigin = "anonymous";
          script.referrerPolicy = "no-referrer";

          script.addEventListener(
            "load",
            () => resolve(window.QRCode),
            { once: true },
          );

          script.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  "QR library failed to load.",
                ),
              ),
            { once: true },
          );

          document.head.append(script);
        },
      );

      return libraryPromise;
    }

    function fallbackLink(target) {
      const link =
        document.createElement("a");

      link.href = registrationUrl();
      link.textContent =
        "Open the registration form";
      link.className = "qr-fallback-link";

      target.replaceChildren(link);
    }

    async function render(target, size) {
      target.textContent = "Loading QR code…";

      try {
        const QRCode = await loadLibrary();

        if (!QRCode) {
          throw new Error(
            "QR code support is unavailable.",
          );
        }

        target.replaceChildren();

        new QRCode(target, {
          text: registrationUrl(),
          width: size,
          height: size,
          colorDark: "#0059cf",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });

        if (hint) {
          hint.textContent =
            "The code opens this site’s event registration section.";
        }
      } catch (error) {
        console.error(error);

        fallbackLink(target);

        if (hint) {
          hint.textContent =
            "The QR code could not be generated, so use the direct registration link instead.";
        }
      }
    }

    toggle.addEventListener("click", () => {
      openModal(overlay, toggle);
      render(canvas, 180);
    });

    close?.addEventListener("click", () =>
      closeModal(overlay),
    );

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeModal(overlay);
      }
    });

    function openExpanded() {
      if (!expandOverlay || !expandBox) return;

      openModal(
        expandOverlay,
        expandButton,
      );

      render(expandBox, 320);
    }

    expandButton?.addEventListener(
      "click",
      openExpanded,
    );

    expandButton?.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openExpanded();
        }
      },
    );

    expandClose?.addEventListener(
      "click",
      () => closeModal(expandOverlay),
    );

    expandOverlay?.addEventListener(
      "click",
      (event) => {
        if (
          event.target === expandOverlay
        ) {
          closeModal(expandOverlay);
        }
      },
    );

    printButton?.addEventListener(
      "click",
      () => {
        const renderedCanvas = $(
          "canvas",
          canvas,
        );

        const renderedImage = $("img", canvas);

        const src =
          renderedCanvas?.toDataURL("image/png") ||
          renderedImage?.src;

        if (!src) {
          window.alert(
            "The QR code is not ready yet. Please try again in a moment.",
          );

          return;
        }

        const printFrame =
          document.createElement("iframe");

        printFrame.className = "print-frame";
        printFrame.title =
          "Print registration QR code";

        document.body.append(printFrame);

        const doc =
          printFrame.contentDocument;

        if (!doc) return;

        doc.open();

        doc.write(
          `<!doctype html><html><head><title>Umoja P.A.G Church — Scan to Register</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:48px}h1{color:#003d8f;margin-bottom:4px}p{color:#6b7280}img{width:280px;height:280px;margin-top:20px}</style></head><body><h1>Umoja P.A.G Church</h1><p>Scan to register for an event</p><img src="${src}" alt="Registration QR code"></body></html>`,
        );

        doc.close();

        window.setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();

          window.setTimeout(
            () => printFrame.remove(),
            1000,
          );
        }, 180);
      },
    );
  })();

  // ── API forms ──────────────────────────────────────────────────
  class SubmissionError extends Error {
    constructor(message) {
      super(message);
      this.name = "SubmissionError";
    }
  }

  async function postJson(endpoint, payload) {
    if (
      window.location.protocol === "file:"
    ) {
      throw new SubmissionError(
        "This local preview cannot send forms. Deploy the site with its API endpoints, or contact the church directly.",
      );
    }

    const controller =
      new AbortController();

    const timeout = window.setTimeout(
      () => controller.abort(),
      15000,
    );

    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        credentials: "same-origin",
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new SubmissionError(
          "The request timed out before it was sent. Please try again or contact the church directly.",
        );
      }

      throw new SubmissionError(
        "The request could not be sent. Check your connection and try again, or contact the church directly.",
      );
    } finally {
      window.clearTimeout(timeout);
    }

    const raw = await response.text();

    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (_) {
        throw new SubmissionError(
          "The server returned an unexpected response. Your request has not been confirmed.",
        );
      }
    }

    if (
      !response.ok ||
      data.success !== true
    ) {
      throw new SubmissionError(
        safeMessage(
          data.message,
          "The server did not confirm the submission. Please try again or contact the church directly.",
        ),
      );
    }

    return data;
  }

  function normalizeKenyanPhone(value) {
    const cleaned = value.replace(
      /[\s().-]+/g,
      "",
    );

    if (/^0(7|1)\d{8}$/.test(cleaned)) {
      return `+254${cleaned.slice(1)}`;
    }

    if (/^254(7|1)\d{8}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  function isValidKenyanPhone(value) {
    return /^\+254(7|1)\d{8}$/.test(
      normalizeKenyanPhone(value),
    );
  }

  function showFormError(
    form,
    errorBox,
    message,
    field = null,
  ) {
    if (!errorBox) return;

    errorBox.textContent = message;
    errorBox.classList.add("is-visible");

    if (field) {
      field.setAttribute(
        "aria-invalid",
        "true",
      );

      field.focus();
    } else {
      errorBox.focus();
    }

    form?.setAttribute(
      "aria-invalid",
      "true",
    );
  }

  function clearFormError(form, errorBox) {
    errorBox?.classList.remove(
      "is-visible",
    );

    if (errorBox) {
      errorBox.textContent = "";
    }

    form?.removeAttribute("aria-invalid");

    $$(
      '[aria-invalid="true"]',
      form || document,
    ).forEach((field) =>
      field.removeAttribute("aria-invalid"),
    );
  }

  function formObject(form) {
    const object = {};

    new FormData(form).forEach(
      (value, key) => {
        object[key] =
          typeof value === "string"
            ? value.trim()
            : value;
      },
    );

    return object;
  }

  function bindApiForm({
    formId,
    buttonId,
    errorId,
    successId,
    resetId,
    endpoint,
    busyLabel,
    makePayload,
    validate,
    successTextId,
  }) {
    const form = $(`#${formId}`);
    const button = $(`#${buttonId}`);
    const errorBox = $(`#${errorId}`);
    const successBox = $(`#${successId}`);
    const resetButton = $(`#${resetId}`);

    if (!form || !button || !successBox) {
      return;
    }

    form.addEventListener(
      "input",
      (event) => {
        clearFormError(form, errorBox);

        if (
          event.target instanceof HTMLElement
        ) {
          event.target.removeAttribute(
            "aria-invalid",
          );
        }
      },
    );

    form.addEventListener("change", () =>
      clearFormError(form, errorBox),
    );

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearFormError(form, errorBox);

        if (!form.checkValidity()) {
          const invalid = $(
            ":invalid",
            form,
          );

          if (invalid) {
            invalid.setAttribute(
              "aria-invalid",
              "true",
            );
          }

          form.reportValidity();
          invalid?.focus();

          if (
            formId ===
            "registrationForm"
          ) {
            window.dispatchEvent(
              new CustomEvent(
                "umoja:registration-invalid",
                {
                  detail: {
                    message:
                      "Please complete the required fields.",
                  },
                },
              ),
            );
          }

          return;
        }

        const values = formObject(form);

        const validationError =
          validate?.(values, form);

        if (validationError) {
          showFormError(
            form,
            errorBox,
            validationError.message,
            validationError.field || null,
          );

          if (
            formId ===
            "registrationForm"
          ) {
            window.dispatchEvent(
              new CustomEvent(
                "umoja:registration-invalid",
                {
                  detail: {
                    message:
                      validationError.message,
                  },
                },
              ),
            );
          }

          return;
        }

        if (
          values.company ||
          values.companyWebsite
        ) {
          return;
        }

        setBusy(
          button,
          true,
          busyLabel,
        );

        form.setAttribute(
          "aria-busy",
          "true",
        );

        try {
          const payload =
            makePayload(values);

          const data = await postJson(
            endpoint,
            payload,
          );

          const successText =
            successTextId
              ? $(`#${successTextId}`)
              : null;

          if (
            successText &&
            data.message
          ) {
            successText.textContent =
              safeMessage(
                data.message,
                successText.textContent,
              );
          }

          form.hidden = true;

          successBox.classList.add(
            "is-visible",
          );

          successBox.focus();
        } catch (error) {
          console.error(
            `${formId} submission error:`,
            error,
          );

          showFormError(
            form,
            errorBox,
            error instanceof SubmissionError
              ? error.message
              : "The request was not sent. Please try again or contact the church directly.",
          );
        } finally {
          form.removeAttribute("aria-busy");

          setBusy(
            button,
            false,
            busyLabel,
          );
        }
      },
    );

    resetButton?.addEventListener(
      "click",
      () => {
        form.reset();

        clearFormError(form, errorBox);

        successBox.classList.remove(
          "is-visible",
        );

        form.hidden = false;

        const first = $(
          "input:not([type=hidden]), select, textarea",
          form,
        );

        first?.focus();
      },
    );
  }

  bindApiForm({
    formId: "registrationForm",
    buttonId: "submitBtn",
    errorId: "formError",
    successId: "formSuccess",
    resetId: "registrationResetBtn",
    endpoint: "/api/register",
    busyLabel: "Sending registration…",
    successTextId: "formSuccessText",

    validate(values) {
      const phone = $("#phone");
      const email = $("#email");

      if (
        !isValidKenyanPhone(
          values.phone || "",
        )
      ) {
        return {
          message:
            "Enter a valid Kenyan phone number, such as 0712345678 or +254712345678.",
          field: phone,
        };
      }

      if (
        values.email &&
        email &&
        !email.validity.valid
      ) {
        return {
          message:
            "Enter a valid email address or leave the email field blank.",
          field: email,
        };
      }

      return null;
    },

    makePayload(values) {
      return {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: normalizeKenyanPhone(
          values.phone,
        ),
        email: values.email || "",
        ageGroup: values.ageGroup || "",
        area: values.area || "",
        regFor: values.regFor,
        notes: values.notes || "",
        consent: true,
        guardianConsent: true,
        honeypot:
          values.companyWebsite || "",
      };
    },
  });

  bindApiForm({
    formId: "messageForm",
    buttonId: "messageSubmitBtn",
    errorId: "messageFormError",
    successId: "messageFormSuccess",
    resetId: "messageResetBtn",
    endpoint: "/api/contact-message",
    busyLabel: "Sending message…",

    makePayload(values) {
      return {
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
        consent: true,
        honeypot:
          values.company || "",
      };
    },
  });

  bindApiForm({
    formId: "prayerForm",
    buttonId: "prayerSubmitBtn",
    errorId: "prayerFormError",
    successId: "prayerFormSuccess",
    resetId: "prayerResetBtn",
    endpoint: "/api/prayer-request",
    busyLabel:
      "Sending prayer request…",

    makePayload(values) {
      return {
        name: values.name,
        request: values.request,
        consent: true,
        honeypot:
          values.company || "",
      };
    },
  });

  bindApiForm({
    formId: "pastoralCareForm",
    buttonId: "careSubmitBtn",
    errorId: "careFormError",
    successId: "careFormSuccess",
    resetId: "careResetBtn",
    endpoint: "/api/pastoral-care",
    busyLabel: "Sending request…",

    makePayload(values) {
      return {
        name: values.name,
        email: values.email,
        request: values.request,
        consent: true,
        honeypot:
          values.company || "",
      };
    },
  });

  // ── Events and updates ─────────────────────────────────────────
  (() => {
    const filterWrap =
      $("#eventsFilterPills");

    const upcomingWrap =
      $("#eventsByMonth");

    const pastWrap =
      $("#pastEventsByMonth");

    const pastRow =
      $("#pastEventsRow");

    const pastToggle =
      $("#pastEventsToggle");

    if (
      !filterWrap ||
      !upcomingWrap
    ) {
      return;
    }

    const items = [
      {
        date: "2026-06-20",
        title: "Kesha Night",
        category: "Prayer & Worship",
        time: "7:00 PM",
        location:
          "Umoja P.A.G Church",
        description:
          "A night of prayer, worship, intercession, and teaching for the whole congregation. No registration is required.",
        link: "#contact",
        linkText: "Ask a question",
      },
      {
        date: "2026-05-11",
        title:
          "Women’s Fellowship Week",
        category:
          "Women’s Fellowship",
        time: "5:00 PM daily",
        location:
          "Umoja P.A.G Church",
        description:
          "A week of fellowship, teaching, testimony, and prayer for the women of the church.",
      },
      {
        date: "2026-04-13",
        title:
          "Men’s Fellowship Week",
        category:
          "Men’s Fellowship",
        time: "6:00 PM daily",
        location:
          "Umoja P.A.G Church",
        description:
          "A week of teaching and fellowship focused on discipleship, accountability, family, and community leadership.",
      },
      {
        date: "2026-03-09",
        title: "Evangelism Week",
        category:
          "Evangelism & Outreach",
        time: "All day",
        location:
          "Umoja and surrounding estates",
        description:
          "A week of outreach and community service across Umoja and neighbouring estates.",
      },
      {
        date: null,
        sortDate: "2026-08-31",
        dateLabel:
          "August 2026 — exact date to be confirmed",
        dateTbd: true,
        title:
          "Youth Camp & Family Fun Day",
        category: "Youth",
        time: "All day",
        location:
          "Umoja P.A.G Church",
        description:
          "Youth camp activities followed by a family fun day with games, music, team challenges, and a shared meal. Registration is open while the final date is confirmed.",
        link: "#register",
        linkText:
          "Register interest",
      },
    ];

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const pad = (value) =>
      String(value).padStart(2, "0");

    const today = new Date();

    const todayString =
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const escapeHtml = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const iconCalendar =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const iconClock =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const iconPin =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>';

    const itemSortDate = (item) =>
      item.date || item.sortDate;

    const isUpcoming = (item) =>
      itemSortDate(item) >= todayString;

    const dateText = (item) => {
      if (item.dateLabel) {
        return item.dateLabel;
      }

      const [year, month, day] =
        item.date
          .split("-")
          .map(Number);

      return `${monthNames[month - 1]} ${day}, ${year}`;
    };

    function card(item) {
      const media = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">`
        : iconCalendar.replace(
            'width="13" height="13"',
            'width="40" height="40"',
          );

      return `<article class="event-card">
        <div class="event-card-media">
          <span class="event-card-badge">${escapeHtml(item.category)}</span>
          ${item.dateTbd ? '<span class="event-card-date-status">Date TBC</span>' : ""}
          ${media}
        </div>
        <div class="event-card-body">
          <h4>${escapeHtml(item.title)}</h4>
          <div class="event-card-meta">
            <span class="event-card-meta-item">${iconCalendar}${escapeHtml(dateText(item))}</span>
            ${item.time ? `<span class="event-card-meta-item">${iconClock}${escapeHtml(item.time)}</span>` : ""}
            ${item.location ? `<span class="event-card-meta-item">${iconPin}${escapeHtml(item.location)}</span>` : ""}
          </div>
          ${item.description ? `<p class="event-card-desc">${escapeHtml(item.description)}</p>` : ""}
          ${item.link ? `<a href="${escapeHtml(item.link)}" class="event-card-link">${escapeHtml(item.linkText || "Learn more")}</a>` : ""}
        </div>
      </article>`;
    }

    function renderGroups(
      list,
      container,
      emptyMessage,
    ) {
      if (!list.length) {
        container.innerHTML =
          `<p class="events-empty-state">${escapeHtml(emptyMessage)}</p>`;

        return;
      }

      const groups = new Map();

      list.forEach((item) => {
        const [year, month] =
          itemSortDate(item)
            .split("-")
            .map(Number);

        const key =
          `${year}-${pad(month)}`;

        if (!groups.has(key)) {
          groups.set(key, {
            year,
            month,
            events: [],
          });
        }

        groups
          .get(key)
          .events.push(item);
      });

      container.innerHTML =
        Array.from(groups.values())
          .map(
            ({
              year,
              month,
              events,
            }) => `
        <section class="events-month-group" aria-labelledby="events-${year}-${month}">
          <div class="events-month-group-header">
            <h4 id="events-${year}-${month}">${monthNames[month - 1]} ${year}</h4>
            <span class="events-month-rule" aria-hidden="true"></span>
            <span class="events-month-count">${events.length} ${events.length === 1 ? "item" : "items"}</span>
          </div>
          <div class="events-grid">${events.map(card).join("")}</div>
        </section>`,
          )
          .join("");
    }

    const categories = [
      "All",
      ...new Set(
        items.map(
          (item) => item.category,
        ),
      ),
    ];

    let activeCategory = "All";

    function renderFilters() {
      filterWrap.innerHTML =
        categories
          .map((category) => {
            const active =
              category ===
              activeCategory;

            return `<button type="button" class="filter-pill${active ? " is-active" : ""}" data-category="${escapeHtml(category)}" aria-pressed="${active}">${escapeHtml(category.toUpperCase())}</button>`;
          })
          .join("");
    }

    function renderEvents() {
      const selected =
        items.filter(
          (item) =>
            activeCategory === "All" ||
            item.category ===
              activeCategory,
        );

      const upcoming =
        selected
          .filter(isUpcoming)
          .sort((a, b) =>
            itemSortDate(a).localeCompare(
              itemSortDate(b),
            ),
          );

      const past =
        selected
          .filter(
            (item) =>
              !isUpcoming(item),
          )
          .sort((a, b) =>
            itemSortDate(b).localeCompare(
              itemSortDate(a),
            ),
          );

      renderGroups(
        upcoming,
        upcomingWrap,
        "Nothing upcoming in this category right now.",
      );

      if (
        pastWrap &&
        pastRow &&
        pastToggle
      ) {
        if (past.length) {
          pastRow.hidden = false;

          renderGroups(
            past,
            pastWrap,
            "No past events in this category.",
          );
        } else {
          pastRow.hidden = true;
          pastWrap.hidden = true;
          pastWrap.replaceChildren();

          pastToggle.textContent =
            "View Past Events";

          pastToggle.setAttribute(
            "aria-expanded",
            "false",
          );
        }
      }
    }

    filterWrap.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            ".filter-pill",
          );

        if (!button) return;

        activeCategory =
          button.dataset.category;

        renderFilters();
        renderEvents();
      },
    );

    pastToggle?.setAttribute(
      "aria-controls",
      "pastEventsByMonth",
    );

    pastToggle?.setAttribute(
      "aria-expanded",
      "false",
    );

    pastToggle?.addEventListener(
      "click",
      () => {
        const showing =
          pastWrap.hidden;

        pastWrap.hidden = !showing;

        pastToggle.textContent =
          showing
            ? "Hide Past Events"
            : "View Past Events";

        pastToggle.setAttribute(
          "aria-expanded",
          String(showing),
        );
      },
    );

    const eventSelect = $("#regFor");

    if (eventSelect) {
      const placeholder =
        eventSelect.options[0];

      eventSelect.replaceChildren(
        placeholder,
      );

      items
        .filter(isUpcoming)
        .forEach((item) => {
          const option =
            document.createElement(
              "option",
            );

          option.value = item.title;
          option.textContent =
            item.title;

          eventSelect.append(option);
        });

      const other =
        document.createElement(
          "option",
        );

      other.value =
        "Other Special Event";

      other.textContent =
        "Other Special Event";

      eventSelect.append(other);
    }

    renderFilters();
    renderEvents();
  })();
})();