// "use client";

// import { useMemo } from "react";
// import Link from "next/link";
// import { ArrowLeft, ArrowRight, HeartPulse, MailCheck } from "lucide-react";

// import { confirmEmailAction } from "./actions";

// import { Button } from "@/components/ui/button";

// export default function ConfirmEmailPage() {
//   const confirmationData = useMemo(() => {
//     if (typeof window === "undefined") {
//       return {
//         tokenHash: null,
//         type: null,
//         next: "/dashboard",
//         isValid: false,
//       };
//     }

//     const params = new URLSearchParams(window.location.search);

//     const tokenHash = params.get("token_hash");
//     const type = params.get("type");
//     const next = getSafeNextPath(params.get("next"));

//     return {
//       tokenHash,
//       type,
//       next,
//       isValid: Boolean(tokenHash && type),
//     };
//   }, []);

//   return (
//     <main className="h-screen overflow-hidden bg-[#f7f8fc]">
//       <div className="grid h-full lg:grid-cols-2">
//         {/* LEFT — HERO */}
//         <section
//           className="relative hidden h-screen overflow-hidden bg-slate-950 bg-cover bg-center lg:block"
//           style={{
//             backgroundImage: "url('/images/auth/mytime-auth-doctor.jpg')",
//           }}
//         >
//           <div className="absolute inset-0 bg-[#062f55]/75" />
//           <div className="absolute inset-0 bg-slate-950/10" />

//           <div className="relative z-10 flex h-full flex-col px-[9%] py-[7.5%]">
//             <div className="mt-auto max-w-[530px] pb-[3%]">
//               <h1 className="text-[51px] font-bold leading-[1.12] tracking-[-1.8px] text-white">
//                 Better monitoring.
//                 <br />
//                 Better care.
//               </h1>

//               <p className="mt-6 max-w-[520px] text-[18px] font-medium leading-[30px] text-slate-200">
//                 Advanced clinical insights powering the next generation of
//                 patient outcomes.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* RIGHT — CONFIRMATION */}
//         <section className="flex h-screen items-center justify-center overflow-hidden px-6 sm:px-10 lg:px-16">
//           <div className="w-full max-w-[456px]">
//             {/* BRAND */}
//             <div className="mb-[50px] flex items-center gap-3">
//               <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] bg-[#032b50] text-white">
//                 <HeartPulse className="h-[24px] w-[24px]" strokeWidth={2.5} />
//               </div>

//               <span className="text-[22px] font-bold tracking-[-0.5px] text-[#032b50]">
//                 MyTime Health
//               </span>
//             </div>

//             {confirmationData.isValid ? (
//               <>
//                 <div className="mb-9">
//                   <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-blue-50 text-blue-700">
//                     <MailCheck className="h-6 w-6" />
//                   </div>

//                   <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
//                     Confirm your email
//                   </h1>

//                   <p className="mt-2 text-[15px] leading-6 text-slate-700">
//                     Your email address is almost verified. Click the button
//                     below to finish confirming your MyTime Health account.
//                   </p>
//                 </div>

//                 <form action={confirmEmailAction}>
//                   <input
//                     type="hidden"
//                     name="token_hash"
//                     value={confirmationData.tokenHash ?? ""}
//                   />

//                   <input
//                     type="hidden"
//                     name="type"
//                     value={confirmationData.type ?? ""}
//                   />

//                   <input
//                     type="hidden"
//                     name="next"
//                     value={confirmationData.next}
//                   />

//                   <Button
//                     type="submit"
//                     className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]"
//                   >
//                     Confirm Email
//                     <ArrowRight className="ml-1 h-[18px] w-[18px]" />
//                   </Button>
//                 </form>

//                 <p className="mt-5 text-[13px] leading-5 text-slate-500">
//                   This extra confirmation step helps protect your account from
//                   automated email-link scanners.
//                 </p>

