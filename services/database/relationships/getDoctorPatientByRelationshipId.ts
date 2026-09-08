// import "server-only";

// import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// export interface DoctorPatientRelationshipPatient {
//   relationshipId: string;

//   patient: {
//     fullName: string | null;
//   };

//   relationship: {
//     status: "active";
//     createdAt: string;
//     acceptedAt: string | null;
//     updatedAt: string;
//   };
// }

// /**
//  * Internal version of the relationship.
//  *
//  * IMPORTANT:
//  * patientId is the patient's Supabase/auth UUID.
//  *
//  * It is returned from this database service because trusted server-side
//  * services will need it for:
//  *
//  * - report authorization
//  * - creating assessments for the selected patient
//  * - querying patient reports
//  * - IFI monitoring
//  *
//  * It must NOT be exposed directly to the browser/API response.
//  */
// export interface DoctorPatientRelationshipInternal extends DoctorPatientRelationshipPatient {
//   patientId: string;
// }

// interface DoctorPatientRelationshipRow {
//   id: string;
//   patient_id: string;
//   status: string;
//   created_at: string;
//   accepted_at: string | null;
//   updated_at: string;

//   patient: {
//     full_name: string | null;
//   } | null;
// }

// /**
//  * Resolve an active patient relationship belonging to a specific doctor.
//  *
//  * SECURITY:
//  *
//  * This function uses the Supabase admin client, which bypasses RLS.
//  * Therefore ALL authorization constraints must be included explicitly
//  * in this query.
//  *
//  * A relationship is returned only when:
//  *
//  *   relationship.id        = relationshipId
//  *   relationship.doctor_id = doctorId
//  *   relationship.status    = active
//  *
//  * Never remove the doctor_id condition.
//  */
// export async function getDoctorPatientByRelationshipId({
//   relationshipId,
//   doctorId,
// }: {
//   relationshipId: string;
//   doctorId: string;
// }): Promise<DoctorPatientRelationshipInternal | null> {
//   const normalizedRelationshipId = relationshipId.trim();
//   const normalizedDoctorId = doctorId.trim();

//   if (!normalizedRelationshipId) {
//     throw new Error("Relationship ID is required.");
//   }

//   if (!normalizedDoctorId) {
//     throw new Error("Doctor ID is required.");
//   }

//   const supabase = createSupabaseAdminClient();

//   const { data, error } = await supabase
//     .from("doctor_patient_relationships")
//     .select(
//       `
//         id,
//         patient_id,
//         status,
//         created_at,
//         accepted_at,
//         updated_at,
//         patient:profiles!doctor_patient_relationships_patient_id_fkey (
//           full_name
//         )
//       `,
//     )
//     .eq("id", normalizedRelationshipId)
//     .eq("doctor_id", normalizedDoctorId)
//     .eq("status", "active")
//     .maybeSingle();

//   if (error) {
//     console.error(
//       "[Doctor Patient Relationship] Failed to retrieve relationship:",
//       error,
//     );

//     throw new Error(
//       `Failed to retrieve doctor-patient relationship: ${error.message}`,
//     );
//   }

//   if (!data) {
//     return null;
//   }

//   const row = data as unknown as DoctorPatientRelationshipRow;

//   if (!row.patient_id) {
//     throw new Error(
//       "Doctor-patient relationship does not contain a patient ID.",
//     );
//   }

//   return {
//     relationshipId: row.id,

//     /**
//      * SERVER-ONLY.
//      *
//      * Do not serialize this value from the API we're going to build next.
//      */
//     patientId: row.patient_id,

//     patient: {
//       fullName: row.patient?.full_name ?? null,
//     },

//     relationship: {
//       status: "active",
//       createdAt: row.created_at,
//       acceptedAt: row.accepted_at,
//       updatedAt: row.updated_at,
//     },
//   };
// }
import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface DoctorPatientRelationshipPatient {
  relationshipId: string;

  patient: {
    fullName: string | null;
  };

  relationship: {
    status: "active";
    createdAt: string;
    acceptedAt: string | null;
    updatedAt: string;
  };
}

