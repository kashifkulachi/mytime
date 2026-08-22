import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReportPdfStatus = "pending" | "generating" | "ready" | "failed";

interface UpdateReportPdfStatusInput {
  reportId: string;
  status: ReportPdfStatus;
  pdfPath?: string | null;
  pdfError?: string | null;
}

export async function updateReportPdfStatus({
  reportId,
  status,
  pdfPath,
  pdfError,
}: UpdateReportPdfStatusInput): Promise<void> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  const updatePayload: {
    pdf_status: ReportPdfStatus;
    pdf_path?: string | null;
    pdf_generated_at?: string | null;
    pdf_error?: string | null;
  } = {
    pdf_status: status,
  };

  if (status === "generating") {
    updatePayload.pdf_error = null;
  }

  if (status === "ready") {
    if (!pdfPath) {
      throw new Error("PDF path is required when marking a report as ready.");
    }

    updatePayload.pdf_path = pdfPath;
    updatePayload.pdf_generated_at = new Date().toISOString();
    updatePayload.pdf_error = null;
  }

  if (status === "failed") {
    updatePayload.pdf_error = pdfError?.trim() || "PDF generation failed.";
  }

  const { error } = await supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", normalizedReportId);

  if (error) {
    console.error(
      `Failed to update PDF status for report ${normalizedReportId}:`,
      error,
    );

    throw new Error(`Failed to update report PDF status: ${error.message}`);
  }
}
