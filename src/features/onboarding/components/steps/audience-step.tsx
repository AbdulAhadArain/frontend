'use client';

import { cn } from '@/lib/utils';
import type { OnboardingStepProps } from '../../types/onboarding';
import {
  AGE_RANGE_OPTIONS,
  REGION_OPTIONS,
  AUDIENCE_LANGUAGE_OPTIONS
} from '../../types/onboarding';

function PillSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string | null;
  onChange: (val: string) => void;
}) {
  return (
    <div className='space-y-2'>
      <p className='text-[12px] font-medium text-muted-foreground'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-150',
              value === opt.value
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

export function AudienceStep({ data, onUpdate }: OnboardingStepProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-heading text-lg font-bold text-foreground'>
          Tell us about your audience
        </h3>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          Select the best match for each category
        </p>
      </div>
      <div className='space-y-4'>
        <PillSelect
          label='Age range'
          options={AGE_RANGE_OPTIONS}
          value={data.audienceAgeRange}
          onChange={(val) => onUpdate({ audienceAgeRange: val })}
        />
        <PillSelect
          label='Region'
          options={REGION_OPTIONS}
          value={data.audienceRegion}
          onChange={(val) => onUpdate({ audienceRegion: val })}
        />
        <PillSelect
          label='Language'
          options={AUDIENCE_LANGUAGE_OPTIONS}
          value={data.audienceLanguage}
          onChange={(val) => onUpdate({ audienceLanguage: val })}
        />
      </div>
    </div>
  );
}
