// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// import { getActiveIFIMonitoringCycle } from "@/services/database/ifi-monitoring/getActiveIFIMonitoringCycle";
// import { getIFIMonitoringCycleData } from "@/services/database/ifi-monitoring/getIFIMonitoringCycleData";

// interface RouteContext {
//   params: Promise<{
//     relationshipId: string;
//   }>;
// }

// /**
//  * ============================================================
//  * GET
//  * /api/doctor/patients/[relationshipId]/ifi-monitoring
//  * ============================================================
//  *
//  * Returns IFI monitoring data for a doctor's connected patient.
//  *
//  * Security flow:
//  *
//  * authenticated user
//  *      ↓
//  * must be doctor
//  *      ↓
//  * relationship must belong to logged-in doctor
//  *      ↓
//  * relationship must be active
//  *      ↓
//  * patient_id resolved server-side
//  *      ↓
//  * active IFI monitoring cycle resolved for patient
//  *      ↓
//  * 31-day monitoring calculation returned
//  *
//  * IMPORTANT:
//  *
//  * The browser never supplies patientId.
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
//      * 2. DOCTOR-ONLY ENDPOINT
//      * --------------------------------------------------------
//      */
//     if (profile.role !== "doctor") {
//       return NextResponse.json(
//         {
//           error: "This endpoint is available only to doctors.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 3. READ ROUTE PARAM
//      * --------------------------------------------------------
//      */
//     const { relationshipId } = await context.params;

//     const normalizedRelationshipId = relationshipId?.trim();

//     if (!normalizedRelationshipId) {
//       return NextResponse.json(
//         {
//           error: "Relationship ID is required.",
//         },
//         {
//           status: 400,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
//      * --------------------------------------------------------
//      *
//      * We verify all three:
//      *
//      * - relationship ID
//      * - logged-in doctor ID
//      * - active status
//      *
//      * Therefore a doctor cannot use another doctor's
//      * relationshipId.
//      */
//     const supabase = createSupabaseAdminClient();

//     const { data: relationship, error: relationshipError } = await supabase
//       .from("doctor_patient_relationships")
//       .select(
//         `
//           id,
//           doctor_id,
//           patient_id,
//           status
//         `,
//       )
//       .eq("id", normalizedRelationshipId)
//       .eq("doctor_id", profile.id)
//       .eq("status", "active")
//       .maybeSingle();

//     if (relationshipError) {
//       console.error(
//         "[Doctor IFI Monitoring] Relationship lookup failed:",
//         relationshipError,
//       );

//       return NextResponse.json(
//         {
//           error: "Unable to verify patient relationship.",
//         },
//         {
//           status: 500,
//         },
//       );
//     }

//     /**
//      * Same response for:
//      *
//      * - relationship does not exist
//      * - relationship belongs to another doctor
//      * - relationship is pending
//      * - relationship is revoked
//      *
//      * This avoids revealing relationship information.
//      */
//     if (!relationship) {
//       return NextResponse.json(
//         {
//           error: "Active patient relationship not found.",
//         },
//         {
//           status: 404,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 5. FIND PATIENT'S ACTIVE IFI MONITORING CYCLE
//      * --------------------------------------------------------
//      *
//      * SECURITY:
//      *
//      * patient_id comes exclusively from the verified
//      * relationship.
//      *
//      * It is never accepted from:
//      *
//      * - query parameters
//      * - request body
//      * - URL patient UUID
//      */
//     const cycle = await getActiveIFIMonitoringCycle({
//       patientId: relationship.patient_id,
//     });

//     /**
//      * No active monitoring cycle is a valid state.
//      *
//      * For example, the patient may not yet have completed
//      * an assessment that establishes Day 0.
//      */
//     if (!cycle) {
//       return NextResponse.json(
//         {
//           success: true,

//           relationship: {
//             id: relationship.id,
//           },

//           data: null,
//         },
//         {
//           status: 200,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 6. BUILD 31-DAY IFI MONITORING DATA
//      * --------------------------------------------------------
//      */
//     const monitoring = await getIFIMonitoringCycleData({
//       cycleId: cycle.id,
//     });

//     /**
//      * --------------------------------------------------------
//      * 7. RETURN RESULT
//      * --------------------------------------------------------
//      */
//     return NextResponse.json(
//       {
//         success: true,

//         relationship: {
//           id: relationship.id,
//         },

//         data: monitoring,
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     console.error(
//       "[GET /api/doctor/patients/[relationshipId]/ifi-monitoring]",
//       error,
//     );

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
//         error: "Unable to load patient IFI monitoring data.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }

import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getIFIMonitoringCycles } from "@/services/database/ifi-monitoring/getIFIMonitoringCycles";
import { getIFIMonitoringCycleData } from "@/services/database/ifi-monitoring/getIFIMonitoringCycleData";

interface RouteContext {
  params: Promise<{
    relationshipId: string;
  }>;
}

