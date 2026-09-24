import type { Metadata } from "next";
import city from "@/data/city.json";
import SectionRule from "@/components/SectionRule";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { flaggedActions, lastChecked, verifiedActions } from "@/lib/actions";
import { RIVER_NAME } from "@/lib/feeds";
import { formatDate } from "@/lib/labels";
import type { City } from "@/lib/types";

export const metadata: Metadata = { title: `How it's checked | Hi there, ${city.name}.` };

const CHECKS = [
  ["01/", "Format", "Every entry has all the required fields: title, summary, steps, sources and when it applies. The site checks this again every time it's built, so a broken entry can't reach the page."],
  ["02/", "Source spot-check", "Each action was looked up on its official page. The name, who it's for and what it offers had to match what the source says."],
  ["03/", "Freshness", "Is it still running? Closed, paused, seasonal or replaced schemes are flagged, even if the page still exists."],
];

const FEEDS = [
  ["Heat", "Open-Meteo weather forecast", "Actual and feels-like temperature, today's peak. Hot from 27°C feels-like, heat warning from 35°C, extreme from 40°C."],
  ["Air", "Open-Meteo air quality", "European Air Quality Index and fine particles (PM2.5). Moderate above 40, poor above 60, very poor above 80."],
  ["Rain and flood", "Open-Meteo weather forecast and flood model", `The day's rain total, and river flow on ${RIVER_NAME} compared with normal for the date. Heavy rain from 25 mm, flood risk when the river runs at twice normal.`],
];

export default function HowItsChecked() {
  const c = city as City;
  const stat = (value: string | number, label: string) => (
    <div className="border-t border-line pt-4">
      <p className="text-5xl font-medium tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <SiteHeader city={c} current="checked" />

      <div className="flex flex-col gap-6 pb-12 pt-12 sm:pt-20 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-5xl font-medium leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
          How it&apos;s<br />
          checked<span className="text-accent">.</span>
        </h1>
        <p className="max-w-xs text-sm leading-snug text-muted lg:pb-3">
          Advice is only useful if it&apos;s real and still running. Here&apos;s how every action was checked, and what
          didn&apos;t make it.
        </p>
      </div>

      <SectionRule label="The numbers" />
      <div className="grid gap-6 sm:grid-cols-3">
        {stat(verifiedActions.length, "actions passed all three checks")}
        {stat(flaggedActions.length, "flagged and kept off the advice")}
        {stat(formatDate(lastChecked, true) ?? "–", "most recent check")}
      </div>

      <section aria-labelledby="checks-heading" className="mt-16">
        <SectionRule label="What every action goes through" />
        <h2 id="checks-heading" className="mb-6 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          The three checks<span className="text-accent">.</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {CHECKS.map(([n, name, body]) => (
            <div key={name} className="notch flex rounded-2xl bg-accent p-px">
              <div className="notch-inner flex flex-1 flex-col gap-3 rounded-[15px] bg-surface p-6">
                <p className="pl-4 text-xs font-bold uppercase tracking-wider text-muted">
                  <span className="mr-2">{n}</span>{name}
                </p>
                <p className="text-sm">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="feeds-heading" className="mt-16">
        <SectionRule label="Where the numbers come from" />
        <h2 id="feeds-heading" className="mb-3 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          Live readings<span className="text-accent">.</span>
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          All three panels use Open-Meteo, a free public weather service. No accounts or keys. Weather and air are
          refreshed every hour and the river every six hours, and each panel shows when its reading was taken. If a
          feed is down, its panel says so instead of showing an old number.
        </p>
        <dl className="divide-y divide-line border-y border-line">
          {FEEDS.map(([panel, source, detail]) => (
            <div key={panel} className="grid gap-1 py-4 sm:grid-cols-[10rem_14rem_1fr] sm:gap-6">
              <dt className="text-sm font-bold">{panel}</dt>
              <dd className="text-sm text-muted">{source}</dd>
              <dd className="text-sm">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="flagged-heading" className="mt-16">
        <SectionRule label="Kept off the advice" />
        <h2 id="flagged-heading" className="mb-3 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          Flagged entries<span className="text-accent">.</span>
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          Real schemes that failed a check. They&apos;re listed here so the record is visible, not as advice.
        </p>
        {flaggedActions.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">Nothing flagged.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {flaggedActions.map((f) => (
              <article key={f.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  {f.category} · checked {formatDate(f.verification.lastChecked, true)}
                </p>
                <h3 className="text-lg font-medium leading-snug">{f.title}</h3>
                <p className="text-sm">
                  <span className="font-bold">Why it&apos;s flagged: </span>
                  {f.verification.flag_reason}
                </p>
                <p className="mt-auto pt-2 text-xs text-muted">
                  {f.sources.map((s, i) => (
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
      </section>

      <SiteFooter />
    </main>
  );
}
