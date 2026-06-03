import { NicheInput, ScoreBreakdown } from './types.js';

const clamp = (value: number) => Math.max(1, Math.min(10, Math.round(value)));

function keywordBoost(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

export function scoreNiche(niche: NicheInput): ScoreBreakdown {
  const text = [niche.name, niche.audience, ...niche.seedTopics, ...niche.monetizationPaths].join(' ');
  const monetization = clamp(
    4 + niche.monetizationPaths.length * 1.2 + keywordBoost(text, ['b2b', 'founder', 'consulting', 'course', 'subscription', 'data', 'finance'])
  );
  const audienceClarity = clamp(3 + Math.min(4, niche.audience.split(/\s+/).length / 4) + keywordBoost(niche.audience, ['who', 'using', 'parents', 'teachers', 'engineers', 'locals', 'founders']));
  const contentSupply = clamp(4 + niche.seedTopics.length * 1.1 + niche.contentFormats.length * 0.5);
  const productionComplexity = clamp(10 - keywordBoost(text, ['animated', 'upload', 'api', 'legal', 'finance', 'kids', 'medical']) - Math.max(0, niche.contentFormats.length - 3));
  const differentiation = clamp(4 + keywordBoost(text, ['niche', 'snowflake', 'phoenix', 'prediction', 'agent', 'teacher']) + Math.min(2, niche.constraints?.length ?? 0));
  const safetyCompliance = clamp(9 - keywordBoost(text, ['kids', 'finance', 'financial', 'prediction', 'gambling', 'medical']) + Math.min(2, niche.constraints?.length ?? 0));

  return { monetization, audienceClarity, contentSupply, productionComplexity, differentiation, safetyCompliance };
}

export function weightedScore(breakdown: ScoreBreakdown): number {
  const score =
    breakdown.monetization * 0.22 +
    breakdown.audienceClarity * 0.18 +
    breakdown.contentSupply * 0.18 +
    breakdown.productionComplexity * 0.14 +
    breakdown.differentiation * 0.16 +
    breakdown.safetyCompliance * 0.12;
  return Number(score.toFixed(2));
}
