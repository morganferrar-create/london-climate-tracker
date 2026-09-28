// "When should I plug in?": when London's electricity is cleanest, from the
// grid's carbon intensity forecast. All numbers and times arrive worked out
// (see lib/grid.ts), so this only lays them out.

import type { ReactNode } from "react";
import SectionRule from "./SectionRule";
import type { Level } from "@/lib/conditions";
import type { GridDay, GridWindow } from "@/lib/grid";

// Tags say what to do rather than naming NESO's carbon band ("High" could be
// misread as high renewables). Keyed by NESO's band name.
const ADVICE: Record<string, string> = {
  "very low": "Great time", low: "Great time", moderate: "OK time", high: "Better to wait", "very high": "Avoid if you can",
};
const advice = (index: string) => ADVICE[index] ?? "No rating";

// The same advice keyed by the site's level colours, for the chart labels.
const LEVEL_ADVICE: Record<Level, string> = {
  good: "Great time", moderate: "OK time", high: "Better to wait", extreme: "Avoid if you can", unknown: "",
};
// Runs of bars in the same colour, keeping those of four bars (two hours) or
// more; runs of three bars or fewer are too narrow for a label.
function stretches(bars: { level: Level }[], minBars = 4) {
  const runs: { start: number; length: number; level: Level }[] = [];
  bars.forEach((b, i) => {
    const last = runs.at(-1);
    if (last && last.level === b.level) last.length++;
    else runs.push({ start: i, length: 1, level: b.level });
  });
  return runs.filter((r) => r.length >= minBars && r.level !== "unknown");
}

const LEVEL_BG: Record<Level, string> = {
  good: "bg-level-good", moderate: "bg-level-moderate", high: "bg-level-high", extreme: "bg-level-extreme", unknown: "bg-level-unknown",
};

