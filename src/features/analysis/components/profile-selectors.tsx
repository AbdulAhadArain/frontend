// src/features/analysis/components/profile-selectors.tsx
'use client';

import Link from 'next/link';
import { IconRotateClockwise2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  PLATFORM_OPTIONS,
  NICHE_OPTIONS,
  AGE_RANGE_OPTIONS,
  REGION_OPTIONS,
  VIEW_COUNT_OPTIONS
} from '@/features/onboarding/types/onboarding';
import type {
  ProfileBaseline,
  ProfileDraft,
  ProfileField
} from '../types/profile-override';

interface ProfileSelectorsProps {
  baseline: ProfileBaseline;
  draft: ProfileDraft;
  touched: Set<ProfileField>;
  onChange: (field: ProfileField, value: string) => void;
  onReset: () => void;
}

type OptionList = readonly { readonly value: string; readonly label: string }[];

interface FieldConfig {
  field: ProfileField;
  label: string;
  options: OptionList;
}

const FIELDS: FieldConfig[] = [
  { field: 'platform', label: 'Platform', options: PLATFORM_OPTIONS },
  { field: 'niche', label: 'Niche', options: NICHE_OPTIONS },
  { field: 'audienceAgeRange', label: 'Audience age', options: AGE_RANGE_OPTIONS },
  { field: 'audienceRegion', label: 'Audience region', options: REGION_OPTIONS },
  { field: 'averageViewCount', label: 'Average views', options: VIEW_COUNT_OPTIONS }
];

export function ProfileSelectors({
  draft,
  touched,
  onChange,
  onReset
}: ProfileSelectorsProps) {
  const hasEdits = touched.size > 0;

  return (
    <div className='mt-4 rounded-[4px] border border-border bg-[rgba(13,17,23,0.6)] p-3.5'>
      <div className='mb-3 flex items-center justify-between'>
        <span className='font-mono text-[11px] text-muted-foreground'>
          Customize for this run
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          disabled={!hasEdits}
          className='h-7 gap-1.5 px-2 text-[11px]'
        >
          <IconRotateClockwise2 className='size-3.5' />
          Reset
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-wrap'>
        {FIELDS.map(({ field, label, options }) => {
          const isTouched = touched.has(field);
          const value = draft[field];
          return (
            <div key={field} className='flex flex-col gap-1 md:min-w-[140px] md:flex-1'>
              <label className='flex items-center font-mono text-[11px] text-muted-foreground'>
                {isTouched && (
                  <span
                    aria-hidden
                    className='mr-1.5 inline-block size-1.5 rounded-full bg-primary'
                  />
                )}
                {label}
              </label>
              <Select
                value={value ?? undefined}
                onValueChange={(v) => onChange(field, v)}
              >
                <SelectTrigger className='h-9 text-[13px]'>
                  <SelectValue placeholder='Select…' />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <p className='mt-3 text-[11px] text-muted-foreground'>
        These changes apply only to this run. Update your saved profile in{' '}
        <Link href='/settings' className='text-primary hover:underline'>
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
