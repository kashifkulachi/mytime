// // "use client";
// // import { useAssessment } from "@/hooks/useAssessment";
// // import {
// //   Activity,
// //   CalendarDays,
// //   Calculator,
// //   CheckCircle2,
// //   ClipboardList,
// //   FileText,
// //   HeartPulse,
// //   Info,
// //   Ruler,
// //   Scale,
// //   ShieldCheck,
// //   UserRound,
// // } from "lucide-react";

// // type ReportBreakdownValue = string | number | boolean | null | undefined;

// // export interface ReportData {
// //   breakdown?: Record<string, ReportBreakdownValue>;
// //   calculatedAt: string;
// //   evaluationDate: string;
// //   formulaVersion: string;
// //   functionalCondition: string;
// //   ifi: number;
// //   mainGroup: string;
// //   rawIfi: number;
// // }

// // interface ReportProps {
// //   patientName?: string;
// //   onBack?: () => void;
// //   onPrint?: () => void;
// // }

// // const formatDate = (date: string, includeTime = false): string => {
// //   const parsedDate = new Date(date);

// //   if (Number.isNaN(parsedDate.getTime())) {
// //     return date;
// //   }

// //   return new Intl.DateTimeFormat("en-US", {
// //     year: "numeric",
// //     month: "long",
// //     day: "numeric",
// //     ...(includeTime
// //       ? {
// //           hour: "numeric",
// //           minute: "2-digit",
// //         }
// //       : {}),
// //   }).format(parsedDate);
// // };

// // const formatNumber = (
// //   value: number | null,
// //   maximumFractionDigits = 2,
// // ): string => {
// //   if (value == null) {
// //     return "";
// //   }
// //   return new Intl.NumberFormat("en-US", {
// //     maximumFractionDigits,
// //   }).format(value);
// // };

// // const formatLabel = (key: string): string =>
// //   key
// //     .replace(/([a-z])([A-Z])/g, "$1 $2")
// //     .replace(/[_-]/g, " ")
// //     .replace(/\b\w/g, (letter) => letter.toUpperCase());

// // const formatBreakdownValue = (
// //   key: string,
// //   value: ReportBreakdownValue,
// // ): string => {
// //   if (value === null || value === undefined) {
// //     return "Not available";
// //   }

// //   if (typeof value === "boolean") {
// //     return value ? "Yes" : "No";
// //   }

// //   if (typeof value === "number") {
// //     if (key.toLowerCase().includes("difference")) {
// //       return formatNumber(value, 4);
// //     }

// //     return formatNumber(value, 2);
// //   }

// //   return value;
// // };

// // const getBreakdownIcon = (key: string) => {
// //   const normalizedKey = key.toLowerCase();

// //   if (normalizedKey.includes("sex")) {
// //     return UserRound;
// //   }

// //   if (normalizedKey.includes("height")) {
// //     return Ruler;
// //   }

// //   if (normalizedKey.includes("bmi") || normalizedKey.includes("weight")) {
// //     return Scale;
// //   }

// //   return Calculator;
// // };

// // const getIfiStatus = (ifi: number) => {
// //   if (ifi >= 0) {
// //     return {
// //       label: "Within expected range",
// //       description:
// //         "The calculated IFI value is within the expected non-negative range.",
// //       containerClass:
// //         "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
// //       badgeClass:
// //         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
// //     };
// //   }

// //   return {
// //     label: "Clinical attention indicated",
// //     description:
// //       "The calculated IFI value is negative and should be interpreted alongside the full clinical assessment.",
// //     containerClass:
// //       "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
// //     badgeClass:
// //       "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
// //   };
// // };

// // export default function Page({ patientName, onBack, onPrint }: ReportProps) {
// //   const {
// //     assessment: { result: report },
// //   } = useAssessment();

// //   if (!report) {
// //     return null;
// //   }

// //   // const status = getIfiStatus(report?.IFI?.ifi);
// //   const breakdownItems = Object.entries(report?.IFI?.breakdown ?? {});

// //   const handlePrint = () => {
// //     if (onPrint) {
// //       onPrint();
// //       return;
// //     }

// //     window.print();
// //   };

// //   return (
// //     <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
// //       <div className="mx-auto max-w-6xl">
// //         <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
// //           <div>
// //             <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
// //               Assessment results
// //             </p>

// //             <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
// //               Functional Index Report
// //             </h1>

// //             <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
// //               Review the calculated result and formula breakdown.
// //             </p>
// //           </div>

// //           <div className="flex items-center gap-3">
// //             {onBack && (
// //               <button
// //                 type="button"
// //                 onClick={onBack}
// //                 className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
// //               >
// //                 Back
// //               </button>
// //             )}

// //             <button
// //               type="button"
// //               onClick={handlePrint}
// //               className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-950"
// //             >
// //               <FileText className="h-4 w-4" />
// //               Print report
// //             </button>
// //           </div>
// //         </div>

// //         <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
// //           <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-8 text-white sm:px-8">
// //             <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
// //             <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

// //             <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
// //               <div>
// //                 <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
// //                   <HeartPulse className="h-6 w-6" />
// //                 </div>

// //                 <p className="text-sm font-medium text-indigo-100">
// //                   Clinical assessment report
// //                 </p>

// //                 <h2 className="mt-1 text-3xl font-bold tracking-tight">
// //                   {patientName || "Patient Report"}
// //                 </h2>

