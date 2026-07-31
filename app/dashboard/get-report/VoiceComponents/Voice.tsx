import { PronunciationGuide } from "./ProunounciationGuide";
import { RecordingPanel } from "./RecordingPanel";
import ClinicalGuidance from "./ClinicalGuidance";

function Voice() {
  return (
    <section className="flex-1 items-start grid md:grid-cols-4 grid-cols-1 mx-auto gap-4">
      <PronunciationGuide />
      <RecordingPanel />
      <ClinicalGuidance />
    </section>
  );
}

export default Voice;
