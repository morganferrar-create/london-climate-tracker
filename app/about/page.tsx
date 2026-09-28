import type { Metadata } from "next";
import city from "@/data/city.json";
import SectionRule from "@/components/SectionRule";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { flaggedActions, lastChecked } from "@/lib/actions";
import type { Level } from "@/lib/conditions";
import { RIVER_NAME } from "@/lib/feeds";
import { formatDate } from "@/lib/labels";
import type { Action, City } from "@/lib/types";

export const metadata: Metadata = { title: `About | Hi there, ${city.name}.` };

// Leave empty to hide the "Spotted something out of date?" line.
const CONTACT_EMAIL = "";

const LEVEL_BG: Record<Level, string> = {
  good: "bg-level-good", moderate: "bg-level-moderate", high: "bg-level-high", extreme: "bg-level-extreme", unknown: "bg-level-unknown",
};

// What each label on the home page means. The cut-offs match lib/conditions.ts
// (weather) and NESO's own ratings (electricity); keep them in step.
const GUIDE: { title: string; rows: [Level, string, string][] }[] = [
  {
    title: "Heat",
    rows: [
      ["good", "Comfortable", "Feels like under 27°C"],
      ["moderate", "Hot", "Feels like 27–35°C"],
      ["extreme", "Extreme heat", "Feels like 35°C or more"],
      ["high", "Extreme cold", "Feels like −15°C or less"],
    ],
  },
  {
    title: "Air",
    rows: [
      ["good", "Good", "European air quality index 0–40"],
      ["moderate", "Okay", "40–60"],
      ["high", "Poor", "60–80"],
      ["extreme", "Extremely poor", "Over 80"],
    ],
  },
  {
    title: "Rain and flood",
    rows: [
      ["good", "Dry", "Under 5 mm in the day"],
      ["moderate", "Rain today", "5–25 mm"],
      ["high", "Heavy rain", "25–50 mm, or the Thames at twice its normal flow"],
      ["extreme", "Torrential rain", "50 mm or more, or the Thames at five times normal"],
    ],
  },
  {
    title: "When to plug in",
    rows: [
      ["good", "Great time", "Low carbon: lots of wind or sun on the grid"],
      ["moderate", "OK time", "Moderate carbon"],
      ["high", "Better to wait", "High carbon: more gas power stations running"],
      ["extreme", "Avoid if you can", "Very high carbon, usually the early-evening peak"],
    ],
  },
];

const SOURCES = [
  ["Heat, air and rain", "Open-Meteo", "https://open-meteo.com/", "Every hour"],
  ["River level", `Open-Meteo flood model, reading ${RIVER_NAME}`, "https://open-meteo.com/en/docs/flood-api", "Every six hours"],
  ["Electricity", "NESO, Britain's electricity system operator", "https://carbonintensity.org.uk/", "Every half hour"],
];

// Flagged entries that might come back, with a short status. Worked out from
// the wording of each flag reason; anything that has ended is listed apart.
function statusOf(a: Action): string | null {
  const r = a.verification.flag_reason ?? "";
  if (/seasonal/i.test(r)) return "Seasonal";
  if (/paus/i.test(r)) return "Paused";
  if (/temporar/i.test(r)) return "Temporary";
  if (/round/i.test(r)) return "Between rounds";
  if (/closed|ended|no longer|withdrawn|replaced/i.test(r)) return null;
  return "Not open right now";
}

