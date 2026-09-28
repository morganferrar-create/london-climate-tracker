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

export default function ConditionPanel({ panel }: { panel: Panel }) {
  return (
    <section className={`notch flex flex-col rounded-2xl p-px md:min-h-[18.5rem] ${LEVEL_FILL[panel.level]}`}>
      <div className="notch-inner flex flex-1 flex-col gap-4 rounded-[15px] bg-panel p-6">
        <div className="flex items-start justify-between gap-2 pl-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            {panel.label}
          </h2>
          <span className={`rounded-full px-4 py-1.5 text-right text-sm font-medium text-white ${LEVEL_FILL[panel.level]}`}>{panel.headline}</span>
        </div>
        <p className="flex items-baseline gap-2 pt-4">
          <span className="text-6xl font-medium tracking-tight tabular-nums">{panel.value}</span>
          <span className="text-sm text-muted">{panel.unit}</span>
        </p>
        <p className="whitespace-pre-line text-sm text-muted">{panel.detail.split("\n").map(noWidow).join("\n")}</p>
        <p className="mt-auto border-t border-foreground/10 pt-3 text-xs text-muted">{panel.timeLabel ?? "No reading available"}</p>
      </div>
    </section>
  );
}
