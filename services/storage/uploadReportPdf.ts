// import "server-only";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// const MEDICAL_REPORTS_BUCKET = "medical-reports";

// interface UploadReportPdfOptions {
//   reportId: string;
//   pdf: Uint8Array;
// }

// export interface UploadedReportPdf {
//   bucket: string;
//   path: string;
// }

// export async function uploadReportPdf({
//   reportId,
//   pdf,
// }: UploadReportPdfOptions): Promise<UploadedReportPdf> {
//   const normalizedReportId = reportId.trim();

//   if (!normalizedReportId) {
//     throw new Error("Report ID is required.");
//   }

//   if (pdf.byteLength === 0) {
//     throw new Error("Cannot upload an empty PDF.");
//   }

//   const timestamp = getFileTimestamp();
//   const uploadStartedAt = performance.now();

//   const supabase = createSupabaseAdminClient();

//   const path = `reports/${normalizedReportId}/${timestamp}-mytime-report.pdf`;

//   console.log(
//     `[PDF ${reportId}] Starting Supabase Storage upload. Size: ${Math.round(
//       pdf.byteLength / 1024,
//     )} KB`,
//   );

//   const { data, error } = await supabase.storage
//     .from(MEDICAL_REPORTS_BUCKET)
//     .upload(path, pdf, {
//       contentType: "application/pdf",
//       cacheControl: "3600",
//       upsert: true,
//     });

//   if (error) {
//     console.error("Failed to upload report PDF:", error);

//     throw new Error(`Failed to upload report PDF: ${error.message}`);
//   }

//   console.log(
//     `[PDF ${reportId}] Supabase Storage upload completed in ${Math.round(
//       performance.now() - uploadStartedAt,
//     )}ms`,
//   );

//   return {
//     bucket: MEDICAL_REPORTS_BUCKET,
//     path: data.path,
//   };
// }

// function getFileTimestamp() {
//   const now = new Date();

//   const day = now.getDate();
//   const month = now.getMonth() + 1;
//   const year = now.getFullYear();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   return `${day}-${month}-${year}-${hours}-${minutes}`;
// }

// This New Code is gonna keep only one file in that report id in the bucket

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

/**
 * Uploads the generated PDF for one medical report.
 *
 * Storage strategy:
 *
 * reports/{reportId}/medical-report.pdf
 *
 * The path is intentionally stable.
 *
 * When a report is regenerated, the existing PDF is replaced
 * instead of creating another timestamped object.
 */
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

  const supabase = createSupabaseAdminClient();

  const path = `reports/${normalizedReportId}/medical-report.pdf`;

  const sizeKb = Math.round(pdf.byteLength / 1024);

  const sizeMb = (pdf.byteLength / 1024 / 1024).toFixed(2);

  console.log(
    `[PDF ${normalizedReportId}] Starting Supabase Storage upload. Size: ${sizeKb} KB (${sizeMb} MB).`,
  );

  const uploadStartedAt = performance.now();

  const { data, error } = await supabase.storage
    .from(MEDICAL_REPORTS_BUCKET)
    .upload(path, pdf, {
      contentType: "application/pdf",

      /**
       * The report is regenerated at the same path.
       *
       * Without upsert, regeneration would fail because the
       * previous PDF already exists.
       */
      upsert: true,

      /**
       * The actual download uses a short-lived signed URL.
       *
       * A modest cache duration is fine here.
       */
      cacheControl: "3600",
    });

  const uploadDurationMs = Math.round(performance.now() - uploadStartedAt);

  if (error) {
    console.error(
      `[PDF ${normalizedReportId}] Supabase Storage upload failed after ${uploadDurationMs}ms:`,
      error,
    );

    throw new Error(`Failed to upload report PDF: ${error.message}`);
  }

  console.log(
    `[PDF ${normalizedReportId}] Supabase Storage upload completed in ${uploadDurationMs}ms.`,
  );

  return {
    bucket: MEDICAL_REPORTS_BUCKET,
    path: data.path,
  };
}
