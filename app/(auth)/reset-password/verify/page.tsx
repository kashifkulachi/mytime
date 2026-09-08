"use client";

import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  KeyRound,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { verifyPasswordRecoveryAction } from "./actions";

import { Button } from "@/components/ui/button";

function PasswordRecoveryVerifyContent() {
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const isValidLink = Boolean(tokenHash && type === "recovery");

  const handleContinue = () => {
    if (!tokenHash || type !== "recovery") {
      return;
    }

    startTransition(() => {
      const formData = new FormData();

      formData.set("token_hash", tokenHash);
      formData.set("type", type);

      void verifyPasswordRecoveryAction(formData);
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

            {isValidLink ? (
              <>
                <div className="mb-8">
                  <div className="mb-5 flex h-[50px] w-[50px] items-center justify-center rounded-[12px] bg-blue-50 text-blue-700">
                    <KeyRound className="h-7 w-7" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Reset your password
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    Your password reset request is ready. Continue below to
                    securely verify this recovery link and choose a new
                    password.
                  </p>
                </div>

                <div className="mb-7 rounded-[12px] border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                    <p className="text-[13px] leading-[21px] text-slate-700">
                      For your security, simply opening this page does not
                      consume the password recovery link. Verification only
                      happens after you press the button below.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleContinue}
                  disabled={isPending}
                  className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue to Reset Password
                      <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                    </>
                  )}
                </Button>

                <p className="mt-5 text-center text-[12px] leading-5 text-slate-500">
                  Keep this page open while your recovery link is being
                  verified.
                </p>

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
            ) : (
              <>
                <div className="mb-8">
                  <div className="mb-5 flex h-[50px] w-[50px] items-center justify-center rounded-[12px] bg-amber-50 text-amber-700">
                    <TriangleAlert className="h-7 w-7" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Invalid recovery link
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    This password recovery link is incomplete or invalid. Please
                    request a new password reset email and open the link
                    directly from that message.
                  </p>
                </div>

                <Button className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]">
                  <Link href="/forgot-password">
                    Request a New Reset Link
                    <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                  </Link>
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

function PasswordRecoveryVerifyLoading() {
  return (
    <main className="h-screen overflow-hidden bg-[#f7f8fc]">
      <div className="grid h-full lg:grid-cols-2">
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

        <section className="flex h-screen items-center justify-center px-6 sm:px-10 lg:px-16">
          <div className="w-full max-w-[456px]">
            <div className="mb-[50px] flex items-center gap-3">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] bg-[#032b50] text-white">
                <HeartPulse className="h-[24px] w-[24px]" strokeWidth={2.5} />
              </div>

              <span className="text-[22px] font-bold tracking-[-0.5px] text-[#032b50]">
                MyTime Health
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Loader2 className="h-5 w-5 animate-spin" />

              <span className="text-[15px]">Loading recovery details...</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PasswordRecoveryVerifyPage() {
  return (
    <Suspense fallback={<PasswordRecoveryVerifyLoading />}>
      <PasswordRecoveryVerifyContent />
    </Suspense>
  );
}
