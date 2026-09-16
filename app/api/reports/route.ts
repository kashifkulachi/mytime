// // This code has patientid = role.id which is wrong

// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { createReportSchema } from "@/lib/schemas/report.schema";
// import { createReport } from "@/services/database/reports/createReport";

// export async function POST(request: Request) {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATION
//      * --------------------------------------------------------
//      *
//      * Report creation is no longer available anonymously.
//      *
//      * Ownership is derived exclusively from the authenticated
//      * server-side Supabase session.
//      *
//      * Never accept patientId / createdByUserId from the client.
//      */
//     const profile = await requireCurrentProfile();

//     /**
//      * --------------------------------------------------------
//      * 2. ROLE VALIDATION
//      * --------------------------------------------------------
//      *
//      * All application roles currently have a valid profile.
//      *
//      * Later:
//      *
//      * - patient:
//      *     can create their own report with active subscription
//      *
//      * - doctor:
//      *     can create a report for an authorized linked patient
//      *
//      * - super_admin:
//      *     can create reports without subscription
//      *
//      * For the current self-assessment flow, the authenticated
//      * user is the report subject and creator.
//      */
//     if (
//       profile.role !== "patient" &&
//       profile.role !== "doctor" &&
//       profile.role !== "super_admin"
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "FORBIDDEN",
//           message: "You are not authorized to create reports.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * FUTURE SUBSCRIPTION GATE
//      * --------------------------------------------------------
//      *
//      * This is where we will eventually enforce:
//      *
//      * patient / doctor
//      *     → active subscription required
//      *
//      * super_admin
//      *     → subscription bypass
//      *
//      * Do NOT trust subscription information from the client.
//      *
//      * Example future architecture:
//      *
//      * await requireReportGenerationAccess(profile);
//      */

//     /**
//      * --------------------------------------------------------
//      * 3. REQUEST BODY
//      * --------------------------------------------------------
//      */
//     let body: unknown;

//     try {
//       body = await request.json();
//     } catch {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_JSON",
//           message: "Invalid JSON request body.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. VALIDATE REPORT DATA
//      * --------------------------------------------------------
//      */
//     const parsedBody = createReportSchema.safeParse(body);

//     if (!parsedBody.success) {
//       console.error(
//         "Zod validation errors:",
//         JSON.stringify(parsedBody.error.issues, null, 2),
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_REPORT_PAYLOAD",
//           message: "Invalid report payload.",
//           errors: parsedBody.error.issues,
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     const { patient, results } = parsedBody.data;

//     /**
//      * --------------------------------------------------------
//      * 5. CREATE OWNED REPORT
//      * --------------------------------------------------------
//      *
//      * IMPORTANT:
//      *
//      * patientId and createdByUserId come from the authenticated
//      * profile — NOT from request JSON.
//      *
//      * Current self-assessment:
//      *
//      * patient_id         = current user's ID
//      * created_by_user_id = current user's ID
//      *
//      * Later doctor workflow will be different:
//      *
//      * patient_id         = verified linked patient's ID
//      * created_by_user_id = doctor's ID
//      *
//      * That patient relationship will be resolved securely
//      * server-side.
//      */
//     const report = await createReport({
//       patientId: profile.id,
//       createdByUserId: profile.id,

//       patientName: patient.name,
//       dateOfBirth: patient.dateOfBirth,
//       evaluationDate: patient.evaluationDate,
//       gender: patient.gender,

//       results: {
//         IFI: results.IFI,
//         BiologicalAge: results.BiologicalAge,
//         PeptideDose: results.PeptideDose,
//         HBOTSessions: results.HBOTSessions,
//       },
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Report created successfully.",
//         report,
//       },
//       {
//         status: 201,
//       },
//     );
//   } catch (error) {
//     /**
//      * --------------------------------------------------------
//      * AUTHENTICATION ERROR
//      * --------------------------------------------------------
//      *
//      * requireCurrentProfile() currently throws this exact
//      * message when there is no logged-in user.
//      *
//      * Convert that internal exception into a proper HTTP 401.
//      */
//     if (
//       error instanceof Error &&
//       error.message === "Authentication required."
//     ) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "UNAUTHENTICATED",
//           message: "Authentication is required to create a report.",
//         },
//         {
//           status: 401,
//         },
//       );
//     }

