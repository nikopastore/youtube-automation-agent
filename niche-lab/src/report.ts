import { ExperimentReport, NicheReport } from './types.js';

function linesForNiche(report: NicheReport, rank: number): string[] {
  return [
    `## ${rank}. ${report.niche.name} — ${report.score}/10`,
    '',
    `**Audience:** ${report.niche.audience}`,
    `**Recommendation:** ${report.recommendation}`,
    `**Formats:** ${report.niche.contentFormats.join(', ')}`,
    `**Monetization:** ${report.niche.monetizationPaths.join(', ')}`,
    '',
    '**Score breakdown:**',
    `- Monetization: ${report.scoreBreakdown.monetization}/10`,
    `- Audience clarity: ${report.scoreBreakdown.audienceClarity}/10`,
    `- Content supply: ${report.scoreBreakdown.contentSupply}/10`,
    `- Production simplicity: ${report.scoreBreakdown.productionComplexity}/10`,
    `- Differentiation: ${report.scoreBreakdown.differentiation}/10`,
    `- Safety/compliance: ${report.scoreBreakdown.safetyCompliance}/10`,
    '',
    '**Top test scripts:**',
    ...report.scripts.map((script, index) => `- ${index + 1}. ${script.hook}`),
    '',
    '**7-day calendar:**',
    ...report.calendar.map((item) => `- Day ${item.day} ${item.publishWindow}: ${item.format} — ${item.topic}`),
    '',
    ...(report.risks.length ? ['**Risks:**', ...report.risks.map((risk) => `- ${risk}`), ''] : [])
  ];
}

export function toMarkdown(report: ExperimentReport): string {
  const lines = [
    `# ${report.experimentName}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Ranked niches',
    '',
    ...report.rankedReports.flatMap((niche, index) => linesForNiche(niche, index + 1))
  ];
  return lines.join('\n');
}
