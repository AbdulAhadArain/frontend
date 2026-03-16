'use client';

import { motion } from 'motion/react';
import type { Analysis, AnalysisLanguage } from '@/types/analysis';
import { ViralScoreHero } from './viral-score-hero';
import { FiveDimensions } from './five-dimensions';
import { First5Seconds } from './first-5-seconds';
import { RetentionCurve } from './retention-curve';
import { ScriptRewrite } from './script-rewrite';
import { DistributionPack } from './distribution-pack';

interface AnalysisResultsProps {
  analysis: Analysis;
  scriptText: string;
  language: AnalysisLanguage;
}

export function AnalysisResults({
  analysis,
  scriptText,
  language
}: AnalysisResultsProps) {
  const r = analysis.result;
  const isRTL = language === 'ar';

  return (
    <motion.div
      className='flex flex-col gap-0'
      dir={isRTL ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Section 1 — Viral Score Hero (transparent bg) */}
      <div dir='ltr'>
        <ViralScoreHero score={analysis.viralScore} />
      </div>

      {/* Section 2 — Five Dimensions (card bg) */}
      <FiveDimensions
        hookStrength={r.hookStrength}
        emotionalIntensity={r.emotionalIntensity}
        curiosityGap={r.curiosityGap}
        clarity={r.clarity}
        viralProbability={r.viralProbability}
      />

      {/* Section 3 — First 5 Seconds (transparent bg) */}
      <First5Seconds data={r.first5Seconds} />

      {/* Section 4 — Retention Curve (card bg) */}
      <div dir='ltr'>
        <RetentionCurve data={r.retentionCurve} />
      </div>

      {/* Section 5 — Script Rewrite (transparent bg) */}
      <ScriptRewrite data={r.scriptRewrite} originalScript={scriptText} />

      {/* Section 6 — Distribution Pack (card bg) */}
      <DistributionPack data={r.distributionPack} />
    </motion.div>
  );
}
