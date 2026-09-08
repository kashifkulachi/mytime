"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/schemas/forgot-password.schema";

export type ForgotPasswordActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    email?: string[];
  };
};

export async function forgotPasswordAction(
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the email address and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email } = parsed.data;

  try {
    const supabase = await createSupabaseServerClient();
    const origin = await getRequestOrigin();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password/verify`,
    });

    if (error) {
      console.error("Forgot password request failed:", {
        code: error.code,
        message: error.message,
      });

      if (
        error.code === "over_request_rate_limit" ||
        error.code === "over_email_send_rate_limit"
      ) {
        return {
          success: false,
          message:
            "Too many reset requests were made. Please wait a moment and try again.",
        };
      }

      return {
        success: false,
        message:
          "Unable to send password reset instructions right now. Please try again.",
      };
    }

    /**
     * Keep this response intentionally generic.
     *
     * We do not reveal whether the supplied email address
     * belongs to an existing MyTime Health account.
     */
    return {
      success: true,
      message:
        "If an account exists for this email, password reset instructions have been sent.",
    };
  } catch (error) {
    console.error("Unexpected forgot password error:", error);

    return {
      success: false,
      message:
        "Unable to send password reset instructions right now. Please try again.",
    };
  }
}

async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();

  const forwardedHost = requestHeaders.get("x-forwarded-host");

  const host = forwardedHost ?? requestHeaders.get("host");

  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");

  if (!host) {
    throw new Error("Unable to determine application host.");
  }

  const protocol =
    forwardedProtocol ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}
