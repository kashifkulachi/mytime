// this code has the jwt issue when signout and login again
// import "server-only";

// import { getCurrentUser } from "@/lib/auth/getCurrentUser";
// import { createSupabaseServerClient } from "@/lib/supabase/server";

// export type UserRole = "doctor" | "patient" | "super_admin";

// export interface CurrentProfile {
//   id: string;
//   role: UserRole;
//   fullName: string | null;
//   createdAt: string;
//   updatedAt: string;
// }

// /**
//  * Returns the authenticated user's application profile.
//  *
//  * Returns:
//  * - CurrentProfile -> authenticated user with a valid profile
//  * - null -> user is not authenticated
//  *
//  * Throws:
//  * - profile query failures
//  * - missing profile for an authenticated user
//  */
// export async function getCurrentProfile(): Promise<CurrentProfile | null> {
//   const user = await getCurrentUser();

//   if (!user) {
//     return null;
//   }

//   const supabase = await createSupabaseServerClient();

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("id, role, full_name, created_at, updated_at")
//     .eq("id", user.id)
//     .single();

//   if (error) {
//     throw new Error(`Failed to retrieve current profile: ${error.message}`);
//   }

//   if (!data) {
//     throw new Error("Authenticated user does not have an application profile.");
//   }

//   return {
//     id: data.id,
//     role: data.role as UserRole,
//     fullName: data.full_name,
//     createdAt: data.created_at,
//     updatedAt: data.updated_at,
//   };
// }

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export type UserRole = "doctor" | "patient" | "super_admin";

export interface CurrentProfile {
  id: string;
  role: UserRole;
  fullName: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ProfileFetchError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);

    this.name = "ProfileFetchError";
  }
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        role,
        full_name,
        created_at,
        updated_at
      `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getCurrentProfile] Profile query failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: user.id,
    });

    throw new ProfileFetchError(
      "Unable to retrieve the current user profile.",
      error.code,
    );
  }

  if (!data) {
    throw new ProfileFetchError(
      "Authenticated user does not have a profile.",
      "PROFILE_NOT_FOUND",
    );
  }

  return {
    id: data.id,
    role: data.role as UserRole,
    fullName: data.full_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
