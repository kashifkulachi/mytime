"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const resendConfirmationSchema = z.object({
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
});

export type ResendConfirmationActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    email?: string[];
  };
};

export async function resendConfirmationAction(
  formData: FormData,
): Promise<ResendConfirmationActionState> {
  try {
    const validationResult = resendConfirmationSchema.safeParse({
      email: formData.get("email"),
    });

    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();

      return {
        success: false,
        message: "Please enter a valid email address.",
        fieldErrors: {
          email: flattenedErrors.fieldErrors.email,
        },
      };
    }

    const { email } = validationResult.data;

    const supabase = await createSupabaseServerClient();
    const origin = await getRequestOrigin();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/confirm-email?next=/dashboard`,
      },
    });

    if (error) {
      console.error("Resend confirmation failed:", {
        code: error.code,
        message: error.message,
      });

      return {
        success: false,
        message: getResendErrorMessage(error.code, error.message),
      };
    }

    /**
     * Keep this intentionally generic.
     *
     * We do not confirm whether an account exists for the
     * provided email because that can expose registered users.
     */
    return {
      success: true,
      message:
        "If an unconfirmed account exists for this email, a new confirmation link has been sent.",
    };
  } catch (error) {
    console.error("Unexpected resend confirmation error:", error);

    return {
      success: false,
      message:
        "We could not resend the confirmation email right now. Please try again.",
    };
  }
}

async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();

  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) {
    throw new Error("Unable to determine application host.");
  }

  const protocol =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

function getResendErrorMessage(
  code: string | undefined,
  message: string,
): string {
  const normalizedCode = code?.toLowerCase();
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedCode === "over_email_send_rate_limit" ||
    normalizedCode === "over_request_rate_limit" ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many confirmation emails have been requested. Please wait a moment and try again.";
  }

  if (
    normalizedMessage.includes("email") &&
    normalizedMessage.includes("invalid")
  ) {
    return "Please enter a valid email address.";
  }

  return "We could not resend the confirmation email right now. Please try again.";
}
