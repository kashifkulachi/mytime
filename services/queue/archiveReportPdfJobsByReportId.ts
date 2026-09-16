import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface ArchiveReportPdfJobsByReportIdInput {
  reportId: string;
}

export interface ArchiveReportPdfJobsByReportIdResult {
  reportId: string;
  archivedCount: number;
}

interface ArchiveReportPdfJobsRpcRow {
  archived_count: number | string;
}

/**
 * Archives every live PDF-generation queue message associated
 * with a specific report.
 *
 * This is primarily used when a patient permanently deletes
 * their medical record.
 *
 * Important:
 *
 * This function does NOT:
 * - authorize the patient
 * - delete the report
 * - delete the PDF from Storage
 *
 * Those responsibilities belong to the medical-record deletion
 * service.
 */
export async function archiveReportPdfJobsByReportId({
  reportId,
}: ArchiveReportPdfJobsByReportIdInput): Promise<ArchiveReportPdfJobsByReportIdResult> {
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
   * 2. ARCHIVE REPORT QUEUE MESSAGES
   * ============================================================
   */

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "archive_report_pdf_generation_jobs_by_report_id",
    {
      p_report_id: normalizedReportId,
    },
  );

  if (error) {
    console.error(
      `[archiveReportPdfJobsByReportId] Failed to archive PDF queue jobs for report ${normalizedReportId}:`,
      {
        code: error.code,
        message: error.message,
      },
    );

    throw new Error("REPORT_PDF_QUEUE_CANCELLATION_FAILED");
  }

  /**
   * ============================================================
   * 3. VALIDATE RPC RESULT
   * ============================================================
   */

  const rows = data as ArchiveReportPdfJobsRpcRow[] | null;

  if (!rows || rows.length === 0) {
    throw new Error("The PDF queue did not return a cancellation result.");
  }

  const archivedCount = Number(rows[0].archived_count);

  if (!Number.isSafeInteger(archivedCount) || archivedCount < 0) {
    throw new Error(
      "The PDF queue returned an invalid archived message count.",
    );
  }

  /**
   * archivedCount === 0 is completely valid.
   *
   * Examples:
   *
   * - PDF was already generated and acknowledged.
   * - Report never had a queue message.
   * - Previous cleanup already archived the message.
   */

  return {
    reportId: normalizedReportId,
    archivedCount,
  };
}
