// The orange rule with a diagonal arrow on the left, pointing down into the
// section, and a small label on the right. The arrow is decoration only (not
// a button), so screen readers skip it.

export default function SectionRule({ label, id }: { label: string; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-6 items-center justify-between border-t border-accent py-4 text-xs text-muted">
      <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l10 10M13 5v8H5" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
