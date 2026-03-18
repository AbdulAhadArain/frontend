'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconX, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import useMultistepForm from '@/hooks/use-multistep-form';
import apiClient from '@/lib/api-client';
import type { OnboardingData } from '../types/onboarding';
import { INITIAL_ONBOARDING_DATA } from '../types/onboarding';
import { PlatformStep } from './steps/platform-step';
import { NicheStep } from './steps/niche-step';
import { AudienceStep } from './steps/audience-step';
import { ViewCountStep } from './steps/view-count-step';
import { FrustrationStep } from './steps/frustration-step';

interface OnboardingModalProps {
  open: boolean;
  onClose?: () => void;
  initialData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => void;
}

const STEP_VALIDATION: ((data: OnboardingData) => boolean)[] = [
  (d) => !!d.platform,
  (d) => !!d.niche,
  (d) => !!d.audienceAgeRange && !!d.audienceRegion && !!d.audienceLanguage,
  (d) => !!d.averageViewCount,
  (d) => !!d.biggestFrustration
];

export function OnboardingModal({
  open,
  onClose,
  initialData,
  onComplete
}: OnboardingModalProps) {
  const [data, setData] = useState<OnboardingData>({
    ...INITIAL_ONBOARDING_DATA,
    ...initialData
  });
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  function handleUpdate(fields: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  const steps = useMemo(
    () => [
      <PlatformStep key='platform' data={data} onUpdate={handleUpdate} />,
      <NicheStep key='niche' data={data} onUpdate={handleUpdate} />,
      <AudienceStep key='audience' data={data} onUpdate={handleUpdate} />,
      <ViewCountStep key='viewcount' data={data} onUpdate={handleUpdate} />,
      <FrustrationStep key='frustration' data={data} onUpdate={handleUpdate} />
    ],
    [data]
  );

  const { currentStepIndex, step, isFirstStep, isLastStep, next, back } =
    useMultistepForm(steps);

  const isCurrentStepValid = STEP_VALIDATION[currentStepIndex]?.(data) ?? false;

  function handleNext() {
    if (isLastStep) {
      handleSubmit();
    } else {
      setDirection(1);
      next();
    }
  }

  function handleBack() {
    setDirection(-1);
    back();
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await apiClient.patch('/auth/onboarding', data);
      onComplete(data);
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Overlay */}
          <motion.div
            className='absolute inset-0 bg-black/60 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className='card-glow relative z-10 mx-4 flex w-full max-w-md flex-col overflow-hidden p-6 sm:mx-0 sm:p-8'
            style={{ maxHeight: '90vh' }}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {onClose && (
              <button
                onClick={onClose}
                className='absolute right-4 top-4 text-muted-foreground transition-colors duration-120 hover:text-foreground'
              >
                <IconX className='size-4' />
              </button>
            )}

            {/* Progress */}
            <div className='mb-6'>
              <p className='mb-2 font-mono text-[11px] text-muted-foreground'>
                Step {currentStepIndex + 1} of 5
              </p>
              <div className='flex gap-1.5'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className='h-1 flex-1 rounded-full transition-colors duration-200'
                    style={{
                      backgroundColor:
                        i <= currentStepIndex
                          ? 'var(--color-primary)'
                          : 'var(--color-muted)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className='min-h-[240px] flex-1 overflow-y-auto'>
              <AnimatePresence mode='wait' initial={false}>
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {step}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className='mt-6 flex gap-3'>
              {!isFirstStep && (
                <Button
                  variant='outline'
                  onClick={handleBack}
                  disabled={submitting}
                >
                  Back
                </Button>
              )}
              <Button
                className='flex-1'
                onClick={handleNext}
                disabled={!isCurrentStepValid || submitting}
              >
                {submitting ? (
                  <>
                    <IconLoader2 className='mr-2 size-4 animate-spin' />
                    Saving...
                  </>
                ) : isLastStep ? (
                  'Complete'
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
