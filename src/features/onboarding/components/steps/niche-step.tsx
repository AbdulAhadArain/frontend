'use client';

import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '../../types/onboarding';
import { NICHE_OPTIONS } from '../../types/onboarding';

export function NicheStep({ data, onUpdate }: OnboardingStepProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-heading text-lg font-bold text-foreground'>
          What&apos;s your niche?
        </h3>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          This helps us tailor analysis to your content type
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        {NICHE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate({ niche: opt.value })}
            className={cn(
              'rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-150',
              data.niche === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-transparent text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
