"use server";

import { loginSchema } from "@/lib/schemas/login.schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    const rawInput = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validationResult = loginSchema.safeParse(rawInput);

    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();

      return {
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          email: flattenedErrors.fieldErrors.email,
          password: flattenedErrors.fieldErrors.password,
        },
      };
    }

    const { email, password } = validationResult.data;

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: getLoginErrorMessage(error.message),
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        message:
          "Unable to establish an authenticated session. Please try again.",
      };
    }

    return {
      success: true,
      message: "Logged in successfully.",
    };
  } catch (error) {
    console.error("Login action failed:", error);

    return {
      success: false,
      message: "We could not log you in right now. Please try again.",
    };
  }
}

function getLoginErrorMessage(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("email_not_confirmed")
  ) {
    return "Please confirm your email address before logging in.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many login attempts. Please try again later.";
  }

  return "Unable to log in. Please check your credentials and try again.";
}
