// import type { Metadata } from "next";

// import "@/app/globals.css";
// import "@/app/medical-report.css";

// import { AssessmentProvider } from "@/context/AssesmentContext";
// import { RecordingStatusProvider } from "@/context/VoiceRecordingStatusContext";

// import Sidebar from "@/components/ui/Sidebar";
// import { Toaster } from "sonner";

// export const metadata: Metadata = {
//   title: "Health Monitoring Platform",
//   description: "Browser-based health assessment application",
// };

// export default function DashboardLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <>
//       <AssessmentProvider>
//         <RecordingStatusProvider>
//           <section className="flex min-h-screen">
//             <Sidebar />

//             <div className="flex-1 bg-surface lg:pl-72">{children}</div>
//           </section>
//         </RecordingStatusProvider>
//       </AssessmentProvider>

//       <Toaster richColors closeButton position="top-right" mobileOffset={300} />
//     </>
//   );
// }

import type { Metadata } from "next";

import { redirect } from "next/navigation";

import "@/app/globals.css";
import "@/app/medical-report.css";

import { AssessmentProvider } from "@/context/AssesmentContext";
import { RecordingStatusProvider } from "@/context/VoiceRecordingStatusContext";

import Sidebar from "@/components/ui/Sidebar";

import { Toaster } from "sonner";

import { requireCurrentProfile } from "@/lib/auth/requireCurrentProfile";

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
    /**
     * --------------------------------------------------------
     * AUTHENTICATED DASHBOARD
     * --------------------------------------------------------
     *
     * Every page under /dashboard now requires a valid
     * authenticated application profile.
     *
     * The role passed to Sidebar comes from the trusted
     * server-side profile — never from localStorage or client
     * metadata.
     */
    profile = await requireCurrentProfile();
  } catch (error) {
    /**
     * requireCurrentProfile() throws this when there is no
     * authenticated user.
     */
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      redirect("/login");
    }

    /**
     * Other profile/database errors should not be silently
     * treated as logout.
     */
    throw error;
  }

  return (
    <>
      <AssessmentProvider>
        <RecordingStatusProvider>
          <section className="flex min-h-screen">
            <Sidebar role={profile.role} />

            <div className="flex-1 bg-surface lg:pl-72">{children}</div>
          </section>
        </RecordingStatusProvider>
      </AssessmentProvider>

      <Toaster richColors closeButton position="top-right" mobileOffset={300} />
    </>
  );
}
