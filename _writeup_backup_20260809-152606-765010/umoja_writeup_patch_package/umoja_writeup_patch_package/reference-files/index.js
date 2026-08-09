(() => {
  "use strict";

  const $ = (selector, context = document) =>
    context.querySelector(selector);

  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  function getFocusable(container) {
    if (!container) return [];

    return $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container,
    ).filter(
      (element) =>
        !element.hidden &&
        element.getClientRects().length > 0,
    );
  }

  function safeMessage(value, fallback) {
    const text =
      typeof value === "string"
        ? value.trim()
        : "";

    return text &&
      text.length <= 240
      ? text
      : fallback;
  }

  function setBusy(
    button,
    busy,
    busyLabel,
  ) {
    if (!button) return;

    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel =
        button.textContent.trim();
    }

    button.disabled = busy;

    button.setAttribute(
      "aria-busy",
      String(busy),
    );

    button.textContent =
      busy
        ? busyLabel
        : button.dataset.defaultLabel;
  }

  const navbar =
    $("#navbar");

  const navToggle =
    $("#navToggle");

  const navLinks =
    $("#navLinks");

  const navOverlay =
    $("#navOverlay");

  const mobileNavQuery =
    window.matchMedia(
      "(max-width: 1200px)",
    );

  let navReturnFocus = null;

  function updateNavbarAppearance() {
    if (!navbar) return;

    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 18 ||
        !document.body.classList.contains(
          "home-page",
        ),
    );
  }

  function setMobileNavAccessibility(
    isOpen,
  ) {
    if (!navLinks) return;

    if (mobileNavQuery.matches) {
      navLinks.setAttribute(
        "aria-hidden",
        String(!isOpen),
      );
    } else {
      navLinks.removeAttribute(
        "aria-hidden",
      );
    }

    navOverlay?.setAttribute(
      "aria-hidden",
      String(!isOpen),
    );
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

    navReturnFocus =
      document.activeElement;

    navToggle.classList.add(
      "open",
    );

    navLinks.classList.add(
      "open",
    );

    navOverlay.classList.add(
      "open",
    );

    document.body.classList.add(
      "nav-open",
    );

    navToggle.setAttribute(
      "aria-expanded",
      "true",
    );

    navToggle.setAttribute(
      "aria-label",
      "Close menu",
    );

    setMobileNavAccessibility(
      true,
    );

    $("a", navLinks)?.focus();
  }

  function closeMobileNav({
    restoreFocus = false,
  } = {}) {
    if (
      !navToggle ||
      !navLinks ||
      !navOverlay
    ) {
      return;
    }

    navToggle.classList.remove(
      "open",
    );

    navLinks.classList.remove(
      "open",
    );

    navOverlay.classList.remove(
      "open",
    );

    document.body.classList.remove(
      "nav-open",
    );

    navToggle.setAttribute(
      "aria-expanded",
      "false",
    );

    navToggle.setAttribute(
      "aria-label",
      "Open menu",
    );

    setMobileNavAccessibility(
      false,
    );

    if (
      restoreFocus &&
      navReturnFocus instanceof
        HTMLElement
    ) {
      navReturnFocus.focus();
    }
  }

  updateNavbarAppearance();

  setMobileNavAccessibility(
    false,
  );

  window.addEventListener(
    "scroll",
    updateNavbarAppearance,
    {
      passive: true,
    },
  );

  navToggle?.addEventListener(
    "click",
    () => {
      navLinks?.classList.contains(
        "open",
      )
        ? closeMobileNav({
            restoreFocus: true,
          })
        : openMobileNav();
    },
  );

  navOverlay?.addEventListener(
    "click",
    () =>
      closeMobileNav({
        restoreFocus: true,
      }),
  );

  navLinks?.addEventListener(
    "click",
    (event) => {
      if (
        event.target.closest(
          "a",
        )
      ) {
        closeMobileNav();
      }
    },
  );

  mobileNavQuery.addEventListener(
    "change",
    () =>
      closeMobileNav(),
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key ===
          "Escape" &&
        navLinks?.classList.contains(
          "open",
        )
      ) {
        event.preventDefault();

        closeMobileNav({
          restoreFocus: true,
        });

        return;
      }

      if (
        event.key !==
          "Tab" ||
        !navLinks?.classList.contains(
          "open",
        )
      ) {
        return;
      }

      const focusable =
        getFocusable(
          navLinks,
        );

      if (
        !focusable.length
      ) {
        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          first
      ) {
        event.preventDefault();

        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();

        first.focus();
      }
    },
  );

  if (navLinks) {
    const indicator =
      document.createElement(
        "span",
      );

    indicator.className =
      "nav-indicator";

    indicator.setAttribute(
      "aria-hidden",
      "true",
    );

    navLinks.append(
      indicator,
    );

    const positionIndicator =
      () => {
        if (
          mobileNavQuery.matches
        ) {
          indicator.style.opacity =
            "0";

          return;
        }

        const active =
          $("a.active", navLinks);

        if (!active) {
          indicator.style.opacity =
            "0";

          return;
        }

        const linkRect =
          active.getBoundingClientRect();

        const navRect =
          navLinks.getBoundingClientRect();

        const width =
          Math.max(
            20,
            Math.round(
              linkRect.width *
                0.52,
            ),
          );

        const x =
          Math.round(
            linkRect.left -
              navRect.left +
              (linkRect.width -
                width) /
                2,
          );

        indicator.style.width =
          `${width}px`;

        indicator.style.transform =
          `translateX(${x}px)`;

        indicator.style.opacity =
          "1";
      };

    positionIndicator();

    window.addEventListener(
      "resize",
      positionIndicator,
    );

    window.addEventListener(
      "load",
      positionIndicator,
    );
  }

  const modalStack = [];

  function openModal(
    overlay,
    trigger =
      document.activeElement,
  ) {
    if (!overlay) return;

    const dialog =
      overlay.matches(
        '[role="dialog"]',
      )
        ? overlay
        : $(
            '[role="dialog"]',
            overlay,
          ) ||
          overlay;

    overlay.hidden = false;

    overlay.setAttribute(
      "aria-hidden",
      "false",
    );

    overlay.classList.add(
      "open",
    );

    document.body.classList.add(
      "modal-open",
    );

    modalStack.push({
      overlay,
      trigger,
    });

    const preferred =
      $(
        "[data-autofocus], .qr-modal-close",
        dialog,
      );

    (
      preferred ||
      dialog
    ).focus();
  }

  function closeModal(
    overlay,
    {
      restoreFocus = true,
    } = {},
  ) {
    if (!overlay) return;

    const index =
      modalStack.findLastIndex(
        (item) =>
          item.overlay ===
          overlay,
      );

    const record =
      index >= 0
        ? modalStack.splice(
            index,
            1,
          )[0]
        : null;

    overlay.classList.remove(
      "open",
    );

    overlay.setAttribute(
      "aria-hidden",
      "true",
    );

    overlay.hidden = true;

    if (
      !modalStack.length
    ) {
      document.body.classList.remove(
        "modal-open",
      );
    }

    if (
      restoreFocus &&
      record?.trigger instanceof
        HTMLElement
    ) {
      record.trigger.focus();
    }
  }

  document.addEventListener(
    "keydown",
    (event) => {
      const top =
        modalStack[
          modalStack.length -
            1
        ];

      if (!top) return;

      const dialog =
        top.overlay.matches(
          '[role="dialog"]',
        )
          ? top.overlay
          : $(
              '[role="dialog"]',
              top.overlay,
            ) ||
            top.overlay;

      if (
        event.key ===
        "Escape"
      ) {
        event.preventDefault();

        closeModal(
          top.overlay,
        );

        return;
      }

      if (
        event.key !==
        "Tab"
      ) {
        return;
      }

      const focusable =
        getFocusable(
          dialog,
        );

      if (
        !focusable.length
      ) {
        event.preventDefault();

        dialog.focus();

        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          first
      ) {
        event.preventDefault();

        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();

        first.focus();
      }
    },
  );

  (() => {
    const hero =
      $(".editorial-hero");

    const visual =
      hero?.querySelector(
        ".editorial-hero-visual",
      );

    const copy =
      hero?.querySelector(
        ".editorial-hero-copy",
      );

    const mainFigure =
      visual?.querySelector(
        ".hero-photo-main",
      );

    const mainImage =
      mainFigure?.querySelector(
        "img",
      );

    const churchImage =
      visual?.querySelector(
        ".hero-photo-secondary img",
      );

    const choirImage =
      visual?.querySelector(
        ".hero-photo-tertiary img",
      );

    const caption =
      visual?.querySelector(
        ".hero-photo-caption",
      );

    if (
      !hero ||
      !visual ||
      !copy ||
      !mainFigure ||
      !mainImage
    ) {
      return;
    }

    const slides = [
      {
        label: "Worship",
        src:
          "images/background.jpg",
        alt:
          "Worship and faith at Umoja P.A.G Church",
      },
      {
        label: "Family",
        src:
          "images/background 2.jpg",
        alt:
          "Church family and fellowship at Umoja P.A.G Church",
      },
      {
        label: "Purpose",
        src:
          "images/background3.png",
        alt:
          "Purpose-driven ministry at Umoja P.A.G Church",
      },
    ];

    if (churchImage) {
      churchImage.src =
        "images/Church.jpg";

      churchImage.alt =
        "Umoja P.A.G Church building";

      churchImage.loading =
        "eager";

      churchImage.decoding =
        "async";
    }

    if (choirImage) {
      choirImage.src =
        "images/choir 2.jpg";

      choirImage.alt =
        "Umoja P.A.G Church choir ministering in song";

      choirImage.loading =
        "eager";

      choirImage.decoding =
        "async";
    }

    mainImage.loading =
      "eager";

    mainImage.decoding =
      "async";

    if (caption) {
      caption.textContent =
        "Worship · Family · Purpose";
    }

    let stage =
      visual.querySelector(
        ".umoja-clean-stage",
      );

    if (!stage) {
      stage =
        document.createElement(
          "div",
        );

      stage.className =
        "umoja-clean-stage";

      stage.setAttribute(
        "aria-hidden",
        "true",
      );

      visual.prepend(
        stage,
      );
    }

    stage.replaceChildren();

    const stageSlides =
      slides.map(
        (slide) => {
          const layer =
            document.createElement(
              "div",
            );

          layer.className =
            "umoja-clean-stage-slide";

          layer.style.backgroundImage =
            `url("${slide.src}")`;

          stage.append(
            layer,
          );

          return layer;
        },
      );

    let dots =
      copy.querySelector(
        ".umoja-clean-hero-dots",
      );

    if (!dots) {
      dots =
        document.createElement(
          "div",
        );

      dots.className =
        "umoja-clean-hero-dots";

      dots.setAttribute(
        "aria-label",
        "Hero slides",
      );

      copy.append(
        dots,
      );
    }

    dots.replaceChildren();

    const status =
      document.createElement(
        "div",
      );

    status.className =
      "umoja-clean-hero-status";

    status.setAttribute(
      "aria-live",
      "polite",
    );

    hero.append(
      status,
    );

    let current = 0;

    let timer = null;

    let hoverPaused =
      false;

    let focusPaused =
      false;

    let heroVisible =
      true;

    const intervalMs =
      7200;

    const buttons =
      slides.map(
        (
          slide,
          index,
        ) => {
          const button =
            document.createElement(
              "button",
            );

          button.type =
            "button";

          button.className =
            "umoja-clean-hero-dot";

          button.setAttribute(
            "aria-label",
            `Show hero slide ${index + 1}: ${slide.label}`,
          );

          button.addEventListener(
            "click",
            () => {
              show(
                index,
                true,
              );

              start();
            },
          );

          dots.append(
            button,
          );

          return button;
        },
      );

    function updateDots() {
      buttons.forEach(
        (
          button,
          index,
        ) => {
          const active =
            index ===
            current;

          button.classList.toggle(
            "is-active",
            active,
          );

          button.setAttribute(
            "aria-pressed",
            String(active),
          );
        },
      );
    }

    function swapMain(
      slide,
    ) {
      if (
        mainImage.getAttribute(
          "src",
        ) ===
        slide.src
      ) {
        return;
      }

      mainFigure.classList.add(
        "is-switching",
      );

      window.setTimeout(
        () => {
          mainImage.src =
            slide.src;

          mainImage.alt =
            slide.alt;
        },
        reduceMotion.matches
          ? 0
          : 240,
      );

      window.setTimeout(
        () =>
          mainFigure.classList.remove(
            "is-switching",
          ),
        reduceMotion.matches
          ? 0
          : 980,
      );
    }

    function show(
      index,
      announce = false,
    ) {
      current =
        (index +
          slides.length) %
        slides.length;

      const activeSlide =
        slides[current];

      const backgroundIndex =
        (current + 1) %
        slides.length;

      swapMain(
        activeSlide,
      );

      stageSlides.forEach(
        (
          layer,
          layerIndex,
        ) => {
          layer.classList.toggle(
            "is-active",
            layerIndex ===
              backgroundIndex,
          );
        },
      );

      updateDots();

      if (announce) {
        status.textContent =
          `Showing hero slide ${current + 1} of ${slides.length}: ${activeSlide.label}.`;
      }
    }

    function stop() {
      if (timer) {
        window.clearInterval(
          timer,
        );
      }

      timer = null;
    }

    function canPlay() {
      return (
        !reduceMotion.matches &&
        !hoverPaused &&
        !focusPaused &&
        heroVisible &&
        !document.hidden
      );
    }

    function start() {
      stop();

      if (!canPlay()) {
        return;
      }

      timer =
        window.setInterval(
          () =>
            show(
              current +
                1,
            ),
          intervalMs,
        );
    }

    hero.addEventListener(
      "pointerenter",
      () => {
        hoverPaused =
          true;

        stop();
      },
    );

    hero.addEventListener(
      "pointerleave",
      () => {
        hoverPaused =
          false;

        start();
      },
    );

    hero.addEventListener(
      "focusin",
      () => {
        focusPaused =
          true;

        stop();
      },
    );

    hero.addEventListener(
      "focusout",
      () => {
        window.setTimeout(
          () => {
            focusPaused =
              hero.contains(
                document.activeElement,
              );

            start();
          },
          0,
        );
      },
    );

    document.addEventListener(
      "visibilitychange",
      start,
    );

    if (
      "IntersectionObserver" in
      window
    ) {
      const visibilityObserver =
        new IntersectionObserver(
          ([entry]) => {
            heroVisible =
              Boolean(
                entry
                  ?.isIntersecting,
              );

            start();
          },
          {
            threshold:
              0.18,
          },
        );

      visibilityObserver.observe(
        hero,
      );
    }

    reduceMotion.addEventListener(
      "change",
      () => {
        if (
          reduceMotion.matches
        ) {
          stop();
        } else {
          start();
        }
      },
    );

    show(0);

    start();
  })();

  const LEADER_INFO = {
    secretary: {
      name:
        "Mr. Sam Kavai",

      role:
        "Secretary",

      photo:
        "images/secretary.jpg",

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
      name:
        "Mr. Paul Mosira",

      role:
        "Deacon",

      photo:
        "images/deacon.jpg",

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
      name:
        "Lady Linet Lukiri",

      role:
        "Mother Director",

      photo:
        "images/women director.jpg",

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
      name:
        "Mr. Paul Mwangi",

      role:
        "Treasurer",

      photo:
        "images/Treasurer.jpg",

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
      name:
        "Ms. Florence Atino",

      role:
        "Youth Leader",

      photo:
        "images/youth leader.jpg",

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

  function normaliseLeadershipCards(
    root = document,
  ) {
    $$(
      ".leadership-card",
      root,
    ).forEach(
      (card) => {
        const button =
          $(
            ".leadership-more",
            card,
          );

        const name =
          $(
            ".leadership-name",
            card,
          )
            ?.textContent
            ?.trim() ||
          "this church leader";

        if (
          !button ||
          button.dataset
            .normalised ===
            "true"
        ) {
          return;
        }

        button.dataset.normalised =
          "true";

        button.setAttribute(
          "aria-label",
          `Learn more about ${name}`,
        );

        const key =
          button.dataset.leader;

        button.replaceChildren();

        const label =
          document.createElement(
            "span",
          );

        label.textContent =
          "Learn more";

        const arrow =
          document.createElement(
            "span",
          );

        arrow.className =
          "umoja-learn-arrow";

        arrow.setAttribute(
          "aria-hidden",
          "true",
        );

        arrow.textContent =
          "→";

        button.append(
          label,
          arrow,
        );

        if (key) {
          button.dataset.leader =
            key;
        }
      },
    );
  }

  normaliseLeadershipCards();

  (() => {
    const overlay =
      $("#leaderModalOverlay");

    const close =
      $("#leaderModalClose");

    const image =
      $("#leaderModalImg");

    const role =
      $("#leaderModalRole");

    const name =
      $("#leaderModalName");

    const bio =
      $("#leaderModalBio");

    const tags =
      $("#leaderModalTags");

    if (!overlay) return;

    $$(
      ".leadership-more[data-leader]",
    ).forEach(
      (button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            const info =
              LEADER_INFO[
                button.dataset
                  .leader
              ];

            if (!info) {
              return;
            }

            if (image) {
              image.src =
                info.photo;

              image.alt =
                info.name;
            }

            if (role) {
              role.textContent =
                info.role;
            }

            if (name) {
              name.textContent =
                info.name;
            }

            if (bio) {
              bio.replaceChildren(
                ...info.bio.map(
                  (
                    paragraph,
                  ) => {
                    const p =
                      document.createElement(
                        "p",
                      );

                    p.textContent =
                      paragraph;

                    return p;
                  },
                ),
              );
            }

            if (tags) {
              tags.replaceChildren(
                ...info.tags.map(
                  (label) => {
                    const span =
                      document.createElement(
                        "span",
                      );

                    span.className =
                      "pastor-tag";

                    span.textContent =
                      label;

                    return span;
                  },
                ),
              );
            }

            openModal(
              overlay,
              button,
            );
          },
        );
      },
    );

    close?.addEventListener(
      "click",
      () =>
        closeModal(
          overlay,
        ),
    );

    overlay.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          overlay
        ) {
          closeModal(
            overlay,
          );
        }
      },
    );
  })();

  (() => {
    const toggle =
      $("#qrToggleBtn");

    const overlay =
      $("#qrModalOverlay");

    const close =
      $("#qrModalClose");

    const canvas =
      $("#qrCanvas");

    const hint =
      $("#qrHint");

    const expandButton =
      $("#qrExpandBtn");

    const expandOverlay =
      $("#qrExpandOverlay");

    const expandClose =
      $("#qrExpandClose");

    const expandBox =
      $("#qrExpandBox");

    const printButton =
      $("#qrPrintBtn");

    if (
      !toggle ||
      !overlay ||
      !canvas
    ) {
      return;
    }

    const PUBLIC_URL =
      "https://umojapagchurch.org/events.html#register";

    const SOURCES = [
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
    ];

    let libraryPromise =
      null;

    function registrationUrl() {
      try {
        const url =
          new URL(
            window.location.href,
          );

        const local =
          [
            "localhost",
            "127.0.0.1",
            "::1",
          ].includes(
            url.hostname,
          );

        if (
          url.protocol ===
            "file:" ||
          local
        ) {
          return PUBLIC_URL;
        }

        if (
          url.protocol ===
            "http:" ||
          url.protocol ===
            "https:"
        ) {
          url.pathname =
            url.pathname.replace(
              /[^/]*$/,
              "events.html",
            );

          url.hash =
            "register";

          return url.href;
        }
      } catch (_) {}

      return PUBLIC_URL;
    }

    function loadScript(
      src,
    ) {
      return new Promise(
        (
          resolve,
          reject,
        ) => {
          if (
            window.QRCode
          ) {
            resolve(
              window.QRCode,
            );

            return;
          }

          const existing =
            Array.from(
              document.scripts,
            ).find(
              (script) =>
                script.src ===
                src,
            );

          const script =
            existing ||
            document.createElement(
              "script",
            );

          script.addEventListener(
            "load",
            () =>
              window.QRCode
                ? resolve(
                    window.QRCode,
                  )
                : reject(
                    new Error(
                      "QRCode unavailable",
                    ),
                  ),
            {
              once: true,
            },
          );

          script.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  `Could not load ${src}`,
                ),
              ),
            {
              once: true,
            },
          );

          if (!existing) {
            script.src =
              src;

            script.async =
              true;

            script.crossOrigin =
              "anonymous";

            script.referrerPolicy =
              "no-referrer";

            document.head.append(
              script,
            );
          }
        },
      );
    }

    async function loadLibrary() {
      if (
        window.QRCode
      ) {
        return window.QRCode;
      }

      if (
        libraryPromise
      ) {
        return libraryPromise;
      }

      libraryPromise =
        (async () => {
          let lastError;

          for (
            const src of
            SOURCES
          ) {
            try {
              return await loadScript(
                src,
              );
            } catch (error) {
              lastError =
                error;
            }
          }

          throw (
            lastError ||
            new Error(
              "QR library unavailable",
            )
          );
        })();

      libraryPromise.catch(
        () => {
          libraryPromise =
            null;
        },
      );

      return libraryPromise;
    }

    function fallback(
      target,
    ) {
      const message =
        document.createElement(
          "p",
        );

      message.textContent =
        "QR generation is unavailable right now.";

      const link =
        document.createElement(
          "a",
        );

      link.href =
        registrationUrl();

      link.textContent =
        "Open registration form →";

      link.className =
        "qr-fallback-link";

      target.replaceChildren(
        message,
        link,
      );
    }

    async function render(
      target,
      size,
    ) {
      if (!target) return;

      target.textContent =
        "Generating QR code…";

      try {
        const QRCode =
          await loadLibrary();

        target.replaceChildren();

        new QRCode(
          target,
          {
            text:
              registrationUrl(),

            width:
              size,

            height:
              size,

            colorDark:
              "#072f6f",

            colorLight:
              "#ffffff",

            correctLevel:
              QRCode
                .CorrectLevel
                .H,
          },
        );

        const generated =
          target.querySelector(
            "canvas, img",
          );

        if (generated) {
          generated.style.display =
            "block";

          generated.style.margin =
            "0 auto";

          generated.style.maxWidth =
            "100%";

          generated.style.height =
            "auto";
        }

        if (hint) {
          hint.textContent =
            "Scan this code to open the event registration form.";
        }
      } catch (error) {
        console.error(
          "QR generation failed:",
          error,
        );

        fallback(
          target,
        );

        if (hint) {
          hint.textContent =
            "The QR code could not be generated. Use the link instead.";
        }
      }
    }

    toggle.addEventListener(
      "click",
      () => {
        openModal(
          overlay,
          toggle,
        );

        render(
          canvas,
          200,
        );
      },
    );

    close?.addEventListener(
      "click",
      () =>
        closeModal(
          overlay,
        ),
    );

    overlay.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          overlay
        ) {
          closeModal(
            overlay,
          );
        }
      },
    );

    async function openExpanded() {
      if (
        !expandOverlay ||
        !expandBox
      ) {
        return;
      }

      openModal(
        expandOverlay,
        expandButton,
      );

      await render(
        expandBox,
        340,
      );
    }

    expandButton?.addEventListener(
      "click",
      openExpanded,
    );

    expandButton?.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();

          openExpanded();
        }
      },
    );

    expandClose?.addEventListener(
      "click",
      () =>
        closeModal(
          expandOverlay,
        ),
    );

    expandOverlay?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          expandOverlay
        ) {
          closeModal(
            expandOverlay,
          );
        }
      },
    );

    printButton?.addEventListener(
      "click",
      async () => {
        if (
          !canvas.querySelector(
            "canvas, img",
          )
        ) {
          await render(
            canvas,
            280,
          );
        }

        const qrCanvas =
          $(
            "canvas",
            canvas,
          );

        const qrImage =
          $("img", canvas);

        const src =
          qrCanvas?.toDataURL(
            "image/png",
          ) ||
          qrImage?.src;

        if (!src) {
          window.alert(
            "The QR code is not ready yet. Please try again.",
          );

          return;
        }

        const iframe =
          document.createElement(
            "iframe",
          );

        iframe.className =
          "print-frame";

        iframe.title =
          "Print registration QR code";

        document.body.append(
          iframe,
        );

        const doc =
          iframe.contentDocument;

        if (!doc) {
          iframe.remove();

          return;
        }

        doc.open();

        doc.write(
          `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Umoja P.A.G Church — Scan to Register</title>
<style>
body{
font-family:Arial,sans-serif;
text-align:center;
padding:48px;
color:#17243d
}
main{
max-width:560px;
margin:auto;
padding:38px;
border:2px solid #d1a326;
border-radius:20px
}
h1{
color:#072f6f;
margin:0 0 6px
}
.tag{
color:#9b7414;
font-weight:700
}
img{
width:300px;
height:300px;
margin:24px auto;
display:block
}
.url{
font-size:11px;
color:#647087;
word-break:break-all
}
@media print{
body{padding:12px}
main{border:0}
}
</style>
</head>
<body>
<main>
<h1>Umoja P.A.G Church</h1>
<p class="tag">Scan to Register</p>
<img
src="${src}"
alt="Event registration QR code"
>
<p>
Scan with your phone camera to open event registration.
</p>
<p class="url">
${registrationUrl()}
</p>
</main>
</body>
</html>`,
        );

        doc.close();

        window.setTimeout(
          () => {
            iframe
              .contentWindow
              ?.focus();

            iframe
              .contentWindow
              ?.print();

            window.setTimeout(
              () =>
                iframe.remove(),
              1200,
            );
          },
          350,
        );
      },
    );
  })();

  (() => {
    const frame =
      $("#mapFrame");

    const button =
      $("#loadMapBtn");

    if (
      !frame ||
      !button
    ) {
      return;
    }

    const src =
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120.59!2d36.8938387!3d-1.2849086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f138dc6b5156b%3A0x4a4bc064c62c9fb0!2sUmoja%20P.%20A.%20G%20School!5e0!3m2!1sen!2ske!4v1719500000000!5m2!1sen!2ske";

    button.addEventListener(
      "click",
      () => {
        setBusy(
          button,
          true,
          "Loading map…",
        );

        const iframe =
          document.createElement(
            "iframe",
          );

        iframe.src =
          src;

        iframe.title =
          "Map to Umoja P.A.G Church";

        iframe.loading =
          "lazy";

        iframe.referrerPolicy =
          "no-referrer-when-downgrade";

        iframe.allowFullscreen =
          true;

        iframe.addEventListener(
          "load",
          () =>
            frame.classList.add(
              "map-loaded",
            ),
          {
            once: true,
          },
        );

        frame.replaceChildren(
          iframe,
        );
      },
    );
  })();

  (() => {
    const avatar =
      $("#cloudwatchAvatar");

    const copy =
      $("#cloudwatchCopy");

    const pupils =
      $$(".cloudwatch-pupil");

    const privateFields =
      [
        $("#phone"),
        $("#email"),
      ].filter(Boolean);

    if (!avatar) return;

    const defaultCopy =
      copy?.innerHTML ||
      "";

    let messageTimer =
      null;

    function setClosed(
      value,
    ) {
      avatar.classList.toggle(
        "eyes-closed",
        value,
      );
    }

    function setFrown(
      value,
    ) {
      avatar.classList.toggle(
        "frown",
        value,
      );
    }

    function setMessage(
      message,
      resetAfter = 0,
    ) {
      if (!copy) return;

      copy.textContent =
        message;

      window.clearTimeout(
        messageTimer,
      );

      if (resetAfter) {
        messageTimer =
          window.setTimeout(
            () => {
              copy.innerHTML =
                defaultCopy;

              setFrown(
                false,
              );
            },
            resetAfter,
          );
      }
    }

    window.addEventListener(
      "umoja:registration-invalid",
      (event) => {
        setClosed(
          false,
        );

        setFrown(
          true,
        );

        setMessage(
          event.detail
            ?.message ||
            "Please check the highlighted details.",
          2600,
        );

        if (
          !reduceMotion.matches
        ) {
          avatar.classList.remove(
            "is-shaking",
          );

          void avatar.offsetWidth;

          avatar.classList.add(
            "is-shaking",
          );
        }
      },
    );

    if (
      !reduceMotion.matches
    ) {
      document.addEventListener(
        "pointermove",
        (event) => {
          const x =
            (event.clientX /
              window.innerWidth -
              0.5) *
            12;

          const y =
            (event.clientY /
              window.innerHeight -
              0.5) *
            6;

          pupils.forEach(
            (pupil) => {
              pupil.style.transform =
                `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            },
          );
        },
        {
          passive: true,
        },
      );

      window.setInterval(
        () => {
          if (
            privateFields.some(
              (field) =>
                document.activeElement ===
                field,
            )
          ) {
            return;
          }

          setClosed(
            true,
          );

          window.setTimeout(
            () =>
              setClosed(
                false,
              ),
            180,
          );
        },
        3600,
      );
    }

    privateFields.forEach(
      (field) => {
        field.addEventListener(
          "focus",
          () =>
            setClosed(
              true,
            ),
        );

        field.addEventListener(
          "blur",
          () =>
            setClosed(
              false,
            ),
        );
      },
    );
  })();

  class SubmissionError extends Error {
    constructor(message) {
      super(message);

      this.name =
        "SubmissionError";
    }
  }

  async function postJson(
    endpoint,
    payload,
  ) {
    if (
      window.location.protocol ===
      "file:"
    ) {
      throw new SubmissionError(
        "This file preview cannot submit forms. Open the site through Laragon or the live website.",
      );
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        () =>
          controller.abort(),
        15000,
      );

    let response;

    try {
      response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),

            signal:
              controller.signal,

            credentials:
              "same-origin",
          },
        );
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new SubmissionError(
          "The request timed out. Please try again.",
        );
      }

      throw new SubmissionError(
        "The request could not be sent. Check your connection and try again.",
      );
    } finally {
      window.clearTimeout(
        timeout,
      );
    }

    const raw =
      await response.text();

    let data = {};

    if (raw) {
      try {
        data =
          JSON.parse(
            raw,
          );
      } catch (_) {
        throw new SubmissionError(
          "The server returned an unexpected response.",
        );
      }
    }

    if (
      !response.ok ||
      data.success !==
        true
    ) {
      throw new SubmissionError(
        safeMessage(
          data.message,
          "The server did not confirm the submission. Please try again.",
        ),
      );
    }

    return data;
  }

  function normalizeKenyanPhone(
    value,
  ) {
    const cleaned =
      value.replace(
        /[\s().-]+/g,
        "",
      );

    if (
      /^0(7|1)\d{8}$/.test(
        cleaned,
      )
    ) {
      return `+254${cleaned.slice(1)}`;
    }

    if (
      /^254(7|1)\d{8}$/.test(
        cleaned,
      )
    ) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  function isValidKenyanPhone(
    value,
  ) {
    return /^\+254(7|1)\d{8}$/.test(
      normalizeKenyanPhone(
        value,
      ),
    );
  }

  function formObject(
    form,
  ) {
    const result = {};

    new FormData(
      form,
    ).forEach(
      (
        value,
        key,
      ) => {
        result[key] =
          typeof value ===
          "string"
            ? value.trim()
            : value;
      },
    );

    return result;
  }

  function clearFormError(
    form,
    errorBox,
  ) {
    errorBox?.classList.remove(
      "is-visible",
    );

    if (errorBox) {
      errorBox.textContent =
        "";
    }

    form?.removeAttribute(
      "aria-invalid",
    );

    $$(
      '[aria-invalid="true"]',
      form ||
        document,
    ).forEach(
      (element) =>
        element.removeAttribute(
          "aria-invalid",
        ),
    );
  }

  function showFormError(
    form,
    errorBox,
    message,
    field = null,
  ) {
    if (!errorBox) return;

    errorBox.textContent =
      message;

    errorBox.classList.add(
      "is-visible",
    );

    form?.setAttribute(
      "aria-invalid",
      "true",
    );

    if (field) {
      field.setAttribute(
        "aria-invalid",
        "true",
      );

      field.focus();
    } else {
      errorBox.focus();
    }
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
    const form =
      $(`#${formId}`);

    const button =
      $(`#${buttonId}`);

    const errorBox =
      $(`#${errorId}`);

    const successBox =
      $(`#${successId}`);

    const resetButton =
      $(`#${resetId}`);

    if (
      !form ||
      !button ||
      !successBox
    ) {
      return;
    }

    form.addEventListener(
      "input",
      (event) => {
        clearFormError(
          form,
          errorBox,
        );

        event.target
          ?.removeAttribute
          ?.(
            "aria-invalid",
          );
      },
    );

    form.addEventListener(
      "change",
      () =>
        clearFormError(
          form,
          errorBox,
        ),
    );

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearFormError(
          form,
          errorBox,
        );

        if (
          !form.checkValidity()
        ) {
          const invalid =
            $(
              ":invalid",
              form,
            );

          invalid?.setAttribute(
            "aria-invalid",
            "true",
          );

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

        const values =
          formObject(
            form,
          );

        const validationError =
          validate?.(
            values,
            form,
          );

        if (
          validationError
        ) {
          showFormError(
            form,
            errorBox,
            validationError.message,
            validationError.field ||
              null,
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
          const data =
            await postJson(
              endpoint,
              makePayload(
                values,
              ),
            );

          const successText =
            successTextId
              ? $(
                  `#${successTextId}`,
                )
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

          form.hidden =
            true;

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
            error instanceof
              SubmissionError
              ? error.message
              : "The request was not sent. Please try again.",
          );
        } finally {
          form.removeAttribute(
            "aria-busy",
          );

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

        clearFormError(
          form,
          errorBox,
        );

        successBox.classList.remove(
          "is-visible",
        );

        form.hidden =
          false;

        $(
          "input:not([type=hidden]), select, textarea",
          form,
        )?.focus();
      },
    );
  }

  bindApiForm({
    formId:
      "registrationForm",

    buttonId:
      "submitBtn",

    errorId:
      "formError",

    successId:
      "formSuccess",

    resetId:
      "registrationResetBtn",

    endpoint:
      "/api/register",

    busyLabel:
      "Sending registration…",

    successTextId:
      "formSuccessText",

    validate(values) {
      const phone =
        $("#phone");

      const email =
        $("#email");

      if (
        !isValidKenyanPhone(
          values.phone ||
            "",
        )
      ) {
        return {
          message:
            "Enter a valid Kenyan phone number, such as 0712345678 or +254712345678.",

          field:
            phone,
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

          field:
            email,
        };
      }

      return null;
    },

    makePayload(values) {
      return {
        firstName:
          values.firstName,

        lastName:
          values.lastName,

        phone:
          normalizeKenyanPhone(
            values.phone,
          ),

        email:
          values.email ||
          "",

        ageGroup:
          values.ageGroup ||
          "",

        area:
          values.area ||
          "",

        regFor:
          values.regFor,

        notes:
          values.notes ||
          "",

        consent:
          true,

        guardianConsent:
          true,

        honeypot:
          values.companyWebsite ||
          "",
      };
    },
  });

  bindApiForm({
    formId:
      "messageForm",

    buttonId:
      "messageSubmitBtn",

    errorId:
      "messageFormError",

    successId:
      "messageFormSuccess",

    resetId:
      "messageResetBtn",

    endpoint:
      "/api/contact-message",

    busyLabel:
      "Sending message…",

    makePayload(values) {
      return {
        name:
          values.name,

        email:
          values.email,

        subject:
          values.subject,

        message:
          values.message,

        consent:
          true,

        honeypot:
          values.company ||
          "",
      };
    },
  });

  bindApiForm({
    formId:
      "prayerForm",

    buttonId:
      "prayerSubmitBtn",

    errorId:
      "prayerFormError",

    successId:
      "prayerFormSuccess",

    resetId:
      "prayerResetBtn",

    endpoint:
      "/api/prayer-request",

    busyLabel:
      "Sending prayer request…",

    makePayload(values) {
      return {
        name:
          values.name,

        request:
          values.request,

        consent:
          true,

        honeypot:
          values.company ||
          "",
      };
    },
  });

  bindApiForm({
    formId:
      "pastoralCareForm",

    buttonId:
      "careSubmitBtn",

    errorId:
      "careFormError",

    successId:
      "careFormSuccess",

    resetId:
      "careResetBtn",

    endpoint:
      "/api/pastoral-care",

    busyLabel:
      "Sending request…",

    makePayload(values) {
      return {
        name:
          values.name,

        email:
          values.email,

        request:
          values.request,

        consent:
          true,

        honeypot:
          values.company ||
          "",
      };
    },
  });

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
        date:
          "2026-06-20",

        title:
          "Kesha Night",

        category:
          "Prayer & Worship",

        time:
          "7:00 PM",

        location:
          "Umoja P.A.G Church",

        description:
          "A night of prayer, worship, intercession, and teaching for the whole congregation. No registration is required.",

        link:
          "connect.html#contact",

        linkText:
          "Ask a question",
      },

      {
        date:
          "2026-05-11",

        title:
          "Women’s Fellowship Week",

        category:
          "Women’s Fellowship",

        time:
          "5:00 PM daily",

        location:
          "Umoja P.A.G Church",

        description:
          "A week of fellowship, teaching, testimony, and prayer for the women of the church.",
      },

      {
        date:
          "2026-04-13",

        title:
          "Men’s Fellowship Week",

        category:
          "Men’s Fellowship",

        time:
          "6:00 PM daily",

        location:
          "Umoja P.A.G Church",

        description:
          "A week of teaching and fellowship focused on discipleship, accountability, family, and community leadership.",
      },

      {
        date:
          "2026-03-09",

        title:
          "Evangelism Week",

        category:
          "Evangelism & Outreach",

        time:
          "All day",

        location:
          "Umoja and surrounding estates",

        description:
          "A week of outreach and community service across Umoja and neighbouring estates.",
      },

      {
        date:
          null,

        sortDate:
          "2026-08-31",

        dateLabel:
          "August 2026 — exact date to be confirmed",

        dateTbd:
          true,

        title:
          "Youth Camp & Family Fun Day",

        category:
          "Youth",

        time:
          "All day",

        location:
          "Umoja P.A.G Church",

        description:
          "Youth camp activities followed by a family fun day with games, music, team challenges, and a shared meal. Registration is open while the final date is confirmed.",

        link:
          "#register",

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

    const pad =
      (value) =>
        String(
          value,
        ).padStart(
          2,
          "0",
        );

    const today =
      new Date();

    const todayString =
      `${today.getFullYear()}-${pad(
        today.getMonth() +
          1,
      )}-${pad(
        today.getDate(),
      )}`;

    const itemSortDate =
      (item) =>
        item.date ||
        item.sortDate;

    const isUpcoming =
      (item) =>
        itemSortDate(
          item,
        ) >=
        todayString;

    const escapeHtml =
      (value) =>
        String(
          value ?? "",
        )
          .replaceAll(
            "&",
            "&amp;",
          )
          .replaceAll(
            "<",
            "&lt;",
          )
          .replaceAll(
            ">",
            "&gt;",
          )
          .replaceAll(
            '"',
            "&quot;",
          )
          .replaceAll(
            "'",
            "&#039;",
          );

    const iconCalendar =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const iconClock =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

    const iconPin =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>';

    function dateText(
      item,
    ) {
      if (
        item.dateLabel
      ) {
        return item.dateLabel;
      }

      const [
        year,
        month,
        day,
      ] =
        item.date
          .split("-")
          .map(
            Number,
          );

      return `${monthNames[month - 1]} ${day}, ${year}`;
    }

    function card(
      item,
    ) {
      const media =
        item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">`
          : iconCalendar.replace(
              'width="13" height="13"',
              'width="40" height="40"',
            );

      return `
        <article class="event-card">

          <div class="event-card-media">

            <span class="event-card-badge">
              ${escapeHtml(
                item.category,
              )}
            </span>

            ${
              item.dateTbd
                ? '<span class="event-card-date-status">Date TBC</span>'
                : ""
            }

            ${media}

          </div>

          <div class="event-card-body">

            <h4>
              ${escapeHtml(
                item.title,
              )}
            </h4>

            <div class="event-card-meta">

              <span class="event-card-meta-item">
                ${iconCalendar}
                ${escapeHtml(
                  dateText(
                    item,
                  ),
                )}
              </span>

              ${
                item.time
                  ? `<span class="event-card-meta-item">${iconClock}${escapeHtml(item.time)}</span>`
                  : ""
              }

              ${
                item.location
                  ? `<span class="event-card-meta-item">${iconPin}${escapeHtml(item.location)}</span>`
                  : ""
              }

            </div>

            ${
              item.description
                ? `<p class="event-card-desc">${escapeHtml(item.description)}</p>`
                : ""
            }

            ${
              item.link
                ? `<a href="${escapeHtml(item.link)}" class="event-card-link">${escapeHtml(item.linkText || "Learn more")}</a>`
                : ""
            }

          </div>

        </article>
      `;
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

      const groups =
        new Map();

      list.forEach(
        (item) => {
          const [
            year,
            month,
          ] =
            itemSortDate(
              item,
            )
              .split("-")
              .map(
                Number,
              );

          const key =
            `${year}-${pad(
              month,
            )}`;

          if (
            !groups.has(
              key,
            )
          ) {
            groups.set(
              key,
              {
                year,
                month,
                events: [],
              },
            );
          }

          groups
            .get(key)
            .events.push(
              item,
            );
        },
      );

      container.innerHTML =
        Array.from(
          groups.values(),
        )
          .map(
            ({
              year,
              month,
              events,
            }) =>
              `
              <section
                class="events-month-group"
                aria-labelledby="events-${year}-${month}"
              >

                <div class="events-month-group-header">

                  <h4 id="events-${year}-${month}">
                    ${monthNames[
                      month - 1
                    ]} ${year}
                  </h4>

                  <span
                    class="events-month-rule"
                    aria-hidden="true"
                  ></span>

                  <span class="events-month-count">
                    ${events.length}
                    ${
                      events.length ===
                      1
                        ? "item"
                        : "items"
                    }
                  </span>

                </div>

                <div class="events-grid">
                  ${events
                    .map(
                      card,
                    )
                    .join("")}
                </div>

              </section>
              `,
          )
          .join("");
    }

    const categories = [
      "All",
      ...new Set(
        items.map(
          (item) =>
            item.category,
        ),
      ),
    ];

    let activeCategory =
      "All";

    function renderFilters() {
      filterWrap.innerHTML =
        categories
          .map(
            (category) => {
              const active =
                category ===
                activeCategory;

              return `
                <button
                  type="button"
                  class="filter-pill${active ? " is-active" : ""}"
                  data-category="${escapeHtml(category)}"
                  aria-pressed="${active}"
                >
                  ${escapeHtml(category.toUpperCase())}
                </button>
              `;
            },
          )
          .join("");
    }

    function renderEvents() {
      const selected =
        items.filter(
          (item) =>
            activeCategory ===
              "All" ||
            item.category ===
              activeCategory,
        );

      const upcoming =
        selected
          .filter(
            isUpcoming,
          )
          .sort(
            (
              a,
              b,
            ) =>
              itemSortDate(
                a,
              ).localeCompare(
                itemSortDate(
                  b,
                ),
              ),
          );

      const past =
        selected
          .filter(
            (item) =>
              !isUpcoming(
                item,
              ),
          )
          .sort(
            (
              a,
              b,
            ) =>
              itemSortDate(
                b,
              ).localeCompare(
                itemSortDate(
                  a,
                ),
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
          pastRow.hidden =
            false;

          renderGroups(
            past,
            pastWrap,
            "No past events in this category.",
          );
        } else {
          pastRow.hidden =
            true;

          pastWrap.hidden =
            true;

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

        if (!button) {
          return;
        }

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
        if (!pastWrap) {
          return;
        }

        const showing =
          pastWrap.hidden;

        pastWrap.hidden =
          !showing;

        pastToggle.textContent =
          showing
            ? "Hide Past Events"
            : "View Past Events";

        pastToggle.setAttribute(
          "aria-expanded",
          String(
            showing,
          ),
        );
      },
    );

    const eventSelect =
      $("#regFor");

    if (eventSelect) {
      const placeholder =
        eventSelect.options[0];

      eventSelect.replaceChildren(
        placeholder,
      );

      items
        .filter(
          isUpcoming,
        )
        .forEach(
          (item) => {
            const option =
              document.createElement(
                "option",
              );

            option.value =
              item.title;

            option.textContent =
              item.title;

            eventSelect.append(
              option,
            );
          },
        );

      const other =
        document.createElement(
          "option",
        );

      other.value =
        "Other Special Event";

      other.textContent =
        "Other Special Event";

      eventSelect.append(
        other,
      );
    }

    renderFilters();

    renderEvents();
  })();

  $$(".reveal").forEach(
    (element) =>
      element.classList.add(
        "visible",
      ),
  );

  (() => {
    const imageSelectors =
      [
        ".editorial-hero-visual .hero-photo",

        ".home-ministry-visual figure",

        ".page-hero-media figure",

        ".about-img-main",

        ".pastor-media",

        ".leadership-photo",

        ".min-card > img",

        ".giving-media",

        ".map-frame",

        ".school-photo-top",

        ".school-photo-bottom",

        ".event-card-media",
      ].join(",");

    const textSelectors =
      [
        ".editorial-hero-copy > *",

        ".home-intro-grid > *",

        ".home-section-header > *",

        ".home-belief",

        ".home-ministry-link",

        ".home-ministry-button-row",

        ".home-event-row",

        ".page-hero-copy-wrap > *",

        ".about-text > *",

        ".pastor-body > *",

        ".leadership-name",

        ".leadership-role",

        ".leadership-more",

        ".min-card > div > h2",

        ".min-card > div > .verse-block",

        ".min-card > div > p",

        ".min-card > div > .sub-list",

        ".min-card > div > .expect-title",

        ".min-card > div > .expect-list",

        ".min-card > div > .info-panel",

        ".min-card > div > .leader",

        ".min-card > div > .btn-row",

        ".giving-panel > *",

        ".contact-details > *",

        ".contact-message-card > *",

        ".care-card > *",

        ".event-card-body > *",

        ".reg-form-wrap > *",

        ".home-visit-inner > *",
      ].join(",");

    const registered =
      new WeakSet();

    let observer =
      null;

    function delayFor(
      element,
      index,
    ) {
      if (
        element.matches(
          ".leadership-photo",
        )
      ) {
        return 0;
      }

      if (
        element.matches(
          ".leadership-name",
        )
      ) {
        return 160;
      }

      if (
        element.matches(
          ".leadership-role",
        )
      ) {
        return 280;
      }

      if (
        element.matches(
          ".leadership-more",
        )
      ) {
        return 400;
      }

      return (
        (index % 5) *
        110
      );
    }

    function register(
      element,
      type,
      index,
    ) {
      if (
        registered.has(
          element,
        )
      ) {
        return;
      }

      registered.add(
        element,
      );

      element.classList.add(
        "umoja-scroll-pop",
      );

      if (
        type ===
        "image"
      ) {
        element.classList.add(
          "umoja-pop-image",
        );
      }

      element.style.setProperty(
        "--umoja-pop-delay",
        `${delayFor(
          element,
          index,
        )}ms`,
      );

      if (
        reduceMotion.matches ||
        !observer
      ) {
        element.classList.add(
          "umoja-pop-visible",
        );
      } else {
        observer.observe(
          element,
        );
      }
    }

    function scan(
      root = document,
    ) {
      const images = [];

      const text = [];

      if (
        root instanceof
        Element
      ) {
        if (
          root.matches(
            imageSelectors,
          )
        ) {
          images.push(
            root,
          );
        }

        if (
          root.matches(
            textSelectors,
          )
        ) {
          text.push(
            root,
          );
        }
      }

      if (
        root === document ||
        root instanceof
          Element
      ) {
        images.push(
          ...root.querySelectorAll(
            imageSelectors,
          ),
        );

        text.push(
          ...root.querySelectorAll(
            textSelectors,
          ),
        );
      }

      images.forEach(
        (
          element,
          index,
        ) =>
          register(
            element,
            "image",
            index,
          ),
      );

      text.forEach(
        (
          element,
          index,
        ) =>
          register(
            element,
            "text",
            index,
          ),
      );
    }

    function createObserver() {
      observer?.disconnect();

      if (
        reduceMotion.matches ||
        !(
          "IntersectionObserver" in
          window
        )
      ) {
        observer =
          null;

        $$(".umoja-scroll-pop").forEach(
          (element) =>
            element.classList.add(
              "umoja-pop-visible",
            ),
        );

        return;
      }

      observer =
        new IntersectionObserver(
          (entries) => {
            entries.forEach(
              (entry) => {
                const element =
                  entry.target;

                if (
                  entry.isIntersecting
                ) {
                  requestAnimationFrame(
                    () =>
                      requestAnimationFrame(
                        () =>
                          element.classList.add(
                            "umoja-pop-visible",
                          ),
                      ),
                  );

                  return;
                }

                const rect =
                  entry.boundingClientRect;

                if (
                  rect.bottom <
                    -90 ||
                  rect.top >
                    window.innerHeight +
                      90
                ) {
                  element.classList.remove(
                    "umoja-pop-visible",
                  );
                }
              },
            );
          },
          {
            threshold:
              0.11,

            rootMargin:
              "0px 0px -5% 0px",
          },
        );
    }

    document.documentElement.classList.add(
      "umoja-motion-enabled",
    );

    createObserver();

    scan();

    const mutationObserver =
      new MutationObserver(
        (mutations) => {
          mutations.forEach(
            (mutation) => {
              mutation.addedNodes.forEach(
                (node) => {
                  if (
                    !(
                      node instanceof
                      Element
                    )
                  ) {
                    return;
                  }

                  normaliseLeadershipCards(
                    node,
                  );

                  scan(
                    node,
                  );
                },
              );
            },
          );
        },
      );

    mutationObserver.observe(
      document.body,
      {
        childList:
          true,

        subtree:
          true,
      },
    );

    reduceMotion.addEventListener(
      "change",
      () => {
        createObserver();

        if (
          !reduceMotion.matches
        ) {
          $$(".umoja-scroll-pop").forEach(
            (element) =>
              observer?.observe(
                element,
              ),
          );
        }
      },
    );
  })();
})();
/* =========================================================
   UMOJA P.A.G — FULL HERO BACKGROUND SLIDESHOW
   No overlapping image cards.
========================================================= */

(() => {
  "use strict";

  const hero =
    document.querySelector(".editorial-hero");

  if (!hero) return;

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  /*
   * Remove any hero elements created by the older
   * overlapping-card versions.
   */
  hero
    .querySelectorAll(
      [
        ".umoja-clean-stage",
        ".umoja-hero-stage",
        ".hero-multipage-dots",
        ".umoja-hero-dots",
        ".umoja-clean-hero-dots",
        ".hero-multipage-status",
        ".umoja-hero-status",
        ".umoja-clean-hero-status"
      ].join(",")
    )
    .forEach((element) => {
      element.remove();
    });

  /*
   * We no longer need the right-hand image collage.
   */
  const oldVisual =
    hero.querySelector(
      ".editorial-hero-visual"
    );

  if (oldVisual) {
    oldVisual.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  const slides = [
    {
      src: "images/background.jpg",
      label: "Worship"
    },
    {
      src: "images/background 2.jpg",
      label: "Family"
    },
    {
      src: "images/background3.png",
      label: "Purpose"
    }
  ];

  /* -------------------------------------------------------
     BUILD BACKGROUND LAYERS
  ------------------------------------------------------- */

  let background =
    hero.querySelector(
      ".hero-background-slideshow"
    );

  if (!background) {
    background =
      document.createElement("div");

    background.className =
      "hero-background-slideshow";

    background.setAttribute(
      "aria-hidden",
      "true"
    );

    hero.prepend(background);
  }

  background.replaceChildren();

  const layers =
    slides.map((slide) => {
      const layer =
        document.createElement("div");

      layer.className =
        "hero-background-slide";

      layer.style.backgroundImage =
        `url("${slide.src}")`;

      background.appendChild(
        layer
      );

      return layer;
    });

  /* -------------------------------------------------------
     HERO CONTROLS
  ------------------------------------------------------- */

  const copy =
    hero.querySelector(
      ".editorial-hero-copy"
    );

  let controls =
    hero.querySelector(
      ".hero-background-controls"
    );

  if (!controls) {
    controls =
      document.createElement("div");

    controls.className =
      "hero-background-controls";

    copy?.appendChild(
      controls
    );
  }

  controls.replaceChildren();

  const status =
    document.createElement("div");

  status.className =
    "hero-background-status";

  status.setAttribute(
    "aria-live",
    "polite"
  );

  controls.appendChild(
    status
  );

  const dots =
    document.createElement("div");

  dots.className =
    "hero-background-dots";

  dots.setAttribute(
    "aria-label",
    "Hero background slides"
  );

  controls.appendChild(
    dots
  );

  let current = 0;
  let timer = null;

  let pointerInside = false;
  let focusInside = false;
  let heroVisible = true;

  /*
   * 8 seconds gives visitors time to actually see
   * each photograph.
   */
  const interval = 5000;

  const dotButtons =
    slides.map((slide, index) => {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "hero-background-dot";

      button.setAttribute(
        "aria-label",
        `Show ${slide.label} background`
      );

      button.addEventListener(
        "click",
        () => {
          showSlide(
            index,
            true
          );

          start();
        }
      );

      dots.appendChild(
        button
      );

      return button;
    });

  /* -------------------------------------------------------
     DISPLAY SLIDE
  ------------------------------------------------------- */

  function showSlide(
    index,
    announce = false
  ) {
    current =
      (index + slides.length) %
      slides.length;

    layers.forEach(
      (layer, layerIndex) => {
        layer.classList.toggle(
          "is-active",
          layerIndex === current
        );
      }
    );

    dotButtons.forEach(
      (button, buttonIndex) => {
        const active =
          buttonIndex === current;

        button.classList.toggle(
          "is-active",
          active
        );

        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      }
    );

    hero.dataset.heroSlide =
      slides[current].label;

    if (announce) {
      status.textContent =
        `${slides[current].label} hero background selected.`;
    }
  }

  /* -------------------------------------------------------
     AUTOPLAY
  ------------------------------------------------------- */

  function stop() {
    if (timer) {
      clearInterval(timer);
    }

    timer = null;
  }

  function canPlay() {
    return (
      !reduceMotion.matches &&
      !pointerInside &&
      !focusInside &&
      heroVisible &&
      !document.hidden
    );
  }

  function start() {
    stop();

    if (!canPlay()) return;

    timer = setInterval(
      () => {
        showSlide(
          current + 1
        );
      },
      interval
    );
  }

  hero.addEventListener(
    "pointerenter",
    () => {
      pointerInside = true;
      stop();
    }
  );

  hero.addEventListener(
    "pointerleave",
    () => {
      pointerInside = false;
      start();
    }
  );

  hero.addEventListener(
    "focusin",
    () => {
      focusInside = true;
      stop();
    }
  );

  hero.addEventListener(
    "focusout",
    () => {
      setTimeout(
        () => {
          focusInside =
            hero.contains(
              document.activeElement
            );

          start();
        },
        0
      );
    }
  );

  document.addEventListener(
    "visibilitychange",
    start
  );

  if (
    "IntersectionObserver"
    in window
  ) {
    const observer =
      new IntersectionObserver(
        ([entry]) => {
          heroVisible =
            Boolean(
              entry?.isIntersecting
            );

          start();
        },
        {
          threshold: 0.15
        }
      );

    observer.observe(hero);
  }

  reduceMotion.addEventListener(
    "change",
    () => {
      if (
        reduceMotion.matches
      ) {
        stop();
      } else {
        start();
      }
    }
  );

  showSlide(0);

  start();
})();

/* =========================================================
   HERO NAVBAR
   - Visible inside hero
   - Transparent/glass while over hero
   - Becomes solid white after hero
========================================================= */

(() => {
  "use strict";

  const body = document.body;

  if (!body.classList.contains("home-page")) {
    return;
  }

  const navbar =
    document.getElementById("navbar");

  const hero =
    document.querySelector(".editorial-hero");

  if (!navbar || !hero) {
    return;
  }

  body.classList.add("hero-navbar-mode");

  let ticking = false;

  function updateNavbar() {
    const heroRect =
      hero.getBoundingClientRect();

    /*
     * As long as a meaningful part of the hero
     * remains behind the navbar, use hero mode.
     */
    const insideHero =
      heroRect.bottom > 110;

    navbar.classList.toggle(
      "navbar-on-hero",
      insideHero
    );

    navbar.classList.toggle(
      "navbar-after-hero",
      !insideHero
    );
  }

  function requestUpdate() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      updateNavbar();
      ticking = false;
    });
  }

  updateNavbar();

  window.addEventListener(
    "scroll",
    requestUpdate,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    requestUpdate
  );
})();