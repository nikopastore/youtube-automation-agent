# Multi-Channel Launch Playbook

This fork now treats the original automation agent as the production engine and adds a safer launch layer for testing 2-3 YouTube channel niches.

## Core rule

Do **not** let the agent auto-publish public videos during the testing phase.

Default safety settings:

```env
DEFAULT_PRIVACY_STATUS=private
YOUTUBE_UPLOAD_DRY_RUN=true
AUTO_PUBLISH_ENABLED=false
REQUIRE_MANUAL_APPROVAL=true
```

That means the system can generate/channel-plan/batch content immediately, but real YouTube uploads stay private or dry-run until credentials and approval are configured.

## Initial channel experiments

The starter config is `config/channels.sample.json`.

1. `agent-ops-lab` — B2B AI automation / coding-agent operations
2. `probability-briefs` — prediction markets / data-driven current events
3. `classroom-workflow-lab` — teacher productivity / classroom systems

These are intentionally different niche types:

- tech/operator audience
- data/finance/news audience
- teacher/productivity audience

The goal is not to marry these names. The goal is to generate enough consistent content to compare velocity, CTR, retention, comments, and subscriber conversion.

## Commands

From the repo root:

```bash
npm run channels:plan
npm run channels:batch
npm run channels:check
```

Outputs go to:

```text
runs/channel-launch/
```

Important files:

- `runs/channel-launch/launch-plan.md`
- `runs/channel-launch/batch-summary.json`
- `runs/channel-launch/<channel-id>/<episode-id>/script.md`
- `runs/channel-launch/<channel-id>/<episode-id>/metadata.json`

## YouTube credential layout

For testing multiple YouTube channels, keep credentials separated by channel profile:

```text
config/youtube/agent-ops-lab/credentials.json
config/youtube/agent-ops-lab/tokens.json
config/youtube/probability-briefs/credentials.json
config/youtube/probability-briefs/tokens.json
config/youtube/classroom-workflow-lab/credentials.json
config/youtube/classroom-workflow-lab/tokens.json
```

`npm run channels:check` verifies which credential profiles are ready.

## First posting workflow

1. Generate first batch:

   ```bash
   npm run channels:batch
   ```

2. Pick one episode from each channel.
3. Generate/assemble the video asset.
4. Upload as private or run dry-run upload first.
5. Review in YouTube Studio:
   - title
   - description
   - tags
   - thumbnail
   - captions
   - no unsupported claims
   - no copyrighted media
6. Only then schedule/public.
7. Track:
   - impressions
   - CTR
   - average view duration
   - first 3-second hold
   - comments/subscribers per 1k views

## What was improved in the original agent

- Default upload privacy changed from `public` to `private`.
- Real uploads now require actual video file streams instead of the original simulated JSON body.
- Added dry-run upload mode.
- Added manual approval gate before publishing.
- Added auto-publish off switch.
- Added multi-channel launch config and batch episode pack generator.

## Next build targets

- Per-channel OAuth selection in the runtime publishing agent.
- CLI command to convert generated episode packs into production queue entries.
- Video assembly templates for Shorts: captioned slides, chart cards, b-roll prompts, and voiceover.
- Analytics importer that writes per-channel experiment metrics back into a scorecard.
