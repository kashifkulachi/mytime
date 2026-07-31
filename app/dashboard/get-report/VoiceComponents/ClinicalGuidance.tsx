import { CheckCircle, Info } from "lucide-react";

function ClinicalGuidance() {
  return (
    <>
      <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <span className="material-symbols-outlined mt-1">
            <Info />
          </span>
          <h3 className="font-medium text-[20px]">Clinical Guidance</h3>
        </div>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="material-symbols-outlined mt-1 text-secondary text-body-lg">
              <CheckCircle width={17} />
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface">
                Quiet Environment
              </span>
              <span className="text-[14px] text-on-surface-variant">
                Minimize background noise and fans for optimal voice frequency
                analysis.
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="material-symbols-outlined mt-1 text-secondary text-body-lg">
              <CheckCircle width={17} />
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface">Mic Distance</span>
              <span className="text-[14px] text-on-surface-variant">
                Keep your device approx. 30cm (12&quot;) from your mouth.
              </span>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="material-symbols-outlined mt-1 text-secondary text-body-lg">
              <CheckCircle width={17} />
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-on-surface">Steady Volume</span>
              <span className="text-[14px] text-on-surface-variant">
                Maintain a comfortable volume from{" "}
                <span className="font-semibold">7</span> till{" "}
                <span className="font-semibold">J</span>.
              </span>
            </div>
          </li>
        </ul>
      </div>
    </>
  );
}

export default ClinicalGuidance;
