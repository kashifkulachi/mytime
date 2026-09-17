"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/* ============================================================
   VALIDATION
============================================================ */

const updateNameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be 100 characters or fewer."),
});

const updateEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .transform((value) => value.toLowerCase()),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/\d/, "Password must contain at least one number."),

    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((values) => values.currentPassword !== values.password, {
    path: ["password"],
    message: "Your new password must be different from your current password.",
  });

/* ============================================================
   TYPES
============================================================ */

export type ProfileActionState = {
  success: boolean;
  message: string;

  fieldErrors?: {
    fullName?: string[];
    email?: string[];
    currentPassword?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

/* ============================================================
   UPDATE FULL NAME
============================================================ */

export async function updateProfileNameAction(
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = updateNameSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your name and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return authenticationRequired();
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("[Profile] Failed to update full name:", {
        code: error.code,
        message: error.message,
        userId: user.id,
      });

      return {
        success: false,
        message: "Unable to update your name right now. Please try again.",
      };
    }

    /**
     * Keep the Auth user metadata synchronized with the
     * application profile.
     *
     * public.profiles remains the application's source of truth.
     */
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: parsed.data.fullName,
      },
    });

    if (metadataError) {
      /**
       * Do not roll back the profile update here.
       *
       * The authoritative application profile was already
       * updated successfully. Metadata synchronization is
       * secondary.
       */
      console.error("[Profile] Failed to synchronize name to auth metadata:", {
        code: metadataError.code,
        message: metadataError.message,
        userId: user.id,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      message: "Your name has been updated.",
    };
  } catch (error) {
    console.error("[Profile] Unexpected name update error:", error);

    return {
      success: false,
      message: "Unable to update your name right now. Please try again.",
    };
  }
}

/* ============================================================
   UPDATE EMAIL
============================================================ */

export async function updateProfileEmailAction(
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return authenticationRequired();
    }

    const currentEmail = user.email?.trim().toLowerCase();

    if (!currentEmail) {
      console.error("[Profile] Authenticated user does not have an email:", {
        userId: user.id,
      });

      return {
        success: false,
        message: "Unable to determine your current email address.",
      };
    }

    if (currentEmail === parsed.data.email) {
      return {
        success: false,
        message: "This is already your current email address.",
        fieldErrors: {
          email: ["Please enter a different email address."],
        },
      };
    }

    const supabase = await createSupabaseServerClient();

    /**
     * Email belongs to Supabase Auth.
     *
     * Do not independently update an email field in
     * public.profiles.
     */
    const { error } = await supabase.auth.updateUser({
      email: parsed.data.email,
    });

    if (error) {
      console.error("[Profile] Failed to request email change:", {
        code: error.code,
        message: error.message,
        userId: user.id,
      });

      if (
        error.code === "email_exists" ||
        error.code === "user_already_exists"
      ) {
        return {
          success: false,
          message: "Unable to use that email address.",
          fieldErrors: {
            email: ["Please use a different email address."],
          },
        };
      }

      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return {
          success: false,
          message:
            "Too many email requests. Please wait a moment and try again.",
        };
      }

      return {
        success: false,
        message: "Unable to update your email right now. Please try again.",
      };
    }

    return {
      success: true,
      message:
        "Email change requested. Please check your email for confirmation instructions.",
    };
  } catch (error) {
    console.error("[Profile] Unexpected email update error:", error);

    return {
      success: false,
      message: "Unable to update your email right now. Please try again.",
    };
  }
}

/* ============================================================
   CHANGE PASSWORD
============================================================ */

