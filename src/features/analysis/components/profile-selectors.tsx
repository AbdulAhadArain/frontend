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
    <div className='mt-2 rounded-[4px] border border-border bg-[rgba(13,17,23,0.6)] p-2.5'>
      <div className='mb-1.5 flex items-center justify-between'>
        <span className='font-mono text-[11px] text-muted-foreground'>
          Customize for this run
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          disabled={!hasEdits}
          className='h-6 gap-1 px-1.5 text-[11px]'
        >
          <IconRotateClockwise2 className='size-3' />
          Reset
        </Button>
      </div>

      <div className='grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-5'>
        {FIELDS.map(({ field, label, options }) => {
          const isTouched = touched.has(field);
          const value = draft[field];
          return (
            <div key={field} className='flex min-w-0 flex-col gap-0.5'>
              <label className='flex items-center font-mono text-[11px] text-muted-foreground'>
                {isTouched && (
                  <span
                    aria-hidden
                    className='mr-1 inline-block size-1 rounded-full bg-primary'
                  />
                )}
                <span className='truncate'>{label}</span>
              </label>
              <Select
                value={value ?? undefined}
                onValueChange={(v) => onChange(field, v)}
              >
                <SelectTrigger className='h-8 w-full min-w-0 px-2 text-[12px]'>
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

      <p className='mt-1.5 text-[11px] text-muted-foreground'>
        These changes apply only to this run. Update in{' '}
        <Link href='/settings' className='text-primary hover:underline'>
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
