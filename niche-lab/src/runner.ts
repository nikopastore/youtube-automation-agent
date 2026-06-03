import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runNichePipeline } from './agents.js';
import { analyzeVideoBatchForClips, ClipAnalyzerOptions } from './clipAnalyzer.js';
import { toMarkdown } from './report.js';
import { ClipOpportunityReport, ExperimentConfig, ExperimentReport, TrendItem, TrendResearchReport, VideoSource } from './types.js';
import { buildTrendResearchReport, TrendResearchOptions } from './trendResearch.js';

export async function loadConfig(configPath: string): Promise<ExperimentConfig> {
  const raw = await readFile(configPath, 'utf8');
  const config = JSON.parse(raw) as ExperimentConfig;
  if (!config.experimentName || !Array.isArray(config.niches) || config.niches.length === 0) {
    throw new Error('Config must include experimentName and at least one niche.');
  }
  return config;
}

export async function runExperiment(configPath: string, outDir: string): Promise<ExperimentReport> {
  const config = await loadConfig(configPath);
  const rankedReports = config.niches
    .map(runNichePipeline)
    .sort((a, b) => b.score - a.score);

  const report: ExperimentReport = {
    experimentName: config.experimentName,
    generatedAt: new Date().toISOString(),
    rankedReports
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(outDir, 'summary.md'), toMarkdown(report));
  return report;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function loadVideos(raw: unknown): VideoSource[] {
  if (Array.isArray(raw)) return raw as VideoSource[];
  if (!isRecord(raw)) throw new Error('Clip input must be an object with videos, or an array of video sources.');
  if (Array.isArray(raw.videos)) return raw.videos as VideoSource[];
  if (isRecord(raw.video)) {
    const video = raw.video as Record<string, unknown>;
    const segments = Array.isArray(raw.segments)
      ? raw.segments.map((segment) => {
          const record = segment as Record<string, unknown>;
          return {
            startSeconds: typeof record.startSeconds === 'number' ? record.startSeconds : (record.start as number),
            endSeconds: typeof record.endSeconds === 'number' ? record.endSeconds : (record.end as number),
            text: String(record.text ?? '')
          };
        })
      : undefined;
    return [
      {
        id: String(video.id ?? video.url ?? video.title ?? 'video-1'),
        title: String(video.title ?? 'Untitled video'),
        platform: String(video.platform ?? video.source ?? 'generic'),
        url: typeof video.url === 'string' ? video.url : undefined,
        creator: typeof video.creator === 'string' ? video.creator : typeof video.channel === 'string' ? video.channel : undefined,
        durationSeconds: typeof video.durationSeconds === 'number' ? video.durationSeconds : 0,
        publishedAt: typeof video.publishedAt === 'string' ? video.publishedAt : undefined,
        transcriptSegments: segments
      }
    ];
  }
  throw new Error('Clip input must include videos.');
}

function loadTrendItems(raw: unknown): { niche: string; items: TrendItem[] } {
  if (Array.isArray(raw)) return { niche: 'general', items: raw as TrendItem[] };
  if (!isRecord(raw)) throw new Error('Trend input must be an object with items, or an array of trend items.');
  const niche = typeof raw.niche === 'string' && raw.niche.trim() ? raw.niche : 'general';
  if (!Array.isArray(raw.items)) throw new Error('Trend input must include items.');
  return { niche, items: raw.items as TrendItem[] };
}

function clipsMarkdown(report: ClipOpportunityReport): string {
  return [
    '# Viral clip opportunity report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.safetyNote,
    '',
    `Sources analyzed: ${report.sourcesAnalyzed}`,
    '',
    '## Top clip candidates',
    '',
    ...report.candidates.flatMap((candidate, index) => [
      `### ${index + 1}. ${candidate.title} (${candidate.score}/10)`,
      '',
      `- Source: ${candidate.sourceId}`,
      `- Window: ${candidate.startSeconds}s-${candidate.endSeconds}s`,
      `- Hook: ${candidate.hook}`,
      `- Why viral: ${candidate.whyViral.join('; ')}`,
      `- Format: ${candidate.format}`,
      `- Reuse plan: ${candidate.reusePlan}`,
      `- Risk flags: ${candidate.riskFlags.length ? candidate.riskFlags.join(', ') : 'none'}`,
      ''
    ])
  ].join('\n');
}

function trendsMarkdown(report: TrendResearchReport): string {
  return [
    '# Trend research report',
    '',
    `Niche: ${report.niche}`,
    `Generated: ${report.generatedAt}`,
    '',
    report.safetyNote,
    '',
    '## Ranked trends',
    '',
    ...report.rankedTrends.flatMap((trend, index) => [
      `### ${index + 1}. ${trend.topic} (${trend.score}/10)`,
      '',
      `- Recency: ${trend.recencyScore}/10`,
      `- Velocity: ${trend.velocityScore}/10`,
      `- Platform spread: ${trend.platformSpread}`,
      `- Relevance: ${trend.relevanceScore}/10`,
      `- Content supply: ${trend.contentSupplyScore}/10`,
      `- Sources: ${trend.sources.join(', ')}`,
      `- Recommendation: ${trend.recommendation}`,
      ''
    ]),
    '## Research angles',
    '',
    ...report.researchAngles.map((angle) => `- ${angle}`),
    ''
  ].join('\n');
}

export async function runClipsReport(inputPath: string, outDir: string, options?: ClipAnalyzerOptions): Promise<ClipOpportunityReport> {
  const raw = JSON.parse(await readFile(inputPath, 'utf8')) as unknown;
  const videos = loadVideos(raw);
  const report = analyzeVideoBatchForClips(videos, options);
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(outDir, 'summary.md'), clipsMarkdown(report));
  return report;
}

export async function runTrendResearchReport(
  inputPath: string,
  outDir: string,
  options?: Partial<TrendResearchOptions>
): Promise<TrendResearchReport> {
  const raw = JSON.parse(await readFile(inputPath, 'utf8')) as unknown;
  const { niche, items } = loadTrendItems(raw);
  const report = buildTrendResearchReport(items, { niche: options?.niche ?? niche, now: options?.now, maxTrends: options?.maxTrends });
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'trend-report.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(outDir, 'trend-summary.md'), trendsMarkdown(report));
  return report;
}
