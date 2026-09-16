// import Link from "next/link";

// import {
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   FileText,
// } from "lucide-react";

// import type { PatientMedicalRecord } from "@/services/database/medical-records/getPatientMedicalRecords";

// interface MedicalRecordsHistoryProps {
//   records: PatientMedicalRecord[];

//   pagination: {
//     page: number;
//     pageSize: number;
//     totalRecords: number;
//     totalPages: number;
//     hasNextPage: boolean;
//     hasPreviousPage: boolean;
//   };

//   paginationBaseHref: string;

//   getRecordHref: (record: PatientMedicalRecord) => string;

//   emptyDescription?: string;
// }

// /**
//  * ============================================================
//  * MEDICAL RECORDS HISTORY
//  * ============================================================
//  *
//  * Shared between:
//  *
//  * Patient:
//  * /dashboard/medical-records
//  *
//  * Doctor:
//  * /dashboard/patients/[relationshipId]/medical-records
//  *
//  * This component is presentation-only.
//  *
//  * It does NOT:
//  * - authenticate users
//  * - authorize patient access
//  * - query Supabase
//  * - resolve doctor-patient relationships
//  */
// export default function MedicalRecordsHistory({
//   records,
//   pagination,
//   paginationBaseHref,
//   getRecordHref,
//   emptyDescription = "No medical records are available yet.",
// }: MedicalRecordsHistoryProps) {
//   if (records.length === 0) {
//     return <EmptyState description={emptyDescription} />;
//   }

//   return (
//     <div className="space-y-4">
//       {/* ======================================================
//           DESKTOP TABLE
//       ====================================================== */}

//       <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="border-b border-slate-200 bg-slate-50/80">
//                 <TableHeading>Assessment</TableHeading>

//                 <TableHeading>IFI</TableHeading>

//                 <TableHeading>IFI Range</TableHeading>

//                 <TableHeading>Functional Risk</TableHeading>

//                 <TableHeading>Biological Age</TableHeading>

//                 <TableHeading>PDF Report</TableHeading>

//                 <TableHeading>
//                   <span className="sr-only">View record</span>
//                 </TableHeading>
//               </tr>
//             </thead>

//             <tbody>
//               {records.map((record) => {
//                 const ifi = record.metrics.ifi;

//                 const biologicalAge = record.metrics.biologicalAge;

//                 const riskLabel = ifi?.riskLabel ?? null;

//                 return (
//                   <tr
//                     key={record.id}
//                     className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
//                   >
//                     {/* Assessment */}
//                     <TableCell>
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
//                           <CalendarDays className="h-4 w-4 text-[#2e6cf6]" />
//                         </div>

//                         <div className="min-w-0">
//                           <p className="font-medium text-[#12355b]">
//                             {formatDate(record.evaluationDate)}
//                           </p>

//                           <p className="mt-0.5 text-xs text-slate-400">
//                             {formatCreatedTime(record.createdAt)}
//                           </p>
//                         </div>
//                       </div>
//                     </TableCell>

//                     {/* IFI */}
//                     <TableCell>
//                       <MetricValue value={ifi?.rawIfi ?? ifi?.ifi} />
//                     </TableCell>

//                     {/* IFI Range */}
//                     <TableCell>
//                       {ifi?.ifiRange !== null && ifi?.ifiRange !== undefined ? (
//                         <span className="inline-flex min-w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-[#12355b]">
//                           {ifi.ifiRange}
//                         </span>
//                       ) : (
//                         <EmptyValue />
//                       )}
//                     </TableCell>

//                     {/* Functional Risk */}
//                     {riskLabel && (
//                       <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
//                         <span className="shrink-0 text-xs font-medium text-slate-500">
//                           Functional Risk
//                         </span>

//                         <IFIRiskBadge riskLabel={riskLabel} />
//                       </div>
//                     )}

//                     {/* Biological Age */}
//                     <TableCell>
//                       {biologicalAge ? (
//                         <div>
//                           <p className="font-medium tabular-nums text-[#12355b]">
//                             {formatAge(
//                               biologicalAge.displayBiologicalAgeYears ??
//                                 biologicalAge.biologicalAgeYears,
//                             )}
//                           </p>

