// // Before DOctor Patient has active relationship and requireReport Access hepler function
// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { createSupabaseAdminClient } from "@/lib/supabase/admin";
// import { getReportById } from "@/services/database/reports/getReportById";

// const MEDICAL_REPORTS_BUCKET = "medical-reports";

// const SIGNED_URL_EXPIRES_IN_SECONDS = 60;

// interface DownloadReportRouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export const runtime = "nodejs";

// export async function GET(
//   _request: Request,
//   { params }: DownloadReportRouteContext,
// ) {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATION
//      * --------------------------------------------------------
//      *
//      * A signed PDF URL must never be created for an anonymous
//      * request.
//      */
//     const profile = await requireCurrentProfile();

//     /**
//      * --------------------------------------------------------
//      * 2. REPORT ID
//      * --------------------------------------------------------
//      */
//     const { reportId } = await params;

//     const normalizedReportId = reportId.trim();

//     if (!normalizedReportId) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_REPORT_ID",
//           message: "Report ID is required.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 3. LOAD REPORT
//      * --------------------------------------------------------
//      */
//     const report = await getReportById(normalizedReportId);

//     if (!report) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_NOT_FOUND",
//           message: "Report not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. AUTHORIZATION
//      * --------------------------------------------------------
//      */
//     const isSuperAdmin = profile.role === "super_admin";

//     const isPatientOwner = report.patientId === profile.id;

//     const isReportCreator = report.createdByUserId === profile.id;

//     let canDownloadReport = false;

//     if (isSuperAdmin) {
//       canDownloadReport = true;
//     } else if (profile.role === "patient") {
//       canDownloadReport = isPatientOwner;
//     } else if (profile.role === "doctor") {
//       canDownloadReport = isPatientOwner || isReportCreator;
//     }

//     if (!canDownloadReport) {
//       console.warn(
//         `[Report Download Access] User ${profile.id} with role ${profile.role} attempted to download report ${report.id} without authorization.`,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_ACCESS_DENIED",
//           message: "You are not authorized to download this report.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * FUTURE SUBSCRIPTION RULE
//      * --------------------------------------------------------
//      *
//      * IMPORTANT:
//      *
//      * I would normally NOT require an active subscription merely
//      * to download a PDF that the user already legitimately owns.
//      *
//      * Subscription enforcement is better placed on actions such
//      * as:
//      *
//      * - creating new assessments
//      * - generating new reports
//      * - regenerating reports
//      *
//      * Historical medical/report access may need to remain
//      * available after subscription expiration.
//      *
//      * We can finalize that policy when we implement payments.
//      */

//     /**
//      * --------------------------------------------------------
//      * 5. PDF STATE
//      * --------------------------------------------------------
//      */
//     if (report.pdfStatus !== "ready") {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "PDF_NOT_READY",
//           message: "Your medical report is not ready yet.",
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
//           code: "PDF_PATH_MISSING",
//           message: "The report record does not contain a PDF file path.",
//         },
//         {
//           status: 409,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 6. STORAGE PATH VALIDATION
//      * --------------------------------------------------------
//      *
//      * Expected path:
//      *
//      * reports/{reportId}/medical-report.pdf
//      */
//     const lastSlashIndex = report.pdfPath.lastIndexOf("/");

//     if (lastSlashIndex === -1) {
//       console.error(
//         `[Report Download] Invalid stored PDF path for report ${report.id}.`,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_PDF_PATH",
//           message: "The stored PDF path is invalid.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     const folderPath = report.pdfPath.slice(0, lastSlashIndex);

//     const fileName = report.pdfPath.slice(lastSlashIndex + 1);

//     /**
//      * Extra defensive validation.
//      *
//      * A report should only reference files inside its own
//      * Storage directory.
//      */
//     const expectedFolderPath = `reports/${report.id}`;

//     if (folderPath !== expectedFolderPath) {
//       console.error(
//         `[Report Download] PDF path ownership mismatch for report ${report.id}. Stored path: ${report.pdfPath}`,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_PDF_PATH",
//           message: "The stored PDF path is invalid.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     const supabase = createSupabaseAdminClient();

//     /**
//      * --------------------------------------------------------
//      * 7. VERIFY FILE EXISTS
//      * --------------------------------------------------------
//      */
//     const { data: files, error: listError } = await supabase.storage
//       .from(MEDICAL_REPORTS_BUCKET)
//       .list(folderPath, {
//         limit: 100,
//         search: fileName,
//       });

//     if (listError) {
//       console.error(
//         `[Report Download] Failed to check PDF existence for report ${normalizedReportId}:`,
//         listError,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "STORAGE_CHECK_FAILED",
//           message: "Unable to verify the stored medical report.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     const pdfExists = files?.some((file) => file.name === fileName) ?? false;

//     /**
//      * --------------------------------------------------------
//      * 8. DATABASE READY, STORAGE MISSING
//      * --------------------------------------------------------
//      *
//      * This is recoverable.
//      *
//      * The frontend can call the already-secured generation
//      * endpoint with force=true.
//      */
//     if (!pdfExists) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "PDF_MISSING",
//           message:
//             "The stored PDF could not be found. The report can be regenerated.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 9. CREATE SHORT-LIVED PRIVATE SIGNED URL
//      * --------------------------------------------------------
//      */
//     const downloadFileName = buildDownloadFileName(
//       report.patientName,
//       report.evaluationDate,
//     );

