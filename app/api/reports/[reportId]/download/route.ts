// import { NextResponse } from "next/server";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";
// import { getReportById } from "@/services/database/reports/getReportById";

// const MEDICAL_REPORTS_BUCKET = "medical-reports";
// const SIGNED_URL_EXPIRES_IN_SECONDS = 60;

// interface DownloadReportRouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export async function GET(
//   request: Request,
//   { params }: DownloadReportRouteContext,
// ) {
//   try {
//     const { reportId } = await params;

//     const normalizedReportId = reportId.trim();

//     if (!normalizedReportId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report ID is required.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     const report = await getReportById(normalizedReportId);

//     if (!report) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     if (report.pdfStatus !== "ready") {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Report PDF is not ready yet.",
//           pdfStatus: report.pdfStatus,
//         },
//         {
//           status: 409,
//         },
//       );
//     }

//     if (!report.pdfPath) {
//       return NextResponse.json(
//         {
//           success: false,
//           message:
//             "Report is marked as ready, but no PDF file path is available.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     const supabase = createSupabaseAdminClient();

//     const { data, error } = await supabase.storage
//       .from(MEDICAL_REPORTS_BUCKET)
//       .createSignedUrl(report.pdfPath, SIGNED_URL_EXPIRES_IN_SECONDS, {
//         download: buildDownloadFileName(
//           report.patientName,
//           report.evaluationDate,
//         ),
//       });

//     if (error) {
//       console.error(
//         `Failed to create signed download URL for report ${normalizedReportId}:`,
//         error,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unable to prepare the report download.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     if (!data?.signedUrl) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Supabase did not return a download URL.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     return NextResponse.redirect(new URL(data.signedUrl, request.url));
//   } catch (error) {
//     console.error("Download medical report API error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to download the medical report.",
//         error:
//           error instanceof Error ? error.message : "Unknown download error.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

// function buildDownloadFileName(
//   patientName: string,
//   evaluationDate: string,
// ): string {
//   const safePatientName = patientName
//     .trim()
//     .replace(/[^a-zA-Z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");

//   const safeDate = evaluationDate.trim().replace(/[^0-9-]/g, "");

//   const patientPart = safePatientName || "patient";

//   const datePart = safeDate || "evaluation";

//   return `MyTIME-Medical-Report-${patientPart}-${datePart}.pdf`;
// }

import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getReportById } from "@/services/database/reports/getReportById";

const MEDICAL_REPORTS_BUCKET = "medical-reports";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60;

interface DownloadReportRouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: DownloadReportRouteContext,
) {
  try {
    const { reportId } = await params;

    const normalizedReportId = reportId.trim();

    if (!normalizedReportId) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REPORT_ID",
          message: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const report = await getReportById(normalizedReportId);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          code: "REPORT_NOT_FOUND",
          message: "Report not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (report.pdfStatus !== "ready") {
      return NextResponse.json(
        {
          success: false,
          code: "PDF_NOT_READY",
          message: "Your medical report is not ready yet.",
          pdfStatus: report.pdfStatus,
        },
        {
          status: 409,
        },
      );
    }

    if (!report.pdfPath) {
      return NextResponse.json(
        {
          success: false,
          code: "PDF_PATH_MISSING",
          message: "The report record does not contain a PDF file path.",
        },
        {
          status: 409,
        },
      );
    }

    const supabase = createSupabaseAdminClient();

    /*
     * --------------------------------------------------------
     * Verify the PDF really exists in Supabase Storage.
     * --------------------------------------------------------
     *
     * Example pdfPath:
     *
     * reports/{reportId}/medical-report.pdf
     */

    const lastSlashIndex = report.pdfPath.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PDF_PATH",
          message: "The stored PDF path is invalid.",
        },
        {
          status: 500,
        },
      );
    }

    const folderPath = report.pdfPath.slice(0, lastSlashIndex);

    const fileName = report.pdfPath.slice(lastSlashIndex + 1);

    const { data: files, error: listError } = await supabase.storage
      .from(MEDICAL_REPORTS_BUCKET)
      .list(folderPath, {
        limit: 100,
        search: fileName,
      });

    if (listError) {
      console.error(
        `Failed to check PDF existence for report ${normalizedReportId}:`,
        listError,
      );

      return NextResponse.json(
        {
          success: false,
          code: "STORAGE_CHECK_FAILED",
          message: "Unable to verify the stored medical report.",
        },
        {
          status: 500,
        },
      );
    }

    const pdfExists = files?.some((file) => file.name === fileName) ?? false;

    /*
     * --------------------------------------------------------
     * Database says "ready", but Storage file is gone.
     *
     * This is recoverable because all calculation data still
     * exists in the reports table.
     *
     * The dashboard will recognize PDF_MISSING and call our
     * existing POST /api/reports/{id}/generate endpoint.
     * --------------------------------------------------------
     */

    if (!pdfExists) {
      return NextResponse.json(
        {
          success: false,
          code: "PDF_MISSING",
          message:
            "The stored PDF could not be found. The report can be regenerated.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * --------------------------------------------------------
     * File exists — create a temporary private download URL.
     * --------------------------------------------------------
     */

    const downloadFileName = buildDownloadFileName(
      report.patientName,
      report.evaluationDate,
    );

    const { data, error } = await supabase.storage
      .from(MEDICAL_REPORTS_BUCKET)
      .createSignedUrl(report.pdfPath, SIGNED_URL_EXPIRES_IN_SECONDS, {
        download: downloadFileName,
      });

    if (error) {
      console.error(
        `Failed to create signed download URL for report ${normalizedReportId}:`,
        error,
      );

      return NextResponse.json(
        {
          success: false,
          code: "SIGNED_URL_FAILED",
          message: "Unable to prepare your medical report download.",
        },
        {
          status: 500,
        },
      );
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        {
          success: false,
          code: "SIGNED_URL_MISSING",
          message: "A secure download link could not be created.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * Return JSON rather than redirecting.
     *
     * This allows the dashboard Client Component to:
     *
     * - toast errors
     * - detect PDF_MISSING
     * - regenerate automatically
     * - navigate to the signed URL only on success
     */

    return NextResponse.json(
      {
        success: true,
        download: {
          url: data.signedUrl,
          fileName: downloadFileName,
          expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Download medical report API error:", error);

    return NextResponse.json(
      {
        success: false,
        code: "DOWNLOAD_FAILED",
        message: "Failed to prepare the medical report download.",
        error:
          error instanceof Error ? error.message : "Unknown download error.",
      },
      {
        status: 500,
      },
    );
  }
}

function buildDownloadFileName(
  patientName: string,
  evaluationDate: string,
): string {
  const safePatientName = patientName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeDate = evaluationDate.trim().replace(/[^0-9-]/g, "");

  return `MyTIME-Medical-Report-${
    safePatientName || "Patient"
  }-${safeDate || "Evaluation"}.pdf`;
}
