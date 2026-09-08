import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { getDoctorPatients } from "@/services/database/relationships/getDoctorPatients";

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
     * Only doctor accounts may access the My Patients list.
     */
    if (profile.role !== "doctor") {
      return NextResponse.json(
        {
          success: false,
          code: "DOCTOR_ROLE_REQUIRED",
          message: "Only doctors can access the patient list.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. LOAD ACTIVE PATIENT RELATIONSHIPS
     * --------------------------------------------------------
     *
     * doctorId comes only from the authenticated profile.
     */
    const patients = await getDoctorPatients({
      doctorId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,

        patients,

        count: patients.length,
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
          message: "Authentication is required to access the patient list.",
        },
        {
          status: 401,
        },
      );
    }

    console.error("[Doctor Patients API] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "DOCTOR_PATIENTS_READ_FAILED",
        message: "Unable to load your patients.",
      },
      {
        status: 500,
      },
    );
  }
}
