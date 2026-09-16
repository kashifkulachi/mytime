// import "server-only";

// import { generatePdf } from "@/lib/pdf-service/generateMedicalReportPdf";
// import { uploadReportPdf } from "@/services/storage/uploadReportPdf";
// import { getReportById } from "@/services/database/reports/getReportById";
// import { updateReportPdfStatus } from "@/services/database/reports/updateReportPdfStatus";

// export interface GenerateAndStoreReportPdfInput {
//   reportId: string;
// }

// export interface GenerateAndStoreReportPdfResult {
//   reportId: string;
//   pdfPath: string;
// }

// /**
//  * Generates and stores a PDF for a report that has already been
//  * claimed by the PDF queue worker.
//  *
//  * Expected report state when this function starts:
//  *
//  *   pdf_status = "generating"
//  *
//  * Responsibilities:
//  *
//  *   1. Validate the report still exists
//  *   2. Ensure the worker actually owns a generating job
//  *   3. Render the report with Puppeteer
//  *   4. Upload the generated PDF to Supabase Storage
//  *   5. Mark the report as ready
//  *
//  * If generation/upload fails:
//  *
//  *   pdf_status = "failed"
//  *
//  * Queue message acknowledgement is NOT handled here.
//  * That belongs to the queue worker.
//  */
// export async function generateAndStoreReportPdf({
//   reportId,
// }: GenerateAndStoreReportPdfInput): Promise<GenerateAndStoreReportPdfResult> {
//   const normalizedReportId = reportId.trim();

//   if (!normalizedReportId) {
//     throw new Error("Report ID is required.");
//   }

//   /*
//    * ----------------------------------------------------------
//    * Verify the report still exists and was properly claimed.
//    * ----------------------------------------------------------
//    *
//    * The future queue worker claim operation will atomically:
//    *
//    *   queued -> generating
//    *
//    * before calling this function.
//    *
//    * This guard prevents this function from accidentally being
//    * called directly against pending/queued/ready reports.
//    */
//   const report = await getReportById(normalizedReportId);

//   if (!report) {
//     throw new Error("REPORT_NOT_FOUND");
//   }

//   if (report.pdfStatus !== "generating") {
//     throw new Error(`REPORT_NOT_CLAIMED_FOR_GENERATION:${report.pdfStatus}`);
//   }

//   try {
//     /*
//      * --------------------------------------------------------
//      * Generate PDF using the database-backed print page.
//      * --------------------------------------------------------
//      *
//      * generatePdf() loads:
//      *
//      * /reports/{reportId}/print
//      *
//      * The print page loads the persisted calculation snapshot
//      * from Supabase.
//      */
//     const pdf = await generatePdf({
//       reportId: normalizedReportId,
//     });

//     if (!pdf || pdf.byteLength === 0) {
//       throw new Error("Generated PDF is empty.");
//     }

//     /*
//      * --------------------------------------------------------
//      * Upload PDF
//      * --------------------------------------------------------
//      *
//      * Existing uploadReportPdf() uses:
//      *
//      * reports/{reportId}/medical-report.pdf
//      *
//      * with upsert=true.
//      *
//      * That makes regeneration idempotent.
//      */
//     const uploadedPdf = await uploadReportPdf({
//       reportId: normalizedReportId,
//       pdf,
//     });

//     if (!uploadedPdf.path) {
//       throw new Error("PDF upload completed without returning a storage path.");
//     }

//     /*
//      * --------------------------------------------------------
//      * Persist READY state
//      * --------------------------------------------------------
//      */
//     await updateReportPdfStatus({
//       reportId: normalizedReportId,
//       status: "ready",
//       pdfPath: uploadedPdf.path,
//       pdfError: null,
//     });

//     return {
//       reportId: normalizedReportId,
//       pdfPath: uploadedPdf.path,
//     };
//   } catch (error) {
//     const generationError =
//       error instanceof Error
//         ? error
//         : new Error("Unknown PDF generation error.");

//     /*
//      * --------------------------------------------------------
//      * Persist FAILED state
//      * --------------------------------------------------------
//      *
//      * Never allow a failure while updating database status to
//      * hide the original Puppeteer/Storage error.
//      */
//     try {
//       await updateReportPdfStatus({
//         reportId: normalizedReportId,
//         status: "failed",
//         pdfError: sanitizePdfGenerationError(generationError),
//       });
//     } catch (statusError) {
//       console.error(
//         `Failed to mark report ${normalizedReportId} as failed:`,
//         statusError,
//       );
//     }

