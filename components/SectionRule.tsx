// The orange rule with a "+" on the left and a small label on the right.

export default function SectionRule({ label, id }: { label: string; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-6 items-center justify-between border-t border-accent py-4 text-xs text-muted">
      <span aria-hidden className="text-xl leading-none text-accent">+</span>
      <span>{label}</span>
    </div>
  );
}
