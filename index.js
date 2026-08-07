// =========================================================
// QR CODE — EVENT REGISTRATION
// =========================================================

(() => {
  "use strict";

  const toggle =
    document.getElementById("qrToggleBtn");

  const overlay =
    document.getElementById("qrModalOverlay");

  const closeButton =
    document.getElementById("qrModalClose");

  const canvas =
    document.getElementById("qrCanvas");

  const hint =
    document.getElementById("qrHint");

  const expandButton =
    document.getElementById("qrExpandBtn");

  const expandOverlay =
    document.getElementById("qrExpandOverlay");

  const expandClose =
    document.getElementById("qrExpandClose");

  const expandBox =
    document.getElementById("qrExpandBox");

  const printButton =
    document.getElementById("qrPrintBtn");

  /*
   * The QR interface only exists on events.html.
   * On all other pages simply stop here.
   */
  if (
    !toggle ||
    !overlay ||
    !canvas
  ) {
    return;
  }

  // ---------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------

  const PUBLIC_SITE =
    "https://umojapagchurch.org";

  /*
   * Primary and backup CDN.
   * If one CDN is blocked/unavailable, the second is tried.
   */
  const QR_SOURCES = [
    "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
    "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
  ];

  let libraryPromise = null;

  let lastFocusedElement = null;

  // ---------------------------------------------------------
  // REGISTRATION URL
  // ---------------------------------------------------------

  function getRegistrationUrl() {
    /*
     * When using Laragon:
     *
     * http://localhost/Umoja/events.html
     *
     * the QR will point to the local URL.
     *
     * When deployed:
     *
     * https://umojapagchurch.org/events.html
     *
     * it will point to the live registration page.
     */

    try {
      const currentUrl =
        new URL(window.location.href);

      if (
        currentUrl.protocol === "http:" ||
        currentUrl.protocol === "https:"
      ) {
        /*
         * Make sure the QR always opens the registration
         * section rather than the current scroll position.
         */
        currentUrl.hash = "register";

        return currentUrl.href;
      }
    } catch (error) {
      console.warn(
        "Could not build current registration URL:",
        error,
      );
    }

    /*
     * Fallback used when opening events.html directly
     * as a file instead of through Laragon.
     */
    return `${PUBLIC_SITE}/events.html#register`;
  }

  // ---------------------------------------------------------
  // LOAD QR LIBRARY
  // ---------------------------------------------------------

  function loadScript(source) {
    return new Promise(
      (resolve, reject) => {
        /*
         * Avoid adding the same script twice.
         */
        const existing =
          Array.from(
            document.scripts,
          ).find(
            (script) =>
              script.src === source,
          );

        if (
          existing &&
          window.QRCode
        ) {
          resolve(window.QRCode);

          return;
        }

        const script =
          existing ||
          document.createElement(
            "script",
          );

        if (!existing) {
          script.src = source;

          script.async = true;

          script.crossOrigin =
            "anonymous";

          script.referrerPolicy =
            "no-referrer";

          document.head.appendChild(
            script,
          );
        }

        const finish = () => {
          if (window.QRCode) {
            resolve(window.QRCode);
          } else {
            reject(
              new Error(
                "The QR library loaded but QRCode was unavailable.",
              ),
            );
          }
        };

        /*
         * If an existing script has already loaded,
         * QRCode may already be ready.
         */
        if (window.QRCode) {
          finish();

          return;
        }

        script.addEventListener(
          "load",
          finish,
          {
            once: true,
          },
        );

        script.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                `Could not load ${source}`,
              ),
            );
          },
          {
            once: true,
          },
        );
      },
    );
  }

  async function loadQRCodeLibrary() {
    if (window.QRCode) {
      return window.QRCode;
    }

    if (libraryPromise) {
      return libraryPromise;
    }

    libraryPromise =
      (async () => {
        let lastError = null;

        for (
          const source of
          QR_SOURCES
        ) {
          try {
            const library =
              await loadScript(
                source,
              );

            if (library) {
              return library;
            }
          } catch (error) {
            console.warn(
              "QR source failed:",
              source,
              error,
            );

            lastError = error;
          }
        }

        throw (
          lastError ||
          new Error(
            "QR library could not be loaded.",
          )
        );
      })();

    /*
     * If every CDN fails, reset the Promise so another
     * click can retry rather than remaining permanently
     * rejected.
     */
    libraryPromise.catch(
      () => {
        libraryPromise = null;
      },
    );

    return libraryPromise;
  }

  // ---------------------------------------------------------
  // CREATE QR
  // ---------------------------------------------------------

  function createFallback(
    target,
  ) {
    target.replaceChildren();

    const message =
      document.createElement("p");

    message.textContent =
      "QR generation is unavailable.";

    const link =
      document.createElement("a");

    link.href =
      getRegistrationUrl();

    link.textContent =
      "Open registration form →";

    link.className =
      "qr-fallback-link";

    link.style.display =
      "inline-block";

    link.style.marginTop =
      "10px";

    target.append(
      message,
      link,
    );
  }

  async function renderQR(
    target,
    size,
  ) {
    if (!target) return;

    target.replaceChildren();

    const loading =
      document.createElement("div");

    loading.textContent =
      "Generating QR code…";

    loading.style.padding =
      "20px";

    loading.style.textAlign =
      "center";

    target.appendChild(
      loading,
    );

    try {
      const QRCode =
        await loadQRCodeLibrary();

      target.replaceChildren();

      new QRCode(
        target,
        {
          text:
            getRegistrationUrl(),

          width: size,

          height: size,

          colorDark:
            "#072f6f",

          colorLight:
            "#ffffff",

          correctLevel:
            QRCode.CorrectLevel.H,
        },
      );

      if (hint) {
        hint.textContent =
          "Scan this code to open the event registration form.";
      }

      /*
       * qrcode.js sometimes creates an IMG and sometimes
       * a CANVAS depending on the browser.
       */
      const generated =
        target.querySelector(
          "img, canvas",
        );

      if (generated) {
        generated.style.display =
          "block";

        generated.style.margin =
          "0 auto";

        generated.style.maxWidth =
          "100%";
      }
    } catch (error) {
      console.error(
        "QR generation failed:",
        error,
      );

      createFallback(
        target,
      );

      if (hint) {
        hint.textContent =
          "The QR code could not be generated. Use the registration link instead.";
      }
    }
  }

  // ---------------------------------------------------------
  // MODAL HELPERS
  // ---------------------------------------------------------

  function openOverlay(
    element,
    focusTarget,
  ) {
    if (!element) return;

    lastFocusedElement =
      document.activeElement;

    element.hidden = false;

    element.setAttribute(
      "aria-hidden",
      "false",
    );

    element.classList.add(
      "open",
    );

    document.body.classList.add(
      "modal-open",
    );

    requestAnimationFrame(
      () => {
        focusTarget?.focus();
      },
    );
  }

  function closeOverlay(
    element,
    restoreFocus = true,
  ) {
    if (!element) return;

    element.classList.remove(
      "open",
    );

    element.setAttribute(
      "aria-hidden",
      "true",
    );

    element.hidden = true;

    if (
      !overlay.classList.contains(
        "open",
      ) &&
      !expandOverlay?.classList.contains(
        "open",
      )
    ) {
      document.body.classList.remove(
        "modal-open",
      );
    }

    if (
      restoreFocus &&
      lastFocusedElement instanceof
        HTMLElement
    ) {
      lastFocusedElement.focus();
    }
  }

  // ---------------------------------------------------------
  // OPEN MAIN QR
  // ---------------------------------------------------------

  async function openQRModal() {
    lastFocusedElement =
      toggle;

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

    closeButton?.focus();

    await renderQR(
      canvas,
      200,
    );
  }

  toggle.addEventListener(
    "click",
    openQRModal,
  );

  // ---------------------------------------------------------
  // CLOSE MAIN QR
  // ---------------------------------------------------------

  closeButton?.addEventListener(
    "click",
    () => {
      closeOverlay(
        overlay,
        false,
      );

      toggle.focus();
    },
  );

  overlay.addEventListener(
    "click",
    (event) => {
      if (
        event.target === overlay
      ) {
        closeOverlay(
          overlay,
          false,
        );

        toggle.focus();
      }
    },
  );

  // ---------------------------------------------------------
  // EXPAND QR
  // ---------------------------------------------------------

  async function openExpandedQR() {
    if (
      !expandOverlay ||
      !expandBox
    ) {
      return;
    }

    lastFocusedElement =
      expandButton;

    expandOverlay.hidden =
      false;

    expandOverlay.setAttribute(
      "aria-hidden",
      "false",
    );

    expandOverlay.classList.add(
      "open",
    );

    document.body.classList.add(
      "modal-open",
    );

    expandClose?.focus();

    await renderQR(
      expandBox,
      340,
    );
  }

  expandButton?.addEventListener(
    "click",
    openExpandedQR,
  );

  expandButton?.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        openExpandedQR();
      }
    },
  );

  expandClose?.addEventListener(
    "click",
    () => {
      closeOverlay(
        expandOverlay,
        false,
      );

      expandButton?.focus();
    },
  );

  expandOverlay?.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        expandOverlay
      ) {
        closeOverlay(
          expandOverlay,
          false,
        );

        expandButton?.focus();
      }
    },
  );

  // ---------------------------------------------------------
  // ESCAPE KEY
  // ---------------------------------------------------------

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      if (
        expandOverlay
          ?.classList
          .contains("open")
      ) {
        event.preventDefault();

        closeOverlay(
          expandOverlay,
          false,
        );

        expandButton?.focus();

        return;
      }

      if (
        overlay.classList.contains(
          "open",
        )
      ) {
        event.preventDefault();

        closeOverlay(
          overlay,
          false,
        );

        toggle.focus();
      }
    },
  );

  // ---------------------------------------------------------
  // PRINT QR
  // ---------------------------------------------------------

  async function getQRImage() {
    /*
     * Make sure a QR exists before printing.
     */
    if (
      !canvas.querySelector(
        "canvas, img",
      )
    ) {
      await renderQR(
        canvas,
        300,
      );
    }

    const qrCanvas =
      canvas.querySelector(
        "canvas",
      );

    if (qrCanvas) {
      try {
        return qrCanvas.toDataURL(
          "image/png",
        );
      } catch (error) {
        console.warn(
          "Could not read QR canvas:",
          error,
        );
      }
    }

    const qrImage =
      canvas.querySelector(
        "img",
      );

    if (qrImage?.src) {
      return qrImage.src;
    }

    return null;
  }

  printButton?.addEventListener(
    "click",
    async () => {
      const imageSource =
        await getQRImage();

      if (!imageSource) {
        window.alert(
          "The QR code is not ready. Please try again.",
        );

        return;
      }

      const iframe =
        document.createElement(
          "iframe",
        );

      iframe.setAttribute(
        "title",
        "Print registration QR code",
      );

      iframe.style.position =
        "fixed";

      iframe.style.right =
        "0";

      iframe.style.bottom =
        "0";

      iframe.style.width =
        "1px";

      iframe.style.height =
        "1px";

      iframe.style.opacity =
        "0";

      iframe.style.pointerEvents =
        "none";

      iframe.style.border =
        "0";

      document.body.appendChild(
        iframe,
      );

      const printDocument =
        iframe.contentDocument ||
        iframe.contentWindow
          ?.document;

      if (!printDocument) {
        iframe.remove();

        window.alert(
          "Printing is unavailable in this browser.",
        );

        return;
      }

      printDocument.open();

      printDocument.write(`
        <!doctype html>

        <html lang="en">

          <head>

            <meta charset="utf-8">

            <title>
              Umoja P.A.G Church — Event Registration
            </title>

            <style>

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 50px;
                font-family: Arial, sans-serif;
                text-align: center;
                color: #17243d;
                background: #ffffff;
              }

              .sheet {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px;
                border: 2px solid #d1a326;
                border-radius: 20px;
              }

              h1 {
                margin: 0 0 8px;
                color: #072f6f;
                font-size: 32px;
              }

              .subtitle {
                margin: 0 0 28px;
                color: #9b7414;
                font-size: 18px;
                font-weight: 700;
              }

              img {
                display: block;
                width: 300px;
                height: 300px;
                margin: 24px auto;
              }

              p {
                line-height: 1.6;
              }

              .url {
                margin-top: 20px;
                color: #647087;
                font-size: 11px;
                word-break: break-all;
              }

              @media print {

                body {
                  padding: 20px;
                }

                .sheet {
                  border: none;
                }

              }

            </style>

          </head>

          <body>

            <div class="sheet">

              <h1>
                Umoja P.A.G Church
              </h1>

              <div class="subtitle">
                Scan to Register
              </div>

              <img
                src="${imageSource}"
                alt="Event registration QR code"
              >

              <p>
                Scan this QR code with your phone camera
                to open the event registration form.
              </p>

              <div class="url">
                ${getRegistrationUrl()}
              </div>

            </div>

          </body>

        </html>
      `);

      printDocument.close();

      const printWhenReady =
        () => {
          try {
            iframe.contentWindow
              ?.focus();

            iframe.contentWindow
              ?.print();
          } catch (error) {
            console.error(
              "QR printing failed:",
              error,
            );

            window.alert(
              "Printing failed. Please try again.",
            );
          }

          window.setTimeout(
            () => {
              iframe.remove();
            },
            1500,
          );
        };

      /*
       * Give the QR image enough time to render
       * inside the print document.
       */
      window.setTimeout(
        printWhenReady,
        350,
      );
    },
  );

  // ---------------------------------------------------------
  // INITIAL ACCESSIBILITY STATE
  // ---------------------------------------------------------

  overlay.hidden = true;

  overlay.setAttribute(
    "aria-hidden",
    "true",
  );

  if (expandOverlay) {
    expandOverlay.hidden =
      true;

    expandOverlay.setAttribute(
      "aria-hidden",
      "true",
    );
  }
})();