//                           <p className="mt-0.5 text-xs text-slate-400">years</p>
//                         </div>
//                       ) : (
//                         <EmptyValue />
//                       )}
//                     </TableCell>

//                     {/* PDF */}
//                     <TableCell>
//                       <PdfStatus record={record} />
//                     </TableCell>

//                     {/* View */}
//                     <TableCell>
//                       <div className="flex justify-end">
//                         <Link
//                           href={getRecordHref(record)}
//                           className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#12355b] transition-colors hover:border-[#2e6cf6]/40 hover:bg-[#2e6cf6]/5 hover:text-[#2e6cf6]"
//                         >
//                           View
//                         </Link>
//                       </div>
//                     </TableCell>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ======================================================
//           MOBILE
//       ====================================================== */}

//       <div className="space-y-3 md:hidden">
//         {records.map((record) => {
//           const ifi = record.metrics.ifi;

//           const biologicalAge = record.metrics.biologicalAge;

//           const riskLabel = ifi?.riskLabel ?? null;

//           return (
//             <Link
//               key={record.id}
//               href={getRecordHref(record)}
//               className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#2e6cf6]/30"
//             >
//               {/* Date + PDF */}
//               <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
//                     <CalendarDays className="h-4 w-4 text-[#2e6cf6]" />
//                   </div>

//                   <div>
//                     <p className="text-sm font-semibold text-[#12355b]">
//                       {formatDate(record.evaluationDate)}
//                     </p>

//                     <p className="mt-0.5 text-xs text-slate-400">
//                       {formatCreatedTime(record.createdAt)}
//                     </p>
//                   </div>
//                 </div>

//                 <PdfStatus record={record} />
//               </div>

//               {/* Metrics */}
//               <div className="mt-4 grid grid-cols-3 gap-3">
//                 <MobileMetric
//                   label="IFI"
//                   value={formatMetric(ifi?.rawIfi ?? ifi?.ifi)}
//                 />

//                 <MobileMetric
//                   label="IFI Range"
//                   value={
//                     ifi?.ifiRange !== null && ifi?.ifiRange !== undefined
//                       ? String(ifi.ifiRange)
//                       : "—"
//                   }
//                 />

//                 <MobileMetric
//                   label="Bio Age"
//                   value={
//                     biologicalAge
//                       ? formatAge(
//                           biologicalAge.displayBiologicalAgeYears ??
//                             biologicalAge.biologicalAgeYears,
//                         )
//                       : "—"
//                   }
//                   suffix={biologicalAge ? "yrs" : undefined}
//                 />
//               </div>

//               {/* Functional Risk */}
//               {riskLabel && (
//                 <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
//                   <span className="shrink-0 text-xs font-medium text-slate-500">
//                     Functional Risk
//                   </span>

//                   <IFIRiskBadge riskLabel={riskLabel} />
//                 </div>
//               )}

//               <div className="mt-3 flex justify-end">
//                 <span className="text-xs font-semibold text-[#2e6cf6]">
//                   View Details →
//                 </span>
//               </div>
//             </Link>
//           );
//         })}
//       </div>

//       {/* ======================================================
//           PAGINATION
//       ====================================================== */}

//       <Pagination pagination={pagination} baseHref={paginationBaseHref} />
//     </div>
//   );
// }

// /**
//  * ============================================================
//  * TABLE HELPERS
//  * ============================================================
//  */

// function TableHeading({ children }: { children: React.ReactNode }) {
//   return (
//     <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
//       {children}
//     </th>
//   );
// }

// function TableCell({ children }: { children: React.ReactNode }) {
//   return (
//     <td className="px-4 py-4 align-middle text-sm text-slate-600">
//       {children}
//     </td>
//   );
// }

// function MetricValue({ value }: { value: number | null | undefined }) {
//   if (value === null || value === undefined || !Number.isFinite(value)) {
//     return <EmptyValue />;
//   }

//   return (
//     <span className="font-semibold tabular-nums text-[#12355b]">
//       {formatMetric(value)}
//     </span>
//   );
// }

// function EmptyValue() {
//   return <span className="text-slate-300">—</span>;
// }

