// interface Props {
//   height: number;
// }

// export function WaveformBar({ height }: Props) {
//   return (
//     <div className="w-1 rounded-full bg-outline-variant" style={{ height }} />
//   );
// }
interface Props {
  height: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WaveformBar({ height, className = "", style }: Props) {
  return (
    <div
      className={`w-1 rounded-full transition-all duration-300 ${className}`}
      style={{ height, ...style }}
    />
  );
}
