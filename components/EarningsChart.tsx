import { formatNaira } from "@/lib/utils";

type Point = { label: string; value: number };

export function EarningsChart({
  data,
  height = 200,
  color = "#6929FC",
  accent = "#FD23A7",
}: {
  data: Point[];
  height?: number;
  color?: string;
  accent?: string;
}) {
  const width = 900;
  const padX = 24;
  const padY = 20;
  const max = Math.max(...data.map((d) => d.value));
  const min = 0;
  const stepX = (width - padX * 2) / Math.max(1, data.length - 1);
  const scaleY = (v: number) =>
    height - padY - ((v - min) / (max - min || 1)) * (height - padY * 2);

  const points = data.map((d, i) => [padX + i * stepX, scaleY(d.value)] as const);

  // Smooth path (Catmull-Rom to Bezier)
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1][0]} ${height - padY} L ${points[0][0]} ${height - padY} Z`;

  const gid = "eg-" + Math.abs(hashString(color + accent)).toString(36);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label="Earnings over time"
      >
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gid + "-line"} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={padX}
            x2={width - padX}
            y1={padY + (height - padY * 2) * r}
            y2={padY + (height - padY * 2) * r}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 6"
          />
        ))}

        <path d={areaPath} fill={`url(#${gid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${gid}-line)`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* end-of-line dot */}
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r={4.5}
          fill={accent}
          stroke="#0E0E14"
          strokeWidth={2}
        />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-white/45 px-1">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-white/35 px-1">
        <span>{formatNaira(min, { compact: true })}</span>
        <span>{formatNaira(max, { compact: true })}</span>
      </div>
    </div>
  );
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  const d: string[] = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
