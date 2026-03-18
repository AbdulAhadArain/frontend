'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandYoutube,
  IconArrowRight,
  IconLoader2,
  IconSparkles,
  IconChartBar,
  IconTarget,
  IconPencil
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api-client';
import type { ApiErrorResponse } from '@/types/auth';

const features = [
  {
    icon: IconSparkles,
    title: 'Viral Score',
    description:
      'AI-powered scoring from 0-100 predicting your content virality.'
  },
  {
    icon: IconTarget,
    title: 'Hook Analysis',
    description:
      'Know if your first 5 seconds will stop the scroll or get skipped.'
  },
  {
    icon: IconChartBar,
    title: 'Retention Curve',
    description:
      'Predict exactly where viewers drop off with fix suggestions.'
  },
  {
    icon: IconPencil,
    title: 'Script Rewrite',
    description:
      'Get an optimized rewrite with pattern interrupts and B-roll cues.'
  }
];

const exampleScores = [
  { label: 'HOOK STRENGTH', score: 92 },
  { label: 'EMOTIONAL', score: 67 },
  { label: 'CURIOSITY GAP', score: 85 },
  { label: 'CLARITY', score: 78 },
  { label: 'VIRAL PROB.', score: 54 }
];

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--score-high)';
  if (score >= 40) return 'var(--score-mid)';
  return 'var(--score-low)';
}

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await apiClient.post('/api/waitlist', { email });
      setJoined(true);
      toast.success('You\'re on the list!');
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Nav */}
      <nav className='border-b border-border'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
          <span className='font-heading text-xl font-bold text-foreground'>
            CloutIQ
          </span>
          <Link href='/login'>
            <Button variant='outline' size='sm'>
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className='mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24'>
        <div className='grid items-center gap-8 md:grid-cols-2 md:gap-12'>
          <div>
            <div className='mb-4 flex items-center gap-2'>
              <IconBrandTiktok className='size-5 text-muted-foreground' />
              <IconBrandInstagram className='size-5 text-muted-foreground' />
              <IconBrandYoutube className='size-5 text-muted-foreground' />
            </div>
            <h1 className='font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl'>
              Know if your script
              <br />
              will go viral —
              <br />
              <span className='text-primary'>before you post.</span>
            </h1>
            <p className='mt-4 max-w-lg text-muted-foreground'>
              CloutIQ uses AI to analyze your short-form video scripts in
              seconds. Get a viral score, hook analysis, retention predictions,
              and an optimized rewrite.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link href='/register'>
                <Button size='lg' className='gap-2'>
                  Sign Up Free
                  <IconArrowRight className='size-4' />
                </Button>
              </Link>
              <Link href='/login'>
                <Button variant='outline' size='lg'>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Example scores */}
          <motion.div
            className='card-glow p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className='mb-4 flex items-center justify-between'>
              <span className='font-mono text-xs text-muted-foreground'>
                ANALYSIS PREVIEW
              </span>
              <span
                className='font-heading text-3xl font-bold'
                style={{ color: getScoreColor(74) }}
              >
                74
              </span>
            </div>
            <div className='flex flex-col gap-3'>
              {exampleScores.map((item, i) => (
                <div key={item.label} className='flex items-center gap-3'>
                  <span className='w-20 font-mono text-xs text-muted-foreground sm:w-28'>
                    {item.label}
                  </span>
                  <div className='relative h-2 flex-1 overflow-hidden rounded-sm bg-border'>
                    <motion.div
                      className='absolute inset-y-0 left-0 rounded-sm'
                      style={{ backgroundColor: getScoreColor(item.score) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{
                        duration: 1,
                        delay: 0.3 + i * 0.1,
                        ease: 'easeOut'
                      }}
                    />
                  </div>
                  <motion.span
                    className='w-8 text-right font-heading text-sm font-bold'
                    style={{ color: getScoreColor(item.score) }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  >
                    {item.score}
                  </motion.span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className='border-t border-border bg-card/50'>
        <div className='mx-auto max-w-6xl px-6 py-16'>
          <h2 className='mb-8 text-center font-heading text-2xl font-bold text-foreground'>
            Everything you need to create viral content
          </h2>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {features.map((f) => (
              <div key={f.title} className='card-glow p-5'>
                <f.icon className='mb-3 size-6 text-primary' />
                <h3 className='font-heading text-sm font-bold text-foreground'>
                  {f.title}
                </h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist / CTA */}
      <section className='border-t border-border'>
        <div className='mx-auto max-w-xl px-6 py-16 text-center'>
          <h2 className='font-heading text-2xl font-bold text-foreground'>
            Join the waitlist
          </h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Get early access and be the first to try CloutIQ.
          </p>

          {joined ? (
            <p className='mt-6 font-mono text-sm text-score-high'>
              You&apos;re on the list. We&apos;ll be in touch!
            </p>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className='mt-6 flex gap-2'
            >
              <Input
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className='flex-1'
              />
              <Button type='submit' disabled={submitting}>
                {submitting ? (
                  <IconLoader2 className='size-4 animate-spin' />
                ) : (
                  'Join'
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-border'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-6'>
          <span className='font-heading text-sm font-bold text-muted-foreground'>
            CloutIQ
          </span>
          <span className='text-xs text-muted-foreground'>
            &copy; {new Date().getFullYear()} CloutIQ. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
