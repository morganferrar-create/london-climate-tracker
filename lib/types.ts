// The shapes of the data files. These match the Terra Studio reference and
// the City Climate Tracker research skill, so don't change them without
// updating the skill too.

export type Condition =
  | "any"
  | "heat-high"
  | "heat-extreme"
  | "cold-extreme"
  | "air-moderate"
  | "air-high"
  | "rain-heavy"
  | "flood-risk";

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  tagline: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Verification {
  status: "verified" | "flagged";
  lastChecked: string; // YYYY-MM-DD
  method: string;
  flag_reason?: string;
}

export interface Action {
  id: string;
  city: string;
  category: string;
  title: string;
  summary: string;
  details: string[];
  /** Which live conditions this action is relevant to. "any" always shows. */
  when: Condition[];
  sources: Source[];
  verification: Verification;
}
