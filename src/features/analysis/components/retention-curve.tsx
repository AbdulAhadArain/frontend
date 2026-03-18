'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { getScoreColor } from '@/lib/score-utils';
import type { RetentionCurve as RetentionCurveType } from '@/types/analysis';

interface RetentionCurveProps {
  data: RetentionCurveType;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { timestamp: string; retentionPercent: number; reasoning: string; fix: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className='card-glow max-w-[calc(100vw-3rem)] p-3 sm:max-w-xs'
    >
      <div className='mb-1 flex items-center gap-2'>
        <span className='font-mono text-[10px] text-muted-foreground'>
          {d.timestamp}
        </span>
        <span
          className='font-mono text-sm font-bold'
          style={{ color: getScoreColor(d.retentionPercent) }}
        >
          {d.retentionPercent}%
        </span>
      </div>
      <p className='text-[13px] leading-relaxed text-foreground'>{d.reasoning}</p>
      {d.fix && (
        <p className='mt-1 text-[13px] text-primary'>Fix: {d.fix}</p>
      )}
    </div>
  );
}

export function RetentionCurve({ data }: RetentionCurveProps) {
  return (
    <div className='card-glow p-4 sm:p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='section-title font-heading text-lg font-semibold tracking-[0.01em] text-foreground'>
          Retention Curve
        </h3>
        <Badge
          variant='outline'
          className='font-mono text-[10px]'
          style={{ color: getScoreColor(data.averageRetention) }}
        >
          Avg: {data.averageRetention}%
        </Badge>
      </div>

      <div className='h-48 sm:h-56 md:h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data.predictions}>
            <XAxis
              dataKey='timestamp'
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type='monotone'
              dataKey='retentionPercent'
              stroke='var(--primary)'
              strokeWidth={2}
              dot={{
                r: 4,
                fill: 'var(--card)',
                stroke: 'var(--primary)',
                strokeWidth: 2
              }}
              activeDot={{
                r: 6,
                fill: 'var(--primary)',
                stroke: 'var(--card)',
                strokeWidth: 2,
                style: { filter: 'drop-shadow(0 0 6px var(--primary))' }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
