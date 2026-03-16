export interface ScoreWithExplanation {
  score: number;
  explanation: string;
}

export interface First5Seconds {
  openerType:
    | 'question'
    | 'statement'
    | 'shock'
    | 'statistic'
    | 'story'
    | 'challenge'
    | 'other';
  hookQuality: string;
  alternativeHooks: string[];
}

export interface RetentionPrediction {
  timestamp: string;
  retentionPercent: number;
  reasoning: string;
  fix: string;
}

export interface RetentionCurve {
  predictions: RetentionPrediction[];
  averageRetention: number;
}

export interface ScriptRewrite {
  rewrittenScript: string;
  patternInterrupts: string[];
  bRollSuggestions: string[];
}

export interface OnScreenText {
  text: string;
  timing: string;
}

export interface DistributionPack {
  captionVariants: string[];
  hashtags: string[];
  thumbnailConcept: string;
  bRollShotList: string[];
  onScreenText: OnScreenText[];
  trendingSoundSuggestions: string[];
}

export interface AnalysisResult {
  hookStrength: ScoreWithExplanation;
  emotionalIntensity: ScoreWithExplanation;
  curiosityGap: ScoreWithExplanation;
  clarity: ScoreWithExplanation;
  viralProbability: ScoreWithExplanation;
  first5Seconds: First5Seconds;
  retentionCurve: RetentionCurve;
  scriptRewrite: ScriptRewrite;
  distributionPack: DistributionPack;
}

export interface Analysis {
  id: string;
  viralScore: number;
  result: AnalysisResult;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  text: string;
  language: string;
  duration: number;
  segments: TranscriptSegment[];
}

export interface TranscriptionResponse {
  transcriptionId: string;
  transcript: Transcript;
  analysis?: Analysis;
}

export type AnalysisLanguage = 'en' | 'ar' | 'hi' | 'es';

export interface AnalyzeRequest {
  scriptText: string;
  language: AnalysisLanguage;
}
