"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/reset-password.schema";

import { resetPasswordAction } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type ResetPasswordView = "form" | "success";

export default function ResetPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<ResetPasswordView>("form");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (values: ResetPasswordInput) => {
    startTransition(async () => {
      const formData = new FormData();

      formData.set("password", values.password);

      formData.set("confirmPassword", values.confirmPassword);

      try {
        const result = await resetPasswordAction(formData);

        if (!result.success) {
          if (result.fieldErrors?.password?.[0]) {
            form.setError("password", {
              type: "server",
              message: result.fieldErrors.password[0],
            });
          }

          if (result.fieldErrors?.confirmPassword?.[0]) {
            form.setError("confirmPassword", {
              type: "server",
              message: result.fieldErrors.confirmPassword[0],
            });
          }

          toast.error(result.message);

          return;
        }

        form.reset();

        setView("success");
      } catch (error) {
        console.error("Unexpected reset password client error:", error);

        toast.error(
          "Unable to update your password right now. Please try again.",
        );
      }
    });
  };

  return (
    <main className="h-screen  bg-[#f7f8fc]">
      <div className="grid h-full lg:grid-cols-2">
        {/* LEFT — HERO */}
        <section
          className="relative hidden h-screen overflow-hidden bg-slate-950 bg-cover bg-center lg:block"
          style={{
            backgroundImage: "url('/images/auth/mytime-auth-doctor.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-[#062f55]/75" />
          <div className="absolute inset-0 bg-slate-950/10" />

          <div className="relative z-10 flex h-full flex-col px-[9%] py-[7.5%]">
            <div className="mt-auto max-w-[530px] pb-[3%]">
              <h1 className="text-[51px] font-bold leading-[1.12] tracking-[-1.8px] text-white">
                Better monitoring.
                <br />
                Better care.
              </h1>

              <p className="mt-6 max-w-[520px] text-[18px] font-medium leading-[30px] text-slate-200">
                Advanced clinical insights powering the next generation of
                patient outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <section className="flex h-screen items-center justify-center overflow-hidden px-6 sm:px-10 lg:px-16">
          <div className="w-full max-w-[456px]">
            {/* BRAND */}

            {/* FORM */}
            {view === "form" && (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-blue-50 text-blue-700">
                    <KeyRound className="h-6 w-6" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Create a new password
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    Enter a new password for your MyTime Health account.
                  </p>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                  noValidate
                >
                  {/* PASSWORD */}
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                          New Password
                        </FieldLabel>

                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Enter your new password"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                            className="h-[51px] rounded-[10px] border border-slate-300 bg-transparent px-4 pr-12 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
                          />

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* CONFIRM PASSWORD */}
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                          Confirm New Password
                        </FieldLabel>

                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm your new password"
                            disabled={isPending}
                            aria-invalid={fieldState.invalid}
                            className="h-[51px] rounded-[10px] border border-slate-300 bg-transparent px-4 pr-12 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
                          />

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              setShowConfirmPassword((current) => !current)
                            }
                            className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="rounded-[12px] border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-[13px] leading-[21px] text-slate-700">
                      Your password must be at least 8 characters and include an
                      uppercase letter, a lowercase letter, and a number.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-[51px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        Update Password
                        <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/login"
                    className={`flex items-center gap-2 text-[14px] font-medium text-slate-600 transition hover:text-slate-950 ${
                      isPending ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </>
            )}

            {/* SUCCESS */}
            {view === "success" && (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Password updated
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    Your password has been changed successfully. You can now use
                    your new password to sign in to MyTime Health.
                  </p>
                </div>

                <Button className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]">
                  <Link href="/login" className="flex gap-5">
                    Continue to Login
                    <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