export default function About() {
  const c = city as City;
  const watch = flaggedActions.filter((a) => statusOf(a) !== null);
  const ended = flaggedActions.filter((a) => statusOf(a) === null);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <SiteHeader city={c} current="about" />

      <div className="flex flex-col gap-6 pb-12 pt-12 sm:pt-20 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-[4rem] font-medium leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
          About<span className="text-accent">.</span>
        </h1>
        <p className="max-w-sm text-sm leading-snug text-muted lg:pb-3">
          Every number here is live from public sources, and every action was checked against its official page.
        </p>
      </div>

      <SectionRule label="Can I trust the advice?" />
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-5xl font-medium tracking-[-0.03em]">{formatDate(lastChecked, true) ?? "–"}</p>
          <p className="mt-1 text-sm text-muted">Actions last checked</p>
        </div>
        <ul className="grid gap-4 text-sm sm:grid-cols-3">
          {[
            ["It's real", "Every action links to the official page it came from, so you can check it yourself."],
            ["It's still running", "Closed or paused schemes are left out of the advice. They're listed at the bottom of this page instead."],
            ["It's dated", "Each action shows when it was last checked, and they're all re-checked regularly."],
          ].map(([title, body]) => (
            <li key={title}>
              <p className="font-bold">{title}</p>
              <p className="mt-1 text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>

      <section aria-labelledby="guide-heading" className="mt-16">
        <SectionRule label="Reading the home page" />
        <h2 id="guide-heading" className="mb-6 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          What do the labels mean<span className="text-accent">?</span>
        </h2>
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
          {GUIDE.map((g) => (
            <div key={g.title}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{g.title}</h3>
              <ul className="divide-y divide-line border-y border-line">
                {g.rows.map(([level, label, meaning]) => (
                  <li key={label} className="flex items-center gap-4 py-3 text-sm">
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white ${LEVEL_BG[level]}`}>{label}</span>
                    <span className="text-muted">{meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="grid-heading" className="mt-16">
        <SectionRule label="The renewables figure" />
        <h2 id="grid-heading" className="mb-6 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          What percentage of London&apos;s electricity comes from renewables<span className="text-accent">?</span>
        </h2>
        <div className="grid gap-4 text-sm text-muted md:grid-cols-2 md:gap-0">
          <p className="md:pr-8">
            <span className="font-bold text-foreground">The percentage</span> on the home page is the share of electricity
            reaching London that comes from wind, solar, hydro and biomass. On a still evening it can be under 20%, while on a
            windy, sunny day it can reach about 50–55%. London&apos;s figure is usually lower than Britain&apos;s, because
            much of its power arrives from elsewhere, including electricity imported from abroad (which can come from
            nuclear, hydro, wind or gas power stations), which isn&apos;t counted as renewable here.
          </p>
          <p className="border-t border-accent pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <span className="font-bold text-foreground">Across Great Britain,</span> the grid can already run on almost
            entirely clean power when conditions are right. For example, in April 2026 it ran on a record 98.8% zero-carbon
            power for half an hour: about two-thirds renewables and one-third nuclear. Nuclear doesn&apos;t count towards the
            renewables figure, but it does make electricity cleaner, which is why &ldquo;Great time&rdquo; can appear even
            when renewables are below half. Learn more here:{" "}
            <a
              href="https://www.neso.energy/britains-electricity-system-breaks-zero-carbon-record-gas-reaches-historic-low-and-solar-hits-historic-high"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-accent"
            >
              NESO: zero-carbon record
            </a>
          </p>
        </div>
      </section>

      <section aria-labelledby="sources-heading" className="mt-16">
        <SectionRule label="Can I trust the numbers?" />
        <h2 id="sources-heading" className="mb-3 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          Where do the numbers come from<span className="text-accent">?</span>
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          All free, public sources. Weather readings come from forecasting models that are constantly corrected with real
          measurements, which gives a reading for London itself rather than the nearest weather station. Times are UK
          time. If a source is down, its panel says so rather than showing an old number.
        </p>
        <dl className="divide-y divide-line border-y border-line">
          {SOURCES.map(([what, who, url, how]) => (
            <div key={what} className="grid gap-1 py-4 text-sm sm:grid-cols-[12rem_1fr_10rem] sm:gap-6">
              <dt className="font-bold">{what}</dt>
              <dd>
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  {who}
                </a>
              </dd>
              <dd className="text-muted">Updated {how.toLowerCase()}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="watch-heading" className="mt-16">
        <SectionRule label="Not available right now" />
        <h2 id="watch-heading" className="mb-3 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          Worth keeping an eye on<span className="text-accent">.</span>
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          Useful schemes that aren&apos;t open at the moment, so they&apos;re not in the advice. They may come back.
        </p>
        {watch.length === 0 ? (
          <p className="text-sm text-muted">Nothing on hold right now.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {watch.map((a) => (
              <article key={a.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{a.category}</p>
                  <span className="shrink-0 rounded-full border border-field-border px-3 py-0.5 text-xs">{statusOf(a)}</span>
                </div>
                <h3 className="text-lg font-medium leading-snug">{a.title}</h3>
                <details className="group text-sm text-muted">
                  <summary className="cursor-pointer list-none marker:hidden">
                    <span aria-hidden className="text-accent group-open:hidden">+ </span>
                    <span aria-hidden className="hidden text-accent group-open:inline">– </span>
                    Why it&apos;s not in the advice
                  </summary>
                  <p className="mt-2">{a.verification.flag_reason?.replace(/^Freshness:\s*/i, "")}</p>
                </details>
                <p className="mt-auto pt-2 text-xs text-muted">
                  {a.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && " · "}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                        {s.title}
                      </a>
                    </span>
                  ))}
                </p>
              </article>
            ))}
          </div>
        )}

        {ended.length > 0 && (
          <details className="group mt-6 text-sm">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span aria-hidden className="text-accent group-open:hidden">+ </span>
              <span aria-hidden className="hidden text-accent group-open:inline">– </span>
              Recently ended
            </summary>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted marker:text-accent">
              {ended.map((a) => (
                <li key={a.id}>
                  <span className="text-foreground">{a.title}</span>: {a.verification.flag_reason?.replace(/^Freshness:\s*/i, "")}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {CONTACT_EMAIL && (
        <section aria-labelledby="contact-heading" className="mt-16">
          <SectionRule label="Help keep it accurate" />
          <h2 id="contact-heading" className="mb-3 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
            Spotted something out of date<span className="text-accent">?</span>
          </h2>
          <p className="text-sm text-muted">
            Schemes change. If an action is wrong or a link is broken, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline underline-offset-2 hover:text-accent">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
