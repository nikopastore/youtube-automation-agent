import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { scoreNiche, weightedScore } from '../scoring.js';
import { runClipsReport, runExperiment, runTrendResearchReport } from '../runner.js';
import { sampleConfig } from '../sample.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { analyzeVideoBatchForClips, analyzeVideoForClips } from '../clipAnalyzer.js';
import { buildTrendResearchReport } from '../trendResearch.js';

async function testScoring(): Promise<void> {
  const strong = sampleConfig.niches[0];
  const breakdown = scoreNiche(strong);
  assert.ok(breakdown.monetization >= 7, 'founder/agent niche should monetize well');
  assert.ok(weightedScore(breakdown) > 0);
}

async function testOutputGeneration(): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'youtube-niche-lab-'));
  try {
    const configPath = path.join(dir, 'config.json');
    const outDir = path.join(dir, 'out');
    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(sampleConfig, null, 2));
    const report = await runExperiment(configPath, outDir);
    assert.equal(report.rankedReports.length, sampleConfig.niches.length);
    assert.ok(report.rankedReports[0].score >= report.rankedReports.at(-1)!.score);
    const markdown = await readFile(path.join(outDir, 'summary.md'), 'utf8');
    const json = await readFile(path.join(outDir, 'report.json'), 'utf8');
    assert.ok(markdown.includes('Ranked niches'));
    assert.ok(JSON.parse(json).rankedReports.length > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function sampleClipInput(): unknown {
  return {
    videos: [
      {
        id: 'ai-agent-demo',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=test',
        title: 'AI Agent Workflow Breakdown',
        creator: 'Niche Lab',
        durationSeconds: 220,
        publishedAt: '2026-05-28T12:00:00.000Z',
        signals: [
          { metric: 'views', value: 125000, weight: 0.8, reason: 'Strong view count for the channel' },
          { metric: 'engagementRate', value: 0.08, weight: 0.7, reason: 'Above-average engagement' }
        ],
        transcriptSegments: [
          { startSeconds: 0, endSeconds: 12, text: 'Today we are walking through a normal setup for AI agents.' },
          { startSeconds: 12, endSeconds: 28, text: 'Most founders make this expensive mistake when they automate too early.' },
          { startSeconds: 28, endSeconds: 45, text: 'Here are three fixes that saved our test workflow ten hours a week.' },
          { startSeconds: 45, endSeconds: 62, text: 'The surprising part is that the simplest prompt beat the complex tool chain.' },
          { startSeconds: 62, endSeconds: 78, text: 'Now let us compare the dashboard and summarize the tradeoffs.' },
          { startSeconds: 78, endSeconds: 96, text: 'Do not copy random viral templates; use this checklist before you publish.' }
        ]
      },
      {
        id: 'licensed-finance-clip',
        platform: 'youtube',
        title: 'Licensed Finance Segment',
        creator: 'Licensed Partner',
        durationSeconds: 80,
        publishedAt: '2026-04-01T12:00:00.000Z',
        signals: [{ metric: 'views', value: 5000, weight: 0.3, reason: 'Small but useful baseline' }],
        transcriptSegments: [
          { startSeconds: 0, endSeconds: 10, text: 'This stock will double next month if you follow this strategy.' },
          { startSeconds: 10, endSeconds: 18, text: 'The lesson is to understand risk before copying a trade.' }
        ]
      }
    ]
  };
}

async function testClipAnalyzerScoringAndRiskFlags(): Promise<void> {
  const input = sampleClipInput() as { videos: Parameters<typeof analyzeVideoForClips>[0][] };
  const report = analyzeVideoForClips(input.videos[0], {
    now: new Date('2026-06-02T12:00:00.000Z'),
    maxCandidates: 6
  });

  assert.equal(report.source.id, 'ai-agent-demo');
  assert.ok(report.candidates.length >= 3);
  assert.ok(report.candidates.length <= 6);
  assert.ok(report.candidates[0].score >= report.candidates.at(-1)!.score);
  assert.ok(report.candidates[0].whyViral.some((reason) => reason.includes('mistake') || reason.includes('number')));
  assert.ok(report.candidates.every((candidate) => candidate.startSeconds < candidate.endSeconds));
  assert.ok(report.candidates.every((candidate) => candidate.format.includes('short')));
  assert.ok(report.candidates.some((candidate) => candidate.riskFlags.includes('copyright-review-required')));

  const financeReport = analyzeVideoForClips(input.videos[1], { now: new Date('2026-06-02T12:00:00.000Z') });
  assert.ok(financeReport.candidates.some((candidate) => candidate.riskFlags.includes('financial-claim-review')));
  assert.ok(financeReport.candidates.some((candidate) => candidate.riskFlags.includes('low-confidence-short-segment')));

  const missingTranscript = analyzeVideoForClips(
    {
      id: 'missing',
      platform: 'youtube',
      title: 'Missing Transcript',
      creator: 'Unknown',
      durationSeconds: 30,
      publishedAt: '2026-06-01T12:00:00.000Z'
    },
    { now: new Date('2026-06-02T12:00:00.000Z') }
  );
  assert.equal(missingTranscript.candidates.length, 0);
  assert.ok(missingTranscript.riskFlags.includes('missing-transcript'));

  const batch = analyzeVideoBatchForClips(input.videos, { now: new Date('2026-06-02T12:00:00.000Z'), maxCandidates: 5 });
  assert.equal(batch.sourcesAnalyzed, 2);
  assert.ok(batch.candidates[0].score >= batch.candidates.at(-1)!.score);
}

async function testClipRunnerOutputGeneration(): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'youtube-niche-lab-clips-'));
  try {
    const inputPath = path.join(dir, 'video-intel.json');
    const outDir = path.join(dir, 'clips');
    await writeFile(inputPath, JSON.stringify(sampleClipInput(), null, 2));

    const report = await runClipsReport(inputPath, outDir, { now: new Date('2026-06-02T12:00:00.000Z') });
    assert.ok(report.candidates.length >= 3);
    assert.ok(report.candidates[0].score >= report.candidates.at(-1)!.score);

    const json = await readFile(path.join(outDir, 'report.json'), 'utf8');
    const markdown = await readFile(path.join(outDir, 'summary.md'), 'utf8');
    assert.equal(JSON.parse(json).candidates.length, report.candidates.length);
    assert.ok(markdown.includes('Viral clip opportunity report'));
    assert.ok(markdown.includes('No media was downloaded, extracted, uploaded, or posted'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function sampleTrendItems(): unknown {
  return {
    niche: 'AI agent tools for founders',
    items: [
      {
        id: 'agent-memory-youtube',
        source: 'YouTube',
        title: 'Agent memory workflows',
        url: 'https://example.com/agent-memory',
        topic: 'agent memory',
        publishedAt: '2026-06-01T12:00:00.000Z',
        observedAt: '2026-06-02T08:00:00.000Z',
        velocity: 9,
        relevance: 10,
        contentSupply: 8,
        metrics: { views: 180000, comments: 900 }
      },
      {
        id: 'agent-memory-reddit',
        source: 'Reddit',
        title: 'Founders comparing agent memory tools',
        topic: 'agent memory',
        observedAt: '2026-06-01T18:00:00.000Z',
        velocity: 8,
        relevance: 9,
        contentSupply: 7,
        metrics: { upvotes: 2400 }
      },
      {
        id: 'old-browser-tiktok',
        source: 'TikTok',
        title: 'Browser automation macros',
        topic: 'browser automation',
        observedAt: '2026-04-15T18:00:00.000Z',
        velocity: 6,
        relevance: 8,
        contentSupply: 9,
        metrics: { views: 60000 }
      }
    ]
  };
}

async function testTrendResearchRankingAndOutput(): Promise<void> {
  const direct = buildTrendResearchReport((sampleTrendItems() as { items: Parameters<typeof buildTrendResearchReport>[0] }).items, {
    niche: 'AI agent tools for founders',
    now: new Date('2026-06-02T12:00:00.000Z')
  });
  assert.equal(direct.rankedTrends[0].topic, 'agent memory');
  assert.ok(direct.rankedTrends[0].platformSpread >= 2);
  assert.ok(direct.rankedTrends[0].score >= direct.rankedTrends.at(-1)!.score);
  assert.ok(direct.researchAngles.length > 0);

  const dir = await mkdtemp(path.join(tmpdir(), 'youtube-niche-lab-trends-'));
  try {
    const configPath = path.join(dir, 'trend-items.json');
    const outDir = path.join(dir, 'out');
    await writeFile(configPath, JSON.stringify(sampleTrendItems(), null, 2));

    const report = await runTrendResearchReport(configPath, outDir, { now: new Date('2026-06-02T12:00:00.000Z') });
    assert.ok(report.rankedTrends.length >= 2);
    assert.equal(report.rankedTrends[0].topic, 'agent memory');

    const json = await readFile(path.join(outDir, 'trend-report.json'), 'utf8');
    const markdown = await readFile(path.join(outDir, 'trend-summary.md'), 'utf8');
    assert.equal(JSON.parse(json).niche, 'AI agent tools for founders');
    assert.ok(markdown.includes('Trend research report'));
    assert.ok(markdown.includes('agent memory'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

await testScoring();
await testOutputGeneration();
await testClipAnalyzerScoringAndRiskFlags();
await testClipRunnerOutputGeneration();
await testTrendResearchRankingAndOutput();
console.log('All tests passed');
