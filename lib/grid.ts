// Turns the grid's half-hour forecast into what the "When should I plug in?"
// section shows for a day: the reading right now, the cleanest and dirtiest
// three-hour windows, and a bar for every half-hour. Everything is worked out
// here on the server, with times already on the city's clock.

import type { Level } from "./conditions";
import { GRID_REGION, type DayKey, type GridSlot } from "./feeds";
import { clockTime, formatDate, localDate, zoneName } from "./labels";

const HALF_HOUR = 30 * 60 * 1000;
const WINDOW_SLOTS = 6; // three hours

// NESO's bands, mapped onto the site's level colours.
const INDEX_LEVEL: Record<string, Level> = {
  "very low": "good", low: "good", moderate: "moderate", high: "high", "very high": "extreme",
};

export interface GridWindow {
  from: string; // "09:00"
  to: string; // "12:00"
  when: string; // "" or " tomorrow" when a Today window runs past midnight
  intensity: number; // average g CO₂/kWh
  renewables: number; // average %
  level: Level;
  index: string; // "low", "high"...
  footer: string; // bottom line of the card, e.g. "Forecast for 26 Sept"
}

export interface GridDay {
  intro: string;
  zone: string; // "BST" or "GMT"
  now: { time: string; intensity: number; renewables: number; level: Level; index: string; footer: string } | null;
  /** Yesterday and tomorrow have no "right now", so their first card is the day's average. */
  average: { intensity: number; renewables: number; level: Level; index: string; footer: string };
  best: GridWindow;
  worst: GridWindow;
  bars: { time: string; intensity: number; level: Level }[];
  max: number; // tallest bar, for scaling
  summary: string; // a one-line text version of the chart, for screen readers
}

export function gridDay(
  slots: GridSlot[] | null, day: DayKey, dates: Record<DayKey, string>, nowUtc: Date, timeZone: string,
): GridDay | null {
  if (!slots) return null;
  const start = (s: GridSlot) => Date.parse(s.from);

  // Today: from the current half-hour to the same time tomorrow, so there's
  // always a full day ahead to plan with. Other days: midnight to midnight.
  const picked = day === "today"
    ? slots.filter((s) => start(s) + HALF_HOUR > nowUtc.getTime()).slice(0, 48)
    : slots.filter((s) => localDate(s.from, timeZone) === dates[day]);
  if (picked.length < WINDOW_SLOTS) return null;

  const clock = (ms: number) => clockTime(new Date(ms).toISOString(), timeZone);
  const window = (i: number): GridWindow => {
    const run = picked.slice(i, i + WINDOW_SLOTS);
    const counts = new Map<string, number>();
    run.forEach((s) => counts.set(s.index, (counts.get(s.index) ?? 0) + 1));
    const index = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const first = start(run[0]);
    return {
      from: clock(first),
      to: clock(first + WINDOW_SLOTS * HALF_HOUR),
      when: day === "today" && localDate(run[0].from, timeZone) !== dates.today ? " tomorrow" : "",
      intensity: Math.round(run.reduce((sum, s) => sum + s.intensity, 0) / run.length),
      renewables: Math.round(run.reduce((sum, s) => sum + s.renewables, 0) / run.length),
      level: INDEX_LEVEL[index] ?? "unknown",
      index,
      footer: (() => {
        const date = formatDate(localDate(run[0].from, timeZone));
        if (day === "today") return `${localDate(run[0].from, timeZone) === dates.today ? "Later today" : "Tomorrow"}, ${date}`;
        return `${day === "yesterday" ? "Estimate for" : "Forecast for"} ${date}`;
      })(),
    };
  };

  // Slide a three-hour window along the day and keep the lowest and highest.
  let bestAt = 0, worstAt = 0, bestSum = Infinity, worstSum = -Infinity;
  for (let i = 0; i + WINDOW_SLOTS <= picked.length; i++) {
    const sum = picked.slice(i, i + WINDOW_SLOTS).reduce((t, s) => t + s.intensity, 0);
    if (sum < bestSum) { bestSum = sum; bestAt = i; }
    if (sum > worstSum) { worstSum = sum; worstAt = i; }
  }
  const best = window(bestAt);
  const worst = window(worstAt);

  const current = day === "today" ? picked[0] : null;

  // The day's average, with the band that covers most of its half-hours.
  const bandCounts = new Map<string, number>();
  picked.forEach((s) => bandCounts.set(s.index, (bandCounts.get(s.index) ?? 0) + 1));
  const commonIndex = [...bandCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const average = {
    intensity: Math.round(picked.reduce((sum, s) => sum + s.intensity, 0) / picked.length),
    renewables: Math.round(picked.reduce((sum, s) => sum + s.renewables, 0) / picked.length),
    level: INDEX_LEVEL[commonIndex] ?? ("unknown" as Level),
    index: commonIndex,
    footer: `Whole day, ${formatDate(dates[day])}`,
  };
  const bars = picked.map((s) => ({ time: clockTime(s.from, timeZone), intensity: s.intensity, level: INDEX_LEVEL[s.index] ?? "unknown" as Level }));
  const zone = zoneName(picked[0].from, timeZone);

  const intro = {
    today: `The next 24 hours on ${GRID_REGION.name}'s grid.`,
    tomorrow: `Tomorrow on ${GRID_REGION.name}'s grid, from midnight to midnight.`,
    yesterday: `How yesterday went on ${GRID_REGION.name}'s grid.`,
  }[day];

  return {
    intro,
    zone,
    now: current
      ? {
          time: clockTime(current.from, timeZone), intensity: current.intensity, renewables: Math.round(current.renewables),
          level: INDEX_LEVEL[current.index] ?? "unknown", index: current.index,
          footer: `Half-hour from ${clockTime(current.from, timeZone)} ${zone} on ${formatDate(localDate(current.from, timeZone))}`,
        }
      : null,
    average,
    best,
    worst,
    bars,
    max: Math.max(...picked.map((s) => s.intensity)),
    summary:
      (day === "today"
        ? `Carbon intensity from ${bars[0].time} today to ${clock(start(picked.at(-1)!) + HALF_HOUR)} tomorrow, ${zone}. `
        : `Carbon intensity through the day, midnight to midnight ${zone}. `) +
      `Cleanest three hours: ${best.from} to ${best.to}${best.when}, about ${best.intensity} grams per kilowatt-hour. ` +
      `Dirtiest: ${worst.from} to ${worst.to}${worst.when}, about ${worst.intensity}.`,
  };
}