// /**
//  * ============================================================
//  * MOBILE METRIC
//  * ============================================================
//  */

// function MobileMetric({
//   label,
//   value,
//   suffix,
// }: {
//   label: string;
//   value: string;
//   suffix?: string;
// }) {
//   return (
//     <div>
//       <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400">
//         {label}
//       </p>

//       <div className="mt-1 flex items-baseline gap-1">
//         <p className="text-sm font-semibold tabular-nums text-[#12355b]">
//           {value}
//         </p>

//         {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
//       </div>
//     </div>
//   );
// }

// /**
//  * ============================================================
//  * PDF STATUS
//  * ============================================================
//  */

// function PdfStatus({ record }: { record: PatientMedicalRecord }) {
//   const status = record.pdf.status;

//   if (status === "ready" && record.pdf.isAvailable) {
//     return (
//       <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
//         <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
//         Available
//       </span>
//     );
//   }

//   if (status === "generating") {
//     return (
//       <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
//         <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
//         Generating
//       </span>
//     );
//   }

//   if (status === "queued" || status === "pending") {
//     return (
//       <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
//         <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
//         Pending
//       </span>
//     );
//   }

//   if (status === "failed") {
//     return (
//       <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
//         <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
//         Failed
//       </span>
//     );
//   }

//   return (
//     <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
//       Unknown
//     </span>
//   );
// }

// /**
//  * ============================================================
//  * IFI FUNCTIONAL RISK
//  * ============================================================
//  *
//  * IMPORTANT:
//  *
//  * This is only a compact HISTORY presentation.
//  *
//  * The complete functional profile still comes from the
//  * ifi_functional_profiles table on the Medical Record Detail
//  * page.
//  *
//  * We do NOT query that table once for every history row.
//  */
// /**
//  * ============================================================
//  * IFI FUNCTIONAL RISK BADGE
//  * ============================================================
//  *
//  * IMPORTANT:
//  *
//  * The risk label itself is NOT calculated here.
//  *
//  * It comes from:
//  *
//  * ifi_functional_profiles.risk_label
//  *        ↓
//  * getPatientMedicalRecords()
//  *        ↓
//  * record.metrics.ifi.riskLabel
//  *
//  * This component is responsible only for presentation.
//  */
// function IFIRiskBadge({ riskLabel }: { riskLabel: string }) {
//   const normalized = riskLabel.trim().toUpperCase();

//   let className = "border-slate-200 bg-slate-50 text-slate-700";

//   if (normalized.includes("VERY HIGH")) {
//     className = "border-red-200 bg-red-50 text-red-700";
//   } else if (normalized.includes("HIGH")) {
//     className = "border-orange-200 bg-orange-50 text-orange-700";
//   } else if (normalized.includes("MODERATE")) {
//     className = "border-amber-200 bg-amber-50 text-amber-700";
//   } else if (normalized.includes("LOW")) {
//     className = "border-emerald-200 bg-emerald-50 text-emerald-700";
//   } else if (normalized.includes("NORMAL")) {
//     className = "border-emerald-200 bg-emerald-50 text-emerald-700";
//   }

//   return (
//     <span
//       className={[
//         "inline-flex max-w-full items-center rounded-full border px-2.5 py-1",
//         "text-[10px] font-semibold leading-4",
//         className,
//       ].join(" ")}
//     >
//       {riskLabel}
//     </span>
//   );
// }

// /**
//  * ============================================================
//  * EMPTY STATE
//  * ============================================================
//  */

// function EmptyState({ description }: { description: string }) {
//   return (
//     <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
//       <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
//         <FileText className="h-5 w-5 text-slate-500" />
//       </div>

//       <h3 className="mt-4 text-sm font-semibold text-[#12355b]">
//         No Medical Records
//       </h3>

//       <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
//         {description}
//       </p>
//     </div>
//   );
// }

// /**
//  * ============================================================
//  * PAGINATION
//  * ============================================================
//  */

// function Pagination({
//   pagination,
//   baseHref,
// }: {
//   pagination: MedicalRecordsHistoryProps["pagination"];
//   baseHref: string;
// }) {
//   if (pagination.totalPages <= 1) {
//     return null;
//   }

