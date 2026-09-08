"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function verifyPasswordRecoveryAction(
  formData: FormData,
): Promise<void> {
  const tokenHash = getString(formData.get("token_hash"));

  const type = getString(formData.get("type"));

  if (!tokenHash || type !== "recovery") {
    redirect("/forgot-password?error_code=invalid_token");
  }

  let verificationErrorCode: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error) {
      console.error("Password recovery verification failed:", {
        code: error.code,
        message: error.message,
      });

      verificationErrorCode = error.code ?? "invalid_token";
    }
  } catch (error) {
    console.error("Unexpected password recovery verification error:", error);

    redirect("/forgot-password?error_code=unexpected_failure");
  }

  if (verificationErrorCode) {
    redirect(
      `/forgot-password?error_code=${encodeURIComponent(
        verificationErrorCode,
      )}`,
    );
  }

  /**
   * verifyOtp() has now established the Supabase
   * recovery session in this user's browser.
   *
   * The reset-password page can safely call
   * updateUser({ password }) afterward.
   */
  redirect("/reset-password?recovery=verified");
}

function getString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}
