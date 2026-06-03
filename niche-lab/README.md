# YouTube Niche Lab

A safe MVP for testing YouTube account niche types and researching viral clip opportunities before building a fully autonomous channel runner.

This repo was inspired by the Instagram Reel / GitHub project pattern of a 6-agent YouTube automation team, but it deliberately **does not upload videos** or pretend to run a channel. It is a planning simulator for deciding which niches are worth testing, plus a deterministic video intelligence MVP for analyzing provided metadata, transcripts, segments, and trend items.

## What it does

For each niche, the CLI runs six deterministic agent-style stages:

1. **Researcher** — topic/trend ideas and audience angles
2. **Scriptwriter** — 3 short-form scripts with hooks
3. **Thumbnail Designer** — thumbnail prompts only, no image generation
4. **SEO Strategist** — titles, descriptions, tags
5. **Manager** — 7-day publishing calendar, no upload
6. **Analyst** — ranking score across:
   - monetization
   - audience clarity
   - content supply
   - production complexity
   - differentiation
   - safety/compliance

Outputs are written as both JSON and Markdown so we can compare niche/account ideas quickly.

The video intelligence MVP adds:

- Viral clip opportunity scoring from provided `VideoSource` metadata, transcript segments, and social signals.
- Deterministic 20-90 second clip candidate windows with hooks, viral rationale, reuse plans, scores, and risk flags.
- Trend research reports from provided YouTube, TikTok, Instagram, Reddit, X, Google Trends, newsletter, or other trend items.
- Ranking by recency, velocity, platform spread, niche relevance, and content supply.

Safety boundaries:

- No auto-uploading, scheduling, or posting.
- No media downloading or clip extraction.
- Use only your own, licensed, or manually reviewed fair-use clips.
- Treat risk flags as manual review prompts, especially copyright, medical, and financial claim flags.

## Install

```bash
npm install
npm run build
```

## Commands

Create a sample config with 6 niches:

```bash
node dist/cli.js init-sample
```

Run an experiment:

```bash
node dist/cli.js run --config config/niches.sample.json --out runs/demo
```

Run the full demo:

```bash
npm run run:demo
```

Analyze provided video/transcript intel for clip opportunities:

```bash
node dist/cli.js clips --input config/video-intel.sample.json --out runs/demo-intel/clips
```

Analyze provided trend items:

```bash
node dist/cli.js trends --input config/video-intel.sample.json --out runs/demo-intel/trends
```

Run the video intelligence demo:

```bash
node dist/cli.js demo-intel
```

Run tests:

```bash
npm test
```

## Config shape

Niche experiment config:

```json
{
  "experimentName": "sample-niche-test",
  "niches": [
    {
      "name": "AI Agent Tools for Founders",
      "audience": "solo founders and operators",
      "contentFormats": ["shorts", "tutorials", "tool breakdowns"],
      "monetizationPaths": ["community", "affiliate tools", "consulting"],
      "constraints": ["avoid fake benchmarks", "cite sources"],
      "seedTopics": ["new coding agents", "workflow automations"]
    }
  ]
}
```

## Video intelligence input shape

`config/video-intel.sample.json` includes both `videos` and `items` so it can drive the clips and trends commands.

```json
{
  "niche": "AI agent tools for founders",
  "videos": [
    {
      "id": "ai-agent-demo",
      "title": "AI Agent Workflow Breakdown",
      "platform": "youtube",
      "url": "https://www.youtube.com/watch?v=sample",
      "creator": "Niche Lab",
      "durationSeconds": 220,
      "publishedAt": "2026-05-28T12:00:00.000Z",
      "signals": [{ "metric": "views", "value": 125000, "weight": 0.8, "reason": "Strong view count" }],
      "transcriptSegments": [{ "startSeconds": 12, "endSeconds": 28, "text": "Most founders make this expensive mistake..." }]
    }
  ],
  "items": [
    {
      "source": "YouTube",
      "title": "Agent memory workflows",
      "topic": "agent memory",
      "observedAt": "2026-06-02T08:00:00.000Z",
      "velocity": 9,
      "relevance": 10,
      "contentSupply": 8
    }
  ]
}
```

Clip reports write `report.json` and `summary.md`. Trend reports write `trend-report.json` and `trend-summary.md`.

## Next build steps

- Add live trend ingestion: YouTube Data API, Reddit, X, GitHub trending, Google Trends, behind explicit configured API clients.
- Add LLM provider abstraction for real script variants and niche-specific tone.
- Add review gates for compliance and brand risk.
- Add a dashboard for side-by-side niche experiments.
- Only after validation: add YouTube upload/scheduling behind explicit manual approval.
