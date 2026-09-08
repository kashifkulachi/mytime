import "server-only";

import {
  type CurrentProfile,
  type UserRole,
} from "@/lib/auth/getCurrentProfile";
import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

/**
 * Requires the currently authenticated user to have one of the
 * explicitly allowed application roles.
 *
 * Examples:
 *
 * Doctor only:
 *   await requireRole("doctor");
 *
 * Doctor or super admin:
 *   await requireRole("doctor", "super_admin");
 *
 * Patient only:
 *   await requireRole("patient");
 *
 * Throws when:
 * - the user is unauthenticated
 * - the user's profile cannot be loaded
 * - the user's role is not permitted
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<CurrentProfile> {
  if (allowedRoles.length === 0) {
    throw new Error(
      "requireRole() must be called with at least one allowed role.",
    );
  }

  const profile = await requireCurrentProfile();

  if (!allowedRoles.includes(profile.role)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return profile;
}
