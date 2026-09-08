"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConfirmEmailActionState = {
  success: boolean;
  message: string;
};

export async function confirmEmailAction(formData: FormData): Promise<void> {
  const tokenHash = getString(formData.get("token_hash"));
  const type = getString(formData.get("type"));
  const next = getSafeNextPath(getString(formData.get("next")));

  if (!tokenHash || !type) {
    redirect("/login?error_code=invalid_token");
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (error) {
      console.error("Email confirmation failed:", {
        code: error.code,
        message: error.message,
      });

      const errorCode = error.code ?? "invalid_token";

      redirect(`/login?error_code=${encodeURIComponent(errorCode)}`);
    }

    /**
     * verifyOtp() establishes the authenticated
     * Supabase session in this browser.
     *
     * Because this action runs after a real user
     * click, email scanners cannot consume the
     * token merely by loading the email link.
     */
    const destination = addConfirmedQueryParam(next);

    redirect(destination);
  } catch (error) {
    /**
     * Next.js redirect() internally throws a special
     * redirect error, so it must not be converted
     * into an authentication failure.
     */
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Unexpected email confirmation error:", error);

    redirect("/login?error_code=unexpected_failure");
  }
}

function getString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function getSafeNextPath(next: string | null): string {
  if (!next) {
    return "/dashboard";
  }

  /**
   * Only allow local application paths.
   *
   * Allowed:
   * /dashboard
   * /dashboard/reports
   *
   * Rejected:
   * https://example.com
   * //example.com
   */
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function addConfirmedQueryParam(pathname: string): string {
  const separator = pathname.includes("?") ? "&" : "?";

  return `${pathname}${separator}confirmed=true`;
}

function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!("digest" in error)) {
    return false;
  }

  const digest = (
    error as {
      digest?: unknown;
    }
  ).digest;

  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
