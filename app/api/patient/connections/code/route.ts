import { NextResponse } from "next/server";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import { generatePatientConnectionCode } from "@/services/database/relationships/generatePatientConnectionCode";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
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
     * Only patient accounts may generate patient connection codes.
     *
     * Doctors and super_admins should not generate codes on behalf
     * of arbitrary patients through this endpoint.
     */
    if (profile.role !== "patient") {
      return NextResponse.json(
        {
          success: false,
          code: "PATIENT_ROLE_REQUIRED",
          message: "Only patients can generate a doctor connection code.",
        },
        {
          status: 403,
        },
      );
    }

    /**
     * --------------------------------------------------------
     * 3. GENERATE / ROTATE CONNECTION CODE
     * --------------------------------------------------------
     *
     * patientId comes from the authenticated profile only.
     *
     * No request body is accepted.
     */
    const connectionCode = await generatePatientConnectionCode({
      patientId: profile.id,
    });

    return NextResponse.json(
      {
        success: true,

        message: "Patient connection code generated successfully.",

        connection: {
          code: connectionCode.code,
          expiresAt: connectionCode.expiresAt,
          expiresInSeconds: connectionCode.expiresInSeconds,
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
          message: "Authentication is required to generate a connection code.",
        },
        {
          status: 401,
        },
      );
    }

    console.error("[Patient Connection Code API] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "CONNECTION_CODE_GENERATION_FAILED",
        message: "Unable to generate a patient connection code.",
      },
      {
        status: 500,
      },
    );
  }
}
