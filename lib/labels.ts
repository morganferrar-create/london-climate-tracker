// Plain-language names for conditions and dates. Safe to use in the browser
// as well as on the server.

import type { Condition } from "./types";

export const CONDITION_LABELS: Record<Condition, string> = {
  any: "Any time",
  "heat-high": "When it's hot",
  "heat-extreme": "Extreme heat",
  "cold-extreme": "Extreme cold",
  "air-moderate": "When air is moderate",
  "air-high": "When air is poor",
  "rain-heavy": "Heavy rain",
  "flood-risk": "Flood risk",
};

// "2026-09-22" → "22 Sept", or "22 Sept 2026" with the year.
export function formatDate(date: string | undefined | null, withYear = false): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC",
  });
}

// Short phrases for sentences like "Tomorrow's forecast shows poor air quality".
export const CONDITION_PHRASES: Record<Condition, string> = {
  any: "",
  "heat-high": "hot weather",
  "heat-extreme": "extreme heat",
  "cold-extreme": "extreme cold",
  "air-moderate": "moderate air quality",
  "air-high": "poor air quality",
  "rain-heavy": "heavy rain",
  "flood-risk": "a flood risk",
};

/** "a", "a and b", "a, b and c" */
export function listOf(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Joins the last two words with a non-breaking space, so the last word never sits alone on a line. */
export function noWidow(text: string): string {
  return text.replace(/ (\S+)$/, " $1");
}

// --- Clock times in the city's own time zone ---------------------------------
// Feeds give instants in UTC ("2026-09-25T12:30" or "...Z"). These show them
// on the city's clock, e.g. "13:30" and "BST" (or "GMT" in winter).

function asDate(utc: string): Date {
  return new Date(utc.endsWith("Z") ? utc : `${utc}Z`);
}

/** "13:30" on the city's clock. */
export function clockTime(utc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(asDate(utc));
}

/** "BST" / "GMT" (or the city's equivalent). */
export function zoneName(utc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" })
    .formatToParts(asDate(utc)).find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** The city's calendar date, "2026-09-25". */
export function localDate(utc: string, timeZone: string): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(asDate(utc));
  const get = (t: string) => p.find((x) => x.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
