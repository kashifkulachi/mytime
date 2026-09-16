// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

// import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";

// interface RouteContext {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// /**
//  * ============================================================
//  * GET /api/medical-records/[reportId]
//  * ============================================================
//  *
//  * Patient self-view endpoint for one medical record.
//  *
//  * Security:
//  *
//  * - user must be authenticated
//  * - user must have patient role
//  * - patientId always comes from authenticated profile
//  * - report must belong to that patient
//  */
// export async function GET(_request: Request, context: RouteContext) {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATE
//      * --------------------------------------------------------
//      */
//     const profile = await requireCurrentProfile();

//     /**
//      * --------------------------------------------------------
//      * 2. PATIENT-ONLY ENDPOINT
//      * --------------------------------------------------------
//      */
//     if (profile.role !== "patient") {
//       return NextResponse.json(
//         {
//           error: "This medical record endpoint is available only to patients.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 3. READ REPORT ID
//      * --------------------------------------------------------
//      */
//     const { reportId } = await context.params;

//     if (!reportId || !reportId.trim()) {
//       return NextResponse.json(
//         {
//           error: "Report ID is required.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. LOAD RECORD
//      * --------------------------------------------------------
//      *
//      * IMPORTANT:
//      *
//      * patientId is NOT read from:
//      *
//      * - query params
//      * - request body
//      * - localStorage
//      * - frontend state
//      *
//      * It always comes from the authenticated profile.
//      */
//     const record = await getPatientMedicalRecordById({
//       patientId: profile.id,

//       reportId,
//     });

//     /**
//      * --------------------------------------------------------
//      * 5. NOT FOUND / NOT OWNED
//      * --------------------------------------------------------
//      *
//      * We intentionally use the same response when:
//      *
//      * - report does not exist
//      * - report belongs to another patient
//      *
//      * This avoids revealing information about other users'
//      * report IDs.
//      */
//     if (!record) {
//       return NextResponse.json(
//         {
//           error: "Medical record not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 6. RETURN SAFE DTO
//      * --------------------------------------------------------
//      */
//     return NextResponse.json(
//       {
//         success: true,

//         record,
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     console.error("[GET /api/medical-records/[reportId]]", error);

//     if (
//       error instanceof Error &&
//       error.message === "Authentication required."
//     ) {
//       return NextResponse.json(
//         {
//           error: "Authentication required.",
//         },
//         {
//           status: 401,
//         },
//       );
//     }

//     return NextResponse.json(
//       {
//         error: "Unable to load medical record.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

import { getPatientMedicalRecordById } from "@/services/database/medical-records/getPatientMedicalRecordById";
import { deletePatientMedicalRecord } from "@/services/database/medical-records/deletePatientMedicalRecord";

interface RouteContext {
  params: Promise<{
    reportId: string;
  }>;
}