// //                 <div className="mt-4 flex flex-wrap gap-2">
// //                   <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
// //                     {report?.IFI?.mainGroup}
// //                   </span>

// //                   <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
// //                     {report?.IFI?.functionalCondition}
// //                   </span>
// //                 </div>
// //               </div>

// //               <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur sm:min-w-56">
// //                 <p className="text-sm text-indigo-100">Final IFI score</p>

// //                 <p className="mt-1 text-5xl font-bold tracking-tight">
// //                   {/* {formatNumber()} */}
// //                   {report?.IFI?.ifi}
// //                 </p>

// //                 <p className="mt-2 text-sm text-indigo-100">
// //                   Raw value: {report?.IFI?.rawIfi}
// //                 </p>
// //               </div>
// //             </div>
// //           </header>

// //           {/* <div className="space-y-8 p-6 sm:p-8">
// //             <section
// //               className={`rounded-2xl border p-5 ${status.containerClass}`}
// //             >
// //               <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
// //                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm dark:bg-white/10">
// //                   <Activity className="h-5 w-5" />
// //                 </div>

// //                 <div className="flex-1">
// //                   <div className="flex flex-wrap items-center gap-2">
// //                     <h3 className="font-semibold">Result interpretation</h3>

// //                     <span
// //                       className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}
// //                     >
// //                       {status.label}
// //                     </span>
// //                   </div>

// //                   <p className="mt-2 text-sm leading-6 opacity-80">
// //                     {status.description}
// //                   </p>
// //                 </div>
// //               </div>
// //             </section>

// //             <section>
// //               <div className="mb-4 flex items-center gap-3">
// //                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
// //                   <ClipboardList className="h-5 w-5" />
// //                 </div>

// //                 <div>
// //                   <h3 className="font-semibold">Assessment summary</h3>
// //                   <p className="text-sm text-slate-500 dark:text-slate-400">
// //                     Core classification and calculation details.
// //                   </p>
// //                 </div>
// //               </div>

// //               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
// //                 <SummaryCard
// //                   icon={CalendarDays}
// //                   label="Evaluation date"
// //                   value={formatDate(report?.IFI?.evaluationDate)}
// //                 />

// //                 <SummaryCard
// //                   icon={HeartPulse}
// //                   label="Functional condition"
// //                   value={report?.IFI?.functionalCondition}
// //                 />

// //                 <SummaryCard
// //                   icon={ShieldCheck}
// //                   label="Main group"
// //                   value={report?.IFI?.mainGroup}
// //                 />

// //                 <SummaryCard
// //                   icon={Calculator}
// //                   label="Formula version"
// //                   value={`v${report?.IFI?.formulaVersion}`}
// //                 />
// //               </div>
// //             </section>

// //             <section>
// //               <div className="mb-4 flex items-center gap-3">
// //                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
// //                   <Calculator className="h-5 w-5" />
// //                 </div>

// //                 <div>
// //                   <h3 className="font-semibold">Calculation breakdown</h3>
// //                   <p className="text-sm text-slate-500 dark:text-slate-400">
// //                     Values used when calculating the final IFI result.
// //                   </p>
// //                 </div>
// //               </div>

// //               {breakdownItems.length > 0 ? (
// //                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
// //                   {breakdownItems.map(([key, value]) => {
// //                     const Icon = getBreakdownIcon(key);

// //                     return (
// //                       <article
// //                         key={key}
// //                         className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-indigo-900 dark:hover:bg-slate-950"
// //                       >
// //                         <div className="flex items-start justify-between gap-3">
// //                           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition group-hover:text-indigo-600 dark:bg-slate-900 dark:ring-slate-800 dark:group-hover:text-indigo-400">
// //                             <Icon className="h-5 w-5" />
// //                           </div>

// //                           <CheckCircle2 className="h-4 w-4 text-emerald-500" />
// //                         </div>

// //                         <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
// //                           {formatLabel(key)}
// //                         </p>

// //                         <p className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-white">
// //                           {formatBreakdownValue(key, value)}
// //                         </p>
// //                       </article>
// //                     );
// //                   })}
// //                 </div>
// //               ) : (
// //                 <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
// //                   <Info className="mx-auto h-6 w-6 text-slate-400" />

// //                   <p className="mt-3 font-medium">
// //                     No calculation breakdown available
// //                   </p>

// //                   <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
// //                     Breakdown information was not included in this report.
// //                   </p>
// //                 </div>
// //               )}
// //             </section>

// //             <footer className="flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
// //               <div className="flex items-center gap-2">
// //                 <CalendarDays className="h-4 w-4" />

// //                 <span>
// //                   Calculated {formatDate(report?.IFI?.calculatedAt, true)}
// //                 </span>
// //               </div>

// //               <div className="flex items-center gap-2">
// //                 <ShieldCheck className="h-4 w-4" />

// //                 <span>Formula version {report?.IFI?.formulaVersion}</span>
// //               </div>
// //             </footer>
// //           </div> */}
// //         </section>

// //         <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-400 print:mt-8">
// //           This report presents a calculated assessment result and should be
// //           interpreted by an appropriately qualified healthcare professional in
// //           conjunction with the complete patient assessment.
// //         </p>
// //       </div>
// //     </main>
// //   );
// // }

// // interface SummaryCardProps {
// //   icon: React.ElementType;
// //   label: string;
// //   value: string;
// // }

