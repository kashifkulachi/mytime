import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { getPatientDoctors } from "@/services/database/relationships/getPatientDoctors";

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
     * Only patient accounts may access their doctor
     * connections through this endpoint.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_ROLE_REQUIRED",
          message: "Only patients can access their doctor connections.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. LOAD DOCTOR CONNECTIONS
     * --------------------------------------------------------
     *
     * patientId is derived only from the authenticated profile.
     *
     * The browser never supplies patientId.
     */
    const doctors = await getPatientDoctors({
      patientId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,

        connections: {
          pending: doctors.pending,
          active: doctors.active,

          counts: {
            pending: doctors.pending.length,
            active: doctors.active.length,
            total: doctors.pending.length + doctors.active.length,
          },
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
          message: "Authentication is required to access doctor connections.",
        },
        {
          status: 401,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * UNEXPECTED FAILURE
     * --------------------------------------------------------
     */
    console.error("[Patient Doctors API] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "PATIENT_DOCTORS_READ_FAILED",
        message: "Unable to load your doctor connections.",
      },
      {
        status: 500,
      },
    );
  }
}
