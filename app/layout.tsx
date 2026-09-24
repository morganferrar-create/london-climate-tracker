import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import city from "@/data/city.json";

// A clean, tightly spaced typeface for the whole site.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Hi there, ${city.name}. | Heat, air and rain today`,
  description: city.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
