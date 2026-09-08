// Before the Print Page access restricting throufh generate medical report function

// import "server-only";

// import chromium from "@sparticuz/chromium";
// import puppeteer from "puppeteer-core";

// interface GenerateMedicalReportPdfOptions {
//   reportId: string;
// }

// const LOCAL_CHROME_PATH =
//   "C:\\Users\\Dell\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe";

// export async function generatePdf({
//   reportId,
// }: GenerateMedicalReportPdfOptions): Promise<Uint8Array> {
//   const normalizedReportId = reportId.trim();

//   if (!normalizedReportId) {
//     throw new Error("Report ID is required.");
//   }

//   const appUrl = process.env.APP_URL;

//   if (!appUrl) {
//     throw new Error("Missing APP_URL environment variable.");
//   }

//   const reportUrl = new URL(
//     `/reports/${encodeURIComponent(normalizedReportId)}/print`,
//     appUrl,
//   ).toString();

//   const isProduction = process.env.NODE_ENV === "production";

//   /*
//    * ---------------------------------------------------------
//    * 1. Resolve Chromium executable
//    * ---------------------------------------------------------
//    */

//   const executablePath = isProduction
//     ? await chromium.executablePath()
//     : LOCAL_CHROME_PATH;

//   /*
//    * ---------------------------------------------------------
//    * 2. Launch browser
//    * ---------------------------------------------------------
//    */

//   const browser = await puppeteer.launch({
//     args: isProduction
//       ? [
//           ...chromium.args,

//           /*
//            * Useful for serverless PDF generation.
//            */
//           "--disable-background-networking",
//           "--disable-background-timer-throttling",
//           "--disable-backgrounding-occluded-windows",
//           "--disable-breakpad",
//           "--disable-component-update",
//           "--disable-default-apps",
//           "--disable-extensions",
//           "--disable-sync",
//           "--metrics-recording-only",
//           "--mute-audio",
//           "--no-first-run",
//           "--no-default-browser-check",
//           "--disable-dev-shm-usage",
//         ]
//       : [],
//     executablePath,
//     headless: true,
//   });

//   try {
//     /*
//      * ---------------------------------------------------------
//      * 3. Create page
//      * ---------------------------------------------------------
//      */

//     const pageStartedAt = performance.now();

//     const page = await browser.newPage();

//     console.log(
//       `[PDF ${normalizedReportId}] Page created in ${Math.round(
//         performance.now() - pageStartedAt,
//       )}ms`,
//     );

//     page.setDefaultNavigationTimeout(30_000);
//     page.setDefaultTimeout(15_000);

//     /*
//      * Puppeteer doesn't need a huge viewport for PDF generation,
//      * but setting one explicitly keeps layout deterministic.
//      */
//     await page.setViewport({
//       width: 1172,
//       height: 870,
//       deviceScaleFactor: 1,
//     });

//     /*
//      * ---------------------------------------------------------
//      * 4. Load print page
//      * ---------------------------------------------------------
//      *
//      * IMPORTANT:
//      * Do NOT use networkidle0 here.
//      *
//      * We only need the HTML + initial resources loaded.
//      */

//     const response = await page.goto(reportUrl, {
//       waitUntil: "domcontentloaded",
//       timeout: 30_000,
//     });

//     if (!response) {
//       throw new Error(
//         `Report page did not return a response for report ${normalizedReportId}.`,
//       );
//     }

//     if (!response.ok()) {
//       throw new Error(
//         `Report page returned HTTP ${response.status()} for report ${normalizedReportId}.`,
//       );
//     }

//     /*
//      * ---------------------------------------------------------
//      * 5. Wait for YOUR report, not the entire network
//      * ---------------------------------------------------------
//      *
//      * Add data-report-ready="true" to the outer wrapper of your
//      * print page after all report data has been rendered.
//      */

//     await page.waitForSelector('[data-report-ready="true"]', {
//       timeout: 15_000,
//     });

