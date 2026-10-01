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
  timing: "reading" | "day" | "forecast"; // a reading at a set time, a whole day's figures, or a forecast
  timeLabel?: string; // the time line shown on the panel, on the city's clock (added in app/page.tsx)
}

// Heat: the panel shows the actual temperature, but the level is set by the
// "feels like" temperature in °C, because that's what matters for health.
// Today and yesterday show the reading at this time of day and use the
// higher of that and the day's peak; tomorrow shows the forecast high.
// "Hot" starts at 27, lowered for London, where UK heat-health alerts often
// begin around 27–28. From 35 it counts as extreme heat.
export function heatPanel(w: WeatherReading | null, day: DayKey): Panel {
  const d = w?.days[DAY_INDEX[day]];
  if (!w || !d) return unavailable("heat", "Heat", "Temperature unavailable right now.");
  const snap =
    day === "today" ? { temperature: w.temperature, feelsLike: w.feelsLike, time: w.time }
    : day === "yesterday" ? w.yesterday
    : null;
  const t = snap ? Math.max(snap.feelsLike, d.feelsLikeMax) : d.feelsLikeMax;
  const coldest = snap ? snap.feelsLike : d.feelsLikeMin;
  let level: Level = "good";
  let headline = "Comfortable";
  let conditions: Condition[] = [];
  if (t >= 35) {
    level = "extreme"; headline = "Extreme heat"; conditions = ["heat-extreme", "heat-high"];
  } else if (t >= 27) {
    level = "moderate"; headline = "Hot"; conditions = ["heat-high"];
  } else if (coldest <= -15) {
    level = "high"; headline = "Extreme cold"; conditions = ["cold-extreme"];
  }
  const shared = { key: "heat" as const, label: "Heat", level, headline, conditions };
  if (snap) {
    const detail = day === "today"
      ? `Feels like ${formatNum(snap.feelsLike)}°C now.\nToday's high: feels like ${formatNum(d.feelsLikeMax)}°C.`
      : `Felt like ${formatNum(snap.feelsLike)}°C at this time.\nYesterday's high: felt like ${formatNum(d.feelsLikeMax)}°C.`;
    return { ...shared, value: formatNum(snap.temperature), unit: "°C", detail, observedAt: snap.time, timing: "reading" };
  }
  return {
    ...shared, value: formatNum(d.tempMax), unit: "°C high",
    detail: `Highest temperature of the day.\n${day === "tomorrow" ? "Tomorrow's high: will feel" : "Yesterday's high: felt"} like ${formatNum(d.feelsLikeMax)}°C.`,
    observedAt: d.date, timing: timingFor(day),
  };
}

// Air: European Air Quality Index, in our own four labels: 0–40 good,
// 40–60 okay, 60–80 poor, over 80 extremely poor. Today and yesterday
// use the reading at this hour; tomorrow uses its worst forecast hour.
export function airPanel(a: AirReading | null, day: DayKey): Panel {
  if (!a) return unavailable("air", "Air", "Air quality unavailable right now.");
  const d = a.days[DAY_INDEX[day]];
  const snap =
    day === "today" ? { europeanAqi: a.europeanAqi, pm25: a.pm25, time: a.time }
    : day === "yesterday" ? a.yesterday
    : null;
  if (!snap && !d) return unavailable("air", "Air", "Air quality unavailable for this day.");
  const i = snap ? snap.europeanAqi : d.peakAqi;
  let level: Level = "good";
  let headline = "Good";
  let conditions: Condition[] = [];
  if (i > 80) {
    level = "extreme"; headline = "Extremely poor"; conditions = ["air-high", "air-moderate"];
  } else if (i > 60) {
    level = "high"; headline = "Poor"; conditions = ["air-high", "air-moderate"];
  } else if (i > 40) {
    level = "moderate"; headline = "Okay"; conditions = ["air-moderate"];
  }
  const shared = { key: "air" as const, label: "Air", value: String(i), level, headline, conditions };
  if (snap) {
    return {
      ...shared, unit: "European air quality index",
      detail: airAdvice(level, day),
      observedAt: snap.time, timing: "reading",
    };
  }
  return {
    ...shared, unit: "European air quality index, worst hour",
    detail: airAdvice(level, day),
    observedAt: d.date, timing: timingFor(day),
  };
}

// What the air level means for you, in plain words. Follows the UK
// government's health advice for air pollution (the Daily Air Quality Index).
function airAdvice(level: Level, day: DayKey): string {
  const advice: Record<DayKey, Partial<Record<Level, string>>> = {
    today: {
      good: "Clean air. A good day to be outside.",
      moderate: "Fine for most people. If you have asthma, or a heart or lung condition, take it a bit easier outdoors.",
      high: "Polluted air. Cut back on hard exercise outdoors, especially near busy roads, and more so if you have asthma or a heart or lung condition.",
      extreme: "Very polluted air. Avoid hard exercise outdoors. If you have a heart or lung condition, stay indoors where you can.",
    },
    yesterday: {
      good: "The air was clean at this time.",
      moderate: "The air was fine for most people at this time.",
      high: "The air was polluted at this time.",
      extreme: "The air was very polluted at this time.",
    },
    tomorrow: {
      good: "Clean air expected all day. A good day to be outside.",
      moderate: "Expected to be fine for most people. If you have asthma, or a heart or lung condition, take it a bit easier outdoors.",
      high: "Polluted air expected at times. Plan hard exercise outdoors for cleaner hours, especially if you have asthma or a heart or lung condition.",
      extreme: "Very polluted air expected. Avoid hard exercise outdoors. If you have a heart or lung condition, plan to stay indoors where you can.",
    },
  };
  return advice[day][level] ?? "";
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
  let headline = "Dry";
  const conditions: Condition[] = [];
  if (mm >= 50 || (ratio !== null && ratio >= 5)) {
    level = "extreme"; headline = "Torrential rain";
    conditions.push("rain-heavy", "flood-risk");
  } else if (mm >= 25 || (ratio !== null && ratio >= 2)) {
    level = "high"; headline = "Heavy rain";
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
    timing: isToday ? "reading" : timingFor(day),
  };
}

/** Every condition switched on by a set of panels, plus "any". */
export function activeConditions(panels: Panel[]): Condition[] {
  const set = new Set<Condition>(["any"]);
  panels.forEach((p) => p.conditions.forEach((c) => set.add(c)));
  return [...set];
}

function timingFor(day: DayKey): Panel["timing"] {
  return day === "tomorrow" ? "forecast" : day === "yesterday" ? "day" : "reading";
}

function unavailable(key: Panel["key"], label: string, detail: string): Panel {
  return {
    key, label, value: "–", unit: "", level: "unknown", headline: "Unavailable", detail,
    conditions: [], observedAt: null, timing: "reading",
  };
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
