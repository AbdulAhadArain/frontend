'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!item.access) return true;
      return true;
    });
  }, [items]);

  return filteredItems;
}