export interface DoctorPatientRelationshipInternal extends DoctorPatientRelationshipPatient {
  /**
   * SERVER-ONLY internal patient identifier.
   *
   * Never expose this through the API response.
   */
  patientId: string;
}

interface RelationshipDatabaseRow {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
  updated_at: string;
}

export async function getDoctorPatientByRelationshipId({
  relationshipId,
  doctorId,
}: {
  relationshipId: string;
  doctorId: string;
}): Promise<DoctorPatientRelationshipInternal | null> {
  const normalizedRelationshipId = relationshipId.trim();

  const normalizedDoctorId = doctorId.trim();

  if (!normalizedRelationshipId) {
    throw new Error("Relationship ID is required.");
  }

  if (!normalizedDoctorId) {
    throw new Error("Doctor ID is required.");
  }

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 1. SECURELY RESOLVE ACTIVE RELATIONSHIP
   * ----------------------------------------------------------
   *
   * The authorization conditions are part of the query itself.
   *
   * Required:
   *
   * relationship.id        = URL relationshipId
   * relationship.doctor_id = authenticated doctor
   * relationship.status    = active
   */
  const { data: relationshipData, error: relationshipError } = await supabase
    .from("doctor_patient_relationships")
    .select(
      `
        id,
        patient_id,
        status,
        created_at,
        accepted_at,
        updated_at
      `,
    )
    .eq("id", normalizedRelationshipId)
    .eq("doctor_id", normalizedDoctorId)
    .eq("status", "active")
    .maybeSingle();

  if (relationshipError) {
    console.error(
      `[Doctor Patient Workspace] Failed to retrieve relationship ${normalizedRelationshipId}:`,
      relationshipError,
    );

    throw new Error("Failed to retrieve doctor-patient relationship.");
  }

  if (!relationshipData) {
    return null;
  }

  const relationship = relationshipData as RelationshipDatabaseRow;

  if (!relationship.patient_id) {
    console.error(
      `[Doctor Patient Workspace] Relationship ${relationship.id} has no patient_id.`,
    );

    throw new Error(
      "Doctor-patient relationship does not contain a patient ID.",
    );
  }

  /**
   * ----------------------------------------------------------
   * 2. LOAD PATIENT PROFILE
   * ----------------------------------------------------------
   *
   * doctor_patient_relationships.patient_id references
   * auth.users.id.
   *
   * profiles.id uses that same auth user ID, but there is not a
   * direct FK from this relationship table to profiles.
   *
   * Therefore we query profiles separately.
   */
  const { data: patientProfile, error: patientProfileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        role,
        full_name
      `,
    )
    .eq("id", relationship.patient_id)
    .maybeSingle();

  if (patientProfileError) {
    console.error(
      `[Doctor Patient Workspace] Failed to retrieve patient profile for relationship ${relationship.id}:`,
      patientProfileError,
    );

    throw new Error("Failed to retrieve patient profile.");
  }

  if (!patientProfile) {
    console.error(
      `[Doctor Patient Workspace] Patient profile missing for relationship ${relationship.id}.`,
    );

    throw new Error("Patient profile was not found.");
  }

  /**
   * Defensive database consistency check.
   *
   * Your relationship table trigger should already guarantee
   * this, but we still fail closed here.
   */
  if (patientProfile.role !== "patient") {
    console.error(
      `[Doctor Patient Workspace] Relationship ${relationship.id} points to profile ${patientProfile.id} with invalid role ${patientProfile.role}.`,
    );

    throw new Error("Relationship does not reference a valid patient.");
  }

  if (relationship.status !== "active") {
    return null;
  }

  return {
    relationshipId: relationship.id,

    /**
     * Remains server-only.
     */
    patientId: relationship.patient_id,

    patient: {
      fullName: patientProfile.full_name ?? null,
    },

    relationship: {
      status: "active",

      createdAt: relationship.created_at,

      acceptedAt: relationship.accepted_at,

      updatedAt: relationship.updated_at,
    },
  };
}