//   return (
//     <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
//       <p className="text-xs text-slate-500">
//         Page{" "}
//         <span className="font-semibold text-[#12355b]">{pagination.page}</span>{" "}
//         of{" "}
//         <span className="font-semibold text-[#12355b]">
//           {pagination.totalPages}
//         </span>
//         {" · "}
//         {pagination.totalRecords} records
//       </p>

//       <div className="flex items-center gap-2">
//         {pagination.hasPreviousPage ? (
//           <Link
//             href={buildPageHref(baseHref, pagination.page - 1)}
//             className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#12355b] transition-colors hover:border-[#2e6cf6]/30 hover:bg-[#2e6cf6]/5"
//           >
//             <ChevronLeft className="h-3.5 w-3.5" />
//             Previous
//           </Link>
//         ) : (
//           <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
//             <ChevronLeft className="h-3.5 w-3.5" />
//             Previous
//           </span>
//         )}

//         {pagination.hasNextPage ? (
//           <Link
//             href={buildPageHref(baseHref, pagination.page + 1)}
//             className="inline-flex items-center gap-1 rounded-lg bg-[#2e6cf6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#245bd4]"
//           >
//             Next
//             <ChevronRight className="h-3.5 w-3.5" />
//           </Link>
//         ) : (
//           <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
//             Next
//             <ChevronRight className="h-3.5 w-3.5" />
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// /**
//  * ============================================================
//  * FORMATTERS
//  * ============================================================
//  */

// function buildPageHref(baseHref: string, page: number): string {
//   return `${baseHref}?page=${page}`;
// }

// function formatMetric(value: number | null | undefined): string {
//   if (value === null || value === undefined || !Number.isFinite(value)) {
//     return "—";
//   }

//   return value.toFixed(2).replace(/\.?0+$/, "");
// }

// function formatAge(value: number | null | undefined): string {
//   if (value === null || value === undefined || !Number.isFinite(value)) {
//     return "—";
//   }

//   return value.toFixed(1).replace(/\.0$/, "");
// }

// function formatDate(value: string): string {
//   const date = new Date(`${value}T00:00:00`);

//   if (Number.isNaN(date.getTime())) {
//     return value;
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   }).format(date);
// }

// function formatCreatedTime(value: string): string {
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return "";
//   }

//   return new Intl.DateTimeFormat("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//   }).format(date);
// }

import Link from "next/link";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

import DeleteMedicalRecordButton from "@/components/medical-records/DeleteMedicalRecordButton";

import type { PatientMedicalRecord } from "@/services/database/medical-records/getPatientMedicalRecords";

interface MedicalRecordsHistoryProps {
  records: PatientMedicalRecord[];

  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  paginationBaseHref: string;

  getRecordHref: (record: PatientMedicalRecord) => string;

  emptyDescription?: string;

  /**
   * Controls whether the destructive Delete action is rendered.
   *
   * IMPORTANT:
   *
   * This defaults to false because this component is shared
   * between patient and doctor Medical Records pages.
   *
   * Patient page:
   *   allowDelete={true}
   *
   * Doctor page:
   *   omit the prop
   *
   * This is UI control only. Real deletion authorization is
   * still enforced by the DELETE API on the server.
   */
  allowDelete?: boolean;
}

/**
 * ============================================================
 * MEDICAL RECORDS HISTORY
 * ============================================================
 *
 * Shared between:
 *
 * Patient:
 * /dashboard/medical-records
 *
 * Doctor:
 * /dashboard/patients/[relationshipId]/medical-records
 *
 * This component is presentation-only.
 *
 * It does NOT:
 * - authenticate users
 * - authorize patient access
 * - query Supabase
 * - resolve doctor-patient relationships
 *
 * Deletion authorization is enforced separately by the
 * server-side API.
 */