//     /*
//      * Allow one browser frame so React/layout/paint can finish.
//      */
//     await page.evaluate(
//       () =>
//         new Promise<void>((resolve) => {
//           requestAnimationFrame(() => {
//             requestAnimationFrame(() => resolve());
//           });
//         }),
//     );

//     /*
//      * ---------------------------------------------------------
//      * 6. Generate PDF
//      * ---------------------------------------------------------
//      */

//     const pdf = await page.pdf({
//       printBackground: true,

//       /*
//        * CSS @page remains the source of truth.
//        */
//       preferCSSPageSize: true,

//       margin: {
//         top: "0",
//         right: "0",
//         bottom: "0",
//         left: "0",
//       },

//       /*
//        * Don't explicitly specify width if your @page CSS already
//        * defines it.
//        *
//        * @page {
//        *   size: 310mm 230mm;
//        * }
//        */
//     });

//     return pdf;
//   } finally {
//     await browser.close();
//   }
// }

import "server-only";

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface GenerateMedicalReportPdfOptions {
  reportId: string;
}

const LOCAL_CHROME_PATH =
  "C:\\Users\\Dell\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe";

const REPORT_RENDER_SECRET_HEADER = "x-mytime-render-secret";

export async function generatePdf({
  reportId,
}: GenerateMedicalReportPdfOptions): Promise<Uint8Array> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL environment variable.");
  }

  const isProduction = process.env.NODE_ENV === "production";

  /**
   * ----------------------------------------------------------
   * INTERNAL PRINT ROUTE SECRET
   * ----------------------------------------------------------
   *
   * Production print pages require this header.
   *
   * Development allows direct browser preview, so the secret is
   * optional locally.
   */
  const reportRenderSecret = process.env.REPORT_RENDER_SECRET;

  if (isProduction && !reportRenderSecret) {
    throw new Error("REPORT_RENDER_SECRET is not configured.");
  }

  const reportUrl = new URL(
    `/reports/${encodeURIComponent(normalizedReportId)}/print`,
    appUrl,
  ).toString();

  /**
   * ----------------------------------------------------------
   * 1. Resolve Chromium executable
   * ----------------------------------------------------------
   */
  const executablePath = isProduction
    ? await chromium.executablePath()
    : LOCAL_CHROME_PATH;

  /**
   * ----------------------------------------------------------
   * 2. Launch browser
   * ----------------------------------------------------------
   */
  const browser = await puppeteer.launch({
    args: isProduction
      ? [
          ...chromium.args,

          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-component-update",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-sync",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-dev-shm-usage",
        ]
      : [],

    executablePath,

    headless: true,
  });

  try {
    /**
     * --------------------------------------------------------
     * 3. Create Puppeteer page
     * --------------------------------------------------------
     */
    const pageStartedAt = performance.now();

    const page = await browser.newPage();

    console.log(
      `[PDF ${normalizedReportId}] Page created in ${Math.round(
        performance.now() - pageStartedAt,
      )}ms`,
    );

    page.setDefaultNavigationTimeout(30_000);

    page.setDefaultTimeout(20_000);

    /**
     * --------------------------------------------------------
     * 4. Authenticate Puppeteer against the private print page
     * --------------------------------------------------------
     *
     * This MUST happen before page.goto().
     */
    if (reportRenderSecret) {
      await page.setExtraHTTPHeaders({
        [REPORT_RENDER_SECRET_HEADER]: reportRenderSecret,
      });
    }

    /**
     * A deterministic viewport prevents layout differences
     * between local Chrome and serverless Chromium.
     */
    await page.setViewport({
      width: 1172,
      height: 870,
      deviceScaleFactor: 1,
    });

    /**
     * --------------------------------------------------------
     * 5. Navigate to print page
     * --------------------------------------------------------
     *
     * We intentionally do NOT use networkidle0.
     *
     * The application may have unrelated network activity.
     * Instead, we wait for our own explicit report-ready marker.
     */
    const navigationStartedAt = performance.now();

    const response = await page.goto(reportUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    console.log(
      `[PDF ${normalizedReportId}] Print page navigation completed in ${Math.round(
        performance.now() - navigationStartedAt,
      )}ms`,
    );

    if (!response) {
      throw new Error(
        `Report page did not return a response for report ${normalizedReportId}.`,
      );
    }

    if (!response.ok()) {
      throw new Error(
        `Report page returned HTTP ${response.status()} for report ${normalizedReportId}.`,
      );
    }

    /**
     * --------------------------------------------------------
     * 6. CRITICAL: wait for actual report
     * --------------------------------------------------------
     *
     * This protects us from generating a PDF of:
     *
     * app/loading.tsx
     * Suspense fallback
     * loading spinner
     * partially rendered report
     *
     * The global loading page does NOT contain:
     *
     * data-report-ready="true"
     *
     * Only the completed report page does.
     */
    const reportReadyStartedAt = performance.now();

    await page.waitForSelector('[data-report-ready="true"]', {
      timeout: 20_000,
      visible: true,
    });

    console.log(
      `[PDF ${normalizedReportId}] Report-ready marker detected in ${Math.round(
        performance.now() - reportReadyStartedAt,
      )}ms`,
    );

    /**
     * --------------------------------------------------------
     * 7. Wait for fonts + report images
     * --------------------------------------------------------
     *
     * Seeing the report wrapper does not necessarily mean every
     * font or image has finished rendering.
     *
     * We wait for both before creating the PDF.
     */
    const assetsStartedAt = performance.now();

    await page.evaluate(async () => {
      /**
       * Wait for web fonts.
       */
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      /**
       * Wait for all images used by the rendered report.
       */
      const images = Array.from(document.images);

      await Promise.all(
        images.map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              const finish = () => {
                image.removeEventListener("load", finish);

                image.removeEventListener("error", finish);

                resolve();
              };

              image.addEventListener("load", finish, {
                once: true,
              });

              image.addEventListener("error", finish, {
                once: true,
              });
            });
          }

          /**
           * decode() waits until the image is actually ready
           * for painting, not merely downloaded.
           *
           * Some image types/browsers may reject decode(),
           * which should not kill the whole PDF operation.
           */
          if (typeof image.decode === "function") {
            try {
              await image.decode();
            } catch {
              // Ignore decode failures.
            }
          }
        }),
      );
    });

    console.log(
      `[PDF ${normalizedReportId}] Fonts/images ready in ${Math.round(
        performance.now() - assetsStartedAt,
      )}ms`,
    );

    /**
     * --------------------------------------------------------
     * 8. Give Chromium two final paint frames
     * --------------------------------------------------------
     *
     * This allows React/layout/browser painting to settle after
     * the report and assets become ready.
     */
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        }),
    );

    /**
     * --------------------------------------------------------
     * 9. Defensive final verification
     * --------------------------------------------------------
     *
     * Never call page.pdf() unless the real report container is
     * still present.
     */
    const reportIsReady = await page.evaluate(() =>
      Boolean(document.querySelector('[data-report-ready="true"]')),
    );

    if (!reportIsReady) {
      throw new Error(
        `Report ${normalizedReportId} was not ready for PDF generation.`,
      );
    }

    /**
     * --------------------------------------------------------
     * 10. Generate PDF
     * --------------------------------------------------------
     */
    const pdfStartedAt = performance.now();

    const pdf = await page.pdf({
      printBackground: true,

      /**
       * medical-report.css remains the source of truth:
       *
       * @page {
       *   size: 310mm 230mm;
       *   margin: 0;
       * }
       */
      preferCSSPageSize: true,

      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    console.log(
      `[PDF ${normalizedReportId}] page.pdf() completed in ${Math.round(
        performance.now() - pdfStartedAt,
      )}ms. Size: ${Math.round(pdf.byteLength / 1024)} KB`,
    );

    return pdf;
  } finally {
    const closeStartedAt = performance.now();

    await browser.close();

    console.log(
      `[PDF ${normalizedReportId}] Browser closed in ${Math.round(
        performance.now() - closeStartedAt,
      )}ms`,
    );
  }
}
