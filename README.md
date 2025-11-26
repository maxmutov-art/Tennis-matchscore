# Tennis-matchscore
# Tennis Match Scoreboard

A lightweight single-page scoreboard for tracking singles tennis matches with ATP-style scoring, statistics, and a post-match point-progression chart.

## Features
- Configure player names, initial server, and match length (1, 2, 3, or 5 sets).
- Handles standard games, 7-point tiebreaks at 6–6, and super tiebreaks to 10 when required (1-set matches at 6–6 or 2-set formats at 1–1 in sets).
- Buttons for point attribution, aces, double faults, and an undo stack for accidental taps.
- Live stats (points, aces, double faults) and a cumulative point chart after the match ends.

## Getting Started
Open `index.html` in a browser or start a lightweight local server to use the tracker.

### Quick local preview
1. Install dependencies: `npm install`
2. Start the local server: `npm run preview`
3. Visit `http://localhost:4173` in your browser.

### Deploying on Vercel (v0 static)
1. Ensure `vercel.json` is present (included in this repo) to serve the static assets from the project root.
2. From the project directory, run `vercel --prod` (or `vercel` first to link the project) — no build step is required.
3. After deployment completes, the site will be available at your assigned Vercel URL with client-side routing handled by the provided rewrite while still allowing the filesystem to serve JS/CSS assets directly.

## Testing
Install dependencies (`npm install`) and run the Vitest suite with `npm test` to verify scoring and statistics handling. If your environment restricts access to `registry.npmjs.org`, configure an accessible registry mirror before installing dependencies.

## Pushing to GitHub
If you are cloning this repository locally and need to push to your GitHub fork (`maxmutov-art/Tennis-matchscore`), set the remote once and push the current branch:

```bash
git remote add origin git@github.com:maxmutov-art/Tennis-matchscore.git
git push -u origin work
```

Afterward, use `git push` to update subsequent commits.
