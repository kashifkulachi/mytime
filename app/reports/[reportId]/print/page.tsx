// Before restricting the Preview of Print page.tsx

// import AgingCoefficientReport from "./ReportComponents/AgeCoefficientReport";
// import { ReportPage } from "@/components/medical-reports/ReportPage";
// import { getReportById } from "@/services/database/reports/getReportById";
// import { notFound } from "next/navigation";
// import InflammationCoefficient from "./ReportComponents/InflammationCoefficient";
// import PeptideDoseReport from "./ReportComponents/PeptideDoseReport";
// import PatientInfoReport from "./ReportComponents/PatientInfoReport";
// import HBOTSessionReport from "./ReportComponents/HBOTSessionReport";
// import NueronMoringaDropsReport from "./ReportComponents/NueronMoringaDropsReport";
// import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";
// import { toast } from "sonner";
// import IFIFunctionalConditionReport from "./ReportComponents/IFIFunctionalConditionReport";

// export const dynamic = "force-dynamic";

// interface ReportPrintPageProps {
//   params: Promise<{
//     reportId: string;
//   }>;
// }

// export default async function DemoPrintReportPage({
//   params,
// }: ReportPrintPageProps) {
//   const { reportId } = await params;

//   const report = await getReportById(reportId);
//   if (!report) {
//     toast.error("Unable to load the report");
//     return;
//   }
//   const ifiFunctionalProfile = await getIFIFunctionalProfile({
//     sex: report?.gender,
//     ifiRange: report?.results.IFI.ifiRange,
//   });

//   if (!report) {
//     notFound();
//   }

//   return (
//     <div
//       className="medical-report-document bg-amber-100"
//       data-report-ready="true"
//     >
//       <ReportPage>
//         <PatientInfoReport
//           dateOfBirth={report.dateOfBirth}
//           patientName={report.patientName}
//           sex={report.gender}
//           evaluationDate={report.evaluationDate}
//         />
//         <AgingCoefficientReport
//           agingCoefficientPercent={
//             report.results.BiologicalAge.agingCoefficientPercent
//           }
//           biologicalAge={report.results.BiologicalAge.biologicalAgeYears}
//           ageDifferenceYears={
//             report.results.BiologicalAge.breakdown.biologicalAgeShiftYears
//           }
//           chronologicalAge={
//             report.results.BiologicalAge.breakdown.chronologicalAgeYears
//           }
//         />
//       </ReportPage>

//       <InflammationCoefficient
//         inflammationCoefficientPercent={
//           report.results.IFI.inflammationCoefficientPercent
//         }
//       />

//       <PeptideDoseReport
//         ifiRange={report.results.IFI.ifiRange}
//         recommendations={report.results.PeptideDose.recommendations}
//       />

//       <HBOTSessionReport
//         recommendations={report.results.HBOTSessions.recommendations}
//       />

//       <IFIFunctionalConditionReport
//         age={report.results.BiologicalAge.breakdown.chronologicalAgeYears}
//         patientName={report.patientName}
//         profile={ifiFunctionalProfile}
//         sex={ifiFunctionalProfile.sex}
//       />

//       <NueronMoringaDropsReport
//         recommendedDrops={
//           report.results.PeptideDose.neuronOliveMoringa.recommendedDrops
//         }
//         activeIngredients={
//           report.results.PeptideDose.neuronOliveMoringa.activeIngredients
//         }
//         category={report.results.PeptideDose.neuronOliveMoringa.category}
//         productName={report.results.PeptideDose.neuronOliveMoringa.productName}
//         unit={report.results.PeptideDose.neuronOliveMoringa.unit}
//       />
//     </div>
//   );
// }

import "server-only";

import { timingSafeEqual } from "node:crypto";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ReportPage } from "@/components/medical-reports/ReportPage";
import { getReportById } from "@/services/database/reports/getReportById";
import { getIFIFunctionalProfile } from "@/services/database/reports/getIFIFunctionalProfile";

import AgingCoefficientReport from "./ReportComponents/AgeCoefficientReport";
import HBOTSessionReport from "./ReportComponents/HBOTSessionReport";
import IFIFunctionalConditionReport from "./ReportComponents/IFIFunctionalConditionReport";
import InflammationCoefficient from "./ReportComponents/InflammationCoefficient";
import NueronMoringaDropsReport from "./ReportComponents/NueronMoringaDropsReport";
import PatientInfoReport from "./ReportComponents/PatientInfoReport";
import PeptideDoseReport from "./ReportComponents/PeptideDoseReport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPORT_RENDER_SECRET_HEADER = "x-mytime-render-secret";

/**
 * ------------------------------------------------------------
 * LOCAL DESIGN PREVIEW
 * ------------------------------------------------------------
 *
 * During local development:
 *
 * http://localhost:3000/reports/{reportId}/print
 *
 * can be opened directly in the browser without generating
 * a PDF.
 *
 * Production builds NEVER receive this bypass because
 * NODE_ENV === "production" on Vercel.
 *
 * This is safer than manually commenting/uncommenting the
 * authorization code before every deployment.
 */
