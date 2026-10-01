// Small print shared by both pages.
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-4 text-xs text-muted">
      Live data from Open-Meteo and NESO. Weather and air refresh every hour, the grid every half hour. Times are UK time.
      Weather and air readings come from models corrected with real observations. Although actions are researched and
      verified, check the source before relying on one.
    </footer>
  );
}