//     console.error(
//       `PDF generation failed for report ${normalizedReportId}:`,
//       generationError,
//     );

//     throw generationError;
//   }
// }

// /**
//  * Avoid persisting unnecessarily large or potentially sensitive
//  * infrastructure messages in reports.pdf_error.
//  *
//  * Detailed errors should remain in server logs.
//  */
// function sanitizePdfGenerationError(error: Error): string {
//   const message = error.message.trim();

//   if (!message) {
//     return "PDF generation failed.";
//   }

//   /*
//    * Keep DB error text reasonably small.
//    *
//    * We can later replace this with structured internal error
//    * codes when we add observability.
//    */
//   const MAX_ERROR_LENGTH = 500;

//   if (message.length <= MAX_ERROR_LENGTH) {
//     return message;
//   }

//   return `${message.slice(0, MAX_ERROR_LENGTH)}...`;
// }
import "server-only";

import { generatePdf } from "@/lib/pdf-service/generateMedicalReportPdf";

import { uploadReportPdf } from "@/services/storage/uploadReportPdf";
import { deleteReportPdf } from "@/services/storage/deleteReportPdf";

import { getReportById } from "@/services/database/reports/getReportById";
import { updateReportPdfStatus } from "@/services/database/reports/updateReportPdfStatus";

export interface GenerateAndStoreReportPdfInput {
  reportId: string;
}

export interface GenerateAndStoreReportPdfResult {
  reportId: string;
  pdfPath: string;
}

/**
 * Generates and stores a PDF for a report that has already been
 * claimed by the PDF queue worker.
 *
 * Expected report state:
 *
 *   pdf_status = "generating"
 *
 * Important deletion/concurrency behavior:
 *
 * A patient may permanently delete a medical record while
 * Puppeteer is generating its PDF.
 *
 * Therefore this service:
 *
 *   1. Verifies report before generation.
 *   2. Generates PDF.
 *   3. Verifies report again before upload.
 *   4. Uploads PDF.
 *   5. Verifies report again after upload.
 *   6. If report disappeared after upload, removes the uploaded
 *      PDF so an orphan Storage object is not left behind.
 *   7. Marks the surviving report as ready.
 */
