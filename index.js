(() => {
  "use strict";

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) =>
    Array.from(context.querySelectorAll(selector));

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  // =========================================================
  // SHARED HELPERS
  // =========================================================

  function getFocusable(container) {
    if (!container) return [];

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

    button.textContent = busy
      ? busyLabel
      : button.dataset.defaultLabel;
  }

  function safeMessage(value, fallback) {
    const text =
      typeof value === "string"
        ? value.trim()
        : "";

    return text && text.length <= 240
      ? text
      : fallback;
  }

  // =========================================================
  // NAVBAR
  // =========================================================

  const navbar = $("#navbar");
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");
  const navOverlay = $("#navOverlay");

  const mobileNavQuery =
    window.matchMedia("(max-width: 1200px)");

  let navReturnFocus = null;

  function updateNavbarAppearance() {
    if (!navbar) return;

    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 20 ||
        !document.body.classList.contains("home-page"),
    );
  }

  function setMobileNavAccessibility(isOpen) {
    if (!navLinks) return;

    if (mobileNavQuery.matches) {
      navLinks.setAttribute(
        "aria-hidden",
        String(!isOpen),
      );
    } else {
      navLinks.removeAttribute("aria-hidden");
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

    navReturnFocus = document.activeElement;

    navToggle.classList.add("open");
    navLinks.classList.add("open");
    navOverlay.classList.add("open");

    document.body.classList.add("nav-open");

    navToggle.setAttribute(
      "aria-expanded",
      "true",
    );

    navToggle.setAttribute(
      "aria-label",
      "Close menu",
    );

    setMobileNavAccessibility(true);

    const firstLink = $("a", navLinks);

    firstLink?.focus();
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

    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navOverlay.classList.remove("open");

    document.body.classList.remove("nav-open");

    navToggle.setAttribute(
      "aria-expanded",
      "false",
    );

    navToggle.setAttribute(
      "aria-label",
      "Open menu",
    );

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

    if (navLinks.classList.contains("open")) {
      closeMobileNav({
        restoreFocus: true,
      });
    } else {
      openMobileNav();
    }
  }

  updateNavbarAppearance();
  setMobileNavAccessibility(false);

  window.addEventListener(
    "scroll",
    updateNavbarAppearance,
    { passive: true },
  );

  navToggle?.addEventListener(
    "click",
    toggleMobileNav,
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
      if (event.target.closest("a")) {
        closeMobileNav();
      }
    },
  );

  mobileNavQuery.addEventListener(
    "change",
    () => closeMobileNav(),
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        navLinks?.classList.contains("open")
      ) {
        event.preventDefault();

        closeMobileNav({
          restoreFocus: true,
        });

        return;
      }

      if (
        event.key !== "Tab" ||
        !navLinks?.classList.contains("open")
      ) {
        return;
      }

      const focusable =
        getFocusable(navLinks);

      if (!focusable.length) return;

      const first = focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

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
    },
  );

  // =========================================================
  // NAV INDICATOR
  // =========================================================

  if (navLinks) {
    const activeLink =
      $(".nav-links a.active");

    if (activeLink) {
      const indicator =
        document.createElement("span");

      indicator.className =
        "nav-indicator";

      indicator.setAttribute(
        "aria-hidden",
        "true",
      );

      navLinks.append(indicator);

      function positionIndicator() {
        if (
          mobileNavQuery.matches
        ) {
          indicator.style.opacity = "0";
          return;
        }

        const active =
          $(".nav-links a.active");

        if (!active) {
          indicator.style.opacity = "0";
          return;
        }

        const linkRect =
          active.getBoundingClientRect();

        const navRect =
          navLinks.getBoundingClientRect();

        const width = Math.max(
          20,
          linkRect.width * 0.5,
        );

        const x =
          linkRect.left -
          navRect.left +
          (linkRect.width - width) / 2;

        indicator.style.width =
          `${width}px`;

        indicator.style.transform =
          `translateX(${x}px)`;

        indicator.style.opacity =
          "1";
      }

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
  }

  // =========================================================
  // GENERAL SCROLL REVEAL
  // =========================================================

  const revealItems = $$(".reveal");

  if (
    reduceMotion.matches ||
    !("IntersectionObserver" in window)
  ) {
    revealItems.forEach((element) => {
      element.classList.add("visible");
    });
  } else {
    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              "visible",
            );

            observer.unobserve(
              entry.target,
            );
          });
        },
        {
          threshold: 0.08,
          rootMargin:
            "0px 0px -36px 0px",
        },
      );

    revealItems.forEach(
      (element) => {
        revealObserver.observe(
          element,
        );
      },
    );
  }

  // =========================================================
  // ACCESSIBLE MODAL MANAGER
  // =========================================================

  const modalStack = [];

  function openModal(
    overlay,
    trigger = document.activeElement,
  ) {
    if (!overlay) return;

    const dialog =
      overlay.matches('[role="dialog"]')
        ? overlay
        : $('[role="dialog"]', overlay);

    overlay.hidden = false;

    overlay.setAttribute(
      "aria-hidden",
      "false",
    );

    overlay.classList.add("open");

    document.body.classList.add(
      "modal-open",
    );

    modalStack.push({
      overlay,
      trigger,
    });

    const preferred = $(
      "[data-autofocus], .qr-modal-close",
      dialog || overlay,
    );

    (
      preferred ||
      dialog ||
      overlay
    ).focus();
  }

  function closeModal(
    overlay,
    { restoreFocus = true } = {},
  ) {
    if (!overlay) return;

    const index =
      modalStack.findLastIndex(
        (item) =>
          item.overlay === overlay,
      );

    const record =
      index >= 0
        ? modalStack.splice(
            index,
            1,
          )[0]
        : null;

    overlay.classList.remove("open");

    overlay.setAttribute(
      "aria-hidden",
      "true",
    );

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

  document.addEventListener(
    "keydown",
    (event) => {
      const current =
        modalStack[
          modalStack.length - 1
        ];

      if (!current) return;

      const dialog =
        current.overlay.matches(
          '[role="dialog"]',
        )
          ? current.overlay
          : $(
              '[role="dialog"]',
              current.overlay,
            );

      if (event.key === "Escape") {
        event.preventDefault();

        closeModal(
          current.overlay,
        );

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable =
        getFocusable(
          dialog ||
            current.overlay,
        );

      if (!focusable.length) {
        event.preventDefault();

        (
          dialog ||
          current.overlay
        ).focus();

        return;
      }

      const first = focusable[0];

      const last =
        focusable[
          focusable.length - 1
        ];

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
    },
  );

  // =========================================================
  // LEADERSHIP MODALS
  // =========================================================

  const LEADER_INFO = {
    secretary: {
      name: "Mr. Sam Kavai",
      role: "Secretary",
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
      name: "Mr. Paul Mosira",
      role: "Deacon",
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
      name: "Mr. Paul Mwangi",
      role: "Treasurer",
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
      role: "Youth Leader",
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

    $$(".leadership-more[data-leader]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const info =
              LEADER_INFO[
                button.dataset
                  .leader
              ];

            if (!info) return;

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
                  (text) => {
                    const p =
                      document.createElement(
                        "p",
                      );

                    p.textContent =
                      text;

                    return p;
                  },
                ),
              );
            }

            if (tags) {
              tags.replaceChildren(
                ...info.tags.map(
                  (text) => {
                    const tag =
                      document.createElement(
                        "span",
                      );

                    tag.className =
                      "pastor-tag";

                    tag.textContent =
                      text;

                    return tag;
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
      });

    close?.addEventListener(
      "click",
      () =>
        closeModal(overlay),
    );

    overlay.addEventListener(
      "click",
      (event) => {
        if (
          event.target === overlay
        ) {
          closeModal(overlay);
        }
      },
    );
  })();

  // =========================================================
  // CLICK-TO-LOAD GOOGLE MAP
  // =========================================================

  (() => {
    const frame =
      $("#mapFrame");

    const button =
      $("#loadMapBtn");

    if (!frame || !button) {
      return;
    }

    const mapURL =
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120.59!2d36.8938387!3d-1.2849086!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f138dc6b5156b%3A0x4a4bc064c62c9fb0!2sUmoja%20P.%20A.%20G%20School!5e0!3m2!1sen!2ske!4v1719500000000!5m2!1sen!2ske";

    button.addEventListener(
      "click",
      () => {
        setBusy(
          button,
          true,
          "Loading map...",
        );

        const iframe =
          document.createElement(
            "iframe",
          );

        iframe.src = mapURL;

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
          () => {
            frame.classList.add(
              "map-loaded",
            );
          },
          { once: true },
        );

        frame.replaceChildren(
          iframe,
        );
      },
    );
  })();

  // =========================================================
  // FORM API
  // =========================================================

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
        "Forms cannot be submitted from a file preview. Open the website through Laragon or the live website.",
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
      response = await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify(
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
        "The request could not be sent. Please check your internet connection and try again.",
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
          JSON.parse(raw);
      } catch (_) {
        throw new SubmissionError(
          "The server returned an unexpected response.",
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
      return (
        "+254" +
        cleaned.slice(1)
      );
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

  function formObject(form) {
    const result = {};

    new FormData(form).forEach(
      (value, key) => {
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
      form || document,
    ).forEach((element) => {
      element.removeAttribute(
        "aria-invalid",
      );
    });
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
          ?.removeAttribute?.(
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
            $(":invalid", form);

          invalid?.setAttribute(
            "aria-invalid",
            "true",
          );

          form.reportValidity();

          invalid?.focus();

          return;
        }

        const values =
          formObject(form);

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
            validationError.field,
          );

          return;
        }

        // Honeypot spam field.
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

          const data =
            await postJson(
              endpoint,
              payload,
            );

          if (
            successTextId &&
            data.message
          ) {
            const text =
              $(
                `#${successTextId}`,
              );

            if (text) {
              text.textContent =
                safeMessage(
                  data.message,
                  text.textContent,
                );
            }
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

        form.hidden = false;

        $(
          "input:not([type=hidden]), select, textarea",
          form,
        )?.focus();
      },
    );
  }

  // =========================================================
  // EVENT REGISTRATION
  // =========================================================

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
        firstName:
          values.firstName,

        lastName:
          values.lastName,

        phone:
          normalizeKenyanPhone(
            values.phone,
          ),

        email:
          values.email || "",

        ageGroup:
          values.ageGroup || "",

        area:
          values.area || "",

        regFor:
          values.regFor,

        notes:
          values.notes || "",

        consent: true,

        guardianConsent: true,

        honeypot:
          values.companyWebsite ||
          "",
      };
    },
  });

  // =========================================================
  // CONTACT MESSAGE
  // =========================================================

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

        consent: true,

        honeypot:
          values.company || "",
      };
    },
  });

  // =========================================================
  // PRAYER REQUEST
  // =========================================================

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

        consent: true,

        honeypot:
          values.company || "",
      };
    },
  });

  // =========================================================
  // PASTORAL CARE
  // =========================================================

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

        consent: true,

        honeypot:
          values.company || "",
      };
    },
  });

  // =========================================================
  // EVENTS
  // =========================================================

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
        date: null,

        sortDate:
          "2026-08-31",

        dateLabel:
          "August 2026 — exact date to be confirmed",

        dateTbd: true,

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

    const pad = (value) =>
      String(value).padStart(
        2,
        "0",
      );

    const today =
      new Date();

    const todayString =
      `${today.getFullYear()}-${pad(
        today.getMonth() + 1,
      )}-${pad(
        today.getDate(),
      )}`;

    function escapeHtml(
      value,
    ) {
      return String(
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
    }

    const iconCalendar =
      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/>
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;

    const iconClock =
      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;

    const iconPin =
      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/>
      </svg>`;

    function itemSortDate(
      item,
    ) {
      return (
        item.date ||
        item.sortDate
      );
    }

    function isUpcoming(
      item,
    ) {
      return (
        itemSortDate(item) >=
        todayString
      );
    }

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
          .map(Number);

      return (
        monthNames[
          month - 1
        ] +
        " " +
        day +
        ", " +
        year
      );
    }

    function eventCard(
      item,
    ) {
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
                ? `<span class="event-card-date-status">Date TBC</span>`
                : ""
            }

            ${iconCalendar.replace(
              'width="13" height="13"',
              'width="40" height="40"',
            )}

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
                  dateText(item),
                )}
              </span>

              ${
                item.time
                  ? `
                    <span class="event-card-meta-item">
                      ${iconClock}
                      ${escapeHtml(
                        item.time,
                      )}
                    </span>
                  `
                  : ""
              }

              ${
                item.location
                  ? `
                    <span class="event-card-meta-item">
                      ${iconPin}
                      ${escapeHtml(
                        item.location,
                      )}
                    </span>
                  `
                  : ""
              }

            </div>

            ${
              item.description
                ? `
                  <p class="event-card-desc">
                    ${escapeHtml(
                      item.description,
                    )}
                  </p>
                `
                : ""
            }

            ${
              item.link
                ? `
                  <a
                    href="${escapeHtml(
                      item.link,
                    )}"
                    class="event-card-link"
                  >
                    ${escapeHtml(
                      item.linkText ||
                        "Learn more",
                    )}
                  </a>
                `
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
          `<p class="events-empty-state">${escapeHtml(
            emptyMessage,
          )}</p>`;

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
              .map(Number);

          const key =
            `${year}-${pad(
              month,
            )}`;

          if (
            !groups.has(key)
          ) {
            groups.set(key, {
              year,
              month,
              events: [],
            });
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
            }) => `
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
                      eventCard,
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
                  class="filter-pill ${
                    active
                      ? "is-active"
                      : ""
                  }"
                  data-category="${escapeHtml(
                    category,
                  )}"
                  aria-pressed="${active}"
                >
                  ${escapeHtml(
                    category.toUpperCase(),
                  )}
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
            (a, b) =>
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
            (a, b) =>
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

        if (!button) return;

        activeCategory =
          button.dataset.category;

        renderFilters();
        renderEvents();
      },
    );

    if (pastToggle) {
      pastToggle.setAttribute(
        "aria-controls",
        "pastEventsByMonth",
      );

      pastToggle.setAttribute(
        "aria-expanded",
        "false",
      );

      pastToggle.addEventListener(
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
            String(showing),
          );
        },
      );
    }

    const eventSelect =
      $("#regFor");

    if (eventSelect) {
      const placeholder =
        eventSelect.options[0];

      eventSelect.replaceChildren(
        placeholder,
      );

      items
        .filter(isUpcoming)
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
})();

