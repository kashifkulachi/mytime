import { PronunciationGuide } from "./VoiceComponents/ProunounciationGuide";
import { RecordingPanel } from "./VoiceComponents/RecordingPanel";
import ClinicalGuidance from "./VoiceComponents/ClinicalGuidance";
import OximeterParent from "./OximeterComponents/OximeterParent";
import AssessmentStepper from "./AssesmentStepper";

export default function GenerateReport() {
  return (
    <main className=" bg-slate-50">
      {/* <div className="mx-auto flex min-h-screen  flex-col"> */}
      {/* <header className="mb-10">
          <span className="rounded-full bg-emerald-200 text-primary font-medium px-4 py-1 text-[15px] ">
            Step 1 of 5
          </span>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Generate MyTime Report
          </h1>

          <p className="mt-1 max-w-3xl text-slate-600">
            Complete your health assessment by following each step. Your voice,
            patient information, and oximeter readings will be analyzed to
            generate a personalized health report.
          </p>
        </header> */}

      {/* <section className="flex-1 grid md:grid-cols-4 grid-cols-1 mx-auto gap-4">
          <PronunciationGuide />
          <div className="col-span-2">
            <RecordingPanel />
          </div>
          <ClinicalGuidance /> */}

      <div className="flex-1">
        {/* <OximeterParserTest /> */}
        <AssessmentStepper />
      </div>
      {/* </div> */}
    </main>
  );
}
