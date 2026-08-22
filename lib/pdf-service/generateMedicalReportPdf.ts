// import "server-only";

// import puppeteer from "puppeteer";

// interface GenerateMedicalReportPdfOptions {
//   reportUrl: string;
// }

// export async function generatePdf({
//   reportUrl,
// }: GenerateMedicalReportPdfOptions) {
//   const browser = await puppeteer.launch({
//     headless: true,
//   });

//   try {
//     const page = await browser.newPage();

//     page.setDefaultNavigationTimeout(30_000);

//     const response = await page.goto(reportUrl, {
//       waitUntil: "networkidle0",
//     });

//     if (!response) {
//       throw new Error("Report page did not return a response.");
//     }

//     if (!response.ok()) {
//       throw new Error(`Report page returned ${response.status()}.`);
//     }

//     await page.evaluate(async () => {
//       await document.fonts.ready;
//     });

//     const pdf = await page.pdf({
//       width: "310mm",
//       printBackground: true,
//       preferCSSPageSize: true,

//       margin: {
//         top: "0",
//         right: "0",
//         bottom: "0",
//         left: "0",
//       },
//     });

//     return pdf;
//   } finally {
//     await browser.close();
//   }
// }
import "server-only";

// import puppeteer from "puppeteer";

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface GenerateMedicalReportPdfOptions {
  reportId: string;
}

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

  const reportUrl = new URL(
    `/reports/${encodeURIComponent(normalizedReportId)}/print`,
    appUrl,
  ).toString();

  // const browser = await puppeteer.launch({
  //   headless: true,
  // });

  const isProduction = process.env.NODE_ENV === "production";

  const browser = await puppeteer.launch({
    args: isProduction ? chromium.args : [],
    executablePath: isProduction
      ? await chromium.executablePath()
      : "C:\\Users\\Dell\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  try {
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(30_000);

    const response = await page.goto(reportUrl, {
      waitUntil: "networkidle0",
    });

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

    /*
     * Make sure web fonts have finished loading before the PDF
     * snapshot is created.
     */
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdf = await page.pdf({
      width: "310mm",

      printBackground: true,

      /*
       * Your medical-report.css already contains @page sizing,
       * so CSS remains the source of truth for page dimensions.
       */
      preferCSSPageSize: true,

      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
