# Fork notes: safe YouTube automation lab

This fork is based on `darkzOGx/youtube-automation-agent`.

Original repo: https://github.com/darkzOGx/youtube-automation-agent
Fork: https://github.com/nikopastore/youtube-automation-agent
License: MIT

## Why we forked instead of only keeping a clean-room rewrite

The Instagram Reel was promoting this project, so this fork keeps provenance and lets us build directly on the open-source codebase.

However, the original repo should not be used as a production auto-uploader without hardening. The first inspection found:

- Root `npm test` failed until dependencies were installed, then failed because `agents/thumbnail-designer-agent.js` imports `sharp` but `sharp` was not declared in `package.json`.
- The README/product claims are stronger than the current implementation quality.
- The repo contains publishing/scheduling flows, so any production use needs manual approval and compliance gates first.

## What this fork adds

This fork adds `niche-lab/`, a safe validation layer copied from our local YouTube Niche Lab MVP.

The lab does **not** auto-upload or extract copyrighted clips. It produces planning reports only:

- niche/account scoring
- six-agent-style planning simulation
- viral clip opportunity recommendations from timestamped transcript/video intel
- ongoing trend research from provided trend items
- JSON + Markdown outputs for review

## Commands

From the repo root:

```bash
npm install
npm test
```

Run the lab:

```bash
npm run lab:test
npm run lab:demo
npm run lab:clips
npm run lab:trends
```

Or inside the lab directly:

```bash
cd niche-lab
npm install
npm test
npm run run:demo
node dist/cli.js clips --input config/video-intel.sample.json --out runs/demo-intel/clips
node dist/cli.js trends --input config/video-intel.sample.json --out runs/demo-intel/trends
```

## Architecture decision

We are using the original repo as the upstream base and keeping its agent idea, but routing new work through `niche-lab/` first because it is safer and testable.

Future integration path:

1. Validate niches and clips in `niche-lab/`.
2. Add live source adapters for YouTube/Reddit/X/GitHub/Google Trends.
3. Add compliance and manual approval gates.
4. Only then connect approved ideas to the original repo's production/publishing agents.
