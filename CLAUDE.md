@AGENTS.md

# London Climate Tracker

A one-city site that shows what the heat, the air and the rain are doing in London right now, and matches verified local actions to those conditions.

This is a Terra Studio Build 2 project, built from scratch. The reference repo is https://github.com/Terra-do/terra-studio-template-build-2 (read files from https://raw.githubusercontent.com/Terra-do/terra-studio-template-build-2/main/<path>). Use it for the data schema, the feed pattern and the rules. Write code fresh; don't copy files wholesale.

## Stack
- Next.js (App Router) with TypeScript. Tailwind v4 via `@tailwindcss/postcss`. No UI library, no database.
- npm is the package manager.
- Hosted on Vercel later. Every push to `main` redeploys.
- Live feeds are fetched on the server in `lib/feeds.ts` and cached with `next: { revalidate }`. Nothing is fetched from the browser.

## Files (as they get built)
- `data/city.json`: the city (London: name, lat/long, timezone).
- `data/verified.json`: actions that passed all three checks. The only actions the site shows.
- `data/flagged.json`: actions that failed a check, with a `flag_reason`. Shown on /about ("Worth keeping an eye on" or "Recently ended"), never as advice.
- `lib/types.ts`: the data schema. Matches the reference repo and the research skill.
- `lib/feeds.ts`: one function per live feed (weather incl. rain, air, electricity grid). Each returns `null` on failure. No keys by default. (The river/flood feed was removed: London floods come from heavy rain, which still switches on `flood-risk`.)
- `lib/conditions.ts`: turns readings into levels (good/moderate/high/extreme) and conditions (`heat-high`, `air-high`, `flood-risk`...). Thresholds are documented there.
- `app/page.tsx`: readings (yesterday/today/tomorrow), when to plug in, matched actions, all actions.
- `app/about/page.tsx`: the About page: last-checked date, what the colours mean, the renewables explainer, sources, flagged entries. (/how-its-checked redirects here.)
- `components/`: header, condition panel, action card, client-side action browser.

## Rules
- The default feeds need no keys. If you add a feed that needs one, it lives in `.env.local` (git-ignored) and in Vercel's environment variables. Never in code, never in `NEXT_PUBLIC_*`.
- Feeds are server-side only. A feed that fails must degrade to an "unavailable" panel, never crash the page.
- Don't add a public AI/chat feature. This site has no runtime AI on purpose.
- Don't research climate actions in Claude Code. The learner researches them in Cowork with the City Climate Tracker skill and brings back `verified.json` and `flagged.json`.
- Style with Tailwind classes only. Colour tokens are in `app/globals.css`; add new ones there rather than hardcoding hex values. Keep the level colours clearly different.
- Keep the schema. If a feature needs a new field, say so and stop.
- Run `npm run build` before pushing. Vercel runs the same build.

## Local
`npm install`, then `npm run dev` and open http://localhost:3000. The learner runs the dev server in their own terminal.

## Learning mode (follow for the whole build)
The learner is new to this. Use plain words, and explain any technical term the first time you use it.
- Before each step, say in two or three lines what you're about to do and why, then wait for the learner to say go.
- After each step, name the files you created or changed, and ask one short question that checks they understood the step (for example "Which file would you change to move the tracker to another city?"). Don't quiz more than once per step.
- If the learner asks you to just do it, do it, and still name what changed.
- Use the reference repo for the data schema, the feed pattern and the rules. Don't clone it or copy files wholesale; write the learner's code fresh and let their design differ.
- Use the package manager the learner chose (npm). Tell them the command to start the dev server and let them run it in their own terminal.

## The seven steps
1. Set up (done when the starter page shows).
2. Live readings: London, three panels (heat, air, rain).
3. Research the actions in Cowork (learner, outside Claude Code). Placeholder with 2–3 clearly fake actions if they want to keep going first.
4. Show the actions: "What to do today" plus all actions with category filters and search.
5. "How it's checked" page (now called About).
6. Make it yours: colours, type, layout.
7. Ship it: build check, GitHub repo, Vercel deploy.
