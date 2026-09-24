import type { Level, Panel } from "@/lib/conditions";
import { noWidow } from "@/lib/labels";

// Full class names so Tailwind can find them.
// Every panel has a thin border in its level colour and a grey fill, with the
// top-left corner cut off (see `notch` in globals.css). The tag is a pill
// filled with the same colour, carrying the panel's own label (Comfortable,
// Fair, Dry...) in white.
const LEVEL_FILL: Record<Level, string> = {
  good: "bg-level-good",
  moderate: "bg-level-moderate",
  high: "bg-level-high",
  extreme: "bg-level-extreme",
  unknown: "bg-level-unknown",
};

export default function ConditionPanel({ panel, index }: { panel: Panel; index: number }) {
  return (
    <section className={`notch flex flex-col rounded-2xl p-px ${LEVEL_FILL[panel.level]}`}>
      <div className="notch-inner flex flex-1 flex-col gap-4 rounded-[15px] bg-panel p-6">
        <div className="flex items-start justify-between gap-2 pl-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, "0")}/</span>
            {panel.label}
          </h2>
          <span className={`rounded-full px-4 py-1.5 text-right text-sm font-medium text-white ${LEVEL_FILL[panel.level]}`}>{panel.headline}</span>
        </div>
        <p className="flex items-baseline gap-2 pt-4">
          <span className="text-6xl font-medium tracking-tight tabular-nums">{panel.value}</span>
          <span className="text-sm text-muted">{panel.unit}</span>
        </p>
        <p className="whitespace-pre-line text-sm text-muted">{panel.detail.split("\n").map(noWidow).join("\n")}</p>
        <p className="mt-auto border-t border-foreground/10 pt-3 text-xs text-muted">{readingTime(panel)}</p>
      </div>
    </section>
  );
}

// Times arrive in UTC, like "2026-09-23T15:30", and dates like
// "2026-09-22", so we read the parts straight from the text.
function readingTime({ observedAt, timing }: Panel): string {
  if (!observedAt) return "No reading available";
  const [date, time] = observedAt.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  });
  if (timing === "recorded") return `Modelled record for ${day}`;
  if (timing === "forecast") return `Forecast for ${day}`;
  return time ? `Reading taken ${time} on ${day} UTC` : `River reading for ${day}`;
}
