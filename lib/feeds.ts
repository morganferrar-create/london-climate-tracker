// Live feeds from Open-Meteo. No sign-up or key needed.
//
// Each function runs on the server, and Next.js keeps the result for
// `revalidate` seconds. The first visitor after that window triggers a
// fresh pull; everyone else gets the saved copy.
//
// Each feed asks for three days at once: yesterday, today and tomorrow, in
// that order. Every function returns null on failure, so one dead feed
// never breaks the page. The panel shows "Unavailable" instead.

import type { City } from "./types";

const HOUR = 3600;

/** Position of each day in the `days` arrays below. */
export const DAY_INDEX = { yesterday: 0, today: 1, tomorrow: 2 } as const;
export type DayKey = keyof typeof DAY_INDEX;

const DAYS_PARAMS = "&past_days=1&forecast_days=2";

// The flood model splits the map into squares about 5 km wide. The square
// over central London picks up a side stream, so we read the Thames at
// Greenwich instead, where the model's main river runs.
const RIVER_POINT = { latitude: 51.475, longitude: -0.025, name: "the Thames at Greenwich" };
export const RIVER_NAME = RIVER_POINT.name;

export interface WeatherDay {
  date: string; // YYYY-MM-DD, London's calendar day
  tempMax: number; // °C
  feelsLikeMax: number; // °C
  feelsLikeMin: number; // °C
  rainMm: number; // total for the day
  rainChanceMax: number | null; // % chance, highest in the day
}

export interface WeatherReading {
  temperature: number; // °C, right now
  feelsLike: number; // °C, right now
  time: string; // YYYY-MM-DDTHH:MM in UTC
  days: WeatherDay[]; // yesterday, today, tomorrow
}

export interface AirDay {
  date: string; // YYYY-MM-DD
  peakAqi: number; // worst hour of the day, European AQI
  peakPm25: number; // highest hourly PM2.5, µg/m³
}

export interface AirReading {
  europeanAqi: number; // European Air Quality Index, right now
  pm25: number; // µg/m³, right now
  time: string; // YYYY-MM-DDTHH:MM in UTC
  days: AirDay[]; // yesterday, today, tomorrow
}

export interface FloodDay {
  date: string; // YYYY-MM-DD
  discharge: number; // m³/s
  dischargeMean: number; // long-term average for this date
}

export interface FloodReading {
  days: FloodDay[]; // yesterday, today, tomorrow
}

export async function fetchWeather(city: City): Promise<WeatherReading | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${city.latitude}&longitude=${city.longitude}` +
    `&current=temperature_2m,apparent_temperature` +
    `&daily=temperature_2m_max,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max` +
    `${DAYS_PARAMS}&timezone=${encodeURIComponent(city.timezone)}`;
  try {
    const res = await fetch(url, { next: { revalidate: HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.daily;
    return {
      temperature: json.current.temperature_2m,
      feelsLike: json.current.apparent_temperature,
      time: toUtc(json.current.time, json.utc_offset_seconds),
      days: d.time.map((date: string, i: number) => ({
        date,
        tempMax: d.temperature_2m_max[i],
        feelsLikeMax: d.apparent_temperature_max[i],
        feelsLikeMin: d.apparent_temperature_min[i],
        rainMm: d.precipitation_sum?.[i] ?? 0,
        rainChanceMax: d.precipitation_probability_max?.[i] ?? null,
      })),
    };
  } catch {
    return null;
  }
}

export async function fetchAir(city: City): Promise<AirReading | null> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${city.latitude}&longitude=${city.longitude}` +
    `&current=european_aqi,pm2_5&hourly=european_aqi,pm2_5` +
    `${DAYS_PARAMS}&timezone=${encodeURIComponent(city.timezone)}`;
  try {
    const res = await fetch(url, { next: { revalidate: HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    if (typeof json.current?.european_aqi !== "number") return null;

    // The air feed is hourly, so find the worst hour of each day.
    const byDate = new Map<string, AirDay>();
    json.hourly.time.forEach((t: string, i: number) => {
      const aqi = json.hourly.european_aqi[i];
      const pm = json.hourly.pm2_5[i];
      if (typeof aqi !== "number") return;
      const date = t.slice(0, 10);
      const day = byDate.get(date) ?? { date, peakAqi: 0, peakPm25: 0 };
      day.peakAqi = Math.max(day.peakAqi, Math.round(aqi));
      if (typeof pm === "number") day.peakPm25 = Math.max(day.peakPm25, pm);
      byDate.set(date, day);
    });

    return {
      europeanAqi: Math.round(json.current.european_aqi),
      pm25: json.current.pm2_5,
      time: toUtc(json.current.time, json.utc_offset_seconds),
      days: [...byDate.values()],
    };
  } catch {
    return null;
  }
}

/**
 * River signal from Open-Meteo's flood API (the GloFAS model). Compares
 * each day's modelled river flow with the long-term average for that date.
 */
export async function fetchFlood(): Promise<FloodReading | null> {
  const url =
    `https://flood-api.open-meteo.com/v1/flood` +
    `?latitude=${RIVER_POINT.latitude}&longitude=${RIVER_POINT.longitude}` +
    `&daily=river_discharge,river_discharge_mean${DAYS_PARAMS}`;
  try {
    const res = await fetch(url, { next: { revalidate: 6 * HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.daily;
    if (!Array.isArray(d?.time)) return null;
    return {
      days: d.time.map((date: string, i: number) => ({
        date,
        discharge: d.river_discharge[i],
        dischargeMean: d.river_discharge_mean[i],
      })),
    };
  } catch {
    return null;
  }
}

// Open-Meteo gives "current" times in the city's local time, plus the
// offset from UTC in seconds. Shift back to UTC so every panel uses the
// same clock. The daily totals still follow London's calendar day.
function toUtc(localTime: string, offsetSeconds: number): string {
  const ms = Date.parse(`${localTime}Z`) - (offsetSeconds ?? 0) * 1000;
  return new Date(ms).toISOString().slice(0, 16);
}