// // function SummaryCard({ icon: Icon, label, value }: SummaryCardProps) {
// //   return (
// //     <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
// //       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-800">
// //         <Icon className="h-5 w-5" />
// //       </div>

// //       <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{label}</p>

// //       <p className="mt-1 font-semibold text-slate-900 dark:text-white">
// //         {value}
// //       </p>
// //     </article>
// //   );
// // }
// "use client";

// import {
//   Activity,
//   Check,
//   CircleCheck,
//   Download,
//   FileCheck2,
//   Loader2,
//   LoaderCircle,
//   RefreshCw,
// } from "lucide-react";
// import { useParams } from "next/navigation";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// type PdfStatus = "pending" | "generating" | "ready" | "failed";

// interface ReportApiResponse {
//   success: boolean;

//   report?: {
//     id: string;

//     patient: {
//       name: string;
//       dateOfBirth: string;
//       evaluationDate: string;
//     };

//     results: {
//       IFI: {
//         ifi: number;
//       };

//       BiologicalAge: {
//         displayBiologicalAgeYears: number;
//       };
//     };

//     pdf: {
//       status: PdfStatus;
//       path: string | null;
//       generatedAt: string | null;
//       error: string | null;
//     };

//     createdAt: string;
//     updatedAt: string;
//   };

//   message?: string;
//   error?: string;
// }

// type Report = NonNullable<ReportApiResponse["report"]>;

// const POLLING_INTERVAL_MS = 5_500;

// function formatDate(date: string | null | undefined): string {
//   if (!date) {
//     return "—";
//   }

//   const parsedDate = new Date(date);

//   if (Number.isNaN(parsedDate.getTime())) {
//     return date;
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//   }).format(parsedDate);
// }

// function formatShortDate(date: string | null | undefined): string {
//   if (!date) {
//     return "—";
//   }

//   const parsedDate = new Date(date);

//   if (Number.isNaN(parsedDate.getTime())) {
//     return date;
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   }).format(parsedDate);
// }

// function formatDateTime(date: string | null | undefined): string {
//   if (!date) {
//     return "—";
//   }

//   const parsedDate = new Date(date);

//   if (Number.isNaN(parsedDate.getTime())) {
//     return date;
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//   }).format(parsedDate);
// }

// function getInitials(name: string): string {
//   const parts = name.trim().split(/\s+/).filter(Boolean);

//   if (parts.length === 0) {
//     return "?";
//   }

//   if (parts.length === 1) {
//     return parts[0].slice(0, 2).toUpperCase();
//   }

//   return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
// }

// function getShortReportId(reportId: string): string {
//   if (reportId.length <= 12) {
//     return reportId.toUpperCase();
//   }

//   return reportId.slice(0, 8).toUpperCase();
// }

// export default function ReportPage() {
//   const params = useParams<{ reportId: string }>();

//   const reportId = params.reportId;

//   const [report, setReport] = useState<Report | null>(null);

//   const [isLoading, setIsLoading] = useState(true);
//   const [isDowloading, setIsDowloading] = useState(false);

//   const [isStartingGeneration, setIsStartingGeneration] = useState(false);

//   const [pageError, setPageError] = useState<string | null>(null);

//   /*
//    * Prevent the same page instance from firing multiple
//    * generation requests while React rerenders.
//    */
//   const generationRequestedRef = useRef(false);

//   const fetchReport = useCallback(async () => {
//     if (!reportId) {
//       return null;
//     }

//     const response = await fetch(
//       `/api/reports/${encodeURIComponent(reportId)}`,
//       {
//         method: "GET",
//         cache: "no-store",
//       },
//     );

//     const data = (await response.json()) as ReportApiResponse;

//     if (!response.ok || !data.success || !data.report) {
//       throw new Error(
//         data.message || data.error || "Unable to load the medical report.",
//       );
//     }

//     setReport(data.report);

//     return data.report;
//   }, [reportId]);

//   const startPdfGeneration = useCallback(async () => {
//     if (!reportId || isStartingGeneration) {
//       return;
//     }

//     setIsStartingGeneration(true);

//     try {
//       const response = await fetch(
//         `/api/reports/${encodeURIComponent(reportId)}/generate`,
//         {
//           method: "POST",
//         },
//       );

//       const data = (await response.json()) as ReportApiResponse;

//       /*
//        * 409 means another generation request is already
//        * running. That's okay — polling will pick it up.
//        */
//       if (!response.ok && response.status !== 409) {
//         throw new Error(
//           data.message ||
//             data.error ||
//             "Unable to generate the medical report.",
//         );
//       }

//       await fetchReport();
//     } catch (error) {
//       setPageError(
//         error instanceof Error
//           ? error.message
//           : "Unable to generate the medical report.",
//       );
//     } finally {
//       setIsStartingGeneration(false);
//     }
//   }, [fetchReport, isStartingGeneration, reportId]);

//   /*
//    * Initial report load.
//    */
//   useEffect(() => {
//     let cancelled = false;

//     async function loadInitialReport() {
//       try {
//         setIsLoading(true);
//         setPageError(null);

//         const loadedReport = await fetchReport();

//         if (cancelled || !loadedReport) {
//           return;
//         }

//         /*
//          * Automatically start PDF generation once the
//          * report database record exists.
//          */
//         if (
//           loadedReport.pdf.status === "pending" &&
//           !generationRequestedRef.current
//         ) {
//           generationRequestedRef.current = true;