export default function GridSection({
  grid, past = false, dayButtons,
}: { grid: GridDay | null; past?: boolean; dayButtons?: ReactNode }) {
  return (
    <section aria-labelledby="grid-heading" className="mt-16">
      <SectionRule label="Electricity in London" />
      <h2 id="grid-heading" className="text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
        When should I plug in<span className="text-accent">?</span>
      </h2>
      {/* Two columns on wider screens with an orange line between them; on
          phones they stack, with the line running across instead. */}
      <div className="mt-4 grid gap-4 text-sm text-muted md:grid-cols-2 md:gap-0">
        <p className="md:pr-8">
          <span className="font-bold text-foreground">Britain&apos;s electricity</span> comes from a mix of sources that change throughout the day. When it&apos;s windy or
          sunny more of it comes from renewables, making it a more planet-friendly time to use electricity. In the early
          evening when many people are typically home for the day and using electricity, fossil-fuelled power stations fire up
          to fill the gap.
        </p>
        <p className="border-t border-accent pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <span className="font-bold text-foreground">Carbon intensity</span> measures how planet-friendly your electricity
          is: the grams of carbon dioxide released for each kilowatt-hour (kWh), about what a washing machine uses in
          one load. The lower the number, the cleaner your electricity. Running the same jobs at the cleanest times cuts their emissions without using any less.
        </p>
      </div>

      {dayButtons && <div className="mt-8">{dayButtons}</div>}

      {!grid ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
          Grid forecast unavailable right now.
        </p>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{grid.intro}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {grid.now ? (
              <Stat
                label={`Right now, ${grid.now.time}`}
                value={`${grid.now.renewables}%`}
                unit="from renewables"
                level={grid.now.level}
                tag={advice(grid.now.index)}
                note={`Carbon intensity ${grid.now.intensity} g CO₂/kWh`}
                footer={grid.now.footer}
              />
            ) : (
              <Stat
                label="Average for the day"
                value={`${grid.average.renewables}%`}
                unit="from renewables"
                level={grid.average.level}
                note={`Carbon intensity ${grid.average.intensity} g CO₂/kWh`}
                footer={grid.average.footer}
              />
            )}
            <WindowStat label={past ? "Cleanest three hours" : "Best time to plug in"} w={grid.best} />
            <WindowStat label={past ? "Dirtiest three hours" : "Best avoided"} w={grid.worst} />
          </div>

          <figure className="notch mt-6 flex rounded-2xl bg-accent p-px">
            <div className="notch-inner flex-1 rounded-[15px] bg-surface p-5 pl-8 sm:p-6 sm:pl-10">
            {/* Labels over each longer stretch of same-coloured bars. Only on
                wider screens, where a three-hour stretch has room for its label. */}
            <div aria-hidden className="relative mb-2 hidden h-7 lg:block">
              {stretches(grid.bars).map((r) => (
                <span
                  key={r.start}
                  className="absolute top-0 flex justify-center"
                  style={{ left: `${(r.start / grid.bars.length) * 100}%`, width: `${(r.length / grid.bars.length) * 100}%` }}
                >
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-white ${LEVEL_BG[r.level]}`}>
                    {LEVEL_ADVICE[r.level]}
                  </span>
                </span>
              ))}
            </div>
            <div role="img" aria-label={grid.summary} className="flex h-32 items-end gap-px">
              {grid.bars.map((b, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${LEVEL_BG[b.level]}`}
                  style={{ height: `${Math.max(4, (b.intensity / grid.max) * 100)}%` }}
                  title={`${b.time}: ${b.intensity} g/kWh`}
                />
              ))}
            </div>
            <div aria-hidden className="mt-2 flex text-xs text-muted">
              {grid.bars.map((b, i) => (
                <span key={i} className="flex-1 overflow-visible whitespace-nowrap">
                  {i % 6 === 0 ? b.time : ""}
                </span>
              ))}
            </div>
            <figcaption className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>Grams of CO₂ per kWh, every half hour ({grid.zone})</span>
              <Key level="good" text="Great time" />
              <Key level="moderate" text="OK time" />
              <Key level="high" text="Better to wait" />
              <Key level="extreme" text="Avoid if you can" />
            </figcaption>
            </div>
          </figure>

          <div className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Worth moving to the cleanest hours</h3>
              <ul className="list-disc space-y-1 pl-5 marker:text-accent">
                <li>Washing machine and tumble dryer</li>
                <li>Dishwasher</li>
                <li>Charging an electric car or e-bike</li>
                <li>Charging laptops, tablets and power banks</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Not worth worrying about</h3>
              <p>Kettles, lights, phones and TVs use too little electricity for the timing to make much difference.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label, value, unit, level, tag, note, footer,
}: { label: string; value: number | string; unit: string; level: Level; tag?: string; note: string; footer: string }) {
  return (
    <Card level={level} label={label} tag={tag} footer={footer}>
      <p className="flex items-baseline gap-2 pt-4">
        <span className="text-5xl font-medium tracking-tight tabular-nums sm:text-6xl">{value}</span>
        <span className="text-sm text-muted">{unit}</span>
      </p>
      <p className="text-sm text-muted">{note}</p>
    </Card>
  );
}

function WindowStat({ label, w }: { label: string; w: GridWindow }) {
  return (
    <Card level={w.level} label={label} footer={w.footer}>
      <p className="pt-4 text-4xl font-medium tracking-tight tabular-nums sm:text-5xl">
        {w.from}–{w.to}
      </p>
      <p className="text-sm text-muted">
        {w.renewables}% from renewables, about {w.intensity} g CO₂/kWh.
      </p>
    </Card>
  );
}

// The site's cut-corner card, laid out like the weather panels above: label
// and level tag, big figure, a line of detail, and a footer line under a thin
// rule. Both rows share the same minimum height so they line up.
function Card({
  level, label, tag, footer, children,
}: { level: Level; label: string; tag?: string; footer: string; children: ReactNode }) {
  return (
    <div className={`notch flex flex-col rounded-2xl p-px md:min-h-[18.5rem] ${LEVEL_BG[level]}`}>
      <div className="notch-inner flex flex-1 flex-col gap-4 rounded-[15px] bg-panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2 pl-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{label}</h3>
          {tag && (
            <span className={`rounded-full px-4 py-1.5 text-right text-sm font-medium text-white ${LEVEL_BG[level]}`}>{tag}</span>
          )}
        </div>
        {children}
        <p className="mt-auto border-t border-foreground/10 pt-3 text-xs text-muted">{footer}</p>
      </div>
    </div>
  );
}

function Key({ level, text }: { level: Level; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={`h-2.5 w-2.5 rounded-sm ${LEVEL_BG[level]}`} />
      {text}
    </span>
  );
}
