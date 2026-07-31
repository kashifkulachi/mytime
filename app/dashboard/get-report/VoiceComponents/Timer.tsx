import { TimerIcon } from "lucide-react";

interface Props {
  duration: number;
}

export function Timer({ duration }: Props) {
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (duration % 60).toString().padStart(2, "0");

  return (
    <div className="font-semibold text-2xl text-display flex items-center gap-2 text-primary mb-md tabular-nums">
      <span>
        <TimerIcon />
      </span>
      {minutes}:{seconds}
    </div>
  );
}
