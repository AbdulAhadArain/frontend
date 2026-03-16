'use client';

import { motion } from 'motion/react';

const decorativeScores = [
  { label: 'HOOK', value: 92 },
  { label: 'EMOTION', value: 67 },
  { label: 'CLARITY', value: 85 },
  { label: 'VIRAL', value: 78 },
  { label: 'RETAIN', value: 54 }
];

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--score-high)';
  if (score >= 40) return 'var(--score-mid)';
  return 'var(--score-low)';
}

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen'>
      {/* Left panel — branding + decorative scores */}
      <div className='bg-card relative hidden w-1/2 flex-col justify-between border-r border-border p-12 lg:flex'>
        <div>
          <h1 className='font-heading text-3xl font-bold text-foreground'>
            CloutIQ
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            AI-powered script analysis for short-form creators
          </p>
        </div>

        {/* Decorative animated scores */}
        <div className='flex flex-col gap-4'>
          {decorativeScores.map((item, i) => (
            <div key={item.label} className='flex items-center gap-4'>
              <span className='w-20 font-mono text-xs text-muted-foreground'>
                {item.label}
              </span>
              <div className='relative h-2 flex-1 overflow-hidden rounded-sm bg-border'>
                <motion.div
                  className='absolute inset-y-0 left-0 rounded-sm'
                  style={{ backgroundColor: getScoreColor(item.value) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{
                    duration: 1.2,
                    delay: 0.3 + i * 0.15,
                    ease: 'easeOut'
                  }}
                />
              </div>
              <motion.span
                className='w-10 text-right font-heading text-lg font-bold'
                style={{ color: getScoreColor(item.value) }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.15 }}
              >
                {item.value}
              </motion.span>
            </div>
          ))}
        </div>

        <p className='text-xs text-muted-foreground'>
          Analyse scripts. Predict virality. Create better content.
        </p>
      </div>

      {/* Right panel — form */}
      <div className='flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12'>
        <div className='w-full max-w-[28rem]'>{children}</div>
      </div>
    </div>
  );
}
