// //  This one is fine but rolaoding the page again and again means making request to the report hile generating

// "use client";

// import {
//   Activity,
//   Check,
//   Download,
//   LoaderCircle,
//   RefreshCw,
// } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "sonner";

// type PdfStatus = "pending" | "queued" | "generating" | "ready" | "failed";

// interface ReportApiResponse {
//   success: boolean;

//   code?: string;
//   message?: string;
//   error?: string;

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
// }

// interface DownloadApiResponse {
//   success: boolean;

//   code?: string;
//   message?: string;
//   error?: string;

//   download?: {
//     url: string;
//     fileName: string;
//     expiresIn: number;
//   };
// }

// interface GeneratePdfApiResponse {
//   success: boolean;

//   code?: string;
//   message?: string;
//   error?: string;

//   report?: {
//     id: string;
//     pdfStatus: PdfStatus;
//     pdfPath?: string | null;
//     pdfGeneratedAt?: string | null;
//   };
// }

// type Report = NonNullable<ReportApiResponse["report"]>;

// const POLLING_INTERVAL_MS = 2_500;

// class ReportRequestError extends Error {
//   readonly status: number;
//   readonly code: string | null;

//   constructor({
//     message,
//     status,
//     code,
//   }: {
//     message: string;
//     status: number;
//     code?: string | null;
//   }) {
//     super(message);

//     this.name = "ReportRequestError";
//     this.status = status;
//     this.code = code ?? null;
//   }
// }

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
//   const params = useParams<{
//     reportId: string;
//   }>();

//   const router = useRouter();

//   const reportId = params.reportId;

//   const [report, setReport] = useState<Report | null>(null);

//   const [isLoading, setIsLoading] = useState(true);

//   const [isGenerating, setIsGenerating] = useState(false);

//   const [isDownloading, setIsDownloading] = useState(false);

//   const [pageError, setPageError] = useState<string | null>(null);

//   const [isAccessDenied, setIsAccessDenied] = useState(false);

//   /**
//    * Prevent duplicate automatic enqueue requests caused by
//    * React development renders/effect execution.
//    */
//   const automaticGenerationRequested = useRef(false);

//   /**
//    * Prevent repeated 401 redirects from polling or concurrent
//    * API requests.
//    */
//   const authRedirectRequested = useRef(false);

//   /**
//    * ----------------------------------------------------------
//    * AUTHENTICATION FAILURE
//    * ----------------------------------------------------------
//    */
//   const redirectToLogin = useCallback(() => {
//     if (authRedirectRequested.current) {
//       return;
//     }

//     authRedirectRequested.current = true;

//     const returnPath = `/dashboard/reports/${encodeURIComponent(reportId)}`;

//     toast.error("Your session has expired. Please sign in again.");

//     router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
//   }, [reportId, router]);

//   /**
//    * ----------------------------------------------------------
//    * FETCH REPORT
//    * ----------------------------------------------------------
//    */
//   const fetchReport = useCallback(async (): Promise<Report> => {
//     if (!reportId) {
//       throw new Error("A report ID was not provided.");
//     }

//     const response = await fetch(
//       `/api/reports/${encodeURIComponent(reportId)}`,
//       {
//         method: "GET",
//         cache: "no-store",
//       },
//     );

//     const data = (await response.json()) as ReportApiResponse;

//     if (response.status === 401) {
//       throw new ReportRequestError({
//         status: 401,
//         code: data.code ?? "UNAUTHENTICATED",
//         message: data.message ?? "Authentication is required.",
//       });
//     }

//     if (response.status === 403) {
//       throw new ReportRequestError({
//         status: 403,
//         code: data.code ?? "REPORT_ACCESS_DENIED",
//         message:
//           data.message ?? "You are not authorized to access this report.",
//       });
//     }

//     if (response.status === 404) {
//       throw new ReportRequestError({
//         status: 404,
//         code: data.code ?? "REPORT_NOT_FOUND",
//         message: data.message ?? "Report not found.",
//       });
//     }

//     if (!response.ok || !data.success || !data.report) {
//       throw new ReportRequestError({
//         status: response.status,
//         code: data.code,
//         message:
//           data.message || data.error || "Unable to load the medical report.",
//       });
//     }