/**
 * ============================================================
 * GET /api/medical-records/[reportId]
 * ============================================================
 *
 * Patient self-view endpoint for one medical record.
 *
 * Security:
 *
 * - user must be authenticated
 * - user must have patient role
 * - patientId always comes from authenticated profile
 * - report must belong to that patient
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE
     * --------------------------------------------------------
     */

    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. PATIENT-ONLY ENDPOINT
     * --------------------------------------------------------
     */

    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          error: "This medical record endpoint is available only to patients.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. READ REPORT ID
     * --------------------------------------------------------
     */

    const { reportId } = await context.params;

    if (!reportId || !reportId.trim()) {
      return NextResponse.json(
        {
          error: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. LOAD RECORD
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * patientId is NOT read from:
     *
     * - query params
     * - request body
     * - localStorage
     * - frontend state
     *
     * It always comes from the authenticated profile.
     */

    const record = await getPatientMedicalRecordById({
      patientId: profile.id,
      reportId,
    });

    /**
     * --------------------------------------------------------
     * 5. NOT FOUND / NOT OWNED
     * --------------------------------------------------------
     *
     * We intentionally use the same response when:
     *
     * - report does not exist
     * - report belongs to another patient
     *
     * This avoids revealing information about other users'
     * report IDs.
     */

    if (!record) {
      return NextResponse.json(
        {
          error: "Medical record not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 6. RETURN SAFE DTO
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        record,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[GET /api/medical-records/[reportId]]", error);

    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json(
      {
        error: "Unable to load medical record.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * ============================================================
 * DELETE /api/medical-records/[reportId]
 * ============================================================
 *
 * Permanently deletes one medical record belonging to the
 * currently authenticated patient.
 *
 * This removes:
 *
 * - the complete reports row
 * - calculation results stored with the report
 * - the generated PDF from private Storage
 * - outstanding PDF-generation queue messages
 *
 * Security:
 *
 * - authentication is required
 * - only patient accounts can use this endpoint
 * - patientId comes exclusively from the authenticated profile
 * - the browser supplies only reportId
 * - the deletion service verifies ownership again
 */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE
     * --------------------------------------------------------
     */

    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. PATIENT-ONLY ENDPOINT
     * --------------------------------------------------------
     *
     * Doctors cannot delete patient medical records through
     * this endpoint.
     */

    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          error: "Only patients can delete their medical records.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. READ REPORT ID
     * --------------------------------------------------------
     */

    const { reportId } = await context.params;

    const normalizedReportId = reportId?.trim();

    if (!normalizedReportId) {
      return NextResponse.json(
        {
          error: "Report ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. DELETE MEDICAL RECORD
     * --------------------------------------------------------
     *
     * CRITICAL SECURITY RULE:
     *
     * We do NOT read patientId from the request.
     *
     * profile.id comes from the authenticated server session.
     *
     * deletePatientMedicalRecord() additionally constrains its
     * destructive DELETE query by both:
     *
     *   reports.id
     *   reports.patient_id
     */

    const result = await deletePatientMedicalRecord({
      patientId: profile.id,
      reportId: normalizedReportId,
    });

    /**
     * --------------------------------------------------------
     * 5. SUCCESS
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        message: "Medical record deleted successfully.",
        reportId: result.reportId,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("[DELETE /api/medical-records/[reportId]]", error);

    /**
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * NOT FOUND / NOT OWNED
     * --------------------------------------------------------
     *
     * The service deliberately uses the same error when the
     * report does not exist or belongs to another patient.
     */

    if (
      error instanceof Error &&
      error.message === "MEDICAL_RECORD_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Medical record not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * QUEUE CLEANUP FAILURE
     * --------------------------------------------------------
     *
     * Do not continue deletion when queue cancellation failed.
     * Otherwise a queued worker could still process the report.
     */

    if (
      error instanceof Error &&
      error.message === "REPORT_PDF_QUEUE_CANCELLATION_FAILED"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to safely cancel PDF generation for this medical record.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * STORAGE CLEANUP FAILURE
     * --------------------------------------------------------
     *
     * The reports row remains intact when Storage cleanup fails,
     * so we don't intentionally create an orphaned PDF.
     */

    if (
      error instanceof Error &&
      error.message === "REPORT_PDF_STORAGE_DELETE_FAILED"
    ) {
      return NextResponse.json(
        {
          error:
            "Unable to delete the medical record PDF. The medical record was not deleted.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * DATABASE DELETE FAILURE
     * --------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message === "MEDICAL_RECORD_DELETE_FAILED"
    ) {
      return NextResponse.json(
        {
          error: "Unable to delete the medical record.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * DATABASE LOOKUP FAILURE
     * --------------------------------------------------------
     */

    if (
      error instanceof Error &&
      error.message === "MEDICAL_RECORD_LOOKUP_FAILED"
    ) {
      return NextResponse.json(
        {
          error: "Unable to verify the medical record.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * UNKNOWN ERROR
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        error: "Unable to delete medical record.",
      },
      {
        status: 500,
      },
    );
  }
}