//     const { data, error } = await supabase.storage
//       .from(MEDICAL_REPORTS_BUCKET)
//       .createSignedUrl(report.pdfPath, SIGNED_URL_EXPIRES_IN_SECONDS, {
//         download: downloadFileName,
//       });

//     if (error) {
//       console.error(
//         `[Report Download] Failed to create signed URL for report ${normalizedReportId}:`,
//         error,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "SIGNED_URL_FAILED",
//           message: "Unable to prepare your medical report download.",
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
//           code: "SIGNED_URL_MISSING",
//           message: "A secure download link could not be created.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 10. RETURN TEMPORARY DOWNLOAD URL
//      * --------------------------------------------------------
//      */
//     return NextResponse.json(
//       {
//         success: true,

//         download: {
//           url: data.signedUrl,
//           fileName: downloadFileName,
//           expiresIn: SIGNED_URL_EXPIRES_IN_SECONDS,
//         },
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     /**
//      * --------------------------------------------------------
//      * AUTHENTICATION
//      * --------------------------------------------------------
//      */
//     if (
//       error instanceof Error &&
//       error.message === "Authentication required."
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "UNAUTHENTICATED",
//           message: "Authentication is required to download this report.",
//         },
//         {
//           status: 401,
//         },
//       );
//     }

//     console.error("Download medical report API error:", error);

//     /**
//      * Do not leak raw database/auth/storage details into the
//      * browser response.
//      */
//     return NextResponse.json(
//       {
//         success: false,
//         code: "DOWNLOAD_FAILED",
//         message: "Failed to prepare the medical report download.",
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

//   return `MyTIME-Medical-Report-${safePatientName || "Patient"}-${
//     safeDate || "Evaluation"
//   }.pdf`;
// }
import { NextResponse } from "next/server";

import {
  isReportAccessError,
  requireReportAccess,
} from "@/lib/auth/requireReportAccess";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MEDICAL_REPORTS_BUCKET = "medical-reports";
const SIGNED_URL_EXPIRES_IN_SECONDS = 60;

interface DownloadReportRouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: DownloadReportRouteContext,
) {
  try {
    const { reportId } = await params;

    /**
     * Centralized authentication + authorization.
     *
     * patient
     *   → own report
     *
     * doctor
     *   → created report
     *   OR active doctor-patient relationship
     *
     * super_admin
     *   → any report
     */
    const { report } = await requireReportAccess({
      reportId,
      action: "download",
    });

    /**
     * --------------------------------------------------------
     * PDF STATE
     * --------------------------------------------------------
     */
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

    /**
     * --------------------------------------------------------
     * STORAGE PATH VALIDATION
     * --------------------------------------------------------
     *
     * Expected:
     *
     * reports/{reportId}/medical-report.pdf
     */
    const lastSlashIndex = report.pdfPath.lastIndexOf("/");

    if (lastSlashIndex === -1) {
      console.error(
        `[Report Download] Invalid PDF path for report ${report.id}.`,
      );

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

    const expectedFolderPath = `reports/${report.id}`;

    if (folderPath !== expectedFolderPath) {
      console.error(
        `[Report Download] PDF path ownership mismatch. Report=${report.id}, path=${report.pdfPath}`,
      );

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

    const supabase = createSupabaseAdminClient();

    /**
     * --------------------------------------------------------
     * VERIFY STORAGE OBJECT EXISTS
     * --------------------------------------------------------
     */
    const { data: files, error: listError } = await supabase.storage
      .from(MEDICAL_REPORTS_BUCKET)
      .list(folderPath, {
        limit: 100,
        search: fileName,
      });

    if (listError) {
      console.error(
        `[Report Download] Failed to verify PDF for report ${report.id}:`,
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

    /**
     * DB says ready, but Storage object is missing.
     *
     * Dashboard can call:
     *
     * POST /api/reports/{id}/generate?force=true
     *
     * That endpoint is now also protected by
     * requireReportAccess().
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

    /**
     * --------------------------------------------------------
     * CREATE SHORT-LIVED SIGNED URL
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
        `[Report Download] Failed to create signed URL for report ${report.id}:`,
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
    /**
     * --------------------------------------------------------
     * UNAUTHENTICATED
     * --------------------------------------------------------
     */
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Authentication is required to download this report.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * CENTRAL REPORT ACCESS ERRORS
     * --------------------------------------------------------
     */
    if (isReportAccessError(error)) {
      if (error.code === "INVALID_REPORT_ID") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: error.message,
          },
          {
            status: 400,
          },
        );
      }

      if (error.code === "REPORT_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: error.message,
          },
          {
            status: 404,
          },
        );
      }

      if (error.code === "REPORT_ACCESS_DENIED") {
        return NextResponse.json(
          {
            success: false,
            code: error.code,
            message: "You are not authorized to download this report.",
          },
          {
            status: 403,
          },
        );
      }
    }

    console.error("Download medical report API error:", error);

    return NextResponse.json(
      {
        success: false,
        code: "DOWNLOAD_FAILED",
        message: "Failed to prepare the medical report download.",
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

  return `MyTIME-Medical-Report-${safePatientName || "Patient"}-${
    safeDate || "Evaluation"
  }.pdf`;
}
