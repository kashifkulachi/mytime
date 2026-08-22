import AgingCoefficientReport from "./ReportComponents/AgeCoefficientReport";
import { ReportPage } from "@/components/medical-reports/ReportPage";
import { getReportById } from "@/services/database/reports/getReportById";
import { notFound } from "next/navigation";
import InflammationCoefficient from "./ReportComponents/InflammationCoefficient";
import PeptideDoseReport from "./ReportComponents/PeptideDoseReport";
import PatientInfoReport from "./ReportComponents/PatientInfoReport";
import HBOTSessionReport from "./ReportComponents/HBOTSessionReport";
import NueronMoringaDropsReport from "./ReportComponents/NueronMoringaDropsReport";

export const dynamic = "force-dynamic";

// const testInput: IFIFormulaInput = {
//   evaluationDate: "2026-08-07",
//   // dateOfBirth: "1978-08-06",
//   dateOfBirth: "2021-06-15",
//   age: 50.7,
//   sex: "female",
//   heightCm: 100,
//   weightKg: 18.5,
//   bmi: 18.5,
//   spo2: 90,
//   heartRate: 88,
//   rmsAmplitude: 4.583,
//   meanFrequency: 220,
//   meanIntensity: 43,
// };

// validateFormulaInput(testInput);

// const IFI = calculateIFI(testInput);

// const biological = calculateBiologicalAge({
//   dateOfBirth: testInput.dateOfBirth,
//   evaluationDate: testInput.evaluationDate,
//   rawIfi: IFI.rawIfi,
// });

// console.log("P001 Chronical Age: ", biological.breakdown.chronologicalAgeYears);
// console.log("P001 Biological Age: ", biological.biologicalAgeYears);

interface ReportPrintPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function DemoPrintReportPage({
  params,
}: ReportPrintPageProps) {
  const { reportId } = await params;

  const report = await getReportById(reportId);

  if (!report) {
    notFound();
  }

  return (
    <div className="bg-amber-100">
      <ReportPage>
        {/* <div className="flex justify-center items-center flex-col py-4 my-3 bg-gray-50">
          <h1 className="text-[34px] font-black uppercase leading-none tracking-[-0.035em]">
            <span className="text-[#087225]">My </span>
            <span className="text-[#075ec7]">Time </span>Report
          </h1>
          <p className="mt-1 text-[13px] font-bold italic leading-none">
            This report is intended for educational and functional monitoring
            purposes only.
          </p>
        </div> */}
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