//           void startPdfGeneration();
//         }
//       } catch (error) {
//         if (!cancelled) {
//           setPageError(
//             error instanceof Error
//               ? error.message
//               : "Unable to load the medical report.",
//           );
//         }
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false);
//         }
//       }
//     }

//     void loadInitialReport();

//     return () => {
//       cancelled = true;
//     };
//   }, [fetchReport, startPdfGeneration]);

//   /*
//    * Poll while the PDF is being prepared.
//    */
//   useEffect(() => {
//     if (
//       !report ||
//       (report.pdf.status !== "pending" && report.pdf.status !== "generating")
//     ) {
//       return;
//     }

//     const intervalId = window.setInterval(() => {
//       void fetchReport().catch((error) => {
//         console.error("Report polling failed:", error);
//       });
//     }, POLLING_INTERVAL_MS);

//     return () => {
//       window.clearInterval(intervalId);
//     };
//   }, [fetchReport, report]);

//   const patientInitials = useMemo(
//     () => (report ? getInitials(report.patient.name) : ""),
//     [report],
//   );

//   async function handleRetryGeneration() {
//     generationRequestedRef.current = true;

//     setPageError(null);

//     await startPdfGeneration();
//   }

//   async function handleDownload() {
//     try {
//       if (!report || report.pdf.status !== "ready") {
//         return;
//       }
//       setIsDowloading(true);

//       /*
//        * We will create this endpoint next.
//        *
//        * It will generate a secure temporary URL for the
//        * private Supabase Storage PDF.
//        */
//       window.location.href = `/api/reports/${encodeURIComponent(
//         report.id,
//       )}/download`;

//       setTimeout(() => {
//         setIsDowloading(false);
//       }, 5000);
//     } catch (error) {}
//   }

//   // async function handleDownload() {
//   //   if (!report || report.pdf.status !== "ready") {
//   //     return;
//   //   }

//   //   try {
//   //     setIsDowloading(true);

//   //     const response = await fetch(
//   //       `/api/reports/${encodeURIComponent(report.id)}/download`,
//   //     );

//   //     if (!response.ok) {
//   //       throw new Error("Failed to download report");
//   //     }

//   //     const blob = await response.blob();
//   //     const url = window.URL.createObjectURL(blob);

//   //     const link = document.createElement("a");
//   //     link.href = url;
//   //     link.download = "medical-report.pdf";

//   //     document.body.appendChild(link);
//   //     link.click();
//   //     link.remove();

//   //     window.URL.revokeObjectURL(url);
//   //   } catch (error) {
//   //     console.error("Failed to download report:", error);
//   //   } finally {
//   //     setIsDowloading(false);
//   //   }
//   // }

//   if (isLoading) {
//     return (
//       <main className="flex min-h-[calc(100vh-1px)] w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="flex flex-col items-center gap-3">
//           <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

//           <p className="text-sm font-medium text-slate-600">
//             Loading myTime report...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   if (!report) {
//     return (
//       <main className="flex min-h-[calc(100vh-1px)] w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
//           <h1 className="text-xl font-bold text-[#032b52]">
//             Report unavailable
//           </h1>

//           <p className="mt-2 text-sm text-slate-500">
//             {pageError ?? "The requested report could not be found."}
//           </p>
//         </div>
//       </main>
//     );
//   }

//   const isPending = report.pdf.status === "pending";

//   const isGenerating = report.pdf.status === "generating";

//   const isReady = report.pdf.status === "ready";

//   const isFailed = report.pdf.status === "failed";

//   return (
//     <main className="min-h-screen w-full bg-[#f8f9fd]">
//       <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
//         {/* -------------------------------------------------- */}
//         {/* Header */}
//         {/* -------------------------------------------------- */}

//         <header className="text-center">
//           <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
//             Report #{getShortReportId(report.id)}
//           </p>

//           <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#062d52] sm:text-[34px] lg:text-[40px]">
//             MyTime Report
//           </h1>

//           <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
//             Your MyTime Report is complete. We&apos;re preparing your detailed
//             PDF report.
//           </p>
//         </header>

//         {/* -------------------------------------------------- */}
//         {/* Patient Information */}
//         {/* -------------------------------------------------- */}

//         <section className="mt-9 flex flex-col gap-5 rounded-xl border border-slate-300 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
//           <div className="flex min-w-0 items-center gap-4">
//             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
//               {patientInitials}
//             </div>

//             <div className="min-w-0">
//               <h2 className="truncate text-base font-bold text-[#092846]">
//                 {report.patient.name}
//               </h2>

//               <p className="mt-0.5 text-xs text-slate-600">
//                 DOB: {formatDate(report.patient.dateOfBirth)}
//               </p>
//             </div>
//           </div>

//           <div className="sm:text-right">
//             <p className="text-[11px] text-slate-500">Evaluation Date</p>

//             <p className="text-sm font-medium text-[#092846]">
//               {formatDate(report.patient.evaluationDate)}
//             </p>
//           </div>
//         </section>

//         {/* -------------------------------------------------- */}
//         {/* Main PDF Status Card */}
//         {/* -------------------------------------------------- */}

//         <section className="relative mt-7 overflow-hidden rounded-[22px] border border-slate-300 bg-white px-5 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-8 sm:py-12 lg:py-14">
//           {/* subtle mockup-style dot background */}

