import { PronunciationGuide } from "./ProunounciationGuide";
import { RecordingPanel } from "./RecordingPanel";
import ClinicalGuidance from "./ClinicalGuidance";
import { CharacterGrid } from "./CharacterGrid";

function Voice() {
  return (
    <section
      className="
        grid grid-cols-1
        lg:grid-cols-2
        xl:grid-cols-3
        gap-4
        items-start
        w-full
        max-w-[1300px]
        mx-auto
      "
    >
      <div className="min-w-0">
        {/* <PronunciationGuide /> */}
        <CharacterGrid />
      </div>

      <div className="min-w-0 lg:col-span-2 xl:col-span-2">
        <RecordingPanel />
      </div>

      {/* <div className="min-w-0">
        <ClinicalGuidance />
      </div> */}
    </section>
  );
}

export default Voice;
