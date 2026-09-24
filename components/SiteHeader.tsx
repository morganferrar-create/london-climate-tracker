import Link from "next/link";
import type { City } from "@/lib/types";

// The small top bar shared by both pages.
export default function SiteHeader({ city, current }: { city: City; current: "home" | "checked" }) {
  return (
    <header className="flex items-center justify-between gap-4 text-xs text-muted">
      <Link href="/" className="hover:text-foreground" aria-current={current === "home" ? "page" : undefined}>
        {city.name}, {city.country}
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href="/how-its-checked"
          aria-current={current === "checked" ? "page" : undefined}
          className={`underline-offset-4 hover:text-foreground ${current === "checked" ? "text-foreground underline" : ""}`}
        >
          How it&apos;s checked
        </Link>
        <span className="flex items-center gap-2 rounded-full bg-pill px-4 py-2 text-white">
          Live data
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      </nav>
    </header>
  );
}
