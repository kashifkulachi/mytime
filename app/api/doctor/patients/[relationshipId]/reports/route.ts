import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createReportSchema } from "@/lib/schemas/report.schema";
import { createReport } from "@/services/database/reports/createReport";
import { getDoctorPatientByRelationshipId } from "@/services/database/relationships/getDoctorPatientByRelationshipId";
import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<Response> {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE CURRENT USER
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. REQUIRE DOCTOR ROLE
     * --------------------------------------------------------
     *
     * Patient self-assessment continues to use:
     *
     * POST /api/reports
     *
     * This endpoint exists specifically for:
     *
     * doctor -> linked patient -> assessment -> report
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message:
            "Only doctors can create reports through this patient assessment workflow.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. VALIDATE RELATIONSHIP ID
     * --------------------------------------------------------
     */
    const { relationshipId } = await params;

    const normalizedRelationshipId = relationshipId.trim();

    if (!normalizedRelationshipId) {
      return NextResponse.json(
        {
          success: false,
          code: "RELATIONSHIP_ID_REQUIRED",
          message: "A patient relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. RE-VERIFY PATIENT ACCESS
     * --------------------------------------------------------
     *
     * Never trust the relationship stored in localStorage.
     *
     * At the exact moment the doctor submits the assessment,
     * verify again:
     *
     * relationship.id        = URL relationshipId
     * relationship.doctor_id = authenticated doctor
     * relationship.status    = active
     *
     * The service internally returns patientId, but that ID
     * never came from the browser.
     */
    const relationship = await getDoctorPatientByRelationshipId({
      relationshipId: normalizedRelationshipId,

      doctorId: profile.id,
    });

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_RELATIONSHIP_NOT_AVAILABLE",
          message:
            "This patient relationship is unavailable or no longer active.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * FUTURE SUBSCRIPTION CHECK
     * --------------------------------------------------------
     *
     * This is where the doctor's subscription will later be
     * enforced.
     *
     * Example:
     *
     * await requireDoctorAssessmentSubscription(profile);
     *
     * super_admin will eventually have its own trusted workflow
     * and subscription bypass.
     */

    /**
     * --------------------------------------------------------
     * 5. PARSE JSON BODY
     * --------------------------------------------------------
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_JSON",
          message: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 6. VALIDATE ASSESSMENT + CALCULATION DATA
     * --------------------------------------------------------
     *
     * Reuse the exact same report payload schema as the existing
     * patient self-assessment route.
     *
     * Ownership IDs are deliberately NOT part of this schema.
     */
    const parsedBody = createReportSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error(
        "[Doctor Create Report] Zod validation failed:",
        JSON.stringify(parsedBody.error.issues, null, 2),
      );

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REPORT_PAYLOAD",
          message: "Invalid report payload.",
          errors: parsedBody.error.issues,
        },
        {
          status: 400,
        },
      );
    }

    const { patient, results } = parsedBody.data;

    /**
     * --------------------------------------------------------
     * 7. RESOLVE IFI FUNCTIONAL PROFILE VERSION
     * --------------------------------------------------------
     *
     * The functional-profile version is trusted clinical
     * metadata and must never come from the browser.
     *
     * We resolve it from:
     *
     * validated patient gender
     *        +
     * calculated IFI Range
     *        ↓
     * active IFI functional profile
     *        ↓
     * profile.version
     *
     * That version is then permanently stored with the report.
     */

    const ifiRange = results.IFI.ifiRange;

    if (!Number.isInteger(ifiRange) || ifiRange < 0 || ifiRange > 25) {
      console.error(
        "[Doctor Create Report] Invalid IFI Range while resolving functional profile:",
        {
          relationshipId: normalizedRelationshipId,

          ifiRange,
        },
      );

      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IFI_RANGE",
          message: "The calculated IFI Range is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    let ifiFunctionalProfile;

    try {
      ifiFunctionalProfile = await getIFIFunctionalProfile({
        sex: patient.gender,
        ifiRange,
      });
    } catch (error) {
      console.error(
        "[Doctor Create Report] Failed to resolve active IFI functional profile:",
        {
          relationshipId: normalizedRelationshipId,

          gender: patient.gender,

          ifiRange,

          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      return NextResponse.json(
        {
          success: false,
          code: "IFI_FUNCTIONAL_PROFILE_NOT_FOUND",

          message:
            "Unable to resolve the IFI functional profile for this assessment.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 8. CREATE REPORT WITH TRUSTED OWNERSHIP
     * --------------------------------------------------------
     *
     * patient_id
     *   = patient resolved from the verified active relationship
     *
     * created_by_user_id
     *   = authenticated doctor
     *
     * ifi_functional_profile_version
     *   = version resolved server-side from the active clinical
     *     functional profile
     *
     * None of these trusted values are supplied by the browser.
     */

    const report = await createReport({
      patientId: relationship.patientId,

      createdByUserId: profile.id,

      /**
       * Continue using the validated assessment patient name
       * for the current workflow.
       */
      patientName: patient.name,

      dateOfBirth: patient.dateOfBirth,

      evaluationDate: patient.evaluationDate,
      // evaluationDate: "2026-10-02",

      gender: patient.gender,

      ifiFunctionalProfileVersion: ifiFunctionalProfile.version,

      results: {
        IFI: results.IFI,

        BiologicalAge: results.BiologicalAge,

        PeptideDose: results.PeptideDose,

        HBOTSessions: results.HBOTSessions,
      },
    });

    /**
     * --------------------------------------------------------
     * 8. SAFE RESPONSE
     * --------------------------------------------------------
     *
     * createReport() may contain patientId internally in its
     * TypeScript result depending on your current implementation.
     *
     * We return only what the browser actually needs.
     */
    return NextResponse.json(
      {
        success: true,

        message: "Patient report created successfully.",

        report: {
          id: report.id,

          patientName: report.patientName,

          dateOfBirth: report.dateOfBirth,

          evaluationDate: report.evaluationDate,

          gender: report.gender,

          results: report.results,

          pdfStatus: report.pdfStatus,

          pdfPath: report.pdfPath,

          pdfGeneratedAt: report.pdfGeneratedAt,

          pdfError: report.pdfError,

          createdAt: report.createdAt,

          updatedAt: report.updatedAt,
        },
      },
      {
        status: 201,
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
          message: "Authentication is required to create a patient report.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * INVALID RELATIONSHIP
     * --------------------------------------------------------
     */
    if (
      error instanceof Error &&
      error.message === "Relationship ID is required."
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "RELATIONSHIP_ID_REQUIRED",
          message: "A patient relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    console.error("[Doctor Create Report API] Failed:", error);

    /**
     * Do not expose raw Supabase/database errors to browser.
     */
    return NextResponse.json(
      {
        success: false,
        code: "DOCTOR_REPORT_CREATION_FAILED",
        message: "Unable to create the patient report.",
      },
      {
        status: 500,
      },
    );
  }
}
