import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .email("Please enter a valid email address.")
    .trim()
    .min(1, "Email address is required.")
    .transform((value) => value.toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
