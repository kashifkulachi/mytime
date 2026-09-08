// "use server";

// import { signupSchema } from "@/lib/schemas/signup.schema";
// import { createSupabaseServerClient } from "@/lib/supabase/server";

// export type SignupActionState = {
//   success: boolean;
//   message: string;
//   fieldErrors?: {
//     fullName?: string[];
//     email?: string[];
//     password?: string[];
//     confirmPassword?: string[];
//     role?: string[];
//   };
// };

// export async function signupAction(
//   _previousState: SignupActionState,
//   formData: FormData,
// ): Promise<SignupActionState> {
//   try {
//     const rawInput = {
//       fullName: formData.get("fullName"),
//       email: formData.get("email"),
//       password: formData.get("password"),
//       confirmPassword: formData.get("confirmPassword"),
//       role: formData.get("role"),
//     };

//     const validationResult = signupSchema.safeParse(rawInput);

//     if (!validationResult.success) {
//       const flattenedErrors = validationResult.error.flatten();

//       return {
//         success: false,
//         message: "Please correct the highlighted fields.",
//         fieldErrors: {
//           fullName: flattenedErrors.fieldErrors.fullName,
//           email: flattenedErrors.fieldErrors.email,
//           password: flattenedErrors.fieldErrors.password,
//           confirmPassword: flattenedErrors.fieldErrors.confirmPassword,
//           role: flattenedErrors.fieldErrors.role,
//         },
//       };
//     }

//     const { fullName, email, password, role } = validationResult.data;

//     const supabase = await createSupabaseServerClient();

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           full_name: fullName,
//           role,
//         },
//       },
//     });

//     if (error) {
//       return {
//         success: false,
//         message: getSignupErrorMessage(error.message),
//       };
//     }

//     if (!data.user) {
//       return {
//         success: false,
//         message: "Your account could not be created. Please try again.",
//       };
//     }

//     /**
//      * When email confirmation is enabled, Supabase normally creates
//      * the user but does not provide an authenticated session until
//      * the email address has been confirmed.
//      */
//     if (!data.session) {
//       return {
//         success: true,
//         message:
//           "Account created successfully. Please check your email to confirm your account.",
//       };
//     }

//     /**
//      * Some Supabase projects may have email confirmation disabled.
//      * In that case signup can immediately return a session.
//      */
//     return {
//       success: true,
//       message: "Account created successfully.",
//     };
//   } catch (error) {
//     console.error("Signup action failed:", error);

//     return {
//       success: false,
//       message: "We could not create your account right now. Please try again.",
//     };
//   }
// }

// function getSignupErrorMessage(message: string): string {
//   const normalizedMessage = message.toLowerCase();

//   if (
//     normalizedMessage.includes("already registered") ||
//     normalizedMessage.includes("already been registered") ||
//     normalizedMessage.includes("user already exists")
//   ) {
//     return "An account with this email already exists.";
//   }

//   if (
//     normalizedMessage.includes("password") &&
//     normalizedMessage.includes("weak")
//   ) {
//     return "The password does not meet the required security requirements.";
//   }

//   if (
//     normalizedMessage.includes("email") &&
//     normalizedMessage.includes("invalid")
//   ) {
//     return "Please enter a valid email address.";
//   }

//   if (normalizedMessage.includes("rate limit")) {
//     return "Too many signup attempts. Please try again later.";
//   }

//   return "Unable to create your account. Please check your information and try again.";
// }

"use server";

import { headers } from "next/headers";

import { signupSchema } from "@/lib/schemas/signup.schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignupActionState = {
  success: boolean;
  message: string;
  fieldErrors?: {
    fullName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    role?: string[];
  };
};

export async function signupAction(
  _previousState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  try {
    const rawInput = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      role: formData.get("role"),
    };

    const validationResult = signupSchema.safeParse(rawInput);

    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();

      return {
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          fullName: flattenedErrors.fieldErrors.fullName,
          email: flattenedErrors.fieldErrors.email,
          password: flattenedErrors.fieldErrors.password,
          confirmPassword: flattenedErrors.fieldErrors.confirmPassword,
          role: flattenedErrors.fieldErrors.role,
        },
      };
    }

    const { fullName, email, password, role } = validationResult.data;

    const supabase = await createSupabaseServerClient();

    const origin = await getRequestOrigin();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/confirm-email?next=/dashboard`,
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.error("Supabase signup failed:", {
        code: error.code,
        message: error.message,
      });

      return {
        success: false,
        message: getSignupErrorMessage(error.message),
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: "Your account could not be created. Please try again.",
      };
    }

    if (!data.session) {
      return {
        success: true,
        message:
          "Account created successfully. Please check your email to confirm your account.",
      };
    }

    return {
      success: true,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error("Signup action failed:", error);

    return {
      success: false,
      message: "We could not create your account right now. Please try again.",
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

function getSignupErrorMessage(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("user already exists")
  ) {
    return "An account with this email already exists.";
  }

  if (
    normalizedMessage.includes("password") &&
    normalizedMessage.includes("weak")
  ) {
    return "The password does not meet the required security requirements.";
  }

  if (
    normalizedMessage.includes("email") &&
    normalizedMessage.includes("invalid")
  ) {
    return "Please enter a valid email address.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "Too many signup attempts. Please try again later.";
  }

  return "Unable to create your account. Please check your information and try again.";
}
