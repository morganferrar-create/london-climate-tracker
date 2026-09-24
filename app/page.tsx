import Link from "next/link";
import city from "@/data/city.json";
import ActionBrowser from "@/components/ActionBrowser";
import DayTabs, { type DayTab, type WhatToDo } from "@/components/DayTabs";
import SectionRule from "@/components/SectionRule";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { actionsFor, categories, flaggedActions, verifiedActions } from "@/lib/actions";
import { activeConditions, airPanel, heatPanel, rainPanel, type Panel } from "@/lib/conditions";
import { DAY_INDEX, fetchAir, fetchFlood, fetchWeather, type DayKey } from "@/lib/feeds";
import { CONDITION_PHRASES, formatDate, listOf, noWidow } from "@/lib/labels";
import type { City } from "@/lib/types";

const DAY_LABELS: Record<DayKey, string> = { yesterday: "Yesterday", today: "Today", tomorrow: "Tomorrow" };

// The sentence beside the page title changes with the selected day.
function tagline(day: DayKey, cityName: string): string {
  return {
    yesterday: `What the heat, the air and the rain were doing in ${cityName} yesterday.`,
    today: `What the heat, the air and the rain are doing in ${cityName} right now, and what you can do to prepare.`,
    tomorrow: `What the heat, the air and the rain are doing in ${cityName} tomorrow, and what you can do to prepare.`,
  }[day];
}

// The heading above the panels, also following the selected day. The last
// character (? or .) is shown in orange.
function heading(day: DayKey): string {
  return {
    yesterday: "What happened yesterday?",
    today: "How're you looking today?",
    tomorrow: "How're you looking tomorrow?",
  }[day];
}

// "What to do" follows the selected tab. Yesterday has passed, so that tab
// shows today's actions.
function whatToDo(day: DayKey, panelsByDay: Record<DayKey, Panel[]>): WhatToDo {
  const basis: DayKey = day === "tomorrow" ? "tomorrow" : "today";
  const active = activeConditions(panelsByDay[basis]).filter((c) => c !== "any");
  const { matched, always } = actionsFor(active);
  // Name only the strongest condition of each kind: "extreme heat", not
  // "hot weather and extreme heat".
  const phrases = listOf(
    active
      .filter((c) => !(c === "heat-high" && active.includes("heat-extreme")))
      .filter((c) => !(c === "air-moderate" && active.includes("air-high")))
      .map((c) => CONDITION_PHRASES[c]),
  );
  const when = basis === "tomorrow" ? "tomorrow" : "today";
  const source = basis === "tomorrow" ? "Tomorrow's forecast shows" : "Today's readings show";
  let intro = matched.length
    ? `${source} ${phrases}, so these come first.`
    : `Nothing unusual ${when === "today" ? "today" : "is forecast for tomorrow"}: no heat, air or rain warnings. Here are a few things worth doing any time.`;
  if (day === "yesterday") intro = `Yesterday has passed, so these are for today. ${intro}`;
  return { heading: "What can I do to prepare?", intro: noWidow(intro), matched, always };
}

export default async function Home() {
  const c = city as City;
  // Ask all three feeds at once rather than one after another.
  const [weather, air, flood] = await Promise.all([fetchWeather(c), fetchAir(c), fetchFlood()]);

  const keys = Object.keys(DAY_INDEX) as DayKey[];
  const panelsByDay = Object.fromEntries(
    keys.map((key) => [key, [heatPanel(weather, key), airPanel(air, key), rainPanel(weather, flood, key)]]),
  ) as Record<DayKey, Panel[]>;

  const days: DayTab[] = keys.map((key) => ({
    key,
    label: DAY_LABELS[key],
    tagline: noWidow(tagline(key, c.name)),
    heading: heading(key),
    date: formatDate(weather?.days[DAY_INDEX[key]]?.date ?? flood?.days[DAY_INDEX[key]]?.date),
    panels: panelsByDay[key],
    todo: whatToDo(key, panelsByDay),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <SiteHeader city={c} current="home" />

      <DayTabs days={days}>
        <h1 className="text-5xl font-medium leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
          Hi there,<br />
          {c.name}<span className="text-accent">.</span>
        </h1>
      </DayTabs>

      <section aria-labelledby="all-heading" className="mt-16">
        <SectionRule label="Every verified action" id="all-actions" />
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="all-heading" className="text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
            All actions<span className="text-accent">.</span>
          </h2>
          <p className="text-sm text-muted">
            {verifiedActions.length} passed all three checks · {flaggedActions.length} flagged ·{" "}
            <Link href="/how-its-checked" className="text-foreground underline underline-offset-4 hover:text-accent">
              How it&apos;s checked
            </Link>
          </p>
        </div>
        <ActionBrowser actions={verifiedActions} categories={categories} />
      </section>

      <SiteFooter />
    </main>
  );
}