//           <div
//             className="pointer-events-none absolute inset-0 opacity-[0.28]"
//             style={{
//               backgroundImage:
//                 "radial-gradient(#d6dce7 0.7px, transparent 0.7px)",
//               backgroundSize: "22px 22px",
//             }}
//           />

//           <div className="relative mx-auto flex max-w-2xl flex-col items-center">
//             {/* Ready */}

//             {isReady && (
//               <>
//                 <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#e7f5eb]">
//                   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#087d3e]">
//                     <Check className="h-6 w-6 text-white" strokeWidth={3} />
//                   </div>
//                 </div>

//                 <h2 className="mt-5 text-[23px] font-bold tracking-[-0.02em] text-[#087d3e] sm:text-[27px]">
//                   Your MyTime report is ready
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
//                   Your report has been successfully generated and is ready to
//                   download.
//                   {report.pdf.generatedAt && (
//                     <> Generated {formatDateTime(report.pdf.generatedAt)}</>
//                   )}
//                 </p>

//                 <button
//                   type="button"
//                   onClick={handleDownload}
//                   className="mt-7 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#062542] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#032d55] focus-visible:ring-offset-2"
//                 >
//                   {isDowloading ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Downloading...
//                     </>
//                   ) : (
//                     <>
//                       <Download className="h-4 w-4" />
//                       Download MyTime Report
//                     </>
//                   )}
//                 </button>
//               </>
//             )}

//             {/* Pending / Generating */}

//             {(isPending || isGenerating) && (
//               <>
//                 <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#eaf2fb]">
//                   <LoaderCircle className="h-9 w-9 animate-spin text-[#063467]" />
//                 </div>

//                 <h2 className="mt-5 text-[23px] font-bold tracking-[-0.02em] text-[#062d52] sm:text-[27px]">
//                   Preparing your MyTime report
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
//                   Your evaluation is complete. We are generating your detailed
//                   PDF report. This page will update automatically when it is
//                   ready.
//                 </p>

//                 <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-500">
//                   <LoaderCircle className="h-4 w-4 animate-spin" />
//                   Generating report...
//                 </div>
//               </>
//             )}

//             {/* Failed */}

//             {isFailed && (
//               <>
//                 <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red-50">
//                   <RefreshCw className="h-8 w-8 text-red-600" />
//                 </div>

//                 <h2 className="mt-5 text-[23px] font-bold text-red-700 sm:text-[27px]">
//                   Report generation failed
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
//                   {report.pdf.error ||
//                     "We couldn't generate your PDF report. You can try again."}
//                 </p>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     void handleRetryGeneration();
//                   }}
//                   disabled={isStartingGeneration}
//                   className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   <RefreshCw
//                     className={`h-4 w-4 ${
//                       isStartingGeneration ? "animate-spin" : ""
//                     }`}
//                   />

//                   {isStartingGeneration
//                     ? "Retrying..."
//                     : "Retry Report Generation"}
//                 </button>
//               </>
//             )}
//           </div>
//         </section>

//         {/* -------------------------------------------------- */}
//         {/* Progress */}
//         {/* -------------------------------------------------- */}

//         <section className="mt-7 rounded-xl border border-slate-300 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
//           <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-4">
//             <ProgressItem label="Evaluation Complete" state="complete" />

//             <ProgressItem
//               label="Preparing Report"
//               state={isReady ? "complete" : isFailed ? "failed" : "active"}
//             />

//             <ProgressItem
//               label="Ready to Download"
//               state={isReady ? "ready" : "inactive"}
//             />
//           </div>
//         </section>

//         {/* -------------------------------------------------- */}
//         {/* Metrics */}
//         {/* -------------------------------------------------- */}

//         <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
//           <MetricCard
//             icon={<Activity className="h-5 w-5" />}
//             title="IFI"
//             subtitle="Integrated Functional Index"
//           >
//             <div className="flex items-end gap-1">
//               <span className="text-[38px] font-bold leading-none tracking-[-0.04em] text-[#062d52]">
//                 {report.results.IFI.ifi.toFixed(2)}
//               </span>
//             </div>
//           </MetricCard>

//           <MetricCard
//             icon={<Activity className="h-5 w-5" />}
//             title="Biological Age"
//             subtitle="Estimated based on biomarkers"
//           >
//             <div className="flex items-end gap-2">
//               <span className="text-[38px] font-bold leading-none tracking-[-0.04em] text-[#062d52]">
//                 {report.results.BiologicalAge.displayBiologicalAgeYears.toFixed(
//                   2,
//                 )}
//               </span>

//               <span className="pb-1 text-xs font-medium text-[#062d52]">
//                 years
//               </span>
//             </div>
//           </MetricCard>
//         </section>

//         {/* -------------------------------------------------- */}
//         {/* Footer Metadata */}
//         {/* -------------------------------------------------- */}

//         <footer className="mt-12 grid grid-cols-1 gap-5 pb-8 text-center sm:grid-cols-3 sm:gap-8">
//           <FooterMetadata
//             label="Evaluation Date"
//             value={formatShortDate(report.patient.evaluationDate)}
//           />

//           <FooterMetadata
//             label="Report Created"
//             value={formatDateTime(report.createdAt)}
//           />

//           <FooterMetadata
//             label="Last Updated"
//             value={formatDateTime(report.updatedAt)}
//           />
//         </footer>
//       </div>
//     </main>
//   );
// }

