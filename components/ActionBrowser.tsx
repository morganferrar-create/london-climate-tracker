"use client";

// Every verified action, with category filters and a search box. Filtering
// happens in the browser; nothing is fetched.

import { useMemo, useState } from "react";
import ActionCard from "./ActionCard";
import type { Action } from "@/lib/types";

export default function ActionBrowser({ actions, categories }: { actions: Action[]; categories: string[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actions.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.summary, a.category, ...a.details].some((t) => t.toLowerCase().includes(q));
    });
  }, [actions, category, query]);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active ? "border-tab-active bg-tab-active text-white" : "border-border bg-surface hover:border-muted"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={pill(category === null)}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={pill(category === c)}>
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm lg:w-72">
          <span className="sr-only">Search actions</span>
          <span aria-hidden className="text-muted">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions"
            className="w-full bg-transparent outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <p className="mb-4 text-xs text-muted" aria-live="polite">
        Showing {shown.length} of {actions.length}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
          No actions match. Try another word or pick All.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
