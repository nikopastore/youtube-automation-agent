import {
  ClipCandidate,
  ClipOpportunityReport,
  TranscriptSegment,
  VideoClipAnalysisReport,
  VideoSource,
  ViralSignal
} from './types.js';

export type ClipAnalyzerOptions = {
  now?: Date;
  minSeconds?: number;
  maxSeconds?: number;
  maxCandidates?: number;
};

const safetyNote =
  'No media was downloaded, extracted, uploaded, or posted. Use manual approval and only use owned, licensed, or legitimate fair-use clips.';

const hookPatterns: Array<[RegExp, number, string]> = [
  [/\b(mistake|wrong|avoid|stop|do not|don't|never)\b/i, 2.1, 'High hook language: mistake or reversal framing'],
  [/\b(secret|surprising|unexpected|nobody|hidden|shocking|weird)\b/i, 1.8, 'Curiosity gap or surprise language'],
  [/\b(contrarian|opposite|myth|actually|instead)\b/i, 1.5, 'Contrarian framing'],
  [/\b(\d+|one|two|three|four|five|seven|ten|steps|fixes|rules|checklist)\b/i, 1.6, 'Numbered or checklist structure'],
  [/\b(saved|save|faster|hours|money|expensive|cheap|growth|double|beat)\b/i, 1.5, 'Clear payoff or outcome'],
  [/\b(lesson|learned|here'?s why|because|so what|takeaway)\b/i, 1.3, 'Payoff or lesson marker'],
  [/\b(angry|love|hate|fear|painful|excited|embarrassing|amazing)\b/i, 1.1, 'Emotional language']
];

const financialPattern = /\b(stock|stocks|invest|investment|trading|trade|portfolio|retirement|crypto|double next month|financial advice)\b/i;
const medicalPattern = /\b(cure|diagnose|treatment|symptom|disease|medical|doctor|dosage|supplement)\b/i;

function clamp(value: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Number(value.toFixed(1));
}

function normalizeSegments(segments: TranscriptSegment[] | undefined): TranscriptSegment[] {
  return (segments ?? [])
    .filter(
      (segment) =>
        Number.isFinite(segment.startSeconds) &&
        Number.isFinite(segment.endSeconds) &&
        segment.endSeconds > segment.startSeconds &&
        segment.text.trim().length > 0
    )
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

function signalScore(signals: ViralSignal[] | undefined): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const score = (signals ?? []).reduce((total, signal) => {
    if (!Number.isFinite(signal.value) || !Number.isFinite(signal.weight)) return total;
    const metric = signal.metric.toLowerCase();
    let normalized = 0;
    if (metric.includes('engagement')) normalized = signal.value >= 1 ? Math.min(2, signal.value / 10) : signal.value * 10;
    else if (metric.includes('view')) normalized = Math.min(2, Math.log10(Math.max(1, signal.value)) / 3);
    else if (metric.includes('share') || metric.includes('save') || metric.includes('comment')) normalized = Math.min(2, Math.log10(Math.max(1, signal.value)) / 2.5);
    else normalized = Math.min(1.5, Math.abs(signal.value) / 10);
    if (normalized > 0.4) reasons.push(`Social signal: ${signal.reason}`);
    return total + normalized * clamp(signal.weight, 0, 1.5);
  }, 0);
  return { score: Math.min(2.5, score), reasons };
}

function recencyScore(video: VideoSource, now: Date): { score: number; reason?: string } {
  if (!video.publishedAt) return { score: 0 };
  const published = new Date(video.publishedAt);
  if (Number.isNaN(published.getTime())) return { score: 0 };
  const ageDays = Math.max(0, (now.getTime() - published.getTime()) / 86_400_000);
  if (ageDays <= 7) return { score: 1.3, reason: 'Recent source published within 7 days' };
  if (ageDays <= 30) return { score: 0.8, reason: 'Recent source published within 30 days' };
  if (ageDays <= 90) return { score: 0.3, reason: 'Moderately recent source' };
  return { score: 0 };
}

function durationScore(duration: number): { score: number; reason: string } {
  if (duration >= 20 && duration <= 60) return { score: 1.6, reason: 'Retention-friendly 20-60 second length' };
  if (duration > 60 && duration <= 90) return { score: 0.9, reason: 'Usable short-form length under 90 seconds' };
  if (duration >= 12 && duration < 20) return { score: -0.4, reason: 'Short context window under 20 seconds' };
  return { score: -1.2, reason: 'Weak short-form length fit' };
}

function textScore(text: string): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const score = hookPatterns.reduce((total, [pattern, weight, reason]) => {
    if (!pattern.test(text)) return total;
    reasons.push(reason);
    return total + weight;
  }, 0);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const density = Math.min(1.2, wordCount / 55);
  return { score: score + density, reasons };
}

function riskFlags(video: VideoSource, text: string, duration: number): string[] {
  const flags = new Set<string>();
  if (video.platform.toLowerCase() !== 'owned' || video.url) flags.add('copyright-review-required');
  if (financialPattern.test(text)) flags.add('financial-claim-review');
  if (medicalPattern.test(text)) flags.add('medical-claim-review');
  if (duration < 20 || text.trim().split(/\s+/).length < 12) flags.add('low-confidence-short-segment');
  return [...flags];
}

function titleFromText(text: string): string {
  const firstSentence = text.replace(/\s+/g, ' ').trim().split(/[.!?]/)[0] ?? text;
  if (firstSentence.length <= 64) return firstSentence;
  return `${firstSentence.slice(0, 61).trim()}...`;
}

function buildWindows(
  video: VideoSource,
  segments: TranscriptSegment[],
  options: Required<Pick<ClipAnalyzerOptions, 'minSeconds' | 'maxSeconds'>> & Pick<ClipAnalyzerOptions, 'now'>
): ClipCandidate[] {
  const { score: sourceSignalScore, reasons: signalReasons } = signalScore(video.signals);
  const { score: sourceRecencyScore, reason: recencyReason } = recencyScore(video, optionsNow(options));
  const candidates: ClipCandidate[] = [];

  for (let startIndex = 0; startIndex < segments.length; startIndex += 1) {
    let endIndex = startIndex;
    while (endIndex + 1 < segments.length && segments[endIndex + 1].endSeconds - segments[startIndex].startSeconds <= options.maxSeconds) {
      endIndex += 1;
      const duration = segments[endIndex].endSeconds - segments[startIndex].startSeconds;
      if (duration >= options.minSeconds) break;
    }

    const window = segments.slice(startIndex, endIndex + 1);
    if (window.length === 0) continue;
    const startSeconds = window[0].startSeconds;
    const endSeconds = window.at(-1)!.endSeconds;
    const duration = endSeconds - startSeconds;
    if (duration > options.maxSeconds) continue;

    const text = window.map((segment) => segment.text).join(' ');
    const textSignals = textScore(text);
    const length = durationScore(duration);
    const whyViral = [...textSignals.reasons, length.reason, ...signalReasons];
    if (recencyReason) whyViral.push(recencyReason);

    const score = clamp(3 + textSignals.score + length.score + sourceSignalScore + sourceRecencyScore);
    candidates.push({
      sourceId: video.id,
      startSeconds,
      endSeconds,
      title: titleFromText(text),
      hook: window[0].text.replace(/\s+/g, ' ').trim(),
      whyViral: whyViral.length ? whyViral : ['Standalone explainable moment with enough context'],
      score: round1(score),
      format: duration <= 60 ? 'vertical short with captions' : 'vertical short or cut-down highlight',
      reusePlan: 'Manually review rights, add source attribution, captions, jump cuts, and publish only after approval.',
      riskFlags: riskFlags(video, text, duration)
    });
  }

  return candidates;
}

function optionsNow(options: Pick<ClipAnalyzerOptions, 'now'>): Date {
  return options.now ?? new Date();
}

function defaulted(options: ClipAnalyzerOptions | undefined): Required<Pick<ClipAnalyzerOptions, 'minSeconds' | 'maxSeconds' | 'maxCandidates'>> & Pick<ClipAnalyzerOptions, 'now'> {
  return {
    now: options?.now,
    minSeconds: options?.minSeconds ?? 20,
    maxSeconds: options?.maxSeconds ?? 90,
    maxCandidates: options?.maxCandidates ?? 10
  };
}

export function analyzeVideoForClips(video: VideoSource, options?: ClipAnalyzerOptions): VideoClipAnalysisReport {
  const resolved = defaulted(options);
  const segments = normalizeSegments(video.transcriptSegments);
  const reportRiskFlags = new Set<string>();

  if (segments.length === 0) {
    reportRiskFlags.add('missing-transcript');
    return {
      source: video,
      generatedAt: optionsNow(resolved).toISOString(),
      safetyNote,
      riskFlags: [...reportRiskFlags],
      candidates: []
    };
  }

  const candidates = buildWindows(video, segments, resolved)
    .sort((a, b) => b.score - a.score || a.startSeconds - b.startSeconds)
    .slice(0, resolved.maxCandidates);

  for (const candidate of candidates) {
    for (const flag of candidate.riskFlags) reportRiskFlags.add(flag);
  }

  return {
    source: video,
    generatedAt: optionsNow(resolved).toISOString(),
    safetyNote,
    riskFlags: [...reportRiskFlags],
    candidates
  };
}

export function analyzeVideoBatchForClips(videos: VideoSource[], options?: ClipAnalyzerOptions): ClipOpportunityReport {
  const reports = videos.map((video) => analyzeVideoForClips(video, options));
  const candidates = reports
    .flatMap((report) => report.candidates)
    .sort((a, b) => b.score - a.score || a.sourceId.localeCompare(b.sourceId) || a.startSeconds - b.startSeconds)
    .slice(0, options?.maxCandidates ?? 10);

  return {
    generatedAt: optionsNow(options ?? {}).toISOString(),
    safetyNote,
    sourcesAnalyzed: videos.length,
    sourceReports: reports,
    candidates
  };
}
