import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { getPendingPatientInvitations } from "@/services/database/relationships/getPendingPatientInvitations";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    /**
     * --------------------------------------------------------
     * 1. AUTHENTICATION
     * --------------------------------------------------------
     */
    const profile = await requireCurrentProfile();

    /**
     * --------------------------------------------------------
     * 2. ROLE AUTHORIZATION
     * --------------------------------------------------------
     *
     * Only patient accounts may access this invitation inbox.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_ROLE_REQUIRED",
          message: "Only patients can access doctor connection requests.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. LOAD PENDING INVITATIONS
     * --------------------------------------------------------
     *
     * patientId comes only from the authenticated profile.
     */
    const invitations = await getPendingPatientInvitations({
      patientId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,

        connections: {
          pending: invitations,
          count: invitations.length,
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
          message:
            "Authentication is required to view doctor connection requests.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * DATABASE / SERVICE FAILURE
     * --------------------------------------------------------
     */
    console.error("[Patient Connections API] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "PATIENT_CONNECTIONS_READ_FAILED",
        message: "Unable to load doctor connection requests.",
      },
      {
        status: 500,
      },
    );
  }
}