//                 <Link
//                   href="/login"
//                   className="mt-7 flex items-center justify-center gap-2 text-[14px] font-medium text-slate-600 transition hover:text-slate-950"
//                 >
//                   <ArrowLeft className="h-4 w-4" />
//                   Back to login
//                 </Link>
//               </>
//             ) : (
//               <>
//                 <div className="mb-9">
//                   <div className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-slate-100 text-slate-700">
//                     <MailCheck className="h-6 w-6" />
//                   </div>

//                   <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
//                     Invalid confirmation link
//                   </h1>

//                   <p className="mt-2 text-[15px] leading-6 text-slate-700">
//                     This confirmation link is incomplete or invalid. Return to
//                     the login page and request a new confirmation email if
//                     needed.
//                   </p>
//                 </div>

//                 <Button className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]">
//                   <Link href="/login?error_code=invalid_token">
//                     Back to login
//                     <ArrowRight className="ml-1 h-[18px] w-[18px]" />
//                   </Link>
//                 </Button>
//               </>
//             )}
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

// function getSafeNextPath(next: string | null): string {
//   if (!next) {
//     return "/dashboard";
//   }

//   if (!next.startsWith("/") || next.startsWith("//")) {
//     return "/dashboard";
//   }

//   return next;
// }

"use client";

import { Suspense, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Loader2,
  MailCheck,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { confirmEmailAction } from "./actions";

import { Button } from "@/components/ui/button";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const next = getSafeNextPath(searchParams.get("next"));

  const isValidLink = Boolean(tokenHash && type);

  // const handleConfirm = () => {
  //   if (!tokenHash || !type) {
  //     toast.error("This confirmation link is invalid.");

  //     return;
  //   }

  //   startTransition(async () => {
  //     try {
  //       const formData = new FormData();

  //       formData.set("token_hash", tokenHash);

  //       formData.set("type", type);

  //       formData.set("next", next);

  //       await confirmEmailAction(formData);
  //     } catch (error) {
  //       console.error("Unable to confirm email:", error);

  //       toast.error(
  //         "Unable to confirm your email right now. Please try again.",
  //       );
  //     }
  //   });
  // };

  const handleConfirm = () => {
    if (!tokenHash || !type) {
      toast.error("This confirmation link is invalid.");

      return;
    }

    startTransition(() => {
      const formData = new FormData();

      formData.set("token_hash", tokenHash);

      formData.set("type", type);

      formData.set("next", next);

      void confirmEmailAction(formData);
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
                    <MailCheck className="h-7 w-7" />
                  </div>

                  <h1 className="text-[27px] font-bold tracking-[-0.5px] text-slate-950">
                    Confirm your email
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    Your account is almost ready. Confirm your email address to
                    securely activate your MyTime Health account.
                  </p>
                </div>

                <div className="mb-7 rounded-[12px] border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

                    <p className="text-[13px] leading-[21px] text-slate-700">
                      For security, your email is only confirmed after you press
                      the button below. Simply opening this page does not
                      activate your account.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="h-[51px] w-full cursor-pointer rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      Confirm Email
                      <ArrowRight className="ml-1 h-[18px] w-[18px]" />
                    </>
                  )}
                </Button>

                <p className="mt-5 text-center text-[12px] leading-5 text-slate-500">
                  Please keep this page open while your email is being
                  confirmed.
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
                    Invalid confirmation link
                  </h1>

                  <p className="mt-2 text-[15px] leading-6 text-slate-700">
                    This email confirmation link is incomplete or invalid.
                    Please open the confirmation link directly from the email
                    sent by MyTime Health.
                  </p>
                </div>

                <Button className="h-[51px] w-full rounded-[10px] bg-[#032b50] text-[15px] font-semibold text-white shadow-none hover:bg-[#062440]">
                  <Link href="/login">
                    Go to login
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

function ConfirmEmailLoading() {
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

              <span className="text-[15px]">
                Loading confirmation details...
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailLoading />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function getSafeNextPath(next: string | null): string {
  if (!next) {
    return "/dashboard";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
