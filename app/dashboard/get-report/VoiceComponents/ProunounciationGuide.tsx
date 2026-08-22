import { CharacterGrid } from "./CharacterGrid";

export function PronunciationGuide() {
  return (
    <>
      <div className=" bg-surface-container-low rounded-xl border border-outline-variant p-3 flex flex-col items-center justify-center shadow-sm min-h-100">
        <div className="text-center mb-md">
          <span className="text-[17px] mb-1.5 inline-block font-label-sm text-on-surface-variant uppercase tracking-wider">
            Pronunciation Guide
          </span>
        </div>

        <div className="p-3">
          <CharacterGrid />
        </div>

        <p className="text-body-md text-on-surface text-center">
          Please sustain the sound clearly at a steady volume.
        </p>
      </div>
    </>
  );
}