//     setReport(data.report);

//     return data.report;
//   }, [reportId]);

//   /**
//    * ----------------------------------------------------------
//    * GENERATE / REGENERATE
//    * ----------------------------------------------------------
//    */
//   const generatePdf = useCallback(
//     async ({
//       force = false,
//     }: {
//       force?: boolean;
//     } = {}): Promise<void> => {
//       if (!reportId || isGenerating) {
//         return;
//       }

//       setIsGenerating(true);

//       try {
//         const endpoint = force
//           ? `/api/reports/${encodeURIComponent(reportId)}/generate?force=true`
//           : `/api/reports/${encodeURIComponent(reportId)}/generate`;

//         const response = await fetch(endpoint, {
//           method: "POST",
//         });

//         const data = (await response.json()) as GeneratePdfApiResponse;

//         if (response.status === 401) {
//           redirectToLogin();

//           throw new ReportRequestError({
//             status: 401,
//             code: data.code ?? "UNAUTHENTICATED",
//             message: data.message ?? "Authentication is required.",
//           });
//         }

//         if (response.status === 403) {
//           setIsAccessDenied(true);

//           throw new ReportRequestError({
//             status: 403,
//             code: data.code ?? "REPORT_ACCESS_DENIED",
//             message:
//               data.message ?? "You are not authorized to generate this report.",
//           });
//         }

//         /**
//          * A conflict-like state may mean the report is already
//          * moving through the pipeline.
//          *
//          * Refresh and let normal polling follow it.
//          */
//         if (!response.ok && response.status !== 409) {
//           throw new ReportRequestError({
//             status: response.status,
//             code: data.code,
//             message:
//               data.message ||
//               data.error ||
//               "Unable to generate the medical report.",
//           });
//         }

//         await fetchReport();
//       } finally {
//         setIsGenerating(false);
//       }
//     },
//     [fetchReport, isGenerating, redirectToLogin, reportId],
//   );

//   /**
//    * ----------------------------------------------------------
//    * INITIAL LOAD
//    * ----------------------------------------------------------
//    */
//   useEffect(() => {
//     let cancelled = false;

//     async function loadReport() {
//       try {
//         setIsLoading(true);
//         setPageError(null);
//         setIsAccessDenied(false);

//         const loadedReport = await fetchReport();

//         if (cancelled) {
//           return;
//         }

//         /**
//          * Only brand-new pending reports are automatically
//          * queued.
//          *
//          * Failed reports remain failed until the user explicitly
//          * presses Retry.
//          */
//         if (
//           loadedReport.pdf.status === "pending" &&
//           !automaticGenerationRequested.current
//         ) {
//           automaticGenerationRequested.current = true;

//           void generatePdf().catch((error) => {
//             if (error instanceof ReportRequestError && error.status === 401) {
//               return;
//             }

//             const message =
//               error instanceof Error
//                 ? error.message
//                 : "Unable to generate the medical report.";

//             toast.error(message);
//           });
//         }
//       } catch (error) {
//         if (cancelled) {
//           return;
//         }

//         if (error instanceof ReportRequestError) {
//           if (error.status === 401) {
//             redirectToLogin();
//             return;
//           }

//           if (error.status === 403) {
//             setIsAccessDenied(true);
//             setPageError(error.message);
//             return;
//           }

//           if (error.status === 404) {
//             setPageError(error.message);
//             return;
//           }
//         }

//         const message =
//           error instanceof Error
//             ? error.message
//             : "Unable to load the medical report.";

//         setPageError(message);

//         toast.error(message);
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false);
//         }
//       }
//     }

//     void loadReport();

//     return () => {
//       cancelled = true;
//     };
//   }, [fetchReport, generatePdf, redirectToLogin]);

//   /**
//    * ----------------------------------------------------------
//    * POLLING
//    * ----------------------------------------------------------
//    */
//   useEffect(() => {
//     if (
//       !report ||
//       !["pending", "queued", "generating"].includes(report.pdf.status)
//     ) {
//       return;
//     }

//     let polling = false;

