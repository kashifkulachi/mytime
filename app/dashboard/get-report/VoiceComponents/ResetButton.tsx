import { useRecordingStatus } from "@/context/VoiceRecordingStatusContext";
import { Redo2 } from "lucide-react";

type ActionProps = {
  reset: () => void;
};

function ActionsButtons({ reset }: ActionProps) {
  const { status } = useRecordingStatus();

  return (
    <button
      className="py-md w-[100px] border p-3 gap-2 border-outline-variant text-on-surface-variant rounded-lg font-label-md flex cursor-pointer items-center justify-center gap-sm hover:bg-surface-container-low transition-colors disabled:opacity-50"
      onClick={reset}
      disabled={status == "processing" || status == "recording"}
    >
      <span className="material-symbols-outlined rotate-180">
        <Redo2 />
      </span>
      Retry
    </button>
  );
}

export default ActionsButtons;