/* =========================================================
   MULTIPAGE EDITORIAL IMAGE MOTION
   Smooth image rise / pop when scrolling down or back up
========================================================= */

(() => {
  "use strict";

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

  /*
   * These selectors cover the major photographs used throughout
   * the multipage website.
   */
  const selectors = [
    ".editorial-hero .hero-photo",
    ".home-ministry-visual figure",
    ".page-hero-media figure",
    ".min-card > img",
    ".about-img-main",
    ".pastor-media",
    ".leadership-photo",
    ".giving-media",
    ".map-frame",
  ].join(",");

  const targets =
    Array.from(
      document.querySelectorAll(
        selectors,
      ),
    );

  if (!targets.length) {
    return;
  }

  /*
   * CSS is injected here so the motion works immediately even if
   * you have not yet added the motion block to index.css.
   */
  const styleId =
    "umoja-editorial-motion";

  if (
    !document.getElementById(
      styleId,
    )
  ) {
    const style =
      document.createElement(
        "style",
      );

    style.id = styleId;

    style.textContent = `
      html.motion-enabled .motion-rise {
        opacity: 0;
        filter: blur(5px);
        transform:
          translate3d(0, 60px, 0)
          scale(0.96);

        transform-origin:
          center bottom;

        transition:
          opacity 720ms ease
            var(--motion-delay, 0ms),
          filter 820ms ease
            var(--motion-delay, 0ms),
          transform 950ms
            cubic-bezier(
              0.18,
              1.15,
              0.3,
              1
            )
            var(--motion-delay, 0ms);

        will-change:
          opacity,
          transform,
          filter;

        backface-visibility:
          hidden;
      }

      html.motion-enabled
      .motion-rise.motion-rise-visible {
        opacity: 1;
        filter: blur(0);

        transform:
          translate3d(0, 0, 0)
          scale(1);
      }

      @media (max-width: 700px) {
        html.motion-enabled
        .motion-rise {
          transform:
            translate3d(
              0,
              40px,
              0
            )
            scale(0.975);

          transition:
            opacity 620ms ease
              var(--motion-delay, 0ms),
            filter 700ms ease
              var(--motion-delay, 0ms),
            transform 800ms
              cubic-bezier(
                0.18,
                1.12,
                0.3,
                1
              )
              var(--motion-delay, 0ms);
        }

        html.motion-enabled
        .motion-rise.motion-rise-visible {
          transform:
            translate3d(0, 0, 0)
            scale(1);
        }
      }

      @media (
        prefers-reduced-motion:
        reduce
      ) {
        html.motion-enabled
        .motion-rise,
        html.motion-enabled
        .motion-rise.motion-rise-visible {
          opacity: 1 !important;
          filter: none !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `;

    document.head.append(
      style,
    );
  }

  document.documentElement
    .classList.add(
      "motion-enabled",
    );

  targets.forEach(
    (target, index) => {
      target.classList.add(
        "motion-rise",
      );

      /*
       * Small stagger prevents every photograph from entering
       * at exactly the same millisecond.
       */
      target.style.setProperty(
        "--motion-delay",
        `${(index % 4) * 70}ms`,
      );
    },
  );

  if (
    reducedMotion.matches ||
    !(
      "IntersectionObserver" in
      window
    )
  ) {
    targets.forEach(
      (target) => {
        target.classList.add(
          "motion-rise-visible",
        );
      },
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              entry.isIntersecting
            ) {
              requestAnimationFrame(
                () => {
                  requestAnimationFrame(
                    () => {
                      entry.target.classList.add(
                        "motion-rise-visible",
                      );
                    },
                  );
                },
              );

              return;
            }

            /*
             * Reset only after the photograph has fully travelled
             * outside the viewport. When the visitor scrolls back,
             * the rise animation therefore plays again.
             */
            if (
              entry.boundingClientRect
                .bottom < -80 ||
              entry.boundingClientRect
                .top >
                window.innerHeight +
                  80
            ) {
              entry.target.classList.remove(
                "motion-rise-visible",
              );
            }
          },
        );
      },
      {
        threshold: 0.12,

        rootMargin:
          "0px 0px -7% 0px",
      },
    );

  targets.forEach(
    (target) => {
      observer.observe(
        target,
      );
    },
  );

  reducedMotion.addEventListener(
    "change",
    () => {
      if (
        reducedMotion.matches
      ) {
        targets.forEach(
          (target) => {
            target.classList.add(
              "motion-rise-visible",
            );
          },
        );

        observer.disconnect();
      }
    },
  );
})();