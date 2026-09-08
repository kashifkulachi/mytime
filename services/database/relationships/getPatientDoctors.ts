import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface GetPatientDoctorsInput {
  patientId: string;
}

export interface PatientDoctorConnectionItem {
  relationshipId: string;

  doctor: {
    fullName: string | null;
  };

  status: "pending" | "active";

  acceptedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface PatientDoctorsResult {
  pending: PatientDoctorConnectionItem[];
  active: PatientDoctorConnectionItem[];
}

/**
 * Returns the patient's current doctor relationships.
 *
 * Includes:
 *
 * pending
 *   → doctor has requested access, patient has not accepted yet
 *
 * active
 *   → doctor currently has authorized clinical/report access
 *
 * Excludes:
 *
 * revoked
 *   → no longer relevant to normal patient UI
 *
 * Security:
 *
 * - server-only
 * - patientId must come from authenticated profile
 * - internal doctor UUIDs are never returned to the browser
 */
export async function getPatientDoctors({
  patientId,
}: GetPatientDoctorsInput): Promise<PatientDoctorsResult> {
  const normalizedPatientId = patientId.trim();

  if (!normalizedPatientId) {
    throw new Error("PATIENT_ID_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 1. LOAD CURRENT RELATIONSHIPS
   * ----------------------------------------------------------
   *
   * Only pending + active are needed for the normal UI.
   */
  const { data: relationships, error: relationshipsError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        doctor_id,
        status,
        accepted_at,
        created_at,
        updated_at
      `,
    )
    .eq("patient_id", normalizedPatientId)
    .in("status", ["pending", "active"])
    .order("created_at", {
      ascending: false,
    });

  if (relationshipsError) {
    console.error(
      `[Patient Doctors] Failed to load relationships for patient ${normalizedPatientId}:`,
      relationshipsError,
    );

    throw new Error("PATIENT_DOCTORS_READ_FAILED");
  }

  if (!relationships || relationships.length === 0) {
    return {
      pending: [],
      active: [],
    };
  }

  /**
   * ----------------------------------------------------------
   * 2. LOAD DOCTOR PROFILE METADATA
   * ----------------------------------------------------------
   */
  const doctorIds = relationships.map((relationship) => relationship.doctor_id);

  const { data: doctorProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        role,
        full_name
      `,
    )
    .in("id", doctorIds);

  if (profilesError) {
    console.error(
      `[Patient Doctors] Failed to load doctor profiles for patient ${normalizedPatientId}:`,
      profilesError,
    );

    throw new Error("PATIENT_DOCTOR_PROFILE_READ_FAILED");
  }

  const doctorProfileMap = new Map<
    string,
    {
      role: string;
      fullName: string | null;
    }
  >();

  for (const profile of doctorProfiles ?? []) {
    doctorProfileMap.set(profile.id, {
      role: profile.role,

      fullName: profile.full_name,
    });
  }

  /**
   * ----------------------------------------------------------
   * 3. BUILD SAFE RESPONSE
   * ----------------------------------------------------------
   */
  const pending: PatientDoctorConnectionItem[] = [];

  const active: PatientDoctorConnectionItem[] = [];

  for (const relationship of relationships) {
    const doctor = doctorProfileMap.get(relationship.doctor_id);

    /**
     * Database trigger should already guarantee doctor role,
     * but fail closed if inconsistent data somehow exists.
     */
    if (!doctor || doctor.role !== "doctor") {
      console.error(
        `[Patient Doctors] Relationship ${relationship.id} references an invalid doctor profile.`,
      );

      continue;
    }

    if (relationship.status !== "pending" && relationship.status !== "active") {
      continue;
    }

    /**
     * Active relationships are expected to have accepted_at.
     */
    if (relationship.status === "active" && !relationship.accepted_at) {
      console.error(
        `[Patient Doctors] Active relationship ${relationship.id} is missing accepted_at.`,
      );

      continue;
    }

    const item: PatientDoctorConnectionItem = {
      relationshipId: relationship.id,

      doctor: {
        fullName: doctor.fullName,
      },

      status: relationship.status,

      acceptedAt: relationship.accepted_at,

      createdAt: relationship.created_at,

      updatedAt: relationship.updated_at,
    };

    if (relationship.status === "pending") {
      pending.push(item);
    } else {
      active.push(item);
    }
  }

  return {
    pending,
    active,
  };
}
