"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LogoutActionState = {
  success: boolean;
  message: string;
};

export async function logoutAction(): Promise<LogoutActionState> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);

      return {
        success: false,
        message: "Unable to log out right now. Please try again.",
      };
    }

    return {
      success: true,
      message: "Logged out successfully.",
    };
  } catch (error) {
    console.error("Unexpected logout error:", error);

    return {
      success: false,
      message: "Unable to log out right now. Please try again.",
    };
  }
}
