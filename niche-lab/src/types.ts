export type NicheInput = {
  name: string;
  audience: string;
  contentFormats: string[];
  monetizationPaths: string[];
  constraints?: string[];
  seedTopics: string[];
};

export type ExperimentConfig = {
  experimentName: string;
  niches: NicheInput[];
};

export type TopicIdea = {
  topic: string;
  angle: string;
  whyNow: string;
};

export type ScriptDraft = {
  topic: string;
  hook: string;
  beats: string[];
  cta: string;
};

export type ThumbnailPrompt = {
  topic: string;
  prompt: string;
  textOverlay: string;
};

export type SeoPackage = {
  topic: string;
  title: string;
  description: string;
  tags: string[];
};

export type CalendarItem = {
  day: number;
  format: string;
  topic: string;
  publishWindow: string;
};

export type ScoreBreakdown = {
  monetization: number;
  audienceClarity: number;
  contentSupply: number;
  productionComplexity: number;
  differentiation: number;
  safetyCompliance: number;
};

export type NicheReport = {
  niche: NicheInput;
  topics: TopicIdea[];
  scripts: ScriptDraft[];
  thumbnails: ThumbnailPrompt[];
  seo: SeoPackage[];
  calendar: CalendarItem[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  recommendation: string;
  risks: string[];
};

export type ExperimentReport = {
  experimentName: string;
  generatedAt: string;
  rankedReports: NicheReport[];
};

export type TranscriptSegment = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type ViralSignal = {
  metric: string;
  value: number;
  weight: number;
  reason: string;
};

export type VideoSource = {
  id: string;
  title: string;
  platform: string;
  url?: string;
  creator?: string;
  durationSeconds: number;
  publishedAt?: string;
  transcriptSegments?: TranscriptSegment[];
  signals?: ViralSignal[];
};

export type ClipCandidate = {
  sourceId: string;
  startSeconds: number;
  endSeconds: number;
  title: string;
  hook: string;
  whyViral: string[];
  score: number;
  format: string;
  reusePlan: string;
  riskFlags: string[];
};

export type VideoClipAnalysisReport = {
  source: VideoSource;
  generatedAt: string;
  safetyNote: string;
  riskFlags: string[];
  candidates: ClipCandidate[];
};

export type ClipOpportunityReport = {
  generatedAt: string;
  safetyNote: string;
  sourcesAnalyzed: number;
  sourceReports: VideoClipAnalysisReport[];
  candidates: ClipCandidate[];
};

export type TrendItem = {
  id?: string;
  source: string;
  title: string;
  url?: string;
  topic: string;
  publishedAt?: string;
  observedAt?: string;
  velocity?: number;
  relevance?: number;
  contentSupply?: number;
  metrics?: Record<string, number>;
  evidence?: string;
};

export type RankedTrend = {
  topic: string;
  score: number;
  recencyScore: number;
  velocityScore: number;
  platformSpread: number;
  relevanceScore: number;
  contentSupplyScore: number;
  sources: string[];
  itemCount: number;
  evidence: string[];
  recommendation: string;
};

export type TrendResearchReport = {
  niche: string;
  generatedAt: string;
  itemCount: number;
  sourceCoverage: string[];
  rankedTrends: RankedTrend[];
  researchAngles: string[];
  safetyNote: string;
};

export type TrendWatchConfig = {
  niche: string;
  audience: string;
  seedKeywords: string[];
  sources?: TrendSourceConfig[];
};

export type TrendSourceConfig = {
  type: 'mock';
  label: string;
  items?: TrendSourceItem[];
};

export type TrendSourceItem = {
  keyword: string;
  momentum: number;
  evidence: string;
};

export type TrendingKeyword = {
  keyword: string;
  urgency: number;
  evidence: string[];
  sourceLabels: string[];
};

export type ContentAngle = {
  keyword: string;
  angle: string;
  urgency: number;
  evidenceLabel: string;
};

export type RecommendedExperiment = {
  title: string;
  format: string;
  hypothesis: string;
  sourceLabel: string;
};

export type TrendBrief = {
  niche: string;
  audience: string;
  generatedAt: string;
  trendingKeywords: TrendingKeyword[];
  contentAngles: ContentAngle[];
  recommendedExperiments: RecommendedExperiment[];
};
