// Turns raw readings into levels and conditions that the page and the
// action data both understand. All the cut-off numbers live here, so this
// is the file to change if you want London's thresholds to be stricter.
//
// Each panel can be built for yesterday, today or tomorrow. Today uses the
// "right now" reading where there is one; the other days use the whole day
// (the day's high, the worst hour for air).

import {
  DAY_INDEX, RIVER_NAME,
  type AirReading, type DayKey, type FloodReading, type WeatherReading,
} from "./feeds";
import type { Condition } from "./types";

export type Level = "good" | "moderate" | "high" | "extreme" | "unknown";

export interface Panel {
  key: "heat" | "air" | "rain";
  label: string;
  value: string; // the big number
  unit: string;
  level: Level;
  headline: string; // short plain-language read, shown in the badge
  detail: string; // context; "\n" starts a new line
  conditions: Condition[]; // conditions this reading switches on
  observedAt: string | null; // UTC time (YYYY-MM-DDTHH:MM) or a date (YYYY-MM-DD)
  timing: "now" | "recorded" | "forecast"; // a live reading, yesterday's record, or a forecast
}

// Heat: the panel shows the actual temperature, but the level is set by the
// "feels like" temperature in °C, because that's what matters for health.
// Today uses the higher of now and today's peak. "Hot" starts at 27,
// lowered for London, where UK heat-health alerts often begin around
// 27–28. Warnings start around 35.
export function heatPanel(w: WeatherReading | null, day: DayKey): Panel {
  const d = w?.days[DAY_INDEX[day]];
  if (!w || !d) return unavailable("heat", "Heat", "Temperature unavailable right now.");
  const isToday = day === "today";
  const t = isToday ? Math.max(w.feelsLike, d.feelsLikeMax) : d.feelsLikeMax;
  const coldest = isToday ? w.feelsLike : d.feelsLikeMin;
  let level: Level = "good";
  let headline = "Comfortable";
  let conditions: Condition[] = [];
  if (t >= 40) {
    level = "extreme"; headline = "Extreme heat"; conditions = ["heat-extreme", "heat-high"];
  } else if (t >= 35) {
    level = "high"; headline = "Heat warning territory"; conditions = ["heat-high"];
  } else if (t >= 27) {
    level = "moderate"; headline = "Hot"; conditions = ["heat-high"];
  } else if (coldest <= -15) {
    level = "high"; headline = "Extreme cold"; conditions = ["cold-extreme"];
  }
  const shared = { key: "heat" as const, label: "Heat", level, headline, conditions };
  if (isToday) {
    return {
      ...shared, value: formatNum(w.temperature), unit: "°C",
      detail: `Feels like ${formatNum(w.feelsLike)}°C now.\nToday's peak feels like ${formatNum(d.feelsLikeMax)}°C.`,
      observedAt: w.time, timing: "now",
    };
  }
  return {
    ...shared, value: formatNum(d.tempMax), unit: "°C high",
    detail: `Highest temperature of the day.\nPeak feels like ${formatNum(d.feelsLikeMax)}°C.`,
    observedAt: d.date, timing: timingFor(day),
  };
}

// Air: European Air Quality Index. 0–20 good, 20–40 fair, 40–60 moderate,
// 60–80 poor, 80–100 very poor, over 100 extremely poor. Today uses the
// current reading; other days use their worst hour.
export function airPanel(a: AirReading | null, day: DayKey): Panel {
  if (!a) return unavailable("air", "Air", "Air quality unavailable right now.");
  const isToday = day === "today";
  const d = a.days[DAY_INDEX[day]];
  if (!isToday && !d) return unavailable("air", "Air", "Air quality unavailable for this day.");
  const i = isToday ? a.europeanAqi : d.peakAqi;
  let level: Level = "good";
  let headline = i <= 20 ? "Good" : "Fair";
  let conditions: Condition[] = [];
  if (i > 80) {
    level = "extreme"; headline = i > 100 ? "Extremely poor" : "Very poor"; conditions = ["air-high", "air-moderate"];
  } else if (i > 60) {
    level = "high"; headline = "Poor"; conditions = ["air-high", "air-moderate"];
  } else if (i > 40) {
    level = "moderate"; headline = "Moderate"; conditions = ["air-moderate"];
  }
  const shared = { key: "air" as const, label: "Air", value: String(i), level, headline, conditions };
  if (isToday) {
    return {
      ...shared, unit: "European AQI",
      detail: `Fine particles (PM2.5) at ${formatNum(a.pm25)} µg/m³.`,
      observedAt: a.time, timing: "now",
    };
  }
  return {
    ...shared, unit: "European AQI, worst hour",
    detail: `Fine particles (PM2.5) peaked at ${formatNum(d.peakPm25)} µg/m³.`,
    observedAt: d.date, timing: timingFor(day),
  };
}

