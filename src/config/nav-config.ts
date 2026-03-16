import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    shortcut: ['d', 'd'],
    isActive: false,
    items: []
  },
  {
    title: 'History',
    url: '/history',
    icon: 'post',
    shortcut: ['h', 'h'],
    isActive: false,
    items: []
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: 'settings',
    shortcut: ['s', 's'],
    isActive: false,
    items: []
  }
];

export const adminNavItem: NavItem = {
  title: 'Admin',
  url: '/admin',
  icon: 'user2',
  shortcut: ['a', 'a'],
  isActive: false,
  items: []
};