export async function generateAndStoreReportPdf({
  reportId,
}: GenerateAndStoreReportPdfInput): Promise<GenerateAndStoreReportPdfResult> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  /**
   * ============================================================
   * 1. VERIFY REPORT BEFORE GENERATION
   * ============================================================
   */

  const initialReport = await getReportById(normalizedReportId);

  if (!initialReport) {
    throw new Error("REPORT_NOT_FOUND");
  }

  if (initialReport.pdfStatus !== "generating") {
    throw new Error(
      `REPORT_NOT_CLAIMED_FOR_GENERATION:${initialReport.pdfStatus}`,
    );
  }

  let pdfUploaded = false;

  try {
    /**
     * ==========================================================
     * 2. GENERATE PDF
     * ==========================================================
     */

    const pdf = await generatePdf({
      reportId: normalizedReportId,
    });

    if (!pdf || pdf.byteLength === 0) {
      throw new Error("Generated PDF is empty.");
    }

    /**
     * ==========================================================
     * 3. VERIFY REPORT AGAIN BEFORE STORAGE UPLOAD
     * ==========================================================
     *
     * Puppeteer can take several seconds.
     *
     * During that time the patient may have deleted the medical
     * record.
     *
     * If the report disappeared, do not upload the generated PDF.
     */

    const reportBeforeUpload = await getReportById(normalizedReportId);

    if (!reportBeforeUpload) {
      throw new Error("REPORT_DELETED_DURING_PDF_GENERATION");
    }

    /**
     * The report should still belong to the same claimed
     * generation lifecycle.
     *
     * If its status changed, this worker should not continue
     * uploading a potentially stale PDF.
     */

    if (reportBeforeUpload.pdfStatus !== "generating") {
      throw new Error(
        `REPORT_NO_LONGER_GENERATING:${reportBeforeUpload.pdfStatus}`,
      );
    }

    /**
     * ==========================================================
     * 4. UPLOAD PDF
     * ==========================================================
     *
     * uploadReportPdf() uses the stable path:
     *
     * reports/{reportId}/medical-report.pdf
     *
     * with upsert=true.
     */

    const uploadedPdf = await uploadReportPdf({
      reportId: normalizedReportId,
      pdf,
    });

    if (!uploadedPdf.path) {
      throw new Error("PDF upload completed without returning a storage path.");
    }

    pdfUploaded = true;

    /**
     * ==========================================================
     * 5. VERIFY REPORT AFTER STORAGE UPLOAD
     * ==========================================================
     *
     * There is still a race window between:
     *
     *   verify report
     *       ↓
     *   upload PDF
     *
     * The patient could delete the record during that window.
     *
     * If that happened, remove the newly uploaded PDF before
     * exiting.
     */

    const reportAfterUpload = await getReportById(normalizedReportId);

    if (!reportAfterUpload) {
      await cleanupOrphanedPdf(normalizedReportId);

      pdfUploaded = false;

      throw new Error("REPORT_DELETED_DURING_PDF_UPLOAD");
    }

    if (reportAfterUpload.pdfStatus !== "generating") {
      /**
       * Another operation changed the report lifecycle while this
       * worker was uploading.
       *
       * Do not allow this worker to mark stale output as ready.
       */

      await cleanupOrphanedPdf(normalizedReportId);

      pdfUploaded = false;

      throw new Error(
        `REPORT_NO_LONGER_GENERATING:${reportAfterUpload.pdfStatus}`,
      );
    }

    /**
     * ==========================================================
     * 6. MARK REPORT READY
     * ==========================================================
     */

    try {
      await updateReportPdfStatus({
        reportId: normalizedReportId,
        status: "ready",
        pdfPath: uploadedPdf.path,
        pdfError: null,
      });
    } catch (statusError) {
      /**
       * The report may have been deleted after our final existence
       * check but before the READY update.
       *
       * Remove the uploaded PDF so we do not leave an orphan
       * Storage object.
       */

      if (pdfUploaded) {
        await cleanupOrphanedPdf(normalizedReportId);

        pdfUploaded = false;
      }

      throw statusError;
    }

    return {
      reportId: normalizedReportId,
      pdfPath: uploadedPdf.path,
    };
  } catch (error) {
    const generationError =
      error instanceof Error
        ? error
        : new Error("Unknown PDF generation error.");

    /**
     * ==========================================================
     * 7. CLEAN UP POSSIBLE UPLOADED PDF
     * ==========================================================
     *
     * Normally the specific race branches above already clean
     * their uploaded PDF.
     *
     * This is an additional defensive cleanup if an error occurs
     * after upload but before successful READY persistence.
     */

    if (pdfUploaded) {
      await cleanupOrphanedPdf(normalizedReportId);

      pdfUploaded = false;
    }

    /**
     * ==========================================================
     * 8. MARK SURVIVING REPORT FAILED
     * ==========================================================
     *
     * IMPORTANT:
     *
     * If the patient deleted the report, there is nothing left to
     * mark failed.
     *
     * Therefore check existence first.
     */

    try {
      const survivingReport = await getReportById(normalizedReportId);

      if (survivingReport) {
        await updateReportPdfStatus({
          reportId: normalizedReportId,
          status: "failed",
          pdfError: sanitizePdfGenerationError(generationError),
        });
      }
    } catch (statusError) {
      /**
       * Never allow failure-state persistence to hide the original
       * Puppeteer/Storage error.
       */

      console.error(
        `Failed to mark report ${normalizedReportId} as failed:`,
        statusError,
      );
    }

    console.error(
      `PDF generation failed for report ${normalizedReportId}:`,
      generationError,
    );

    throw generationError;
  }
}

/**
 * ==============================================================
 * STORAGE COMPENSATION
 * ==============================================================
 *
 * Used when a PDF was uploaded but its owning database record
 * disappeared or became invalid before generation could finish.
 *
 * Cleanup errors are logged but deliberately do not replace the
 * original generation error.
 */
async function cleanupOrphanedPdf(reportId: string): Promise<void> {
  try {
    await deleteReportPdf({
      reportId,
    });
  } catch (cleanupError) {
    console.error(
      `[PDF ${reportId}] Failed to clean up uploaded PDF after generation was invalidated:`,
      cleanupError,
    );
  }
}

/**
 * Avoid persisting unnecessarily large or potentially sensitive
 * infrastructure messages in reports.pdf_error.
 *
 * Detailed errors remain in server logs.
 */
function sanitizePdfGenerationError(error: Error): string {
  const message = error.message.trim();

  if (!message) {
    return "PDF generation failed.";
  }

  const MAX_ERROR_LENGTH = 500;

  if (message.length <= MAX_ERROR_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_ERROR_LENGTH)}...`;
}
