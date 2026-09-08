import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface GetDoctorPatientsInput {
  doctorId: string;
}

export interface DoctorPatientListItem {
  relationshipId: string;

  patient: {
    fullName: string | null;
  };

  status: "active";
  acceptedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Returns ACTIVE patients connected to one doctor.
 *
 * Security:
 * - server-only
 * - doctorId must come from authenticated profile
 * - patient UUIDs are not returned to the frontend
 * - only ACTIVE relationships are included
 *
 * This service is designed for:
 * - Doctor dashboard
 * - My Patients page
 * - Patient selection before starting an assessment
 */
export async function getDoctorPatients({
  doctorId,
}: GetDoctorPatientsInput): Promise<DoctorPatientListItem[]> {
  const normalizedDoctorId = doctorId.trim();

  if (!normalizedDoctorId) {
    throw new Error("DOCTOR_ID_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 1. Load active relationships
   * ----------------------------------------------------------
   */
  const { data: relationships, error: relationshipsError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        patient_id,
        status,
        accepted_at,
        created_at,
        updated_at
      `,
    )
    .eq("doctor_id", normalizedDoctorId)
    .eq("status", "active")
    .order("accepted_at", {
      ascending: false,
    });

  if (relationshipsError) {
    console.error(
      `[Doctor Patients] Failed to load relationships for doctor ${normalizedDoctorId}:`,
      relationshipsError,
    );

    throw new Error("DOCTOR_PATIENTS_READ_FAILED");
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const patientIds = relationships.map(
    (relationship) => relationship.patient_id,
  );

  /**
   * ----------------------------------------------------------
   * 2. Load safe patient profile metadata
   * ----------------------------------------------------------
   *
   * Internal UUIDs remain server-side.
   */
  const { data: patientProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        role,
        full_name
      `,
    )
    .in("id", patientIds);

  if (profilesError) {
    console.error(
      `[Doctor Patients] Failed to load patient profiles for doctor ${normalizedDoctorId}:`,
      profilesError,
    );

    throw new Error("DOCTOR_PATIENT_PROFILE_READ_FAILED");
  }

  const patientProfileMap = new Map<
    string,
    {
      role: string;
      fullName: string | null;
    }
  >();

  for (const profile of patientProfiles ?? []) {
    patientProfileMap.set(profile.id, {
      role: profile.role,
      fullName: profile.full_name,
    });
  }

  const patients: DoctorPatientListItem[] = [];

  /**
   * ----------------------------------------------------------
   * 3. Build safe UI response
   * ----------------------------------------------------------
   */
  for (const relationship of relationships) {
    const patient = patientProfileMap.get(relationship.patient_id);

    /**
     * DB trigger should already guarantee patient role,
     * but fail closed if inconsistent data somehow exists.
     */
    if (!patient || patient.role !== "patient") {
      console.error(
        `[Doctor Patients] Relationship ${relationship.id} references an invalid patient profile.`,
      );

      continue;
    }

    /**
     * ACTIVE relationships should always have accepted_at.
     */
    if (!relationship.accepted_at) {
      console.error(
        `[Doctor Patients] Active relationship ${relationship.id} is missing accepted_at.`,
      );

      continue;
    }

    patients.push({
      relationshipId: relationship.id,

      patient: {
        fullName: patient.fullName,
      },

      status: "active",

      acceptedAt: relationship.accepted_at,

      createdAt: relationship.created_at,
      updatedAt: relationship.updated_at,
    });
  }

  return patients;
}
