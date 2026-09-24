// Small print shared by both pages.
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-4 text-xs text-muted">
      Live data from Open-Meteo. Weather and air refresh every hour, the river every six hours.
      Yesterday&apos;s figures are modelled, not station measurements. Actions researched and checked with the
      City Climate Tracker skill; check the source before relying on one.
    </footer>
  );
}