//     /**
//      * Do not expose detailed database/auth infrastructure
//      * errors to the browser.
//      */
//     console.error("Create report API error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         code: "REPORT_CREATION_FAILED",
//         message: "Failed to create report.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createReportSchema } from "@/lib/schemas/report.schema";
import { createReport } from "@/services/database/reports/createReport";
import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATION
     * --------------------------------------------------------
     *
     * Reports cannot be created anonymously.
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. CURRENT REPORT-CREATION WORKFLOW
     * --------------------------------------------------------
     *
     * This endpoint currently represents:
     *
     * PATIENT SELF-ASSESSMENT
     *
     * Therefore only a patient may use it.
     *
     * We intentionally reject doctors and super_admin here until
     * we build the explicit "assessment for patient" workflow.
     *
     * This protects the meaning of reports.patient_id.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_SELF_ASSESSMENT_REQUIRED",
          message:
            "This assessment flow is available only for patient self-assessments.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * FUTURE SUBSCRIPTION GATE
     * --------------------------------------------------------
     *
     * This will eventually become something like:
     *
     * await requireAssessmentSubscription(profile);
     *
     * Current intended policy:
     *
     * patient
     *   → active patient subscription required
     *
     * doctor
     *   → handled by doctor-specific assessment workflow
     *
     * super_admin
     *   → bypass subscription
     *
     * Subscription information must ALWAYS come from the trusted
     * server/database/payment provider, never from request JSON.
     */

    /**
     * --------------------------------------------------------
     * 3. PARSE JSON
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
     * 4. VALIDATE ASSESSMENT RESULTS
     * --------------------------------------------------------
     */
    const parsedBody = createReportSchema.safeParse(body);

    if (!parsedBody.success) {
      console.error(
        "[Create Report] Zod validation failed:",
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
     * 5. RESOLVE IFI FUNCTIONAL PROFILE VERSION
     * --------------------------------------------------------
     *
     * The browser does NOT tell us which clinical profile
     * version should be attached to the report.
     *
     * We resolve the currently active profile server-side using
     * the validated assessment result:
     *
     * gender + IFI Range
     *      ↓
     * active IFI functional profile
     *      ↓
     * profile.version
     *
     * createReport() then snapshots that version into the
     * reports row.
     */

    const ifiRange = results.IFI.ifiRange;

    if (!Number.isInteger(ifiRange) || ifiRange < 0 || ifiRange > 25) {
      console.error(
        "[Create Report] Invalid IFI Range while resolving functional profile:",
        {
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
        "[Create Report] Failed to resolve active IFI functional profile:",
        {
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
     * 6. CREATE TRUSTWORTHY OWNERSHIP + REPORT SNAPSHOT
     * --------------------------------------------------------
     *
     * authenticated patient
     *        ↓
     * patient_id = profile.id
     * created_by_user_id = profile.id
     *
     * Clinical profile version:
     *
     * active functional profile
     *        ↓
     * ifi_functional_profile_version
     *
     * None of these trusted values come from the browser.
     */

    const report = await createReport({
      patientId: profile.id,

      createdByUserId: profile.id,

      patientName: patient.name,

      dateOfBirth: patient.dateOfBirth,

      evaluationDate: patient.evaluationDate,

      gender: patient.gender,

      ifiFunctionalProfileVersion: ifiFunctionalProfile.version,

      results: {
        IFI: results.IFI,

        BiologicalAge: results.BiologicalAge,

        PeptideDose: results.PeptideDose,

        HBOTSessions: results.HBOTSessions,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message: "Report created successfully.",

        report,
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
          message: "Authentication is required to create a report.",
        },
        {
          status: 401,
        },
      );
    }

    console.error("[Create Report API] Failed:", error);

    /**
     * Don't leak Supabase/database internals to the frontend.
     */
    return NextResponse.json(
      {
        success: false,
        code: "REPORT_CREATION_FAILED",
        message: "Failed to create report.",
      },
      {
        status: 500,
      },
    );
  }
}
