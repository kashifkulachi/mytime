"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/schemas/forgot-password.schema";

import { forgotPasswordAction } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type ForgotPasswordView = "form" | "success";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState<ForgotPasswordView>("form");

  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    startTransition(async () => {
      const formData = new FormData();

      formData.set("email", values.email);

      try {
        const result = await forgotPasswordAction(formData);

        if (!result.success) {
          if (result.fieldErrors?.email?.[0]) {
            form.setError("email", {
              type: "server",
              message: result.fieldErrors.email[0],
            });
          }

          toast.error(result.message);

          return;
        }

        setSubmittedEmail(values.email);
        setView("success");
      } catch (error) {
        console.error("Unexpected forgot password client error:", error);

        toast.error(
          "Unable to send password reset instructions right now. Please try again.",
        );
      }
    });
  };

  return (
    <main className="h-screen overflow-hidden bg-[#f7f8fc]">
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
            <div className="mb-[50px] flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] bg-[#032b50] text-white">
                <HeartPulse className="h-[24px] w-[24px]" strokeWidth={2.5} />
              </div>

              <span className="text-[22px] font-bold tracking-[-0.5px] text-[#032b50]">
                MyTime Health
              </span>
            </div>

            {/* FORM */}
            {view === "form" && (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-blue-50 text-blue-700">
                    <Mail className="h-6 w-6" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Forgot your password?
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    Enter the email address associated with your account and
                    we&apos;ll send you instructions to reset your password.
                  </p>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                  noValidate
                >
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="mb-2 block text-sm font-semibold text-slate-950"
                        >
                          Email Address
                        </FieldLabel>

                        <Input
                          {...field}
                          id={field.name}
                          type="email"
                          autoComplete="email"
                          autoFocus
                          placeholder="doctor@hospital.org"
                          disabled={isPending}
                          aria-invalid={fieldState.invalid}
                          className="h-[51px] rounded-[10px] border border-slate-300 bg-transparent px-4 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
                        />

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Instructions
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
                    Check your email
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    If an account exists for{" "}
                    <span className="font-semibold text-slate-950">
                      {submittedEmail}
                    </span>
                    , password reset instructions have been sent.
                  </p>

                  <p className="mt-3 text-[14px] leading-6 text-slate-600">
                    Open the email and follow the reset link to choose a new
                    password.
                  </p>
                </div>

                <div className="rounded-[12px] border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                    <p className="text-[13px] leading-[21px] text-slate-700">
                      Didn&apos;t receive the email? Check your spam folder or
                      wait a moment before requesting another reset email.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setView("form");
                    form.clearErrors();
                  }}
                  className="mt-6 h-[51px] cursor-pointer w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]"
                >
                  Send Again
                  <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                </Button>

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-[14px] font-medium text-slate-600 transition hover:text-slate-950"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
