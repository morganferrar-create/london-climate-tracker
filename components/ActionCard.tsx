// One verified action, in the same cut-corner card style as the panels.
// Used in "What to do" and in the full list of actions.

import { CONDITION_LABELS, formatDate, noWidow } from "@/lib/labels";
import type { Action } from "@/lib/types";

export default function ActionCard({ action }: { action: Action }) {
  const tags = action.when.filter((w) => w !== "any");
  const steps = (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-accent">
      {action.details.map((d) => (
        <li key={d}>{noWidow(d)}</li>
      ))}
    </ul>
  );
  return (
    <article className="notch flex flex-col rounded-2xl bg-accent p-px">
      <div className="notch-inner flex flex-1 flex-col gap-3 rounded-[15px] bg-surface p-6">
        <p className="pl-4 text-xs font-bold uppercase tracking-wider text-muted">{action.category}</p>
        <h3 className="text-xl font-medium leading-snug tracking-tight">{action.title}</h3>
        <p className="text-sm text-muted">{noWidow(action.summary)}</p>

        <details className="group text-sm">
          <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
            <span aria-hidden className="text-accent group-open:hidden">+ </span>
            <span aria-hidden className="hidden text-accent group-open:inline">– </span>
            Show what to do
          </summary>
          {steps}
        </details>

        <div className="mt-auto flex flex-col gap-3 border-t border-foreground/10 pt-3">
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="When this applies">
              {tags.map((t) => (
                <li key={t} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">{CONDITION_LABELS[t]}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted">
            {action.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s.title}
                </a>
              </span>
            ))}
          </p>
          <p className="text-xs text-muted">Checked {formatDate(action.verification.lastChecked, true)}</p>
        </div>
      </div>
    </article>
  );
}
