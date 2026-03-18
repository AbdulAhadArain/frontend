'use client';

import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '../../types/onboarding';
import { VIEW_COUNT_OPTIONS } from '../../types/onboarding';

export function ViewCountStep({ data, onUpdate }: OnboardingStepProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-heading text-lg font-bold text-foreground'>
          What&apos;s your average view count?
        </h3>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          Your best estimate per video
        </p>
      </div>
      <div className='flex flex-col gap-2'>
        {VIEW_COUNT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate({ averageViewCount: opt.value })}
            className={cn(
              'rounded-[6px] border px-4 py-3 text-left text-[13px] font-medium transition-all duration-150',
              data.averageViewCount === opt.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
