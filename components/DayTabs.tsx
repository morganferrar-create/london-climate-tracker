"use client";

// Yesterday / Today / Tomorrow switcher. The page fetches all three days on
// the server, so switching tabs is instant and makes no new requests. It
// also shows the sentence beside the page title and the "What to do"
// actions, which both change with the day.

import { useState, type ReactNode } from "react";
import ActionCard from "./ActionCard";
import ConditionPanel from "./ConditionPanel";
import SectionRule from "./SectionRule";
import type { Panel } from "@/lib/conditions";
import type { DayKey } from "@/lib/feeds";
import type { Action } from "@/lib/types";

export interface WhatToDo {
  heading: string; // "What can I do to prepare?" (last character shown in orange)
  intro: string; // one line explaining what's matched, or that nothing is
  matched: Action[]; // actions tied to the day's conditions
  always: Action[]; // a short pick of "any time" actions
}

export interface DayTab {
  key: DayKey;
  label: string; // "Yesterday", "Today", "Tomorrow"
  date: string | null; // e.g. "22 Sept"
  tagline: string; // the sentence beside the page title for this day
  heading: string; // e.g. "How're you looking today?" (last character shown in orange)
  panels: Panel[];
  todo: WhatToDo;
}

export default function DayTabs({ days, children }: { days: DayTab[]; children: ReactNode }) {
  const [selected, setSelected] = useState<DayKey>("today");
  const current = days.find((d) => d.key === selected) ?? days[0];

  return (
    <div>
      {/* Big title (passed in as children) with the day's sentence beside it. */}
      <div className="flex flex-col gap-6 pb-12 pt-12 sm:pt-20 lg:flex-row lg:items-end lg:justify-between">
        {children}
        <p className="max-w-xs text-sm leading-snug text-muted lg:pb-3">{current.tagline}</p>
      </div>

      <SectionRule label="Conditions by day" />
      <h2 className="mb-6 text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
        {current.heading.slice(0, -1)}<span className="text-accent">{current.heading.slice(-1)}</span>
      </h2>

      <div role="tablist" aria-label="Choose a day" className="mb-6 grid grid-cols-3 gap-2 sm:flex">
        {days.map((d) => {
          const active = d.key === selected;
          return (
            <button
              key={d.key}
              role="tab"
              id={`tab-${d.key}`}
              aria-selected={active}
              aria-controls="day-panels"
              onClick={() => setSelected(d.key)}
              className={`flex flex-col rounded-2xl border px-4 py-2 text-left transition-colors sm:flex-row sm:items-baseline sm:gap-2 sm:rounded-full sm:px-5 ${
                active
                  ? "border-tab-active bg-tab-active text-white"
                  : "border-border bg-surface text-foreground hover:border-muted"
              }`}
            >
              <span className="text-base font-medium">{d.label}</span>
              {d.date && <span className={`text-xs ${active ? "text-white" : "text-muted"}`}>{d.date}</span>}
            </button>
          );
        })}
      </div>

      <div id="day-panels" role="tabpanel" aria-labelledby={`tab-${current.key}`} className="grid gap-3 md:grid-cols-3">
        {current.panels.map((p, i) => (
          <ConditionPanel key={p.key} panel={p} index={i} />
        ))}
      </div>

      <section aria-labelledby="todo-heading" className="mt-16">
        <SectionRule label="Matched to the conditions above" />
        <h2 id="todo-heading" className="text-4xl font-medium tracking-[-0.03em] sm:text-5xl">
          {current.todo.heading.slice(0, -1)}<span className="text-accent">{current.todo.heading.slice(-1)}</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">{current.todo.intro}</p>

        {current.todo.matched.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {current.todo.matched.map((a) => (
              <ActionCard key={a.id} action={a} open />
            ))}
          </div>
        )}

        {current.todo.always.length > 0 && (
          <>
            <h3 className="mb-4 mt-10 text-xs font-bold uppercase tracking-wider text-muted">Always worth doing</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {current.todo.always.map((a) => (
                <ActionCard key={a.id} action={a} />
              ))}
            </div>
            <p className="mt-4 text-sm">
              <a href="#all-actions" className="underline underline-offset-4 hover:text-accent">See all actions</a>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
