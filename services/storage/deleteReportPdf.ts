import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MEDICAL_REPORTS_BUCKET = "medical-reports";

export interface DeleteReportPdfInput {
  reportId: string;
}

export interface DeleteReportPdfResult {
  reportId: string;
  bucket: string;
  path: string;
}

/**
 * Permanently removes the stored PDF belonging to one report.
 *
 * Storage convention:
 *
 *   medical-reports
 *     └── reports/{reportId}/medical-report.pdf
 *
 * The path is deterministic, so this service does not need to
 * trust or receive a storage path from the browser.
 *
 * This service is intentionally idempotent from the application's
 * perspective:
 *
 * - PDF exists    -> remove it
 * - PDF is missing -> deletion can still continue
 *
 * Supabase Storage remove() does not require us to first perform
 * a separate existence check.
 */
export async function deleteReportPdf({
  reportId,
}: DeleteReportPdfInput): Promise<DeleteReportPdfResult> {
  /**
   * ============================================================
   * 1. VALIDATE INPUT
   * ============================================================
   */

  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  /**
   * ============================================================
   * 2. BUILD SERVER-TRUSTED STORAGE PATH
   * ============================================================
   *
   * Never accept this path from the browser.
   */

  const path = `reports/${normalizedReportId}/medical-report.pdf`;

  const supabase = createSupabaseAdminClient();

  /**
   * ============================================================
   * 3. DELETE PDF
   * ============================================================
   */

  const { error } = await supabase.storage
    .from(MEDICAL_REPORTS_BUCKET)
    .remove([path]);

  if (error) {
    console.error(
      `[deleteReportPdf] Failed to delete PDF for report ${normalizedReportId}:`,
      {
        bucket: MEDICAL_REPORTS_BUCKET,
        path,
        message: error.message,
      },
    );

    throw new Error("REPORT_PDF_STORAGE_DELETE_FAILED");
  }

  return {
    reportId: normalizedReportId,
    bucket: MEDICAL_REPORTS_BUCKET,
    path,
  };
}