//     const intervalId = window.setInterval(async () => {
//       /**
//        * Prevent overlapping GET requests if one request takes
//        * longer than the polling interval.
//        */
//       if (polling) {
//         return;
//       }

//       polling = true;

//       try {
//         await fetchReport();
//       } catch (error) {
//         if (error instanceof ReportRequestError) {
//           if (error.status === 401) {
//             window.clearInterval(intervalId);

//             redirectToLogin();

//             return;
//           }

//           if (error.status === 403) {
//             window.clearInterval(intervalId);

//             setIsAccessDenied(true);

//             setPageError(error.message);

//             return;
//           }

//           if (error.status === 404) {
//             window.clearInterval(intervalId);

//             setReport(null);
//             setPageError(error.message);

//             return;
//           }
//         }

//         console.error("Report status polling failed:", error);
//       } finally {
//         polling = false;
//       }
//     }, POLLING_INTERVAL_MS);

//     return () => {
//       window.clearInterval(intervalId);
//     };
//   }, [fetchReport, redirectToLogin, report?.pdf.status]);

//   const patientInitials = useMemo(
//     () => (report ? getInitials(report.patient.name) : ""),
//     [report],
//   );

//   /**
//    * ----------------------------------------------------------
//    * DOWNLOAD
//    * ----------------------------------------------------------
//    */
//   async function handleDownload(): Promise<void> {
//     if (!report || report.pdf.status !== "ready" || isDownloading) {
//       return;
//     }

//     setIsDownloading(true);

//     try {
//       const response = await fetch(
//         `/api/reports/${encodeURIComponent(report.id)}/download`,
//         {
//           method: "GET",
//           cache: "no-store",
//         },
//       );

//       const data = (await response.json()) as DownloadApiResponse;

//       if (response.status === 401) {
//         redirectToLogin();

//         return;
//       }

//       if (response.status === 403) {
//         setIsAccessDenied(true);
//         setPageError(
//           data.message ?? "You are not authorized to download this report.",
//         );

//         return;
//       }

//       /**
//        * Database says ready, but Storage object is missing.
//        *
//        * The secured generate endpoint handles regeneration.
//        */
//       if (!response.ok && data.code === "PDF_MISSING") {
//         toast.error(
//           "The stored PDF is missing. Regenerating your medical report...",
//         );

//         await generatePdf({
//           force: true,
//         });

//         await fetchReport();

//         toast.info(
//           "Your report has been queued for regeneration. This page will update automatically when it is ready.",
//         );

//         return;
//       }

//       if (!response.ok || !data.success) {
//         throw new ReportRequestError({
//           status: response.status,
//           code: data.code,
//           message:
//             data.message ||
//             data.error ||
//             "Unable to download the medical report.",
//         });
//       }

//       if (!data.download?.url) {
//         throw new Error("The download link was not returned by the server.");
//       }

//       window.location.assign(data.download.url);
//     } catch (error) {
//       const message =
//         error instanceof Error
//           ? error.message
//           : "Unable to download the medical report.";

//       console.error("Medical report download failed:", error);

//       toast.error(message);
//     } finally {
//       setIsDownloading(false);
//     }
//   }

//   /**
//    * ----------------------------------------------------------
//    * MANUAL RETRY
//    * ----------------------------------------------------------
//    */
//   async function handleRetryGeneration(): Promise<void> {
//     if (!report || report.pdf.status !== "failed" || isGenerating) {
//       return;
//     }

//     try {
//       setPageError(null);

//       toast.info("Retrying medical report generation...");

//       await generatePdf({
//         force: true,
//       });

//       await fetchReport();

//       toast.info(
//         "Your report has been queued for generation. Generation will begin automatically.",
//       );
//     } catch (error) {
//       if (error instanceof ReportRequestError && error.status === 401) {
//         return;
//       }

//       const message =
//         error instanceof Error
//           ? error.message
//           : "Unable to regenerate the medical report.";

//       console.error("Medical report regeneration failed:", error);

//       toast.error(message);
//     }
//   }

//   if (isLoading) {
//     return (
//       <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="flex flex-col items-center gap-3">
//           <LoaderCircle className="h-7 w-7 animate-spin text-[#032b52]" />

