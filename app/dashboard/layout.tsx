// import type { Metadata } from "next";

// import { redirect } from "next/navigation";

// import "@/app/globals.css";
// import "@/app/medical-report.css";

// import { AssessmentProvider } from "@/context/AssesmentContext";
// import { RecordingStatusProvider } from "@/context/VoiceRecordingStatusContext";

// import Sidebar from "@/components/ui/Sidebar";

// import { Toaster } from "sonner";

// import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

// export const metadata: Metadata = {
//   title: "Health Monitoring Platform",
//   description: "Browser-based health assessment application",
// };

// export default async function DashboardLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   let profile;

//   try {
//     /**
//      * --------------------------------------------------------
//      * AUTHENTICATED DASHBOARD
//      * --------------------------------------------------------
//      *
//      * Every page under /dashboard now requires a valid
//      * authenticated application profile.
//      *
//      * The role passed to Sidebar comes from the trusted
//      * server-side profile — never from localStorage or client
//      * metadata.
//      */
//     profile = await requireCurrentProfile();
//   } catch (error) {
//     /**
//      * requireCurrentProfile() throws this when there is no
//      * authenticated user.
//      */
//     if (
//       error instanceof Error &&
//       error.message === "Authentication required."
//     ) {
//       redirect("/login");
//     }

//     /**
//      * Other profile/database errors should not be silently
//      * treated as logout.
//      */
//     throw error;
//   }

//   return (
//     <>
//       <AssessmentProvider>
//         <RecordingStatusProvider>
//           <section className="flex min-h-screen">
//             <Sidebar role={profile.role} />

//             <div className="flex-1 bg-surface lg:pl-72">{children}</div>
//           </section>
//         </RecordingStatusProvider>
//       </AssessmentProvider>

//       <Toaster richColors closeButton position="top-right" mobileOffset={300} />
//     </>
//   );
// }
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

import "@/app/globals.css";
import "@/app/medical-report.css";

import { AssessmentProvider } from "@/context/AssesmentContext";
import { RecordingStatusProvider } from "@/context/VoiceRecordingStatusContext";

import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";

import {
  getCurrentProfile,
  ProfileFetchError,
} from "@/lib/auth/getCurrentProfile";

export const metadata: Metadata = {
  title: "Health Monitoring Platform",
  description: "Browser-based health assessment application",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profile;

  try {
    profile = await getCurrentProfile();
  } catch (error) {
    if (error instanceof ProfileFetchError) {
      console.error("[DashboardLayout] Unable to load authenticated profile:", {
        code: error.code,
        message: error.message,
      });

      return <DashboardAuthenticationError />;
    }

    /**
     * Unexpected programming/application errors should
     * continue through Next.js error handling.
     */
    throw error;
  }

  /**
   * No profile here means there is no authenticated user.
   */
  if (!profile) {
    redirect("/login");
  }

  return (
    <>
      <AssessmentProvider>
        <RecordingStatusProvider>
          <section className="flex min-h-screen bg-surface">
            {/* SIDEBAR */}
            <Sidebar role={profile.role} />

            {/* DASHBOARD */}
            <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-72">
              <DashboardHeader
                fullName={profile.fullName}
                role={profile.role}
              />

              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </section>
        </RecordingStatusProvider>
      </AssessmentProvider>

      <Toaster richColors closeButton position="top-right" mobileOffset={300} />
    </>
  );
}

function DashboardAuthenticationError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-6">
      <div className="w-full max-w-[500px] rounded-[14px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[10px] bg-amber-50 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-[24px] font-bold tracking-[-0.4px] text-slate-950">
          We couldn&apos;t load your account
        </h1>

        <p className="mt-2 text-[15px] leading-6 text-slate-600">
          We&apos;re having trouble verifying your account information right
          now. Your session may still be valid. Please try again.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button className="h-[48px] flex-1 rounded-[9px] bg-[#032b50] font-semibold text-white hover:bg-[#062440]">
            <Link href="/dashboard">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Link>
          </Button>

          <Button variant="outline" className="h-[48px] flex-1 rounded-[9px]">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <p className="mt-5 text-[12px] leading-5 text-slate-500">
          If the problem continues, please try again in a few moments.
        </p>
      </div>
    </main>
  );
}
