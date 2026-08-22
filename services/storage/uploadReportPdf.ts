import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MEDICAL_REPORTS_BUCKET = "medical-reports";

interface UploadReportPdfOptions {
  reportId: string;
  pdf: Uint8Array;
}

export interface UploadedReportPdf {
  bucket: string;
  path: string;
}

export async function uploadReportPdf({
  reportId,
  pdf,
}: UploadReportPdfOptions): Promise<UploadedReportPdf> {
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new Error("Report ID is required.");
  }

  if (pdf.byteLength === 0) {
    throw new Error("Cannot upload an empty PDF.");
  }

  const timestamp = getFileTimestamp();

  const supabase = createSupabaseAdminClient();

  const path = `reports/${normalizedReportId}/${timestamp}-mytime-report.pdf`;

  const { data, error } = await supabase.storage
    .from(MEDICAL_REPORTS_BUCKET)
    .upload(path, pdf, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Failed to upload report PDF:", error);

    throw new Error(`Failed to upload report PDF: ${error.message}`);
  }

  return {
    bucket: MEDICAL_REPORTS_BUCKET,
    path: data.path,
  };
}

function getFileTimestamp() {
  const now = new Date();

  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  return `${day}-${month}-${year}-${hours}-${minutes}`;
}