//           <p className="text-sm font-medium text-slate-600">
//             Loading MyTime report...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   /**
//    * ----------------------------------------------------------
//    * ACCESS DENIED
//    * ----------------------------------------------------------
//    *
//    * Keep this visually consistent with the existing page rather
//    * than exposing raw API JSON.
//    */
//   if (isAccessDenied) {
//     return (
//       <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
//           <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
//             <RefreshCw className="h-6 w-6 text-red-600" />
//           </div>

//           <h1 className="mt-5 text-xl font-bold text-[#032b52]">
//             Report access denied
//           </h1>

//           <p className="mt-2 text-sm leading-6 text-slate-500">
//             {pageError ??
//               "You do not have permission to access this medical report."}
//           </p>
//         </div>
//       </main>
//     );
//   }

//   if (!report) {
//     return (
//       <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
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

//   const isQueued = report.pdf.status === "queued";

//   const isPdfGenerating = report.pdf.status === "generating";

//   const isReady = report.pdf.status === "ready";

//   const isFailed = report.pdf.status === "failed";

//   return (
//     <main className="min-h-screen w-full bg-[#f8f9fd]">
//       <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
//         {/* Header */}

//         <header className="text-center">
//           <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
//             Report #{getShortReportId(report.id)}
//           </p>

//           <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[#062d52] sm:text-[34px] lg:text-[40px]">
//             MyTime Monitoring Report
//           </h1>

//           <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
//             Your myTime evaluation is complete. We&apos;re preparing your
//             detailed PDF report.
//           </p>
//         </header>

//         {/* Patient Information */}

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

//         {/* Main PDF Status */}

//         <section className="relative mt-7 overflow-hidden rounded-[22px] border border-slate-300 bg-white px-5 py-10 text-center shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:px-8 sm:py-12 lg:py-14">
//           <div
//             className="pointer-events-none absolute inset-0 opacity-[0.28]"
//             style={{
//               backgroundImage:
//                 "radial-gradient(#d6dce7 0.7px, transparent 0.7px)",
//               backgroundSize: "22px 22px",
//             }}
//           />

//           <div className="relative mx-auto flex max-w-2xl flex-col items-center">
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
//                 </p>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     void handleDownload();
//                   }}
//                   disabled={isDownloading || isGenerating}
//                   className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#062542] disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isDownloading || isGenerating ? (
//                     <LoaderCircle className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Download className="h-4 w-4" />
//                   )}

//                   {isGenerating
//                     ? "Regenerating Report..."
//                     : isDownloading
//                       ? "Preparing Download..."
//                       : "Download MyTime Report"}
//                 </button>
//               </>
//             )}

//             {(isPending || isQueued || isPdfGenerating) && (
//               <>
//                 <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#eaf2fb]">
//                   <LoaderCircle className="h-9 w-9 animate-spin text-[#063467]" />
//                 </div>

//                 <h2 className="mt-5 text-[23px] font-bold tracking-[-0.02em] text-[#062d52] sm:text-[27px]">
//                   Preparing your medical report
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
//                   Your evaluation is complete. We are generating your detailed
//                   PDF report. This page updates automatically.
//                 </p>
//               </>
//             )}

//             {isFailed && (
//               <>
//                 <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-red-50">
//                   <RefreshCw className="h-8 w-8 text-red-600" />
//                 </div>

//                 <h2 className="mt-5 text-[23px] font-bold text-red-700">
//                   Report generation failed
//                 </h2>

//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
//                   {report.pdf.error || "We couldn't generate your PDF report."}
//                 </p>

//                 <button
//                   type="button"
//                   onClick={() => {
//                     void handleRetryGeneration();
//                   }}
//                   disabled={isGenerating}
//                   className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#032d55] px-7 py-3 text-sm font-semibold text-white disabled:opacity-60"
//                 >
//                   <RefreshCw
//                     className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
//                   />

//                   {isGenerating ? "Retrying..." : "Retry Report Generation"}
//                 </button>
//               </>
//             )}
//           </div>
//         </section>

//         {/* Progress */}

//         <section className="mt-7 rounded-xl border border-slate-300 bg-white px-5 py-6">
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

