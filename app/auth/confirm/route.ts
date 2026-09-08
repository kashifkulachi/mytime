import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  /**
   * If Supabase redirects here with an explicit auth error,
   * preserve only the safe error code and send the user to login.
   */
  const incomingErrorCode =
    requestUrl.searchParams.get("error_code") ??
    requestUrl.searchParams.get("error");

  if (incomingErrorCode) {
    return redirectToLoginWithError(request, incomingErrorCode);
  }

  if (!tokenHash || !type) {
    return redirectToLoginWithError(request, "invalid_token");
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error("Email confirmation failed:", {
        code: error.code,
        message: error.message,
      });

      return redirectToLoginWithError(request, error.code ?? "invalid_token");
    }

    const successUrl = new URL(next, request.url);

    successUrl.searchParams.set("confirmed", "true");

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Unexpected email confirmation error:", error);

    return redirectToLoginWithError(request, "unexpected_failure");
  }
}

function redirectToLoginWithError(request: NextRequest, errorCode: string) {
  const url = new URL("/login", request.url);

  url.searchParams.set("error_code", errorCode);

  return NextResponse.redirect(url);
}

/**
 * Prevent open redirects.
 *
 * Allowed:
 *   /dashboard
 *   /dashboard/reports
 *
 * Rejected:
 *   https://malicious-site.com
 *   //malicious-site.com
 */
function getSafeNextPath(next: string | null): string {
  if (!next) {
    return "/dashboard";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