const ALLOW_LOCAL_PRINT_PREVIEW = process.env.NODE_ENV === "development";

interface ReportPrintPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function ReportPrintPage({
  params,
}: ReportPrintPageProps) {
  /**
   * ----------------------------------------------------------
   * 1. INTERNAL PRINT AUTHORIZATION
   * ----------------------------------------------------------
   */
  await requirePrintRouteAccess();

  /**
   * ----------------------------------------------------------
   * 2. REPORT ID
   * ----------------------------------------------------------
   */
  const { reportId } = await params;

  const normalizedReportId = reportId.trim();

  if (!normalizedReportId) {
    notFound();
  }

  /**
   * ----------------------------------------------------------
   * 3. LOAD REPORT
   * ----------------------------------------------------------
   *
   * This uses the admin-backed report service because this page
   * is an internal rendering surface.
   *
   * Authorization has already happened above.
   */
  const report = await getReportById(normalizedReportId);

  if (!report) {
    notFound();
  }

  /**
   * ----------------------------------------------------------
   * 4. FUNCTIONAL PROFILE
   * ----------------------------------------------------------
   */
  const ifiFunctionalProfile = await getIFIFunctionalProfile({
    sex: report.gender,
    ifiRange: report.results.IFI.ifiRange,
  });

  /**
   * ----------------------------------------------------------
   * 5. REPORT DOCUMENT
   * ----------------------------------------------------------
   */
  return (
    <div
      className="medical-report-document bg-amber-100"
      data-report-ready="true"
    >
      <ReportPage>
        <PatientInfoReport
          dateOfBirth={report.dateOfBirth}
          patientName={report.patientName}
          sex={report.gender}
          evaluationDate={report.evaluationDate}
        />

        <AgingCoefficientReport
          agingCoefficientPercent={
            report.results.BiologicalAge.agingCoefficientPercent
          }
          biologicalAge={report.results.BiologicalAge.biologicalAgeYears}
          ageDifferenceYears={
            report.results.BiologicalAge.breakdown.biologicalAgeShiftYears
          }
          chronologicalAge={
            report.results.BiologicalAge.breakdown.chronologicalAgeYears
          }
        />
      </ReportPage>

      <InflammationCoefficient
        inflammationCoefficientPercent={
          report.results.IFI.inflammationCoefficientPercent
        }
      />

      <PeptideDoseReport
        ifiRange={report.results.IFI.ifiRange}
        recommendations={report.results.PeptideDose.recommendations}
      />

      <HBOTSessionReport
        recommendations={report.results.HBOTSessions.recommendations}
      />

      <IFIFunctionalConditionReport
        age={report.results.BiologicalAge.breakdown.chronologicalAgeYears}
        patientName={report.patientName}
        profile={ifiFunctionalProfile}
        sex={ifiFunctionalProfile.sex}
      />

      <NueronMoringaDropsReport
        recommendedDrops={
          report.results.PeptideDose.neuronOliveMoringa.recommendedDrops
        }
        activeIngredients={
          report.results.PeptideDose.neuronOliveMoringa.activeIngredients
        }
        category={report.results.PeptideDose.neuronOliveMoringa.category}
        productName={report.results.PeptideDose.neuronOliveMoringa.productName}
        unit={report.results.PeptideDose.neuronOliveMoringa.unit}
      />
    </div>
  );
}

/**
 * Authorizes access to the internal Puppeteer rendering page.
 *
 * Development:
 *
 * Direct browser access is allowed automatically.
 *
 * Production:
 *
 * A valid x-mytime-render-secret header is required.
 */
async function requirePrintRouteAccess(): Promise<void> {
  /**
   * ----------------------------------------------------------
   * DEVELOPMENT-ONLY BYPASS
   * ----------------------------------------------------------
   *
   * You can temporarily remove/comment THIS block if you ever
   * want to test production-style authorization locally.
   *
   * Normally, leave it exactly as-is.
   */
  if (ALLOW_LOCAL_PRINT_PREVIEW) {
    return;
  }

  /**
   * ----------------------------------------------------------
   * PRODUCTION INTERNAL SECRET
   * ----------------------------------------------------------
   */
  const expectedSecret = process.env.REPORT_RENDER_SECRET;

  if (!expectedSecret) {
    console.error("[Report Print] REPORT_RENDER_SECRET is not configured.");

    /**
     * Fail closed.
     *
     * Never allow the route merely because the environment
     * variable was forgotten.
     */
    notFound();
  }

  const requestHeaders = await headers();

  const suppliedSecret = requestHeaders.get(REPORT_RENDER_SECRET_HEADER);

  if (!suppliedSecret || !safeSecretEquals(suppliedSecret, expectedSecret)) {
    /**
     * Returning 404 rather than an authorization explanation
     * avoids advertising the existence of the internal print
     * rendering endpoint/report.
     */
    notFound();
  }
}

function safeSecretEquals(supplied: string, expected: string): boolean {
  const suppliedBuffer = Buffer.from(supplied);

  const expectedBuffer = Buffer.from(expected);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}
