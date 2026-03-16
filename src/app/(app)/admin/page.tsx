'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  IconUsers,
  IconTrendingUp,
  IconCrown,
  IconLoader2,
  IconRefresh
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef
} from '@tanstack/react-table';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import apiClient from '@/lib/api-client';
import type { User, ApiErrorResponse } from '@/types/auth';

interface AdminStats {
  totalUsers: number;
  newThisMonth: number;
  freePlan: number;
  creatorPlan: number;
  analysesToday: number;
  analysesThisWeek: number;
  analysesThisMonth: number;
}

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className='flex items-center gap-4 rounded-[4px] border border-border bg-card p-4 transition-colors duration-150'>
      <Icon className='size-8 text-muted-foreground' />
      <div>
        <p className='font-heading text-2xl font-bold text-foreground'>
          {value}
        </p>
        <p className='text-xs text-muted-foreground'>{label}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await apiClient.get('/users');

      // Backend returns { results: User[], totalCount: number }
      // NOT the standard { message, data } envelope
      const resData = usersRes.data?.data || usersRes.data;
      const userList: User[] = resData?.results || resData || [];
      setUsers(userList);

      // Compute stats from user list
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const newThisMonth = userList.filter((u) => {
        const d = new Date(u.createdAt);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length;
      const regularUsers = userList.filter((u) => u.role !== 'ADMIN');

      setStats({
        totalUsers: userList.length,
        newThisMonth,
        freePlan: regularUsers.filter((u) => u.plan === 'FREE').length,
        creatorPlan: regularUsers.filter((u) => u.plan === 'CREATOR').length,
        analysesToday: 0,
        analysesThisWeek: 0,
        analysesThisMonth: regularUsers.reduce(
          (sum, u) => sum + (u.analysesThisMonth || 0),
          0
        )
      });
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to load admin data';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handlePlanChange(userId: string, plan: 'FREE' | 'CREATOR') {
    setUpdatingUser(userId);
    try {
      await apiClient.patch(`/users/${userId}`, { plan });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan } : u))
      );
      toast.success('Plan updated');
    } catch (error) {
      const msg =
        (error as AxiosError<ApiErrorResponse>).response?.data?.message?.[0] ||
        'Failed to update plan';
      toast.error(msg);
    } finally {
      setUpdatingUser(null);
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className='text-sm text-foreground'>{row.original.name}</span>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground'>
          {row.original.email}
        </span>
      )
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge
          variant='outline'
          className={
            row.original.role === 'ADMIN'
              ? 'border-primary text-primary'
              : 'border-border text-muted-foreground'
          }
        >
          {row.original.role}
        </Badge>
      )
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const user = row.original;
        if (user.role === 'ADMIN') {
          return (
            <span className='text-xs text-muted-foreground'>N/A</span>
          );
        }
        return (
          <Select
            value={user.plan || 'FREE'}
            onValueChange={(val) =>
              handlePlanChange(user.id, val as 'FREE' | 'CREATOR')
            }
            disabled={updatingUser === user.id}
          >
            <SelectTrigger className='h-7 w-24 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='FREE'>FREE</SelectItem>
              <SelectItem value='CREATOR'>CREATOR</SelectItem>
            </SelectContent>
          </Select>
        );
      }
    },
    {
      accessorKey: 'analysesThisMonth',
      header: 'Analyses',
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground'>
          {row.original.analysesThisMonth}
        </span>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => (
        <span className='font-mono text-xs text-muted-foreground'>
          {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
        </span>
      )
    }
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (loading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <IconLoader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='flex-1 p-6 md:p-8'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='font-heading text-2xl font-bold text-foreground'>
          Admin Dashboard
        </h1>
        <Button variant='outline' size='sm' onClick={fetchData}>
          <IconRefresh className='mr-1 size-3.5' />
          Refresh
        </Button>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            label='Total Users'
            value={stats.totalUsers}
            icon={IconUsers}
          />
          <StatCard
            label='New This Month'
            value={stats.newThisMonth}
            icon={IconTrendingUp}
          />
          <StatCard
            label='Creator Plans'
            value={stats.creatorPlan}
            icon={IconCrown}
          />
          <StatCard
            label='Analyses This Month'
            value={stats.analysesThisMonth}
            icon={IconTrendingUp}
          />
        </div>
      )}

      {/* Users table */}
      <div className='overflow-hidden rounded-[4px] border border-border bg-card'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className='border-b border-border bg-muted/50'>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left text-xs font-medium text-muted-foreground'
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-4 py-8 text-center text-muted-foreground'
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className='border-b border-border last:border-0'
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className='px-4 py-3'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
