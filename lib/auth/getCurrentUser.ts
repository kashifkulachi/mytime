import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated Supabase user.
 *
 * Returns:
 * - User → authenticated
 * - null → no authenticated session
 *
 * Throws:
 * - Unexpected Supabase/Auth errors
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    /**
     * An unauthenticated visitor can cause Supabase to report
     * that no auth session exists. That is an expected state,
     * not an application failure.
     */
    if (error.name === "AuthSessionMissingError") {
      return null;
    }

    throw new Error(`authentication failed. `);
  }

  return user;
}
