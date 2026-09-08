// // Before Doctor Has Active Patient Role Relationship and Require Report Access Helper function

// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { getReportById } from "@/services/database/reports/getReportById";

// interface GetReportRouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export const runtime = "nodejs";

// export async function GET(
//   _request: Request,
//   { params }: GetReportRouteContext,
// ) {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATION
//      * --------------------------------------------------------
//      *
//      * A report can no longer be fetched anonymously simply by
//      * knowing its UUID.
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
//      *
//      * Current production-safe rules:
//      *
//      * PATIENT
//      *   Can access reports belonging to themselves.
//      *
//      * DOCTOR
//      *   Can currently access:
//      *     - reports belonging to themselves
//      *     - reports they created
//      *
//      *   Later, once doctor_patient_relationships exists, doctors
//      *   will also be able to access reports belonging to actively
//      *   linked patients.
//      *
//      * SUPER_ADMIN
//      *   Can access every report.
//      */
//     const isSuperAdmin = profile.role === "super_admin";

//     const isPatientOwner = report.patientId === profile.id;

//     const isReportCreator = report.createdByUserId === profile.id;

//     let canAccessReport = false;

//     if (isSuperAdmin) {
//       canAccessReport = true;
//     } else if (profile.role === "patient") {
//       canAccessReport = isPatientOwner;
//     } else if (profile.role === "doctor") {
//       canAccessReport = isPatientOwner || isReportCreator;
//     }

//     if (!canAccessReport) {
//       console.warn(
//         `[Report Access] User ${profile.id} with role ${profile.role} attempted to access report ${report.id} without authorization.`,
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "REPORT_ACCESS_DENIED",
//           message: "You are not authorized to access this report.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 5. RESPONSE
//      * --------------------------------------------------------
//      *
//      * Do NOT expose:
//      *
//      * patientId
//      * createdByUserId
//      *
//      * to the browser unless the frontend actually needs them.
//      *
//      * They are internal authorization identifiers.
//      */
//     return NextResponse.json(
//       {
//         success: true,

//         report: {
//           id: report.id,

//           patient: {
//             name: report.patientName,
//             dateOfBirth: report.dateOfBirth,
//             evaluationDate: report.evaluationDate,
//           },

//           results: {
//             IFI: report.results.IFI,
//             BiologicalAge: report.results.BiologicalAge,
//           },

//           pdf: {
//             status: report.pdfStatus,
//             path: report.pdfPath,
//             generatedAt: report.pdfGeneratedAt,
//             error: report.pdfError,
//           },

//           createdAt: report.createdAt,

//           updatedAt: report.updatedAt,
//         },
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     /**
//      * --------------------------------------------------------
//      * UNAUTHENTICATED
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
//           message: "Authentication is required to access this report.",
//         },
//         {
//           status: 401,
//         },
//       );
//     }

//     console.error("Get report API error:", error);

//     /**
//      * Don't send internal Supabase/database errors directly
//      * to the browser.
//      */
//     return NextResponse.json(
//       {
//         success: false,
//         code: "REPORT_RETRIEVAL_FAILED",
//         message: "Failed to retrieve report.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextResponse } from "next/server";

import {
  isReportAccessError,
  requireReportAccess,
} from "@/lib/auth/requireReportAccess";

interface GetReportRouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: GetReportRouteContext,
) {
  try {
    const { reportId } = await params;

    const { report } = await requireReportAccess({
      reportId,
      action: "read",
    });

    return NextResponse.json(
      {
        success: true,

        report: {
          id: report.id,

          patient: {
            name: report.patientName,
            dateOfBirth: report.dateOfBirth,
            evaluationDate: report.evaluationDate,
          },

          results: {
            IFI: report.results.IFI,
            BiologicalAge: report.results.BiologicalAge,
          },

          pdf: {
            status: report.pdfStatus,
            path: report.pdfPath,
            generatedAt: report.pdfGeneratedAt,
            error: report.pdfError,
          },

          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     *
     * requireCurrentProfile(), used inside requireReportAccess(),
     * throws this exact error when there is no authenticated user.
     */
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Authentication is required to access this report.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * REPORT AUTHORIZATION ERRORS
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
            message: error.message,
          },
          {
            status: 403,
          },
        );
      }
    }

    /**
     * --------------------------------------------------------
     * UNEXPECTED SERVER ERROR
     * --------------------------------------------------------
     */
    console.error("Get report API error:", error);

    return NextResponse.json(
      {
        success: false,
        code: "REPORT_RETRIEVAL_FAILED",
        message: "Failed to retrieve report.",
      },
      {
        status: 500,
      },
    );
  }
}