// interface ProgressItemProps {
//   label: string;
//   state: "complete" | "active" | "ready" | "inactive" | "failed";
// }

// function ProgressItem({ label, state }: ProgressItemProps) {
//   const isActive =
//     state === "complete" || state === "active" || state === "ready";

//   const isReady = state === "ready";

//   const isFailed = state === "failed";

//   return (
//     <div className="flex flex-col items-center text-center">
//       <div
//         className={[
//           "flex h-7 w-7 items-center justify-center rounded-full",
//           isReady
//             ? "bg-[#087d3e] text-white"
//             : isFailed
//               ? "bg-red-100 text-red-600"
//               : isActive
//                 ? "bg-[#032d55] text-white"
//                 : "bg-slate-100 text-slate-400",
//         ].join(" ")}
//       >
//         {state === "active" ? (
//           <LoaderCircle className="h-4 w-4 animate-spin" />
//         ) : isFailed ? (
//           <RefreshCw className="h-3.5 w-3.5" />
//         ) : (
//           <Check className="h-4 w-4" strokeWidth={3} />
//         )}
//       </div>

//       <p
//         className={[
//           "mt-2 text-xs font-semibold",
//           isReady
//             ? "text-[#087d3e]"
//             : isFailed
//               ? "text-red-600"
//               : "text-[#092846]",
//         ].join(" ")}
//       >
//         {label}
//       </p>
//     </div>
//   );
// }

// interface MetricCardProps {
//   icon: React.ReactNode;
//   title: string;
//   subtitle: string;
//   children: React.ReactNode;
// }

// function MetricCard({ icon, title, subtitle, children }: MetricCardProps) {
//   return (
//     <article className="rounded-xl border border-slate-300 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-6">
//       <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
//         <span className="text-[#005cff]">{icon}</span>

//         <h3 className="text-base font-bold text-[#092846]">{title}</h3>
//       </div>

//       <p className="mt-4 text-xs text-slate-500">{subtitle}</p>

//       <div className="mt-3">{children}</div>
//     </article>
//   );
// }

// interface FooterMetadataProps {
//   label: string;
//   value: string;
// }

// function FooterMetadata({ label, value }: FooterMetadataProps) {
//   return (
//     <div>
//       <p className="text-[11px] font-medium text-[#092846]">{label}</p>

//       <p className="mt-1 text-[11px] text-slate-500">{value}</p>
//     </div>
//   );
// }

"use client";

import {
  Activity,
  Check,
  Download,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PdfStatus = "pending" | "generating" | "ready" | "failed";

interface ReportApiResponse {
  success: boolean;

  report?: {
    id: string;

    patient: {
      name: string;
      dateOfBirth: string;
      evaluationDate: string;
    };

    results: {
      IFI: {
        ifi: number;
      };

      BiologicalAge: {
        displayBiologicalAgeYears: number;
      };
    };

    pdf: {
      status: PdfStatus;
      path: string | null;
      generatedAt: string | null;
      error: string | null;
    };

    createdAt: string;
    updatedAt: string;
  };

  message?: string;
  error?: string;
}

interface DownloadApiResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

  download?: {
    url: string;
    fileName: string;
    expiresIn: number;
  };
}

interface GeneratePdfApiResponse {
  success: boolean;
  message?: string;
  error?: string;

  report?: {
    id: string;
    pdfStatus: PdfStatus;
    pdfPath?: string | null;
    pdfGeneratedAt?: string | null;
  };
}

type Report = NonNullable<ReportApiResponse["report"]>;

const POLLING_INTERVAL_MS = 2_500;

function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatShortDate(date: string | null | undefined): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTime(date: string | null | undefined): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getShortReportId(reportId: string): string {
  if (reportId.length <= 12) {
    return reportId.toUpperCase();
  }

  return reportId.slice(0, 8).toUpperCase();
}

