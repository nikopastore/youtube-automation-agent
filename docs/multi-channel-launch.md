# Multi-Channel Launch Playbook

This fork now treats the original automation agent as the production engine and adds a safer launch layer for testing YouTube channel niches. The starter config is `config/channels.sample.json`.

## Current experiment: 2 viral-safe niches

We picked niches that have proven brainrot replay/share value AND are safe to run with an automated, faceless, fully-original-content pipeline. This is the only combination that survives both the YouTube algorithm and YouTube's monetization policy at the same time.

### Channel 1 — Mind Melt (`mind-melt-quiz`)

- **Format:** Quiz / trivia / brain-teaser / would-you-rather Shorts
- **Why it works:** The comment section becomes the game. People argue, defend, replay to prove a point. Massive rewatch + share signal.
- **Examples:** "Only 1% can guess the country from this outline", "3 facts, 1 is fake — pick it", "Would you rather: lose $1,000 or gain 10 years?"
- **Why it is safe:** Original questions only, original scripts, AI-generated visuals, no copyrighted footage.

### Channel 2 — Weird Why (`weird-why-facts`)

- **Format:** Science / space / psychology "wait what" explainer Shorts
- **Why it works:** The twist is the payoff. First watch sells the setup, second watch is the share.
- **Examples:** "This planet literally rains glass sideways", "Your brain deletes most of what you see", "The country that almost existed in 2025"
- **Why it is safe:** Fact-checked sources, no scary medical or political content, no kid-themed framing.

## Why not the more obvious viral niches

These were considered and rejected. The risk-reward does not beat the pair above.

| Niche | Why not |
|---|---|
| Reddit AITA / storytime using real Reddit posts | Copyright and "reused content" risk under YouTube monetization policy |
| Movie / TV / anime recaps | Copyright and reused content |
| Sports highlights | Copyright |
| True crime | Sensitive-event monetization risk |
| Investment / crypto advice | Regulatory and claim risk |
| Health / weight-loss advice | Medical-claim risk |
| Celebrity gossip / drama | Defamation and image rights |
| Kids content | Children-directed policy, COPPA, advertiser suitability |

## The safety defaults

```env
DEFAULT_PRIVACY_STATUS=private
YOUTUBE_UPLOAD_DRY_RUN=true
AUTO_PUBLISH_ENABLED=false
REQUIRE_MANUAL_APPROVAL=true
```

The system can generate content immediately, but real uploads stay private or dry-run until credentials and approval are confirmed.

## YouTube monetization policy reminder

YouTube explicitly flags these as risky:

- Repetitive, mass-produced, or inauthentic content
- Reused content without significant transformation
- AI-generated content without original value
- Compilations of others' footage with minimal commentary

Our setup avoids all of these by producing original scripts, original AI visuals, and meaningful per-episode commentary.

## Commands

```bash
npm run channels:plan
npm run channels:batch
npm run channels:check
```

Outputs:

```text
runs/channel-launch/
  launch-plan.md
  launch-plan.json
  batch-summary.json
  mind-melt-quiz/<episode>/script.md
  mind-melt-quiz/<episode>/metadata.json
  weird-why-facts/<episode>/script.md
  weird-why-facts/<episode>/metadata.json
  credential-check.json
```

## First posting workflow

1. Generate first batch:

   ```bash
   npm run channels:batch
   ```

2. Pick one episode from each channel.
3. Generate or assemble the video asset (TTS + AI visuals).
4. Upload as private or run a dry-run upload first.
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
   - comments per 1k views
   - shares per 1k views
   - save rate

## YouTube credential layout

```text
config/youtube/mind-melt-quiz/credentials.json
config/youtube/mind-melt-quiz/tokens.json
config/youtube/weird-why-facts/credentials.json
config/youtube/weird-why-facts/tokens.json
```

`npm run channels:check` verifies which profiles are ready.

## What was improved in the original agent

- Default upload privacy changed from `public` to `private`.
- Real uploads now use actual video file streams.
- Added dry-run upload mode.
- Added manual approval gate before publishing.
- Added auto-publish off switch.
- Added multi-channel launch config and episode pack generator.

## Next build targets

- Per-channel OAuth selection in the runtime publishing agent.
- TTS pipeline (ElevenLabs or OpenAI) wired into the batch output.
- AI visual pipeline (image gen + simple Ken Burns / parallax) for each storyboard beat.
- Analytics importer that writes per-channel experiment metrics back into a scorecard.
- Per-channel "winner formula" detector: surface topics with high replay and share.
