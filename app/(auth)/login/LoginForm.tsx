"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { loginAction } from "@/app/(auth)/login/actions";
import { resendConfirmationAction } from "@/app/(auth)/signup/resend-confirmation-action";

import { getAuthErrorMessage } from "@/lib/auth/getAuthErrorMessage";
import { loginSchema, type LoginInput } from "@/lib/schemas/login.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type LoginView = "login" | "resend-confirmation" | "resend-success";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const [isResending, startResendTransition] = useTransition();

  const [showPassword, setShowPassword] = useState(false);

  const errorCode = searchParams.get("error_code");

  const initialView: LoginView =
    errorCode?.toLowerCase() === "otp_expired"
      ? "resend-confirmation"
      : "login";

  const [view, setView] = useState<LoginView>(initialView);

  const [resendEmail, setResendEmail] = useState("");

  const [resendEmailError, setResendEmailError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    const registered = searchParams.get("registered");

    const currentErrorCode = searchParams.get("error_code");

    if (registered === "true") {
      toast.success(
        "Account created successfully. Please check your email to confirm your account.",
      );
    }

    if (currentErrorCode && currentErrorCode.toLowerCase() !== "otp_expired") {
      toast.error(getAuthErrorMessage(currentErrorCode));
    }

    if (registered || currentErrorCode) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const onSubmit = (values: LoginInput) => {
    startTransition(async () => {
      const formData = new FormData();

      formData.set("email", values.email);

      formData.set("password", values.password);

      const result = await loginAction(
        {
          success: false,
          message: "",
        },
        formData,
      );

      if (!result.success) {
        if (result.fieldErrors) {
          const fields = result.fieldErrors;

          if (fields.email?.[0]) {
            form.setError("email", {
              type: "server",
              message: fields.email[0],
            });
          }

          if (fields.password?.[0]) {
            form.setError("password", {
              type: "server",
              message: fields.password[0],
            });
          }
        }

        toast.error(result.message);

        return;
      }

      toast.success(result.message);

      router.replace("/dashboard");

      router.refresh();
    });
  };

  const handleResendConfirmation = () => {
    const normalizedEmail = resendEmail.trim().toLowerCase();

    setResendEmailError(null);

    if (!normalizedEmail) {
      setResendEmailError("Email address is required.");

      return;
    }

    startResendTransition(async () => {
      const formData = new FormData();

      formData.set("email", normalizedEmail);

      const result = await resendConfirmationAction(formData);

      if (!result.success) {
        if (result.fieldErrors?.email?.[0]) {
          setResendEmailError(result.fieldErrors.email[0]);
        }

        toast.error(result.message);

        return;
      }

      setResendEmail(normalizedEmail);

      setView("resend-success");
    });
  };

  const handleBackToLogin = () => {
    setView("login");
    setResendEmailError(null);
  };

  return (
    <main className="h-screen overflow-hidden bg-[#FFF]">
      <div className="grid h-full lg:grid-cols-2">
        {/* LEFT — HERO */}
        <section
          className="relative hidden h-screen overflow-hidden bg-slate-950 bg-cover bg-center lg:block"
          style={{
            backgroundImage: "url('/oximeter-assessment.jpg')",
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
              <Image
                src="/Logo.jpg"
                width={300}
                height={40}
                alt="MYTime Logo"
                quality={100}
                unoptimized
                className="object-cover"
              />
            </div>

            {/* NORMAL LOGIN */}
            {view === "login" && (
              <>
                <div className="mb-9">
                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Welcome back
                  </h1>

                  <p className="mt-1 text-[16px] leading-6 text-slate-700">
                    Sign in to access your health monitoring dashboard.
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

                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-sm font-semibold text-slate-950"
                          >
                            Password
                          </FieldLabel>

                          <Link
                            href="/forgot-password"
                            className="text-[13px] font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>

                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Enter your password"
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
                            className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
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

                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-[51px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]"
                  >
                    {isPending ? (
                      "Logging in..."
                    ) : (
                      <>
                        Log In
                        <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-[48px] text-center text-[14px] text-slate-700">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </>
            )}

            {/* RESEND CONFIRMATION */}
            {view === "resend-confirmation" && (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-blue-50 text-blue-700">
                    <Mail className="h-6 w-6" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Resend your confirmation email
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    This confirmation link has expired or has already been used.
                    If your email is already confirmed, you can return to login.
                    Otherwise, enter your email below and we&apos;ll send you a
                    new confirmation link.
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    handleResendConfirmation();
                  }}
                  className="space-y-6"
                  noValidate
                >
                  <Field data-invalid={Boolean(resendEmailError)}>
                    <FieldLabel
                      htmlFor="resend-email"
                      className="mb-2 block text-sm font-semibold text-slate-950"
                    >
                      Email Address
                    </FieldLabel>

                    <Input
                      id="resend-email"
                      type="email"
                      autoComplete="email"
                      value={resendEmail}
                      onChange={(event) => {
                        setResendEmail(event.target.value);

                        if (resendEmailError) {
                          setResendEmailError(null);
                        }
                      }}
                      placeholder="doctor@hospital.org"
                      disabled={isResending}
                      aria-invalid={Boolean(resendEmailError)}
                      className="h-[51px] rounded-[10px] border border-slate-300 bg-transparent px-4 text-[15px] shadow-none placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/15"
                    />

                    {resendEmailError && (
                      <FieldError
                        errors={[
                          {
                            message: resendEmailError,
                          },
                        ]}
                      />
                    )}
                  </Field>

                  <Button
                    type="submit"
                    disabled={isResending}
                    className="h-[51px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]"
                  >
                    {isResending ? (
                      "Sending..."
                    ) : (
                      <>
                        Resend confirmation email
                        <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={isResending}
                    className="mx-auto flex cursor-pointer items-center gap-2 text-[14px] font-medium text-slate-600 transition hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </button>
                </form>
              </>
            )}

            {/* RESEND SUCCESS */}
            {view === "resend-success" && (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Check your email
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    If an unconfirmed account exists for{" "}
                    <span className="font-semibold text-slate-950">
                      {resendEmail}
                    </span>
                    , a new confirmation link has been sent.
                  </p>

                  <p className="mt-3 text-[14px] leading-6 text-slate-600">
                    Open the email and follow the confirmation link to continue.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleBackToLogin}
                  className="h-[51px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]"
                >
                  Back to login
                  <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