export async function changeProfilePasswordAction(
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your password information and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    /* --------------------------------------------------------
       1. REQUIRE AN AUTHENTICATED USER
    --------------------------------------------------------- */

    const user = await getCurrentUser();

    if (!user) {
      return authenticationRequired();
    }

    const email = user.email?.trim().toLowerCase();

    if (!email) {
      console.error("[Profile] Authenticated user does not have an email:", {
        userId: user.id,
      });

      return {
        success: false,
        message: "Unable to verify your account credentials.",
      };
    }

    /* --------------------------------------------------------
       2. VERIFY CURRENT PASSWORD
    --------------------------------------------------------- */

    const verificationClient = createPasswordVerificationClient();

    const { data: verificationData, error: verificationError } =
      await verificationClient.auth.signInWithPassword({
        email,
        password: parsed.data.currentPassword,
      });

    if (verificationError || !verificationData.user) {
      /**
       * Do not expose detailed authentication information
       * beyond what is necessary for the logged-in user.
       */
      if (
        verificationError?.code === "invalid_credentials" ||
        verificationError?.status === 400
      ) {
        return {
          success: false,
          message: "Your current password is incorrect.",
          fieldErrors: {
            currentPassword: [
              "The password you entered does not match your current password.",
            ],
          },
        };
      }

      if (verificationError?.status === 429) {
        return {
          success: false,
          message:
            "Too many verification attempts. Please wait a moment and try again.",
        };
      }

      console.error("[Profile] Current password verification failed:", {
        code: verificationError?.code,
        message: verificationError?.message,
        userId: user.id,
      });

      return {
        success: false,
        message:
          "Unable to verify your current password right now. Please try again.",
      };
    }

    /* --------------------------------------------------------
       3. DEFENSE-IN-DEPTH IDENTITY CHECK
    --------------------------------------------------------- */

    if (verificationData.user.id !== user.id) {
      /**
       * This should never normally happen because the email
       * came from the authenticated Supabase user.
       */
      console.error("[Profile] Password verification identity mismatch:", {
        authenticatedUserId: user.id,
        verifiedUserId: verificationData.user.id,
      });

      return {
        success: false,
        message: "Unable to verify your account credentials.",
      };
    }

    /* --------------------------------------------------------
       4. UPDATE PASSWORD USING THE REAL AUTHENTICATED SESSION
    --------------------------------------------------------- */

    const supabase = await createSupabaseServerClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      console.error("[Profile] Failed to change password:", {
        code: updateError.code,
        message: updateError.message,
        userId: user.id,
      });

      if (updateError.code === "same_password") {
        return {
          success: false,
          message:
            "Your new password must be different from your current password.",
          fieldErrors: {
            password: ["Please choose a different password."],
          },
        };
      }

      if (updateError.code === "weak_password") {
        return {
          success: false,
          message:
            "Your new password does not meet the password security requirements.",
          fieldErrors: {
            password: ["Please choose a stronger password."],
          },
        };
      }

      if (
        updateError.code === "session_not_found" ||
        updateError.code === "refresh_token_not_found"
      ) {
        return authenticationRequired();
      }

      return {
        success: false,
        message: "Unable to change your password right now. Please try again.",
      };
    }

    return {
      success: true,
      message: "Your password has been changed successfully.",
    };
  } catch (error) {
    console.error("[Profile] Unexpected password change error:", error);

    return {
      success: false,
      message: "Unable to change your password right now. Please try again.",
    };
  }
}

/* ============================================================
   PASSWORD VERIFICATION CLIENT
============================================================ */

function createPasswordVerificationClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.",
    );
  }

  /**
   * IMPORTANT:
   *
   * This is intentionally NOT our cookie-backed SSR client.
   *
   * We only use this isolated client to verify:
   *
   *   email + current password
   *
   * persistSession: false prevents the temporary verification
   * session from being persisted.
   *
   * autoRefreshToken: false prevents this temporary client from
   * maintaining its own long-lived authentication session.
   *
   * The resulting access/refresh tokens are never returned to
   * the browser and are discarded after this server action.
   *
   * Never use the Supabase service-role key here.
   */
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/* ============================================================
   HELPERS
============================================================ */

function authenticationRequired(): ProfileActionState {
  return {
    success: false,
    message: "Your session has expired. Please sign in again.",
  };
}
