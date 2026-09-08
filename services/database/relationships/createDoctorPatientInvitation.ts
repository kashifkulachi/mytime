import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DoctorPatientInvitationStatus = "pending" | "active";

export interface CreateDoctorPatientInvitationInput {
  doctorId: string;
  connectionCode: string;
}

export interface CreatedDoctorPatientInvitation {
  relationshipId: string;
  status: DoctorPatientInvitationStatus;

  patient: {
    fullName: string | null;
  };

  alreadyPending: boolean;
  alreadyActive: boolean;
}

interface ConsumeConnectionCodeRpcRow {
  relationship_id: string;
  relationship_status: DoctorPatientInvitationStatus;

  patient_full_name: string | null;

  already_pending: boolean;
  already_active: boolean;
}

/**
 * Consumes a patient-generated connection code and creates or
 * restores the doctor-patient relationship.
 *
 * IMPORTANT:
 *
 * This service does NOT perform the relationship transaction
 * itself.
 *
 * PostgreSQL performs atomically:
 *
 * 1. lock connection code
 * 2. verify unused
 * 3. verify unexpired
 * 4. resolve patient internally
 * 5. validate doctor role
 * 6. create/reopen pending relationship
 * 7. mark connection code used
 *
 * This prevents race conditions and connection-code reuse.
 */
export async function createDoctorPatientInvitation({
  doctorId,
  connectionCode,
}: CreateDoctorPatientInvitationInput): Promise<CreatedDoctorPatientInvitation> {
  const normalizedDoctorId = doctorId.trim();

  if (!normalizedDoctorId) {
    throw new Error("DOCTOR_ID_REQUIRED");
  }

  const normalizedCode = normalizeConnectionCode(connectionCode);

  if (!normalizedCode) {
    throw new Error("CONNECTION_CODE_REQUIRED");
  }

  /**
   * Basic format validation happens before hitting the DB.
   *
   * Expected:
   *
   * MYT-XXXX-XXXX
   */
  if (!/^MYT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalizedCode)) {
    throw new Error("INVALID_CONNECTION_CODE");
  }

  const codeHash = hashConnectionCode(normalizedCode);

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "consume_patient_connection_code_and_invite",
    {
      p_doctor_id: normalizedDoctorId,

      p_code_hash: codeHash,
    },
  );

  if (error) {
    const mappedError = mapInvitationRpcError(error.message);

    console.error(
      `[Doctor Patient Invitation] Failed for doctor ${normalizedDoctorId}:`,
      {
        code: mappedError.message,

        /**
         * Do NOT log the plaintext connection code.
         */
        databaseMessage: error.message,
      },
    );

    throw mappedError;
  }

  if (!Array.isArray(data) || data.length !== 1) {
    console.error(
      "[Doctor Patient Invitation] RPC returned an unexpected result.",
      data,
    );

    throw new Error("DOCTOR_PATIENT_INVITATION_FAILED");
  }

  const row = data[0] as ConsumeConnectionCodeRpcRow;

  if (!row.relationship_id || !isInvitationStatus(row.relationship_status)) {
    console.error(
      "[Doctor Patient Invitation] RPC returned invalid relationship data.",
      row,
    );

    throw new Error("DOCTOR_PATIENT_INVITATION_FAILED");
  }

  return {
    relationshipId: row.relationship_id,

    status: row.relationship_status,

    patient: {
      fullName: row.patient_full_name,
    },

    alreadyPending: Boolean(row.already_pending),

    alreadyActive: Boolean(row.already_active),
  };
}

/**
 * Must stay identical to normalization used when generating and
 * hashing patient connection codes.
 *
 * Examples:
 *
 * myt-7k3q-p9wx
 * MYT-7K3Q-P9WX
 *
 * both become:
 *
 * MYT-7K3Q-P9WX
 */
function normalizeConnectionCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function hashConnectionCode(code: string): string {
  return createHash("sha256")
    .update(normalizeConnectionCode(code), "utf8")
    .digest("hex");
}

function isInvitationStatus(
  value: unknown,
): value is DoctorPatientInvitationStatus {
  return value === "pending" || value === "active";
}

function mapInvitationRpcError(message: string): Error {
  const normalized = message.toUpperCase();

  if (normalized.includes("INVALID_CONNECTION_CODE")) {
    return new Error("INVALID_CONNECTION_CODE");
  }

  if (normalized.includes("CONNECTION_CODE_EXPIRED")) {
    return new Error("CONNECTION_CODE_EXPIRED");
  }

  if (normalized.includes("CONNECTION_CODE_ALREADY_USED")) {
    return new Error("CONNECTION_CODE_ALREADY_USED");
  }

  if (normalized.includes("DOCTOR_PROFILE_NOT_FOUND")) {
    return new Error("DOCTOR_PROFILE_NOT_FOUND");
  }

  if (normalized.includes("DOCTOR_ROLE_REQUIRED")) {
    return new Error("DOCTOR_ROLE_REQUIRED");
  }

  if (normalized.includes("PATIENT_PROFILE_NOT_FOUND")) {
    return new Error("PATIENT_PROFILE_NOT_FOUND");
  }

  if (normalized.includes("CANNOT_CONNECT_TO_SELF")) {
    return new Error("CANNOT_CONNECT_TO_SELF");
  }

  console.error(
    "[Doctor Patient Invitation] Unexpected database error:",
    message,
  );

  return new Error("DOCTOR_PATIENT_INVITATION_FAILED");
}
