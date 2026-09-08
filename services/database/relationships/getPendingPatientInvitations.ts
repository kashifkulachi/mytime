import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface GetPendingPatientInvitationsInput {
  patientId: string;
}

export interface PendingPatientInvitation {
  relationshipId: string;

  doctor: {
    fullName: string | null;
  };

  status: "pending";

  createdAt: string;
  updatedAt: string;
}

/**
 * Returns pending doctor connection requests for one patient.
 *
 * Security:
 * - server-only
 * - patientId must come from the authenticated profile in the API
 * - internal doctor UUID is intentionally not returned to the UI
 */
export async function getPendingPatientInvitations({
  patientId,
}: GetPendingPatientInvitationsInput): Promise<PendingPatientInvitation[]> {
  const normalizedPatientId = patientId.trim();

  if (!normalizedPatientId) {
    throw new Error("PATIENT_ID_REQUIRED");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * First fetch the patient's pending relationship rows.
   */
  const { data: relationships, error: relationshipsError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        doctor_id,
        status,
        created_at,
        updated_at
      `,
    )
    .eq("patient_id", normalizedPatientId)
    .eq("status", "pending")
    .order("created_at", {
      ascending: false,
    });

  if (relationshipsError) {
    console.error(
      `[Patient Invitations] Failed to load pending relationships for patient ${normalizedPatientId}:`,
      relationshipsError,
    );

    throw new Error("PATIENT_INVITATIONS_READ_FAILED");
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  const doctorIds = relationships.map((relationship) => relationship.doctor_id);

  /**
   * Fetch doctor display information separately.
   *
   * We only need safe UI metadata from profiles.
   */
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
      `[Patient Invitations] Failed to load doctor profiles for patient ${normalizedPatientId}:`,
      profilesError,
    );

    throw new Error("PATIENT_INVITATION_DOCTOR_READ_FAILED");
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

  const invitations: PendingPatientInvitation[] = [];

  for (const relationship of relationships) {
    const doctor = doctorProfileMap.get(relationship.doctor_id);

    /**
     * Fail closed if relationship data somehow points at a
     * non-doctor profile.
     *
     * The database trigger should prevent this, but the service
     * still verifies it defensively.
     */
    if (!doctor || doctor.role !== "doctor") {
      console.error(
        `[Patient Invitations] Relationship ${relationship.id} references an invalid doctor profile.`,
      );

      continue;
    }

    invitations.push({
      relationshipId: relationship.id,

      doctor: {
        fullName: doctor.fullName,
      },

      status: "pending",

      createdAt: relationship.created_at,

      updatedAt: relationship.updated_at,
    });
  }

  return invitations;
}