export default function MedicalRecordsHistory({
  records,
  pagination,
  paginationBaseHref,
  getRecordHref,
  emptyDescription = "No medical records are available yet.",
  allowDelete = false,
}: MedicalRecordsHistoryProps) {
  if (records.length === 0) {
    return <EmptyState description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {/* ======================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <TableHeading>Assessment</TableHeading>

                <TableHeading>IFI</TableHeading>

                <TableHeading>IFI Range</TableHeading>

                <TableHeading>Functional Risk</TableHeading>

                <TableHeading>Biological Age</TableHeading>

                <TableHeading>PDF Report</TableHeading>

                <TableHeading>
                  <span className="sr-only">Record actions</span>
                </TableHeading>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => {
                const ifi = record.metrics.ifi;

                const biologicalAge = record.metrics.biologicalAge;

                const riskLabel = ifi?.riskLabel ?? null;

                return (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60"
                  >
                    {/* Assessment */}

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
                          <CalendarDays className="h-4 w-4 text-[#2e6cf6]" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-[#12355b]">
                            {formatDate(record.evaluationDate)}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatCreatedTime(record.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* IFI */}

                    <TableCell>
                      <MetricValue value={ifi?.rawIfi ?? ifi?.ifi} />
                    </TableCell>

                    {/* IFI Range */}

                    <TableCell>
                      {ifi?.ifiRange !== null && ifi?.ifiRange !== undefined ? (
                        <span className="inline-flex min-w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-[#12355b]">
                          {ifi.ifiRange}
                        </span>
                      ) : (
                        <EmptyValue />
                      )}
                    </TableCell>

                    {/* Functional Risk */}

                    <TableCell>
                      {riskLabel ? (
                        <IFIRiskBadge riskLabel={riskLabel} />
                      ) : (
                        <EmptyValue />
                      )}
                    </TableCell>

                    {/* Biological Age */}

                    <TableCell>
                      {biologicalAge ? (
                        <div>
                          <p className="font-medium tabular-nums text-[#12355b]">
                            {formatAge(
                              biologicalAge.displayBiologicalAgeYears ??
                                biologicalAge.biologicalAgeYears,
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">years</p>
                        </div>
                      ) : (
                        <EmptyValue />
                      )}
                    </TableCell>

                    {/* PDF */}

                    <TableCell>
                      <PdfStatus record={record} />
                    </TableCell>

                    {/* Actions */}

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={getRecordHref(record)}
                          className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#12355b] transition-colors hover:border-[#2e6cf6]/40 hover:bg-[#2e6cf6]/5 hover:text-[#2e6cf6]"
                        >
                          View
                        </Link>

                        {allowDelete && (
                          <DeleteMedicalRecordButton
                            reportId={record.id}
                            evaluationDate={record.evaluationDate}
                          />
                        )}
                      </div>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          MOBILE
      ====================================================== */}

      <div className="space-y-3 md:hidden">
        {records.map((record) => {
          const ifi = record.metrics.ifi;

          const biologicalAge = record.metrics.biologicalAge;

          const riskLabel = ifi?.riskLabel ?? null;

          return (
            <div
              key={record.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#2e6cf6]/30"
            >
              {/* Date + PDF */}

              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2e6cf6]/10">
                    <CalendarDays className="h-4 w-4 text-[#2e6cf6]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#12355b]">
                      {formatDate(record.evaluationDate)}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCreatedTime(record.createdAt)}
                    </p>
                  </div>
                </div>

                <PdfStatus record={record} />
              </div>

              {/* Metrics */}

              <div className="mt-4 grid grid-cols-3 gap-3">
                <MobileMetric
                  label="IFI"
                  value={formatMetric(ifi?.rawIfi ?? ifi?.ifi)}
                />

                <MobileMetric
                  label="IFI Range"
                  value={
                    ifi?.ifiRange !== null && ifi?.ifiRange !== undefined
                      ? String(ifi.ifiRange)
                      : "—"
                  }
                />

                <MobileMetric
                  label="Bio Age"
                  value={
                    biologicalAge
                      ? formatAge(
                          biologicalAge.displayBiologicalAgeYears ??
                            biologicalAge.biologicalAgeYears,
                        )
                      : "—"
                  }
                  suffix={biologicalAge ? "yrs" : undefined}
                />
              </div>

              {/* Functional Risk */}

              {riskLabel && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    Functional Risk
                  </span>

                  <IFIRiskBadge riskLabel={riskLabel} />
                </div>
              )}

              {/* Mobile Actions */}

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={getRecordHref(record)}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#12355b] transition-colors hover:border-[#2e6cf6]/40 hover:bg-[#2e6cf6]/5 hover:text-[#2e6cf6]"
                >
                  View Details
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>

                {allowDelete && (
                  <DeleteMedicalRecordButton
                    reportId={record.id}
                    evaluationDate={record.evaluationDate}
                    variant="mobile"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      <Pagination pagination={pagination} baseHref={paginationBaseHref} />
    </div>
  );
}

/**
 * ============================================================
 * TABLE HELPERS
 * ============================================================
 */

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-4 align-middle text-sm text-slate-600">
      {children}
    </td>
  );
}

function MetricValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <EmptyValue />;
  }

  return (
    <span className="font-semibold tabular-nums text-[#12355b]">
      {formatMetric(value)}
    </span>
  );
}

function EmptyValue() {
  return <span className="text-slate-300">—</span>;
}

/**
 * ============================================================
 * MOBILE METRIC
 * ============================================================
 */

function MobileMetric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-1">
        <p className="text-sm font-semibold tabular-nums text-[#12355b]">
          {value}
        </p>

        {suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * PDF STATUS
 * ============================================================
 */

function PdfStatus({ record }: { record: PatientMedicalRecord }) {
  const status = record.pdf.status;

  if (status === "ready" && record.pdf.isAvailable) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Available
      </span>
    );
  }

  if (status === "generating") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Generating
      </span>
    );
  }

  if (status === "queued" || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      Unknown
    </span>
  );
}

