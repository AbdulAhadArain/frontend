import { Barlow, Barlow_Condensed, JetBrains_Mono } from 'next/font/google';

import { cn } from '@/lib/utils';

const fontSans = Barlow({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap'
});

const fontHeading = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
  display: 'swap'
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap'
});

export const fontVariables = cn(
  fontSans.variable,
  fontHeading.variable,
  fontMono.variable
);
