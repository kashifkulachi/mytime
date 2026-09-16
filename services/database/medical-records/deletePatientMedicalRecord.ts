import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { archiveReportPdfJobsByReportId } from "@/services/queue/archiveReportPdfJobsByReportId";
import { deleteReportPdf } from "@/services/storage/deleteReportPdf";

export interface DeletePatientMedicalRecordInput {
  patientId: string;
  reportId: string;
}

export interface DeletePatientMedicalRecordResult {
  reportId: string;
  deleted: true;
  archivedQueueJobs: number;
}

interface PatientReportRow {
  id: string;
  patient_id: string;
  pdf_status: string | null;
}

/**
 * Permanently deletes one patient's medical record.
 *
 * This deletes the complete report, including:
 *
 * - patient/report snapshot stored in reports
 * - calculation_results
 * - IFI / Biological Age / Peptide / HBOT results
 * - PDF metadata
 * - historical IFI functional-profile version reference
 * - generated PDF in private Supabase Storage
 * - outstanding PDF-generation queue messages
 *
 * Security:
 *
 * The report must belong to the supplied patientId.
 *
 * The API calling this service MUST obtain patientId from the
 * authenticated server-side profile. It must never accept a
 * patientId supplied by the browser.
 *
 * Deletion order:
 *
 *   1. Verify ownership.
 *   2. Archive PDF queue messages.
 *   3. Delete Storage PDF.
 *   4. Delete reports row.
 *
 * Storage is deleted before the database row because if the
 * database deletion later fails, the report still exists and
 * its PDF can be regenerated.
 *
 * PDF generation itself is separately protected against the
 * deletion race by generateAndStoreReportPdf().
 */
export async function deletePatientMedicalRecord({
  patientId,
  reportId,
}: DeletePatientMedicalRecordInput): Promise<DeletePatientMedicalRecordResult> {
  /**
   * ============================================================
   * 1. VALIDATE INPUT
   * ============================================================
   */

  const normalizedPatientId = patientId.trim();
  const normalizedReportId = reportId.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ============================================================
   * 2. VERIFY REPORT OWNERSHIP
   * ============================================================
   *
   * IMPORTANT:
   *
   * We query using BOTH:
   *
   *   report.id
   *       AND
   *   report.patient_id
   *
   * Therefore knowing another patient's report UUID is not
   * enough to delete their medical record.
   */

  const { data: reportData, error: reportError } = await supabase
    .from("reports")
    .select(
      `
        id,
        patient_id,
        pdf_status
      `,
    )
    .eq("id", normalizedReportId)
    .eq("patient_id", normalizedPatientId)
    .maybeSingle();

  if (reportError) {
    console.error(
      "[deletePatientMedicalRecord] Failed to verify report ownership:",
      {
        reportId: normalizedReportId,
        patientId: normalizedPatientId,
        code: reportError.code,
        message: reportError.message,
      },
    );

    throw new Error("MEDICAL_RECORD_LOOKUP_FAILED");
  }

  if (!reportData) {
    /**
     * Deliberately use the same result whether:
     *
     * - the report does not exist, or
     * - the report belongs to somebody else.
     *
     * This avoids exposing report ownership information.
     */

    throw new Error("MEDICAL_RECORD_NOT_FOUND");
  }

  const report = reportData as PatientReportRow;

  /**
   * ============================================================
   * 3. ARCHIVE OUTSTANDING PDF QUEUE JOBS
   * ============================================================
   *
   * This prevents queued work for this report from being picked
   * up after deletion begins.
   *
   * The RPC also sees queue messages hidden by their visibility
   * timeout.
   *
   * archivedCount === 0 is valid.
   */

  const queueResult = await archiveReportPdfJobsByReportId({
    reportId: report.id,
  });

  /**
   * ============================================================
   * 4. DELETE PDF FROM PRIVATE STORAGE
   * ============================================================
   *
   * We use the deterministic server-side path:
   *
   *   medical-reports/
   *   reports/{reportId}/medical-report.pdf
   *
   * We intentionally do NOT trust reports.pdf_path or anything
   * supplied by the browser.
   *
   * Missing PDFs are harmless. A failed/queued report may never
   * have produced a PDF in the first place.
   */

  await deleteReportPdf({
    reportId: report.id,
  });

  /**
   * ============================================================
   * 5. DELETE COMPLETE REPORT ROW
   * ============================================================
   *
   * This is the actual medical-record deletion.
   *
   * calculation_results and every other report-owned field are
   * removed because the complete reports row is deleted.
   *
   * IMPORTANT:
   *
   * Repeat the patient_id condition here.
   *
   * We do not rely only on the ownership check performed above.
   * This gives the destructive database operation its own
   * ownership constraint.
   */

  const { data: deletedReport, error: deleteError } = await supabase
    .from("reports")
    .delete()
    .eq("id", normalizedReportId)
    .eq("patient_id", normalizedPatientId)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    console.error(
      "[deletePatientMedicalRecord] Failed to delete medical record:",
      {
        reportId: normalizedReportId,
        patientId: normalizedPatientId,
        code: deleteError.code,
        message: deleteError.message,
      },
    );

    /**
     * At this point:
     *
     * - queue messages have been archived
     * - Storage PDF has been removed
     * - report row still exists
     *
     * This is recoverable because the database remains the
     * source of truth. The PDF can be regenerated later.
     */

    throw new Error("MEDICAL_RECORD_DELETE_FAILED");
  }

  if (!deletedReport) {
    /**
     * The row disappeared between our ownership check and the
     * DELETE operation.
     *
     * From the caller's perspective the desired final state has
     * already been reached: the medical record no longer exists.
     *
     * However, return a successful idempotent result rather than
     * exposing an internal race.
     */

    return {
      reportId: normalizedReportId,
      deleted: true,
      archivedQueueJobs: queueResult.archivedCount,
    };
  }

  /**
   * ============================================================
   * 6. SUCCESS
   * ============================================================
   */

  return {
    reportId: deletedReport.id,
    deleted: true,
    archivedQueueJobs: queueResult.archivedCount,
  };
}
