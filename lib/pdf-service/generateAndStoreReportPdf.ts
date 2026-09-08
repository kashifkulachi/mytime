// import "server-only";

// import { generatePdf } from "@/lib/pdf-service/generateMedicalReportPdf";
// import { uploadReportPdf } from "@/services/storage/uploadReportPdf";
// import { updateReportPdfStatus } from "@/services/database/reports/updateReportPdfStatus";

// interface GenerateAndStoreReportPdfOptions {
//   reportId: string;
// }

// export interface GeneratedStoredReportPdf {
//   reportId: string;
//   pdfPath: string;
// }

// export async function generateAndStoreReportPdf({
//   reportId,
// }: GenerateAndStoreReportPdfOptions): Promise<GeneratedStoredReportPdf> {
//   const normalizedReportId = reportId.trim();

//   if (!normalizedReportId) {
//     throw new Error("Report ID is required.");
//   }

//   try {
//     /*
//      * --------------------------------------------------------
//      * 1. Mark report as generating
//      * --------------------------------------------------------
//      */

//     await updateReportPdfStatus({
//       reportId: normalizedReportId,
//       status: "generating",
//     });

//     /*
//      * --------------------------------------------------------
//      * 2. Generate PDF
//      *
//      * Puppeteer will open:
//      *
//      * /reports/{reportId}/print
//      *
//      * That page retrieves the report from Supabase.
//      * --------------------------------------------------------
//      */

//     const pdf = await generatePdf({
//       reportId: normalizedReportId,
//     });

//     /*
//      * --------------------------------------------------------
//      * 3. Upload PDF to private Supabase Storage
//      * --------------------------------------------------------
//      */

//     const uploadedPdf = await uploadReportPdf({
//       reportId: normalizedReportId,
//       pdf,
//     });

//     /*
//      * --------------------------------------------------------
//      * 4. Mark report as ready
//      *
//      * Store only the permanent Storage object path.
//      * Do not store a signed URL.
//      * --------------------------------------------------------
//      */

//     await updateReportPdfStatus({
//       reportId: normalizedReportId,
//       status: "ready",
//       pdfPath: uploadedPdf.path,
//     });

//     return {
//       reportId: normalizedReportId,
//       pdfPath: uploadedPdf.path,
//     };
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown PDF generation error.";

//     console.error(
//       `Failed to generate report PDF for ${normalizedReportId}:`,
//       error,
//     );

//     /*
//      * --------------------------------------------------------
//      * Attempt to persist the failure state.
//      *
//      * This update is itself wrapped so that a database failure
//      * does not hide the original Puppeteer/Storage error.
//      * --------------------------------------------------------
//      */

//     try {
//       await updateReportPdfStatus({
//         reportId: normalizedReportId,
//         status: "failed",
//         pdfError: errorMessage,
//       });
//     } catch (statusUpdateError) {
//       console.error(
//         `Failed to mark report ${normalizedReportId} as failed:`,
//         statusUpdateError,
//       );
//     }

//     throw error instanceof Error ? error : new Error(errorMessage);
//   }
// }

import "server-only";

import { generatePdf } from "@/lib/pdf-service/generateMedicalReportPdf";
import { uploadReportPdf } from "@/services/storage/uploadReportPdf";
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
 * Expected report state when this function starts:
 *
 *   pdf_status = "generating"
 *
 * Responsibilities:
 *
 *   1. Validate the report still exists
 *   2. Ensure the worker actually owns a generating job
 *   3. Render the report with Puppeteer
 *   4. Upload the generated PDF to Supabase Storage
 *   5. Mark the report as ready
 *
 * If generation/upload fails:
 *
 *   pdf_status = "failed"
 *
 * Queue message acknowledgement is NOT handled here.
 * That belongs to the queue worker.
 */
export async function generateAndStoreReportPdf({
  reportId,
}: GenerateAndStoreReportPdfInput): Promise<GenerateAndStoreReportPdfResult> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  /*
   * ----------------------------------------------------------
   * Verify the report still exists and was properly claimed.
   * ----------------------------------------------------------
   *
   * The future queue worker claim operation will atomically:
   *
   *   queued -> generating
   *
   * before calling this function.
   *
   * This guard prevents this function from accidentally being
   * called directly against pending/queued/ready reports.
   */
  const report = await getReportById(normalizedReportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  if (report.pdfStatus !== "generating") {
    throw new Error(`REPORT_NOT_CLAIMED_FOR_GENERATION:${report.pdfStatus}`);
  }

  try {
    /*
     * --------------------------------------------------------
     * Generate PDF using the database-backed print page.
     * --------------------------------------------------------
     *
     * generatePdf() loads:
     *
     * /reports/{reportId}/print
     *
     * The print page loads the persisted calculation snapshot
     * from Supabase.
     */
    const pdf = await generatePdf({
      reportId: normalizedReportId,
    });

    if (!pdf || pdf.byteLength === 0) {
      throw new Error("Generated PDF is empty.");
    }

    /*
     * --------------------------------------------------------
     * Upload PDF
     * --------------------------------------------------------
     *
     * Existing uploadReportPdf() uses:
     *
     * reports/{reportId}/medical-report.pdf
     *
     * with upsert=true.
     *
     * That makes regeneration idempotent.
     */
    const uploadedPdf = await uploadReportPdf({
      reportId: normalizedReportId,
      pdf,
    });

    if (!uploadedPdf.path) {
      throw new Error("PDF upload completed without returning a storage path.");
    }

    /*
     * --------------------------------------------------------
     * Persist READY state
     * --------------------------------------------------------
     */
    await updateReportPdfStatus({
      reportId: normalizedReportId,
      status: "ready",
      pdfPath: uploadedPdf.path,
      pdfError: null,
    });

    return {
      reportId: normalizedReportId,
      pdfPath: uploadedPdf.path,
    };
  } catch (error) {
    const generationError =
      error instanceof Error
        ? error
        : new Error("Unknown PDF generation error.");

    /*
     * --------------------------------------------------------
     * Persist FAILED state
     * --------------------------------------------------------
     *
     * Never allow a failure while updating database status to
     * hide the original Puppeteer/Storage error.
     */
    try {
      await updateReportPdfStatus({
        reportId: normalizedReportId,
        status: "failed",
        pdfError: sanitizePdfGenerationError(generationError),
      });
    } catch (statusError) {
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
 * Avoid persisting unnecessarily large or potentially sensitive
 * infrastructure messages in reports.pdf_error.
 *
 * Detailed errors should remain in server logs.
 */
function sanitizePdfGenerationError(error: Error): string {
  const message = error.message.trim();

  if (!message) {
    return "PDF generation failed.";
  }

  /*
   * Keep DB error text reasonably small.
   *
   * We can later replace this with structured internal error
   * codes when we add observability.
   */
  const MAX_ERROR_LENGTH = 500;

  if (message.length <= MAX_ERROR_LENGTH) {
    return message;
  }

  return `${message.slice(0, MAX_ERROR_LENGTH)}...`;
}