// Rain and flood. Rain is the day's total in mm: 25+ is a heavy day, 50+ is
// the kind of day that floods basements and roads. The river signal
// compares the day's flow with the normal for that date: 2× is well above
// normal, 5× is flood territory.
export function rainPanel(w: WeatherReading | null, f: FloodReading | null, day: DayKey): Panel {
  const wd = w?.days[DAY_INDEX[day]];
  const fd = f?.days[DAY_INDEX[day]];
  if (!wd && !fd) return unavailable("rain", "Rain and flood", "Rain and river data unavailable right now.");
  const isToday = day === "today";
  const mm = wd?.rainMm ?? 0;
  const ratio = fd && fd.dischargeMean > 0 ? fd.discharge / fd.dischargeMean : null;
  let level: Level = "good";
  let headline = mm > 0 ? "Light rain" : "Dry";
  const conditions: Condition[] = [];
  if (mm >= 50 || (ratio !== null && ratio >= 5)) {
    level = "extreme"; headline = ratio !== null && ratio >= 5 ? "River far above normal" : "Very heavy rain";
    conditions.push("rain-heavy", "flood-risk");
  } else if (mm >= 25 || (ratio !== null && ratio >= 2)) {
    level = "high"; headline = ratio !== null && ratio >= 2 ? "River above normal" : "Heavy rain";
    conditions.push("rain-heavy", "flood-risk");
  } else if (mm >= 5) {
    level = "moderate"; headline = isToday ? "Rain today" : "Rainy day"; conditions.push("rain-heavy");
  }
  const total = !wd
    ? "Rain forecast unavailable."
    : { yesterday: "Total for the day.", today: "Forecast total for today.", tomorrow: "Forecast total for tomorrow." }[day];
  const chance = wd?.rainChanceMax != null && day !== "yesterday" ? ` ${wd.rainChanceMax}% chance of rain.` : "";
  const river = ratio !== null
    ? ` River flow on ${RIVER_NAME} is ${ratio.toFixed(1)}× normal for ${isToday ? "today" : "that day"}.`
    : " River data unavailable.";
  return {
    key: "rain", label: "Rain and flood", value: wd ? formatNum(mm) : "–",
    unit: wd ? (isToday ? "mm today" : "mm") : "", level, headline,
    detail: `${total}${chance}${river}`,
    conditions,
    observedAt: isToday ? (w?.time ?? fd?.date ?? null) : (wd?.date ?? fd?.date ?? null),
    timing: isToday ? "now" : timingFor(day),
  };
}

/** Every condition switched on by a set of panels, plus "any". */
export function activeConditions(panels: Panel[]): Condition[] {
  const set = new Set<Condition>(["any"]);
  panels.forEach((p) => p.conditions.forEach((c) => set.add(c)));
  return [...set];
}

function timingFor(day: DayKey): Panel["timing"] {
  return day === "yesterday" ? "recorded" : day === "tomorrow" ? "forecast" : "now";
}

function unavailable(key: Panel["key"], label: string, detail: string): Panel {
  return {
    key, label, value: "–", unit: "", level: "unknown", headline: "Unavailable", detail,
    conditions: [], observedAt: null, timing: "now",
  };
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