/**
 * ============================================================
 * IFI FUNCTIONAL RISK BADGE
 * ============================================================
 *
 * IMPORTANT:
 *
 * The risk label itself is NOT calculated here.
 *
 * It comes from:
 *
 * ifi_functional_profiles.risk_label
 *        ↓
 * getPatientMedicalRecords()
 *        ↓
 * record.metrics.ifi.riskLabel
 *
 * This component is responsible only for presentation.
 */

function IFIRiskBadge({ riskLabel }: { riskLabel: string }) {
  const normalized = riskLabel.trim().toUpperCase();

  let className = "border-slate-200 bg-slate-50 text-slate-700";

  if (normalized.includes("VERY HIGH")) {
    className = "border-red-200 bg-red-50 text-red-700";
  } else if (normalized.includes("HIGH")) {
    className = "border-orange-200 bg-orange-50 text-orange-700";
  } else if (normalized.includes("MODERATE")) {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (normalized.includes("LOW")) {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized.includes("NORMAL")) {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return (
    <span
      className={[
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1",
        "text-[10px] font-semibold leading-4",
        className,
      ].join(" ")}
    >
      {riskLabel}
    </span>
  );
}

/**
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptyState({ description }: { description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
        <FileText className="h-5 w-5 text-slate-500" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#12355b]">
        No Medical Records
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/**
 * ============================================================
 * PAGINATION
 * ============================================================
 */

function Pagination({
  pagination,
  baseHref,
}: {
  pagination: MedicalRecordsHistoryProps["pagination"];
  baseHref: string;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Page{" "}
        <span className="font-semibold text-[#12355b]">{pagination.page}</span>{" "}
        of{" "}
        <span className="font-semibold text-[#12355b]">
          {pagination.totalPages}
        </span>
        {" · "}
        {pagination.totalRecords} records
      </p>

      <div className="flex items-center gap-2">
        {pagination.hasPreviousPage ? (
          <Link
            href={buildPageHref(baseHref, pagination.page - 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-[#12355b] transition-colors hover:border-[#2e6cf6]/30 hover:bg-[#2e6cf6]/5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </span>
        )}

        {pagination.hasNextPage ? (
          <Link
            href={buildPageHref(baseHref, pagination.page + 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#2e6cf6] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#245bd4]"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * FORMATTERS
 * ============================================================
 */

function buildPageHref(baseHref: string, page: number): string {
  return `${baseHref}?page=${page}`;
}

function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatAge(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCreatedTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
