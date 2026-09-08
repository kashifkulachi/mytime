import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must not exceed 100 characters."),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must not exceed 128 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),

    confirmPassword: z.string(),

    role: z.enum(["doctor", "patient"], {
      message: "Please select a valid account type.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type SignupInput = z.infer<typeof signupSchema>;
