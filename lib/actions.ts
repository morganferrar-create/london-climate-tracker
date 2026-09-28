// Loads the two action files from Cowork and checks every entry against the
// format in lib/types.ts. This runs when the site is built, so a broken entry
// stops the build with a message naming it, instead of showing a broken card.

import verifiedRaw from "@/data/verified.json";
import flaggedRaw from "@/data/flagged.json";
import type { Action, Condition } from "./types";

const CONDITIONS: Condition[] = [
  "any", "heat-high", "heat-extreme", "cold-extreme", "air-moderate", "air-high", "rain-heavy", "flood-risk",
];

export const verifiedActions: Action[] = checkFile(verifiedRaw, "verified", "data/verified.json");
export const flaggedActions: Action[] = checkFile(flaggedRaw, "flagged", "data/flagged.json");

/** Categories in the order they first appear in verified.json. */
export const categories: string[] = [...new Set(verifiedActions.map((a) => a.category))];

/** The most recent "lastChecked" date across the verified actions. */
export const lastChecked: string | null =
  verifiedActions.map((a) => a.verification.lastChecked).sort().at(-1) ?? null;

/**
 * Picks the actions for a day, three in total so the section stays short.
 * `matched` are tied to a condition that's switched on (hot, poor air, heavy
 * rain...) and come first; `always` fills any remaining places with "any time"
 * actions, one per category. Everything is still in the full list below.
 */
export function actionsFor(active: Condition[], total = 3): { matched: Action[]; always: Action[] } {
  const on = new Set<Condition>(active.filter((c) => c !== "any"));
  const allMatched = verifiedActions.filter((a) => a.when.some((w) => on.has(w)));
  const matched = allMatched.slice(0, total);
  const seen = new Set<string>(matched.map((a) => a.category));
  const always: Action[] = [];
  for (const a of verifiedActions) {
    if (matched.length + always.length >= total) break;
    if (!a.when.includes("any") || allMatched.includes(a) || seen.has(a.category)) continue;
    seen.add(a.category);
    always.push(a);
  }
  return { matched, always };
}

function checkFile(raw: unknown, status: "verified" | "flagged", file: string): Action[] {
  if (!Array.isArray(raw)) throw new Error(`${file} should be a list of actions.`);
  const ids = new Set<string>();
  return raw.map((entry, i) => {
    const where = `${file}, entry ${i + 1}${entry?.id ? ` (${entry.id})` : ""}`;
    const problems = problemsWith(entry, status);
    if (typeof entry?.id === "string") {
      if (ids.has(entry.id)) problems.push(`the id "${entry.id}" is used twice`);
      ids.add(entry.id);
    }
    if (problems.length) throw new Error(`${where}: ${problems.join("; ")}.`);
    return entry as Action;
  });
}

function problemsWith(a: Record<string, unknown>, status: "verified" | "flagged"): string[] {
  const p: string[] = [];
  const text = (v: unknown) => typeof v === "string" && v.trim() !== "";
  for (const k of ["id", "city", "category", "title", "summary"]) if (!text(a?.[k])) p.push(`"${k}" is missing or empty`);
  if (!Array.isArray(a?.details) || !a.details.every(text)) p.push(`"details" should be a list of text`);
  if (!Array.isArray(a?.when) || a.when.length === 0) p.push(`"when" should list at least one condition`);
  else {
    const bad = (a.when as unknown[]).filter((w) => !CONDITIONS.includes(w as Condition));
    if (bad.length) p.push(`unknown "when" values: ${bad.join(", ")}`);
  }
  if (!Array.isArray(a?.sources) || a.sources.length === 0) p.push(`"sources" should list at least one source`);
  else if (!(a.sources as Record<string, unknown>[]).every((s) => text(s?.title) && /^https?:\/\//.test(String(s?.url))))
    p.push(`every source needs a title and a web address`);
  const v = a?.verification as Record<string, unknown> | undefined;
  if (!v) p.push(`"verification" is missing`);
  else {
    if (v.status !== status) p.push(`"verification.status" should be "${status}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v.lastChecked))) p.push(`"verification.lastChecked" should be a date like 2026-09-23`);
    if (!text(v.method)) p.push(`"verification.method" is missing`);
    if (status === "flagged" && !text(v.flag_reason)) p.push(`flagged entries need a "flag_reason"`);
  }
  return p;
}
