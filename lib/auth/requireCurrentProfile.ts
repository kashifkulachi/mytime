import "server-only";

import {
  getCurrentProfile,
  type CurrentProfile,
} from "@/lib/auth/getCurrentProfile";

/**
 * Returns the currently authenticated application profile.
 *
 * Throws when:
 * - the user is not authenticated
 * - the authenticated user does not have a valid profile
 * - retrieving the profile fails
 *
 * Use this helper in protected server-side flows where authentication
 * is required.
 */
export async function requireCurrentProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Authentication required.");
  }

  return profile;
}
