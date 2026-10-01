import Link from "next/link";
import city from "@/data/city.json";
import ActionBrowser from "@/components/ActionBrowser";
import DayTabs, { type DayTab, type WhatToDo } from "@/components/DayTabs";
import SectionRule from "@/components/SectionRule";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { actionsFor, categories, lastChecked, verifiedActions } from "@/lib/actions";
import { activeConditions, airPanel, heatPanel, rainPanel, type Panel } from "@/lib/conditions";
import { DAY_INDEX, fetchAir, fetchGrid, fetchWeather, type DayKey } from "@/lib/feeds";
import { gridDay } from "@/lib/grid";
import { CONDITION_PHRASES, clockTime, formatDate, listOf, localDate, noWidow, zoneName } from "@/lib/labels";
import type { City } from "@/lib/types";

const DAY_LABELS: Record<DayKey, string> = { yesterday: "Yesterday", today: "Today", tomorrow: "Tomorrow" };

// The sentence beside the page title changes with the selected day.
function tagline(day: DayKey, cityName: string): string {
  return {
    yesterday: `What the heat, the air and the rain were doing in ${cityName} yesterday, and how clean the grid's electricity was.`,
    today: `What the heat, the air and the rain are doing in ${cityName} right now, when the grid's electricity is cleanest, and what you can do to prepare.`,
    tomorrow: `What the heat, the air and the rain are doing in ${cityName} tomorrow, when to plug in for the cleanest electricity, and what you can do to prepare.`,
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
      .filter((c) => c !== "flood-risk")
      .map((c) => CONDITION_PHRASES[c]),
  );
  const when = basis === "tomorrow" ? "tomorrow" : "today";
  return {
    heading: "What can I do to prepare?",
    // Short labels instead of a sentence: one above the matched actions (none
    // on a calm day), and one above the "any time" actions.
    alwaysLabel: day === "yesterday" ? "Always worth doing (even though yesterday has passed)" : "Always worth doing",
    matchedLabel: matched.length ? `Because of ${phrases} ${when}` : null,
    matched,
    always,
  };
}

// The time line at the bottom of each panel, on the city's clock:
// "Reading taken 13:30 BST on 25 Sept".
function timeLabel(p: Panel, timeZone: string): string {
  if (!p.observedAt) return "No reading available";
  if (p.observedAt.includes("T")) {
    const date = formatDate(localDate(p.observedAt, timeZone));
    return `Reading taken ${clockTime(p.observedAt, timeZone)} ${zoneName(p.observedAt, timeZone)} on ${date}`;
  }
  const date = formatDate(p.observedAt);
  return { day: `Whole day, ${date}`, forecast: `Forecast for ${date}`, reading: date ?? "" }[p.timing];
}

export default async function Home() {
  const c = city as City;
  // Ask all three feeds at once rather than one after another.
  const [weather, air, grid] = await Promise.all([fetchWeather(c), fetchAir(c), fetchGrid()]);

  const keys = Object.keys(DAY_INDEX) as DayKey[];
  const panelsByDay = Object.fromEntries(
    keys.map((key) => [
      key,
      [heatPanel(weather, key), rainPanel(weather, key), airPanel(air, key)].map((p) => ({ ...p, timeLabel: timeLabel(p, c.timezone) })),
    ]),
  ) as Record<DayKey, Panel[]>;

  // The city's calendar dates for each tab, used to pick the grid's half-hours.
  const now = new Date();
  const dayMs = 24 * 3600 * 1000;
  const dates: Record<DayKey, string> = {
    yesterday: localDate(new Date(now.getTime() - dayMs).toISOString(), c.timezone),
    today: localDate(now.toISOString(), c.timezone),
    tomorrow: localDate(new Date(now.getTime() + dayMs).toISOString(), c.timezone),
  };

  const days: DayTab[] = keys.map((key) => ({
    key,
    label: DAY_LABELS[key],
    tagline: noWidow(tagline(key, c.name)),
    heading: heading(key),
    date: formatDate(weather?.days[DAY_INDEX[key]]?.date ?? dates[key]),
    panels: panelsByDay[key],
    todo: whatToDo(key, panelsByDay),
    grid: gridDay(grid, key, dates, now, c.timezone),
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-6">
      <SiteHeader city={c} current="home" />

      <DayTabs days={days}>
        <h1 className="text-[min(5.5rem,18vw)] font-medium leading-[0.95] tracking-[-0.04em] sm:text-[5.5rem] lg:text-8xl">
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
            Every action checked against its official page · Last checked {formatDate(lastChecked, true)} ·{" "}
            <Link href="/about" className="text-foreground underline underline-offset-4 hover:text-accent">
              About
            </Link>
          </p>
        </div>
        <ActionBrowser actions={verifiedActions} categories={categories} />
      </section>

      <SiteFooter />
    </main>
  );
}
