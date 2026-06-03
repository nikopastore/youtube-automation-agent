import { RankedTrend, TrendItem, TrendResearchReport } from './types.js';

export type TrendResearchOptions = {
  niche: string;
  now?: Date;
  maxTrends?: number;
};

const safetyNote =
  'Trend research is input-only and deterministic. Verify sources manually before production decisions; this tool does not scrape, post, upload, or claim live API coverage.';

function clamp(value: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Number(value.toFixed(1));
}

function recencyForItem(item: TrendItem, now: Date): number {
  const dateRaw = item.observedAt ?? item.publishedAt;
  if (!dateRaw) return 4;
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return 4;
  const ageDays = Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
  if (ageDays <= 1) return 10;
  if (ageDays <= 3) return 9;
  if (ageDays <= 7) return 8;
  if (ageDays <= 14) return 6.5;
  if (ageDays <= 30) return 5;
  if (ageDays <= 60) return 3;
  return 1.5;
}

function metricVelocity(item: TrendItem): number {
  if (typeof item.velocity === 'number' && Number.isFinite(item.velocity)) return clamp(item.velocity);
  const metrics = item.metrics ?? {};
  const views = metrics.views ?? metrics.viewCount ?? 0;
  const comments = metrics.comments ?? metrics.commentCount ?? 0;
  const shares = metrics.shares ?? metrics.shareCount ?? 0;
  const upvotes = metrics.upvotes ?? 0;
  const aggregate = views + comments * 35 + shares * 50 + upvotes * 25;
  if (aggregate <= 0) return 4;
  return clamp(Math.log10(aggregate) * 1.8);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function groupByTopic(items: TrendItem[]): Map<string, TrendItem[]> {
  const groups = new Map<string, TrendItem[]>();
  for (const item of items) {
    const topic = item.topic.trim().toLowerCase();
    if (!topic) continue;
    groups.set(topic, [...(groups.get(topic) ?? []), item]);
  }
  return groups;
}

function rankedTrend(topic: string, items: TrendItem[], now: Date): RankedTrend {
  const sources = [...new Set(items.map((item) => item.source).filter(Boolean))].sort();
  const recencyScore = round1(Math.max(...items.map((item) => recencyForItem(item, now))));
  const velocityScore = round1(average(items.map(metricVelocity)));
  const relevanceScore = round1(average(items.map((item) => clamp(item.relevance ?? 6))));
  const contentSupplyScore = round1(average(items.map((item) => clamp(item.contentSupply ?? 5))));
  const platformSpread = sources.length;
  const spreadScore = clamp(platformSpread * 2.5);
  const evidence = items
    .map((item) => item.evidence ?? `${item.title} (${item.source})`)
    .slice(0, 4);
  const score = round1(
    recencyScore * 0.24 + velocityScore * 0.26 + spreadScore * 0.18 + relevanceScore * 0.22 + contentSupplyScore * 0.1
  );

  return {
    topic,
    score,
    recencyScore,
    velocityScore,
    platformSpread,
    relevanceScore,
    contentSupplyScore,
    sources,
    itemCount: items.length,
    evidence,
    recommendation:
      platformSpread >= 2
        ? `Prioritize ${topic}: it is showing cross-platform demand and enough supply for multiple short-form tests.`
        : `Watch ${topic}: good signal, but validate beyond ${sources[0] ?? 'the current source'} before scaling.`
  };
}

function researchAngles(trends: RankedTrend[], niche: string): string[] {
  return trends.slice(0, 5).map((trend) => {
    const format = trend.score >= 8 ? 'fast checklist short' : 'evidence-led explainer';
    return `${format}: ${trend.topic} for ${niche}, using ${trend.sources.join(' + ')} as manual research inputs.`;
  });
}

export function buildTrendResearchReport(items: TrendItem[], options: TrendResearchOptions): TrendResearchReport {
  const now = options.now ?? new Date();
  const rankedTrends = [...groupByTopic(items).entries()]
    .map(([topic, topicItems]) => rankedTrend(topic, topicItems, now))
    .sort((a, b) => b.score - a.score || b.platformSpread - a.platformSpread || a.topic.localeCompare(b.topic))
    .slice(0, options.maxTrends ?? 10);

  return {
    niche: options.niche,
    generatedAt: now.toISOString(),
    itemCount: items.length,
    sourceCoverage: [...new Set(items.map((item) => item.source).filter(Boolean))].sort(),
    rankedTrends,
    researchAngles: researchAngles(rankedTrends, options.niche),
    safetyNote
  };
}
