import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CONNECTION_CODE_PREFIX = "MYT";

const CONNECTION_CODE_EXPIRY_MINUTES = 15;

/**
 * 8 characters gives a good balance between:
 *
 * - easy manual entry
 * - low typo risk
 * - enough randomness for a short-lived code
 *
 * The actual entropy comes from crypto.randomBytes().
 */
const CONNECTION_CODE_CHARACTER_COUNT = 8;

const CONNECTION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface GeneratePatientConnectionCodeInput {
  patientId: string;
}

export interface GeneratedPatientConnectionCode {
  code: string;
  expiresAt: string;
  expiresInSeconds: number;
}

/**
 * Generates a short-lived connection code for a patient.
 *
 * Security properties:
 *
 * - server-only
 * - cryptographically secure randomness
 * - plaintext code is NEVER persisted
 * - database stores SHA-256 hash only
 * - one active/current code per patient
 * - generating another code invalidates the previous one
 * - used_at is reset when rotating the code
 *
 * IMPORTANT:
 *
 * Authentication must happen in the API/server action that calls
 * this service.
 *
 * The caller must derive patientId from the authenticated profile.
 *
 * Never accept an arbitrary patientId from browser JSON.
 */
export async function generatePatientConnectionCode({
  patientId,
}: GeneratePatientConnectionCodeInput): Promise<GeneratedPatientConnectionCode> {
  const normalizedPatientId = patientId.trim();

  if (!normalizedPatientId) {
    throw new Error("Patient ID is required.");
  }

  /**
   * ----------------------------------------------------------
   * 1. Generate plaintext code
   * ----------------------------------------------------------
   *
   * Example:
   *
   * MYT-7K3Q-P9WX
   */
  const rawCode = generateSecureCodeCharacters(CONNECTION_CODE_CHARACTER_COUNT);

  const formattedCode = formatConnectionCode(rawCode);

  /**
   * ----------------------------------------------------------
   * 2. Hash before persistence
   * ----------------------------------------------------------
   */
  const codeHash = hashConnectionCode(formattedCode);

  /**
   * ----------------------------------------------------------
   * 3. Set short expiry
   * ----------------------------------------------------------
   */
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() + CONNECTION_CODE_EXPIRY_MINUTES * 60 * 1000,
  );

  const supabase = createSupabaseAdminClient();

  /**
   * ----------------------------------------------------------
   * 4. Rotate existing code
   * ----------------------------------------------------------
   *
   * patient_id is UNIQUE.
   *
   * Therefore:
   *
   * first generation
   *   → INSERT
   *
   * future generation
   *   → UPDATE same row
   *
   * Supabase upsert handles both safely.
   */
  const { error } = await supabase.from("patient_connection_codes").upsert(
    {
      patient_id: normalizedPatientId,

      code_hash: codeHash,

      expires_at: expiresAt.toISOString(),

      /**
       * New code has not been used yet.
       */
      used_at: null,

      /**
       * Explicitly refresh creation time because this row
       * represents the patient's CURRENT generated code.
       *
       * updated_at is also handled by the DB trigger.
       */
      created_at: now.toISOString(),
    },
    {
      onConflict: "patient_id",
    },
  );

  if (error) {
    console.error(
      `[Patient Connection] Failed to generate connection code for patient ${normalizedPatientId}:`,
      error,
    );

    throw new Error("Failed to generate patient connection code.");
  }

  /**
   * ----------------------------------------------------------
   * 5. Return plaintext ONLY to current caller
   * ----------------------------------------------------------
   *
   * This is the only place the usable code exists.
   */
  return {
    code: formattedCode,

    expiresAt: expiresAt.toISOString(),

    expiresInSeconds: CONNECTION_CODE_EXPIRY_MINUTES * 60,
  };
}

function generateSecureCodeCharacters(length: number): string {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new Error("Invalid connection code length.");
  }

  const alphabetLength = CONNECTION_CODE_ALPHABET.length;

  /**
   * Rejection sampling avoids modulo bias.
   *
   * We only accept byte values inside the largest multiple of
   * alphabetLength that fits within 0..255.
   */
  const maximumAcceptedByte =
    Math.floor(256 / alphabetLength) * alphabetLength - 1;

  let result = "";

  while (result.length < length) {
    const bytes = randomBytes(length);

    for (const byte of bytes) {
      if (byte > maximumAcceptedByte) {
        continue;
      }

      const index = byte % alphabetLength;

      result += CONNECTION_CODE_ALPHABET[index];

      if (result.length === length) {
        break;
      }
    }
  }

  return result;
}

function formatConnectionCode(rawCode: string): string {
  const normalized = rawCode.trim().toUpperCase();

  if (normalized.length !== CONNECTION_CODE_CHARACTER_COUNT) {
    throw new Error("Invalid generated connection code.");
  }

  /**
   * Example:
   *
   * raw:
   * 7K3QP9WX
   *
   * formatted:
   * MYT-7K3Q-P9WX
   */
  return `${CONNECTION_CODE_PREFIX}-${normalized.slice(
    0,
    4,
  )}-${normalized.slice(4)}`;
}

function hashConnectionCode(code: string): string {
  /**
   * Normalize exactly the same way later when the doctor enters
   * the code.
   *
   * Example inputs:
   *
   * myt-7k3q-p9wx
   * MYT-7K3Q-P9WX
   *
   * should resolve to the same hash after normalization.
   */
  const normalized = normalizeConnectionCode(code);

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function normalizeConnectionCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
