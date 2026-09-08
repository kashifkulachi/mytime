"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/schemas/reset-password.schema";

export type ResetPasswordActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function resetPasswordAction(
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your new password and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { password } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();

    /**
     * Security check:
     *
     * updateUser() requires an authenticated Supabase session.
     * For password recovery, that session must have been established
     * from the recovery link before this action is called.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) {
        console.error("Password reset session validation failed:", {
          code: userError.code,
          message: userError.message,
        });
      }

      return {
        success: false,
        message:
          "Your password reset session has expired or is invalid. Please request a new password reset email.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Password update failed:", {
        code: error.code,
        message: error.message,
      });

      if (error.code === "same_password") {
        return {
          success: false,
          message:
            "Your new password must be different from your current password.",
          fieldErrors: {
            password: [
              "Please choose a password different from your current password.",
            ],
          },
        };
      }

      if (error.code === "weak_password") {
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
        error.code === "session_not_found" ||
        error.code === "refresh_token_not_found" ||
        error.code === "refresh_token_already_used"
      ) {
        return {
          success: false,
          message:
            "Your password reset session has expired. Please request a new password reset email.",
        };
      }

      return {
        success: false,
        message: "Unable to update your password right now. Please try again.",
      };
    }

    return {
      success: true,
      message: "Your password has been updated successfully.",
    };
  } catch (error) {
    console.error("Unexpected password reset error:", error);

    return {
      success: false,
      message: "Unable to update your password right now. Please try again.",
    };
  }
}
