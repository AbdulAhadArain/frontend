'use client';

import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '../../types/onboarding';
import { PLATFORM_OPTIONS } from '../../types/onboarding';

export function PlatformStep({ data, onUpdate }: OnboardingStepProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-heading text-lg font-bold text-foreground'>
          What&apos;s your main platform?
        </h3>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          Pick the platform you post on the most
        </p>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        {PLATFORM_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate({ platform: opt.value })}
            className={cn(
              'flex flex-col items-center gap-2 rounded-[6px] border p-4 transition-all duration-150',
              data.platform === opt.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
            )}
          >
            <span className='text-2xl'>{opt.icon}</span>
            <span className='text-[13px] font-medium'>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