/**
 * ============================================================
 * GET
 * /api/doctor/patients/[relationshipId]/ifi-monitoring
 * ============================================================
 *
 * Doctor view of a connected patient's IFI monitoring.
 *
 * Supported requests:
 *
 * GET /api/doctor/patients/[relationshipId]/ifi-monitoring
 *
 *   -> current/latest cycle
 *
 * GET /api/doctor/patients/[relationshipId]/ifi-monitoring
 *     ?cycleId=<cycleId>
 *
 *   -> selected historical cycle
 *
 * Security flow:
 *
 * authenticated user
 *      ↓
 * must be doctor
 *      ↓
 * relationship must belong to logged-in doctor
 *      ↓
 * relationship must be active
 *      ↓
 * patient_id resolved server-side
 *      ↓
 * patient's cycles loaded
 *      ↓
 * requested cycle verified against those cycles
 *      ↓
 * selected cycle monitoring calculated
 *
 * The browser never supplies patientId.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATE
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. DOCTOR-ONLY ENDPOINT
     * --------------------------------------------------------
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          error: "This endpoint is available only to doctors.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. READ RELATIONSHIP ID
     * --------------------------------------------------------
     */
    const { relationshipId } = await context.params;

    const normalizedRelationshipId = relationshipId?.trim();

    if (!normalizedRelationshipId) {
      return NextResponse.json(
        {
          error: "Relationship ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 4. VERIFY ACTIVE DOCTOR-PATIENT RELATIONSHIP
     * --------------------------------------------------------
     */
    const supabase = createSupabaseAdminClient();

    const { data: relationship, error: relationshipError } = await supabase
      .from("doctor_patient_relationships")
      .select(
        `
          id,
          doctor_id,
          patient_id,
          status
        `,
      )
      .eq("id", normalizedRelationshipId)
      .eq("doctor_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (relationshipError) {
      console.error(
        "[Doctor IFI Monitoring] Relationship lookup failed:",
        relationshipError,
      );

      return NextResponse.json(
        {
          error: "Unable to verify patient relationship.",
        },
        {
          status: 500,
        },
      );
    }

    /**
     * Same response whether:
     *
     * - relationship does not exist
     * - relationship belongs to another doctor
     * - relationship is pending
     * - relationship is revoked
     *
     * This avoids exposing relationship information.
     */
    if (!relationship) {
      return NextResponse.json(
        {
          error: "Active patient relationship not found.",
        },
        {
          status: 404,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 5. LOAD THIS PATIENT'S MONITORING CYCLES
     * --------------------------------------------------------
     *
     * patient_id comes from the verified relationship.
     *
     * It is NEVER accepted from the browser.
     */
    const cycles = await getIFIMonitoringCycles({
      patientId: relationship.patient_id,
    });

    /**
     * --------------------------------------------------------
     * 6. NO MONITORING HISTORY
     * --------------------------------------------------------
     *
     * This is a valid state, not a server failure.
     */
    if (cycles.length === 0) {
      return NextResponse.json(
        {
          success: true,

          relationship: {
            id: relationship.id,
          },

          cycles: [],

          selectedCycleId: null,

          data: null,
        },
        {
          status: 200,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 7. READ OPTIONAL CYCLE SELECTION
     * --------------------------------------------------------
     */
    const url = new URL(request.url);

    const requestedCycleId = url.searchParams.get("cycleId")?.trim() || null;

    /**
     * --------------------------------------------------------
     * 8. RESOLVE SELECTED CYCLE
     * --------------------------------------------------------
     */
    let selectedCycle = null;

    if (requestedCycleId) {
      /**
       * SECURITY:
       *
       * The requested cycle must be one of the cycles belonging
       * to the patient resolved from the verified relationship.
       *
       * A doctor therefore cannot provide a cycle belonging to:
       *
       * - another patient
       * - another doctor's patient
       */
      selectedCycle =
        cycles.find((cycle) => cycle.id === requestedCycleId) ?? null;

      if (!selectedCycle) {
        return NextResponse.json(
          {
            error: "IFI monitoring cycle not found.",
          },
          {
            status: 404,
          },
        );
      }
    } else {
      /**
       * Default:
       *
       * 1. Active cycle
       * 2. Otherwise newest historical cycle
       */
      selectedCycle =
        cycles.find((cycle) => cycle.status === "active") ?? cycles[0];
    }

    /**
     * --------------------------------------------------------
     * 9. CALCULATE SELECTED 31-DAY CYCLE
     * --------------------------------------------------------
     */
    const monitoring = await getIFIMonitoringCycleData({
      cycleId: selectedCycle.id,
    });

    /**
     * --------------------------------------------------------
     * 10. RETURN DASHBOARD DTO
     * --------------------------------------------------------
     *
     * Keep this intentionally similar to the patient endpoint
     * so one shared React component can consume both.
     */
    return NextResponse.json(
      {
        success: true,

        relationship: {
          id: relationship.id,
        },

        cycles: cycles.map((cycle) => ({
          id: cycle.id,

          startDate: cycle.startDate,

          endDate: cycle.endDate,

          status: cycle.status,

          completedAt: cycle.completedAt,
        })),

        selectedCycleId: selectedCycle.id,

        data: monitoring,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "[GET /api/doctor/patients/[relationshipId]/ifi-monitoring]",
      error,
    );

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
        error: "Unable to load patient IFI monitoring data.",
      },
      {
        status: 500,
      },
    );
  }
}
