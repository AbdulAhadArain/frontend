'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { navItems, adminNavItem } from '@/config/nav-config';
import { useAuthStore } from '@/stores/auth.store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const allItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/dashboard'>
                <div className='bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-sm'>
                  <span className='font-heading text-sm font-bold'>CQ</span>
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-heading text-base font-bold'>
                    CloutIQ
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel className='mt-6 mb-2'>Navigation</SidebarGroupLabel>
          <SidebarMenu className='gap-1'>
            {allItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const isActive =
                pathname === item.url ||
                pathname.startsWith(`${item.url}/`);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className='py-2 px-3 text-sm font-medium'
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <>
            <Separator className='mb-2' />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size='lg' className='cursor-default'>
                  <div className='bg-accent text-accent-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-sm'>
                    <span className='font-heading text-xs font-bold'>
                      {user.name?.slice(0, 2).toUpperCase() || 'CQ'}
                    </span>
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate text-sm font-medium text-foreground'>
                      {user.name}
                    </span>
                    <div className='flex items-center gap-1.5'>
                      {user.plan === 'FREE' && (
                        <Badge
                          variant='outline'
                          className='border-score-mid/50 bg-score-mid/10 text-score-mid px-1 py-0 text-[10px]'
                        >
                          FREE
                        </Badge>
                      )}
                      {user.plan === 'CREATOR' && (
                        <Badge
                          variant='outline'
                          className='border-primary/50 bg-primary/10 text-primary px-1 py-0 text-[10px]'
                        >
                          CREATOR
                        </Badge>
                      )}
                      {user.role === 'ADMIN' && (
                        <Badge
                          variant='outline'
                          className='border-primary/50 bg-primary/10 text-primary px-1 py-0 text-[10px]'
                        >
                          ADMIN
                        </Badge>
                      )}
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