export default function ReportPage() {
  const params = useParams<{
    reportId: string;
  }>();

  const reportId = params.reportId;

  const [report, setReport] = useState<Report | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);

  /*
   * Prevent automatic generation from being triggered
   * repeatedly by React rerenders.
   */
  const automaticGenerationRequested = useRef(false);

  const fetchReport = useCallback(async (): Promise<Report> => {
    if (!reportId) {
      throw new Error("A report ID was not provided.");
    }

    const response = await fetch(
      `/api/reports/${encodeURIComponent(reportId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = (await response.json()) as ReportApiResponse;

    if (!response.ok || !data.success || !data.report) {
      throw new Error(
        data.message || data.error || "Unable to load the medical report.",
      );
    }

    setReport(data.report);

    return data.report;
  }, [reportId]);

  /**
   * Generate or regenerate the PDF.
   *
   * force=true is specifically used when:
   *
   * Database:
   *   pdf_status = ready
   *
   * Storage:
   *   PDF does not actually exist
   *
   * The generation API will be updated next to support
   * this flag.
   */
  const generatePdf = useCallback(
    async ({
      force = false,
    }: {
      force?: boolean;
    } = {}): Promise<void> => {
      if (!reportId || isGenerating) {
        return;
      }

      setIsGenerating(true);

      try {
        const endpoint = force
          ? `/api/reports/${encodeURIComponent(reportId)}/generate?force=true`
          : `/api/reports/${encodeURIComponent(reportId)}/generate`;

        const response = await fetch(endpoint, {
          method: "POST",
        });

        const data = (await response.json()) as GeneratePdfApiResponse;

        /*
         * A 409 is acceptable when another request is
         * already generating this report.
         */
        if (!response.ok && response.status !== 409) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to generate the medical report.",
          );
        }

        await fetchReport();
      } finally {
        setIsGenerating(false);
      }
    },
    [fetchReport, isGenerating, reportId],
  );

  /**
   * Initial report load.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setIsLoading(true);
        setPageError(null);

        const loadedReport = await fetchReport();

        if (cancelled) {
          return;
        }

        /*
         * New report:
         *
         * Automatically start PDF generation.
         */
        if (
          loadedReport.pdf.status === "pending" &&
          !automaticGenerationRequested.current
        ) {
          automaticGenerationRequested.current = true;

          void generatePdf().catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : "Unable to generate the medical report.";

            toast.error(message);
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load the medical report.";

        setPageError(message);

        toast.error(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [fetchReport, generatePdf]);

  /**
   * Poll Supabase while the PDF is being generated.
   */
  useEffect(() => {
    if (
      !report ||
      (report.pdf.status !== "pending" && report.pdf.status !== "generating")
    ) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        await fetchReport();
      } catch (error) {
        console.error("Report status polling failed:", error);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchReport, report?.pdf.status]);

  const patientInitials = useMemo(
    () => (report ? getInitials(report.patient.name) : ""),
    [report],
  );

  /**
   * ----------------------------------------------------------
   * DOWNLOAD
   * ----------------------------------------------------------
   *
   * This does NOT navigate directly to our API anymore.
   *
   * We fetch JSON first so the UI can correctly handle:
   *
   * PDF_MISSING
   * PDF_NOT_READY
   * REPORT_NOT_FOUND
   * Storage errors
   * Signed URL errors
   *
   * without displaying raw JSON to the patient.
   */
  async function handleDownload(): Promise<void> {
    if (!report || report.pdf.status !== "ready" || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(
        `/api/reports/${encodeURIComponent(report.id)}/download`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as DownloadApiResponse;

      /*
       * ------------------------------------------------------
       * SELF-HEALING REPORT
       * ------------------------------------------------------
       *
       * DB metadata says ready, but someone deleted the
       * physical PDF from Supabase Storage.
       */
      if (!response.ok && data.code === "PDF_MISSING") {
        toast.error(
          "The stored PDF is missing. Regenerating your medical report...",
        );

        await generatePdf({
          force: true,
        });

        /*
         * Refresh database state after regeneration.
         */
        const refreshedReport = await fetchReport();

        if (refreshedReport.pdf.status !== "ready") {
          throw new Error("The report could not be regenerated.");
        }

        toast.success("Your medical report has been regenerated.");

        /*
         * Now request a new signed download URL.
         */
        await downloadReadyReport(refreshedReport.id);

        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to download the medical report.",
        );
      }

      if (!data.download?.url) {
        throw new Error("The download link was not returned by the server.");
      }

      window.location.assign(data.download.url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to download the medical report.";

      console.error("Medical report download failed:", error);

      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  }

  /**
   * Download a PDF that we already know should now exist.
   *
   * Used after successful automatic regeneration.
   */
  async function downloadReadyReport(id: string): Promise<void> {
    const response = await fetch(
      `/api/reports/${encodeURIComponent(id)}/download`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = (await response.json()) as DownloadApiResponse;

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          data.error ||
          "Unable to download the regenerated report.",
      );
    }

    if (!data.download?.url) {
      throw new Error("The regenerated report download link is missing.");
    }

    window.location.assign(data.download.url);
  }

  async function handleRetryGeneration(): Promise<void> {
    try {
      setPageError(null);

      toast.info("Retrying medical report generation...");

      await generatePdf({
        force: true,
      });

      const refreshedReport = await fetchReport();

      if (refreshedReport.pdf.status === "ready") {
        toast.success("Medical report generated successfully.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to regenerate the medical report.";

      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

          <p className="text-sm font-medium text-slate-600">
            Loading MyTime report...
          </p>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#032b52]">
            Report unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {pageError ?? "The requested report could not be found."}
          </p>
        </div>
      </main>
    );
  }

  const isPending = report.pdf.status === "pending";

  const isPdfGenerating = report.pdf.status === "generating";

  const isReady = report.pdf.status === "ready";

  const isFailed = report.pdf.status === "failed";

  return (
    <main className="min-h-screen w-full bg-[#f8f9fd]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}

        <header className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Report #{getShortReportId(report.id)}
          </p>

          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#062d52] sm:text-[34px] lg:text-[40px]">
            MyTime Monitoring Report
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            Your myTime evaluation is complete. We&apos;re preparing your
            detailed PDF report.
          </p>
        </header>

        {/* Patient Information */}

        <section className="mt-9 flex flex-col gap-5 rounded-xl border border-slate-300 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-bold text-[#063467]">
              {patientInitials}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[#092846]">
                {report.patient.name}
              </h2>

              <p className="mt-0.5 text-xs text-slate-600">
                DOB: {formatDate(report.patient.dateOfBirth)}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] text-slate-500">Evaluation Date</p>

            <p className="text-sm font-medium text-[#092846]">
              {formatDate(report.patient.evaluationDate)}
            </p>
          </div>
        </section>

        {/* Main PDF Status */}

        <section className="relative mt-7 overflow-hidden rounded-[22px] border border-slate-300 bg-white px-5 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-8 sm:py-12 lg:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage:
                "radial-gradient(#d6dce7 0.7px, transparent 0.7px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            {isReady && (
              <>
                <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#e7f5eb]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#087d3e]">
                    <Check className="h-6 w-6 text-white" strokeWidth={3} />
                  </div>
                </div>

                <h2 className="mt-5 text-[23px] font-bold tracking-[-0.02em] text-[#087d3e] sm:text-[27px]">
                  Your MyTime report is ready
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Your report has been successfully generated and is ready to
                  download.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleDownload();
                  }}
                  disabled={isDownloading || isGenerating}
                  className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloading || isGenerating ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}

                  {isGenerating
                    ? "Regenerating Report..."
                    : isDownloading
                      ? "Preparing Download..."
                      : "Download MyTime Report"}
                </button>
              </>
            )}

            {(isPending || isPdfGenerating) && (
              <>
                <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#eaf2fb]">
                  <LoaderCircle className="h-9 w-9 animate-spin text-[#063467]" />
                </div>

                <h2 className="mt-5 text-[23px] font-bold tracking-[-0.02em] text-[#062d52] sm:text-[27px]">
                  Preparing your medical report
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Your evaluation is complete. We are generating your detailed
                  PDF report. This page updates automatically.
                </p>
              </>
            )}

            {isFailed && (
              <>
                <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red-50">
                  <RefreshCw className="h-8 w-8 text-red-600" />
                </div>

                <h2 className="mt-5 text-[23px] font-bold text-red-700">
                  Report generation failed
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  {report.pdf.error || "We couldn't generate your PDF report."}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleRetryGeneration();
                  }}
                  disabled={isGenerating}
                  className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
                  />

                  {isGenerating ? "Retrying..." : "Retry Report Generation"}
                </button>
              </>
            )}
          </div>
        </section>

        {/* Progress */}

        <section className="mt-7 rounded-xl border border-slate-300 bg-white px-5 py-6">
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-4">
            <ProgressItem label="Evaluation Complete" state="complete" />

            <ProgressItem
              label="Preparing Report"
              state={isReady ? "complete" : isFailed ? "failed" : "active"}
            />

            <ProgressItem
              label="Ready to Download"
              state={isReady ? "ready" : "inactive"}
            />
          </div>
        </section>

        {/* Metrics */}

        <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
          <MetricCard
            icon={<Activity className="h-5 w-5" />}
            title="IFI"
            subtitle="Integrated Functional Index"
          >
            <span className="text-[38px] font-bold leading-none tracking-[-0.04em] text-[#062d52]">
              {report.results.IFI.ifi}
            </span>
          </MetricCard>

          <MetricCard
            icon={<Activity className="h-5 w-5" />}
            title="Biological Age"
            subtitle="Estimated based on biomarkers"
          >
            <div className="flex items-end gap-2">
              <span className="text-[38px] font-bold leading-none tracking-[-0.04em] text-[#062d52]">
                {report.results.BiologicalAge.displayBiologicalAgeYears.toFixed(
                  2,
                )}
              </span>

              <span className="pb-1 text-xs font-medium text-[#062d52]">
                years
              </span>
            </div>
          </MetricCard>
        </section>

        {/* Footer */}

        <footer className="mt-12 grid grid-cols-1 gap-5 pb-8 text-center sm:grid-cols-3">
          <FooterMetadata
            label="Evaluation Date"
            value={formatShortDate(report.patient.evaluationDate)}
          />

          <FooterMetadata
            label="Report Created"
            value={formatDateTime(report.createdAt)}
          />

          <FooterMetadata
            label="Last Updated"
            value={formatDateTime(report.updatedAt)}
          />
        </footer>
      </div>
    </main>
  );
}

interface ProgressItemProps {
  label: string;
  state: "complete" | "active" | "ready" | "inactive" | "failed";
}

function ProgressItem({ label, state }: ProgressItemProps) {
  const isActive =
    state === "complete" || state === "active" || state === "ready";

  const isReady = state === "ready";
  const isFailed = state === "failed";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full",
          isReady
            ? "bg-[#087d3e] text-white"
            : isFailed
              ? "bg-red-100 text-red-600"
              : isActive
                ? "bg-[#032d55] text-white"
                : "bg-slate-100 text-slate-400",
        ].join(" ")}
      >
        {state === "active" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : isFailed ? (
          <RefreshCw className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-4 w-4" strokeWidth={3} />
        )}
      </div>

      <p
        className={[
          "mt-2 text-xs font-semibold",
          isReady
            ? "text-[#087d3e]"
            : isFailed
              ? "text-red-600"
              : "text-[#092846]",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function MetricCard({ icon, title, subtitle, children }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-300 bg-white px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="text-[#005cff]">{icon}</span>

        <h3 className="text-base font-bold text-[#092846]">{title}</h3>
      </div>

      <p className="mt-4 text-xs text-slate-500">{subtitle}</p>

      <div className="mt-3">{children}</div>
    </article>
  );
}

interface FooterMetadataProps {
  label: string;
  value: string;
}

function FooterMetadata({ label, value }: FooterMetadataProps) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#092846]">{label}</p>

      <p className="mt-1 text-[11px] text-slate-500">{value}</p>
    </div>
  );
}
