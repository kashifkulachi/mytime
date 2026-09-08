import "server-only";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";
import {
  getReportById,
  type ReportRecord,
} from "@/services/database/reports/getReportById";
import { doctorHasActivePatientRelationship } from "@/services/database/relationships/doctorHasActivePatientRelationship";

export type ReportAccessAction = "read" | "generate" | "download";

export type ReportAccessErrorCode =
  | "INVALID_REPORT_ID"
  | "REPORT_NOT_FOUND"
  | "REPORT_ACCESS_DENIED";

export class ReportAccessError extends Error {
  readonly code: ReportAccessErrorCode;

  constructor(code: ReportAccessErrorCode, message: string) {
    super(message);

    this.name = "ReportAccessError";
    this.code = code;
  }
}

export interface RequireReportAccessInput {
  reportId: string;
  action: ReportAccessAction;
}

export interface AuthorizedReportAccess {
  profile: Awaited<ReturnType<typeof requireCurrentProfile>>;

  report: ReportRecord;
}

/**
 * Central authorization boundary for all existing report access.
 *
 * Authentication:
 *   requireCurrentProfile()
 *
 * Authorization:
 *   this helper
 *
 * Current access rules:
 *
 * patient
 *   → may access reports where patient_id === profile.id
 *
 * doctor
 *   → may access a report if:
 *       - doctor created the report
 *       OR
 *       - doctor has an ACTIVE relationship with the patient
 *
 * super_admin
 *   → may access any report
 *
 * Anonymous:
 *   → requireCurrentProfile() throws "Authentication required."
 *
 * IMPORTANT:
 * Subscription enforcement does NOT belong here yet.
 *
 * Later, generation-specific subscription authorization can be
 * layered on top of this helper.
 */
export async function requireReportAccess({
  reportId,
  action,
}: RequireReportAccessInput): Promise<AuthorizedReportAccess> {
  /**
   * ----------------------------------------------------------
   * 1. AUTHENTICATE
   * ----------------------------------------------------------
   */
  const profile = await requireCurrentProfile();

  /**
   * ----------------------------------------------------------
   * 2. VALIDATE REPORT ID
   * ----------------------------------------------------------
   */
  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    throw new ReportAccessError("INVALID_REPORT_ID", "Report ID is required.");
  }

  /**
   * ----------------------------------------------------------
   * 3. LOAD REPORT
   * ----------------------------------------------------------
   *
   * getReportById() uses our trusted admin Supabase client.
   *
   * Because admin bypasses RLS, authorization MUST happen here
   * before the report is exposed to an external request.
   */
  const report = await getReportById(normalizedReportId);

  if (!report) {
    throw new ReportAccessError("REPORT_NOT_FOUND", "Report not found.");
  }

  /**
   * ----------------------------------------------------------
   * 4. SUPER ADMIN
   * ----------------------------------------------------------
   */
  if (profile.role === "super_admin") {
    return {
      profile,
      report,
    };
  }

  /**
   * ----------------------------------------------------------
   * 5. PATIENT
   * ----------------------------------------------------------
   *
   * A patient can access only reports whose patient_id matches
   * their authenticated profile ID.
   *
   * Legacy reports with patient_id = NULL fail closed.
   */
  if (profile.role === "patient") {
    if (report.patientId !== null && report.patientId === profile.id) {
      return {
        profile,
        report,
      };
    }

    denyReportAccess({
      profileId: profile.id,
      role: profile.role,
      reportId: report.id,
      action,
    });
  }

  /**
   * ----------------------------------------------------------
   * 6. DOCTOR
   * ----------------------------------------------------------
   *
   * A doctor is allowed when:
   *
   * A) they created this report
   *
   * OR
   *
   * B) the report belongs to a patient with whom they have an
   *    ACTIVE doctor-patient relationship.
   */
  if (profile.role === "doctor") {
    const isReportCreator =
      report.createdByUserId !== null && report.createdByUserId === profile.id;

    if (isReportCreator) {
      return {
        profile,
        report,
      };
    }

    /**
     * A legacy unowned report cannot be authorized through a
     * doctor-patient relationship.
     */
    if (!report.patientId) {
      denyReportAccess({
        profileId: profile.id,
        role: profile.role,
        reportId: report.id,
        action,
      });
    }

    const hasActiveRelationship = await doctorHasActivePatientRelationship({
      doctorId: profile.id,
      patientId: report.patientId,
    });

    if (hasActiveRelationship) {
      return {
        profile,
        report,
      };
    }

    denyReportAccess({
      profileId: profile.id,
      role: profile.role,
      reportId: report.id,
      action,
    });
  }

  /**
   * ----------------------------------------------------------
   * 7. UNKNOWN / UNSUPPORTED ROLE
   * ----------------------------------------------------------
   *
   * Future role additions must fail closed until explicitly
   * authorized here.
   */
  denyReportAccess({
    profileId: profile.id,
    role: profile.role,
    reportId: report.id,
    action,
  });
}

/**
 * Narrow unknown errors in API routes without checking raw
 * string messages.
 */
export function isReportAccessError(
  error: unknown,
): error is ReportAccessError {
  return error instanceof ReportAccessError;
}

interface DenyReportAccessInput {
  profileId: string;
  role: string;
  reportId: string;
  action: ReportAccessAction;
}

function denyReportAccess({
  profileId,
  role,
  reportId,
  action,
}: DenyReportAccessInput): never {
  console.warn(
    `[Report Authorization] Denied action=${action}, user=${profileId}, role=${role}, report=${reportId}.`,
  );

  throw new ReportAccessError(
    "REPORT_ACCESS_DENIED",
    "You are not authorized to access this report.",
  );
}
