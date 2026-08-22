import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import "@/app/medical-report.css";
import { AssessmentProvider } from "@/context/AssesmentContext";
import Sidebar from "@/components/ui/Sidebar";
import { Toaster } from "sonner";
import { RecordingStatusProvider } from "@/context/VoiceRecordingStatusContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Health Monitoring Platform",
  description: "Browser-based health assessment application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body>
        <AssessmentProvider>
          <RecordingStatusProvider>
            <section className="flex">
              <Sidebar />
              <div className="flex-1 bg-surface lg:pl-72">{children}</div>
            </section>
          </RecordingStatusProvider>
        </AssessmentProvider>
        <Toaster
          richColors
          closeButton
          position="top-right"
          mobileOffset={300}
        />
      </body>
    </html>
  );
}
