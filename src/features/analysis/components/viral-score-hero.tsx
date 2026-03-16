'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect } from 'react';
import { getScoreColor } from '@/lib/score-utils';

interface ViralScoreHeroProps {
  score: number;
}

function getInterpretation(score: number): string {
  if (score >= 90) return 'Exceptional \u00B7 Top 1% content';
  if (score >= 70) return 'Strong \u00B7 Will perform well';
  if (score >= 50) return 'Average \u00B7 Needs improvement';
  if (score >= 30) return 'Weak \u00B7 Significant issues';
  return 'Poor \u00B7 Fundamental problems';
}

export function ViralScoreHero({ score }: ViralScoreHeroProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const color = getScoreColor(score);

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1.5,
      ease: 'easeOut'
    });
    return controls.stop;
  }, [count, score]);

  return (
    <div
      className='relative py-12 text-center md:py-16'
      style={{
        background: `radial-gradient(ellipse 70% 50% at 50% 40%, color-mix(in srgb, ${color} 6%, transparent) 0%, transparent 70%)`
      }}
    >
      <motion.span
        className='block font-heading text-[7rem] font-bold leading-none tracking-tight md:text-[10rem]'
        style={{
          color,
          letterSpacing: '-0.02em',
          filter: `drop-shadow(0 0 30px color-mix(in srgb, ${color} 35%, transparent))`
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {rounded}
      </motion.span>

      <span className='mt-2 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground'>
        Viral Probability Score
      </span>

      <span
        className='mt-2 block text-[13px]'
        style={{ color, opacity: 0.8 }}
      >
        {getInterpretation(score)}
      </span>

      <div className='mx-auto mt-6 max-w-[120px] border-b border-border' />
    </div>
  );
}
