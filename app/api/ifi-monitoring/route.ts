// import { NextResponse } from "next/server";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
// import { getActiveIFIMonitoringCycle } from "@/services/database/ifi-monitoring/getActiveIFIMonitoringCycle";
// import { getIFIMonitoringCycleData } from "@/services/database/ifi-monitoring/getIFIMonitoringCycleData";

// /**
//  * GET /api/ifi-monitoring
//  *
//  * Returns the currently authenticated patient's active
//  * 31-day IFI monitoring cycle.
//  *
//  * Security:
//  * - patientId is NEVER accepted from the browser.
//  * - patientId comes from the authenticated profile.
//  * - only patient accounts can use this endpoint.
//  */
// export async function GET() {
//   try {
//     /**
//      * --------------------------------------------------------
//      * 1. AUTHENTICATION
//      * --------------------------------------------------------
//      */
//     const profile = await requireCurrentProfile();

//     /**
//      * --------------------------------------------------------
//      * 2. ROLE AUTHORIZATION
//      * --------------------------------------------------------
//      */
//     if (profile.role !== "patient") {
//       return NextResponse.json(
//         {
//           error: "This IFI monitoring endpoint is available to patients only.",
//         },
//         {
//           status: 403,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 3. FIND PATIENT'S ACTIVE MONITORING CYCLE
//      * --------------------------------------------------------
//      *
//      * profile.id is trusted because it comes from our
//      * authenticated server-side profile.
//      *
//      * The browser cannot supply another patient's ID.
//      */
//     const cycle = await getActiveIFIMonitoringCycle({
//       patientId: profile.id,
//     });

//     /**
//      * Having no active cycle is a valid application state.
//      *
//      * For example:
//      * - patient has not completed their first assessment yet
//      * - no monitoring cycle has been established yet
//      *
//      * This is therefore NOT a server error.
//      */
//     if (!cycle) {
//       return NextResponse.json(
//         {
//           data: null,
//         },
//         {
//           status: 200,
//         },
//       );
//     }

//     /**
//      * --------------------------------------------------------
//      * 4. BUILD THE 31-DAY MONITORING RESULT
//      * --------------------------------------------------------
//      *
//      * getIFIMonitoringCycleData is cycle-specific, so now we
//      * correctly give it the cycle ID rather than patient ID.
//      */
//     const monitoring = await getIFIMonitoringCycleData({
//       cycleId: cycle.id,
//     });

//     /**
//      * --------------------------------------------------------
//      * 5. RETURN RESULT
//      * --------------------------------------------------------
//      */
//     return NextResponse.json(
//       {
//         data: monitoring,
//       },
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     console.error("[GET /api/ifi-monitoring] Failed:", error);

//     /**
//      * requireCurrentProfile() currently uses this error when
//      * authentication is missing.
//      */
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
//         error: "Unable to load IFI monitoring data.",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

import { getIFIMonitoringCycles } from "@/services/database/ifi-monitoring/getIFIMonitoringCycles";
import { getIFIMonitoringCycleData } from "@/services/database/ifi-monitoring/getIFIMonitoringCycleData";

/**
 * ============================================================
 * GET
 * /api/ifi-monitoring
 * ============================================================
 *
 * Patient self-view IFI monitoring endpoint.
 *
 * Supported requests:
 *
 * GET /api/ifi-monitoring
 *
 *   -> returns the patient's current/latest cycle.
 *
 * GET /api/ifi-monitoring?cycleId=<cycleId>
 *
 *   -> returns the selected historical cycle.
 *
 * Security:
 *
 * - patientId is NEVER accepted from the browser.
 * - patientId comes from the authenticated profile.
 * - requested cycleId must belong to that patient.
 */
export async function GET(request: Request) {
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
          error: "This IFI monitoring endpoint is available to patients only.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. LOAD ALL PATIENT CYCLES
     * --------------------------------------------------------
     *
     * The patient ID comes exclusively from the authenticated
     * profile.
     */
    const cycles = await getIFIMonitoringCycles({
      patientId: profile.id,
    });

    /**
     * --------------------------------------------------------
     * 4. NO MONITORING HISTORY
     * --------------------------------------------------------
     *
     * This is a valid application state.
     */
    if (cycles.length === 0) {
      return NextResponse.json(
        {
          success: true,

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
     * 5. READ OPTIONAL CYCLE SELECTION
     * --------------------------------------------------------
     */
    const url = new URL(request.url);

    const requestedCycleId = url.searchParams.get("cycleId")?.trim() || null;

    /**
     * --------------------------------------------------------
     * 6. RESOLVE SELECTED CYCLE
     * --------------------------------------------------------
     *
     * If cycleId is supplied, it MUST exist inside the cycles
     * already loaded for this authenticated patient.
     *
     * This prevents:
     *
     * /api/ifi-monitoring?cycleId=ANOTHER_PATIENT_CYCLE
     *
     * from exposing another patient's monitoring data.
     */
    let selectedCycle = null;

    if (requestedCycleId) {
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
       * ------------------------------------------------------
       * DEFAULT SELECTION
       * ------------------------------------------------------
       *
       * Prefer the active cycle.
       *
       * If there is no active cycle, fall back to the newest
       * cycle returned by getIFIMonitoringCycles().
       *
       * The service orders newest start_date first.
       */
      selectedCycle =
        cycles.find((cycle) => cycle.status === "active") ?? cycles[0];
    }

    /**
     * --------------------------------------------------------
     * 7. CALCULATE SELECTED CYCLE
     * --------------------------------------------------------
     */
    const monitoring = await getIFIMonitoringCycleData({
      cycleId: selectedCycle.id,
    });

    /**
     * --------------------------------------------------------
     * 8. RETURN DASHBOARD DTO
     * --------------------------------------------------------
     *
     * cycles:
     *   lightweight metadata for the cycle selector.
     *
     * selectedCycleId:
     *   tells the UI which option is currently selected.
     *
     * data:
     *   complete calculated 31-day monitoring result for only
     *   the selected cycle.
     */
    return NextResponse.json(
      {
        success: true,

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
    console.error("[GET /api/ifi-monitoring]", error);

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
        error: "Unable to load IFI monitoring data.",
      },
      {
        status: 500,
      },
    );
  }
}
