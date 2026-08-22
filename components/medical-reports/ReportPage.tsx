import type { ReactNode } from "react";

interface ReportPageProps {
  children: ReactNode;
  className?: string;
}

export function ReportPage({
  children,
  className = "w-full",
}: ReportPageProps) {
  return (
    <section
      className={[
        "medical-report-page",
        "relative mx-auto overflow-hidden bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
