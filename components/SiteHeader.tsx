import Link from "next/link";
import type { City } from "@/lib/types";

// The small top bar shared by both pages.
export default function SiteHeader({ city, current }: { city: City; current: "home" | "about" }) {
  return (
    <header className="flex items-center justify-between gap-4 text-xs text-muted">
      <Link href="/" className="hover:text-foreground" aria-current={current === "home" ? "page" : undefined}>
        {city.name}, {city.country}
      </Link>
      <nav className="flex items-center gap-4">
        {/* On the About page this becomes a link back to the home page. */}
        {current === "about" ? (
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            Home
          </Link>
        ) : (
          <Link href="/about" className="underline-offset-4 hover:text-foreground hover:underline">
            About
          </Link>
        )}
        <span className="flex items-center gap-2 rounded-full bg-pill px-4 py-2 text-white">
          Live data
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </nav>
    </header>
  );
}
