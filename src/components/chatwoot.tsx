'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

declare global {
  interface Window {
    chatwootSDK: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot: {
      setUser: (id: string, data: { name: string; email: string }) => void;
      toggleBubbleVisibility: (visibility: string) => void;
    };
  }
}

const AUTH_PAGES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

export function ChatwootWidget() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  // Load Chatwoot script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `${process.env.NEXT_PUBLIC_CHATWOOT_URL}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_TOKEN!,
        baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_URL!
      });
    };

    return () => {
      script.remove();
    };
  }, []);

  // Identify logged-in user to Chatwoot
  useEffect(() => {
    if (user && window.$chatwoot) {
      window.$chatwoot.setUser(user.id, {
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  // Hide widget on auth pages
  useEffect(() => {
    if (window.$chatwoot) {
      if (AUTH_PAGES.includes(pathname)) {
        window.$chatwoot.toggleBubbleVisibility('hide');
      } else {
        window.$chatwoot.toggleBubbleVisibility('show');
      }
    }
  }, [pathname]);

  return null;
}
