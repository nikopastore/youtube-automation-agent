import {
  CalendarItem,
  NicheInput,
  NicheReport,
  ScriptDraft,
  SeoPackage,
  ThumbnailPrompt,
  TopicIdea
} from './types.js';
import { scoreNiche, weightedScore } from './scoring.js';

const windows = ['8:00 AM', '12:00 PM', '5:30 PM', '8:00 PM'];

export function researcher(niche: NicheInput): TopicIdea[] {
  return niche.seedTopics.slice(0, 6).map((seed, index) => ({
    topic: `${seed}: ${niche.name} angle #${index + 1}`,
    angle: `Make ${seed} useful for ${niche.audience}.`,
    whyNow: `Good test topic because it is close to the audience and can be repeated in ${niche.contentFormats[0] ?? 'shorts'} format.`
  }));
}

export function scriptwriter(niche: NicheInput, topics: TopicIdea[]): ScriptDraft[] {
  return topics.slice(0, 3).map((idea, index) => ({
    topic: idea.topic,
    hook: `Most ${niche.audience.split(' ').slice(0, 4).join(' ')} miss this ${idea.topic.split(':')[0]} move.`,
    beats: [
      `State the problem in one sentence: ${idea.angle}`,
      'Show one concrete example or mini-demo.',
      'Name the mistake most beginners make.',
      'Give a repeatable 3-step playbook.',
      'End with a measurable next action.'
    ],
    cta: index === 0 ? 'Comment TEST for the checklist.' : 'Save this and test it this week.'
  }));
}

export function thumbnailDesigner(scripts: ScriptDraft[]): ThumbnailPrompt[] {
  return scripts.map((script) => ({
    topic: script.topic,
    textOverlay: script.topic.split(':')[0].slice(0, 32).toUpperCase(),
    prompt: `Clean high-contrast YouTube Shorts thumbnail, one bold object/metaphor for "${script.topic}", expressive but not clickbait, large readable overlay text, premium editorial style.`
  }));
}

export function seoStrategist(niche: NicheInput, scripts: ScriptDraft[]): SeoPackage[] {
  return scripts.map((script) => {
    const core = script.topic.split(':')[0];
    return {
      topic: script.topic,
      title: `${core} for ${niche.audience.split(' ').slice(0, 5).join(' ')} #shorts`,
      description: `${script.hook}\n\nThis video tests the ${niche.name} niche with a practical, source-aware format.`,
      tags: Array.from(new Set([
        ...niche.name.toLowerCase().split(/\W+/).filter(Boolean),
        ...core.toLowerCase().split(/\W+/).filter(Boolean),
        'shorts',
        'youtube'
      ])).slice(0, 12)
    };
  });
}

export function manager(niche: NicheInput, topics: TopicIdea[]): CalendarItem[] {
  return Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    format: niche.contentFormats[index % niche.contentFormats.length] ?? 'shorts',
    topic: topics[index % topics.length]?.topic ?? niche.seedTopics[index % niche.seedTopics.length] ?? niche.name,
    publishWindow: windows[index % windows.length]
  }));
}

export function analyst(niche: NicheInput): Pick<NicheReport, 'score' | 'scoreBreakdown' | 'recommendation' | 'risks'> {
  const scoreBreakdown = scoreNiche(niche);
  const score = weightedScore(scoreBreakdown);
  const risks = [
    ...(scoreBreakdown.safetyCompliance < 7 ? ['Compliance/safety risk needs manual review.'] : []),
    ...(scoreBreakdown.productionComplexity < 6 ? ['Production complexity may slow the test cadence.'] : []),
    ...(scoreBreakdown.differentiation < 6 ? ['Niche may need a sharper POV to avoid commodity content.'] : [])
  ];
  const recommendation = score >= 8 ? 'Run a 14-day content sprint.' : score >= 7 ? 'Run a 7-day validation sprint.' : 'Keep as backlog unless strategically important.';
  return { score, scoreBreakdown, recommendation, risks };
}

export function runNichePipeline(niche: NicheInput): NicheReport {
  const topics = researcher(niche);
  const scripts = scriptwriter(niche, topics);
  const thumbnails = thumbnailDesigner(scripts);
  const seo = seoStrategist(niche, scripts);
  const calendar = manager(niche, topics);
  const analysis = analyst(niche);
  return { niche, topics, scripts, thumbnails, seo, calendar, ...analysis };
}
