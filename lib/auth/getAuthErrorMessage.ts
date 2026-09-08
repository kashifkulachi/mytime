/**
 * Converts Supabase/Auth error codes into safe, user-friendly messages.
 *
 * Important:
 * - Do not expose raw Supabase/internal error messages to users.
 * - Unknown errors receive a generic message.
 * - Server-side code may still log the original error separately.
 */
export function getAuthErrorMessage(
  errorCode: string | null | undefined,
): string {
  if (!errorCode) {
    return "Authentication could not be completed. Please try again.";
  }

  const normalizedCode = errorCode.trim().toLowerCase();

  switch (normalizedCode) {
    /**
     * Email confirmation / OTP
     */
    case "otp_expired":
      return "Your confirmation link has expired. Please request a new confirmation email.";

    case "otp_disabled":
      return "Email confirmation is currently unavailable. Please try again later.";

    case "invalid_token":
    case "invalid_otp":
      return "This authentication link is invalid or has already been used.";

    /**
     * Authentication / credentials
     */
    case "invalid_credentials":
      return "Invalid email or password.";

    case "email_not_confirmed":
      return "Please confirm your email address before logging in.";

    case "user_not_found":
      return "Unable to authenticate with the provided information.";

    case "user_banned":
      return "This account is currently unavailable. Please contact support.";

    /**
     * Signup
     */
    case "user_already_exists":
    case "email_exists":
      return "An account with this email address already exists.";

    case "signup_disabled":
      return "New account registration is currently unavailable.";

    case "email_provider_disabled":
      return "Email authentication is currently unavailable.";

    /**
     * Password
     */
    case "weak_password":
      return "Your password does not meet the required security requirements.";

    case "same_password":
      return "Your new password must be different from your current password.";

    /**
     * Rate limiting
     */
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return "Too many authentication attempts. Please wait a moment and try again.";

    /**
     * Session
     */
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
      return "Your session has expired. Please log in again.";

    /**
     * Redirect/auth-provider failure
     */
    case "access_denied":
      return "This authentication request was denied or is no longer valid.";

    case "validation_failed":
      return "The authentication request is invalid. Please try again.";

    case "unexpected_failure":
      return "Authentication could not be completed right now. Please try again.";

    /**
     * Never expose unknown internal/provider messages.
     */
    default:
      return "Authentication could not be completed. Please try again.";
  }
}