//         {/* Metrics */}

//         <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
//           <MetricCard
//             icon={<Activity className="h-5 w-5" />}
//             title="IFI"
//             subtitle="Integrated Functional Index"
//           >
//             <span className="text-[38px] font-bold leading-none tracking-[-0.04em] text-[#062d52]">
//               {report.results.IFI.ifi}
//             </span>
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

//         {/* Footer */}

//         <footer className="mt-12 grid grid-cols-1 gap-5 pb-8 text-center sm:grid-cols-3">
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
//     <article className="rounded-xl border border-slate-300 bg-white px-5 py-5 sm:px-6">
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
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type PdfStatus = "pending" | "queued" | "generating" | "ready" | "failed";

interface ReportApiResponse {
  success: boolean;

  code?: string;
  message?: string;
  error?: string;

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

  code?: string;
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

class ReportRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor({
    message,
    status,
    code,
  }: {
    message: string;
    status: number;
    code?: string | null;
  }) {
    super(message);

    this.name = "ReportRequestError";
    this.status = status;
    this.code = code ?? null;
  }
}

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

  const router = useRouter();

  const reportId = params.reportId;

  const [report, setReport] = useState<Report | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);

  const [isAccessDenied, setIsAccessDenied] = useState(false);

  /**
   * A new report starts as pending.
   *
   * These refs preserve the older working generation behavior
   * and prevent duplicate POST requests.
   */
  const automaticGenerationRequested = useRef(false);

  const generationRequestInFlight = useRef(false);

  const authRedirectRequested = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (authRedirectRequested.current) {
      return;
    }

    authRedirectRequested.current = true;

    const returnPath = `/dashboard/reports/${encodeURIComponent(reportId)}`;

    router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
  }, [reportId, router]);

  /**
   * ----------------------------------------------------------
   * LOAD REPORT
   * ----------------------------------------------------------
   */
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

    if (response.status === 401) {
      throw new ReportRequestError({
        status: 401,
        code: data.code ?? "UNAUTHENTICATED",
        message: data.message ?? "Authentication is required.",
      });
    }

    if (response.status === 403) {
      throw new ReportRequestError({
        status: 403,
        code: data.code ?? "REPORT_ACCESS_DENIED",
        message:
          data.message ?? "You are not authorized to access this report.",
      });
    }

    if (response.status === 404) {
      throw new ReportRequestError({
        status: 404,
        code: data.code ?? "REPORT_NOT_FOUND",
        message: data.message ?? "Report not found.",
      });
    }

    if (!response.ok || !data.success || !data.report) {
      throw new ReportRequestError({
        status: response.status,
        code: data.code,
        message:
          data.message || data.error || "Unable to load the medical report.",
      });
    }

    setReport(data.report);

    return data.report;
  }, [reportId]);

  /**
   * ----------------------------------------------------------
   * GENERATE / REGENERATE
   * ----------------------------------------------------------
   *
   * This keeps your older working in-flight guard.
   */
  const generatePdf = useCallback(
    async ({
      force = false,
    }: {
      force?: boolean;
    } = {}): Promise<void> => {
      if (!reportId || generationRequestInFlight.current) {
        return;
      }

      generationRequestInFlight.current = true;

      setIsGenerating(true);

      try {
        const endpoint = force
          ? `/api/reports/${encodeURIComponent(reportId)}/generate?force=true`
          : `/api/reports/${encodeURIComponent(reportId)}/generate`;

        const response = await fetch(endpoint, {
          method: "POST",
        });

        const data = (await response.json()) as GeneratePdfApiResponse;

        if (response.status === 401) {
          redirectToLogin();

          throw new ReportRequestError({
            status: 401,
            code: data.code ?? "UNAUTHENTICATED",
            message: data.message ?? "Authentication is required.",
          });
        }

        if (response.status === 403) {
          setIsAccessDenied(true);

          throw new ReportRequestError({
            status: 403,
            code: data.code ?? "REPORT_ACCESS_DENIED",
            message:
              data.message ?? "You are not authorized to generate this report.",
          });
        }

        if (!response.ok && response.status !== 409) {
          throw new ReportRequestError({
            status: response.status,
            code: data.code,
            message:
              data.message ||
              data.error ||
              "Unable to generate the medical report.",
          });
        }

        /**
         * Keep the existing single refresh after enqueue.
         */
        await fetchReport();
      } finally {
        generationRequestInFlight.current = false;

        setIsGenerating(false);
      }
    },
    [fetchReport, redirectToLogin, reportId],
  );

  /**
   * ----------------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------------
   */
  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        setIsLoading(true);
        setPageError(null);
        setIsAccessDenied(false);

        const loadedReport = await fetchReport();

        if (cancelled) {
          return;
        }

        if (
          loadedReport.pdf.status === "pending" &&
          !automaticGenerationRequested.current
        ) {
          automaticGenerationRequested.current = true;

          void generatePdf().catch((error) => {
            if (error instanceof ReportRequestError && error.status === 401) {
              return;
            }

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

        if (error instanceof ReportRequestError) {
          if (error.status === 401) {
            redirectToLogin();
            return;
          }

          if (error.status === 403) {
            setIsAccessDenied(true);
            setPageError(error.message);

            return;
          }

          if (error.status === 404) {
            setPageError(error.message);

            return;
          }
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
  }, [fetchReport, generatePdf, redirectToLogin]);

  /**
   * ----------------------------------------------------------
   * STATUS POLLING
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * This preserves your older working recursive setTimeout
   * implementation.
   *
   * That means the next poll is scheduled only after the
   * previous request completes.
   *
   * No overlapping polling requests.
   */
  useEffect(() => {
    if (
      !report ||
      !["pending", "queued", "generating"].includes(report.pdf.status)
    ) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | null = null;

    async function pollReportStatus() {
      try {
        await fetchReport();
      } catch (error) {
        if (error instanceof ReportRequestError) {
          if (error.status === 401) {
            redirectToLogin();
            return;
          }

          if (error.status === 403) {
            setIsAccessDenied(true);
            setPageError(error.message);

            return;
          }

          if (error.status === 404) {
            setReport(null);
            setPageError(error.message);

            return;
          }
        }

        console.error("Report status polling failed:", error);
      }

      if (cancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void pollReportStatus();
      }, POLLING_INTERVAL_MS);
    }

    timeoutId = window.setTimeout(() => {
      void pollReportStatus();
    }, POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [fetchReport, redirectToLogin, report?.pdf.status]);

  const patientInitials = useMemo(
    () => (report ? getInitials(report.patient.name) : ""),
    [report],
  );

  /**
   * ----------------------------------------------------------
   * DOWNLOAD
   * ----------------------------------------------------------
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

      if (response.status === 401) {
        redirectToLogin();

        return;
      }

      if (response.status === 403) {
        setIsAccessDenied(true);

        setPageError(
          data.message ?? "You are not authorized to download this report.",
        );

        return;
      }

      if (!response.ok && data.code === "PDF_MISSING") {
        toast.error(
          "The stored PDF is missing. Regenerating your medical report...",
        );

        await generatePdf({
          force: true,
        });

        await fetchReport();

        toast.info(
          "Your report has been queued for regeneration. This page will update automatically when it is ready.",
        );

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
   * ----------------------------------------------------------
   * MANUAL REGENERATION
   * ----------------------------------------------------------
   */
  async function handleRetryGeneration(): Promise<void> {
    if (
      !report ||
      report.pdf.status !== "failed" ||
      generationRequestInFlight.current
    ) {
      return;
    }

    try {
      setPageError(null);

      toast.info("Retrying medical report generation...");

      await generatePdf({
        force: true,
      });

      /**
       * Keep your previous behavior.
       */
      await fetchReport();

      toast.info(
        "Your report has been queued for generation. Generation will begin automatically.",
      );
    } catch (error) {
      if (error instanceof ReportRequestError && error.status === 401) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to regenerate the medical report.";

      console.error("Medical report regeneration failed:", error);

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

  if (isAccessDenied) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fd] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#032b52]">
            Report access denied
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {pageError ??
              "You do not have permission to access this medical report."}
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

  const isQueued = report.pdf.status === "queued";

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

            {(isPending || isQueued || isPdfGenerating) && (
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
