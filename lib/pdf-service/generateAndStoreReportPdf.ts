import "server-only";

import { generatePdf } from "@/lib/pdf-service/generateMedicalReportPdf";
import { uploadReportPdf } from "@/services/storage/uploadReportPdf";
import { updateReportPdfStatus } from "@/services/database/reports/updateReportPdfStatus";

interface GenerateAndStoreReportPdfOptions {
  reportId: string;
}

export interface GeneratedStoredReportPdf {
  reportId: string;
  pdfPath: string;
}

export async function generateAndStoreReportPdf({
  reportId,
}: GenerateAndStoreReportPdfOptions): Promise<GeneratedStoredReportPdf> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  try {
    /*
     * --------------------------------------------------------
     * 1. Mark report as generating
     * --------------------------------------------------------
     */

    await updateReportPdfStatus({
      reportId: normalizedReportId,
      status: "generating",
    });

    /*
     * --------------------------------------------------------
     * 2. Generate PDF
     *
     * Puppeteer will open:
     *
     * /reports/{reportId}/print
     *
     * That page retrieves the report from Supabase.
     * --------------------------------------------------------
     */

    const pdf = await generatePdf({
      reportId: normalizedReportId,
    });

    /*
     * --------------------------------------------------------
     * 3. Upload PDF to private Supabase Storage
     * --------------------------------------------------------
     */

    const uploadedPdf = await uploadReportPdf({
      reportId: normalizedReportId,
      pdf,
    });

    /*
     * --------------------------------------------------------
     * 4. Mark report as ready
     *
     * Store only the permanent Storage object path.
     * Do not store a signed URL.
     * --------------------------------------------------------
     */

    await updateReportPdfStatus({
      reportId: normalizedReportId,
      status: "ready",
      pdfPath: uploadedPdf.path,
    });

    return {
      reportId: normalizedReportId,
      pdfPath: uploadedPdf.path,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown PDF generation error.";

    console.error(
      `Failed to generate report PDF for ${normalizedReportId}:`,
      error,
    );

    /*
     * --------------------------------------------------------
     * Attempt to persist the failure state.
     *
     * This update is itself wrapped so that a database failure
     * does not hide the original Puppeteer/Storage error.
     * --------------------------------------------------------
     */

    try {
      await updateReportPdfStatus({
        reportId: normalizedReportId,
        status: "failed",
        pdfError: errorMessage,
      });
    } catch (statusUpdateError) {
      console.error(
        `Failed to mark report ${normalizedReportId} as failed:`,
        statusUpdateError,
      );
    }

    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
