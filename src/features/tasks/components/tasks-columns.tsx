import { type ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { labels, priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const statusTone: Record<string, string> = {
  backlog:
    'border-slate-300/70 bg-slate-100/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
  todo: 'border-blue-300/70 bg-blue-100/70 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'in progress':
    'border-cyan-300/70 bg-cyan-100/70 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  done: 'border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  canceled:
    'border-zinc-300/70 bg-zinc-100/70 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300',
}

const priorityTone: Record<string, string> = {
  low: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-sky-600 dark:text-sky-400',
  high: 'text-amber-600 dark:text-amber-400',
  critical: 'text-rose-600 dark:text-rose-400',
}

export const tasksColumns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Task' />
    ),
    cell: ({ row }) => (
      <div className='w-[110px] font-mono text-xs font-semibold tracking-wide text-muted-foreground'>
        {row.getValue('id')}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    meta: {
      className: 'max-w-0 w-[36%]',
      tdClassName: 'ps-4 py-4',
    },
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className='min-w-0 space-y-1'>
          <div className='flex items-center gap-2'>
            {label && (
              <Badge variant='outline' className='rounded-md px-2 py-0.5'>
                {label.label}
              </Badge>
            )}
            <span className='truncate text-sm font-semibold'>
              {row.getValue('title')}
            </span>
          </div>
          <p className='truncate text-xs text-muted-foreground'>
            {row.original.description ?? 'No additional notes'}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-4' },
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue('status')
      )

      if (!status) {
        return null
      }

      return (
        <div className='flex w-[130px] items-center gap-2'>
          {status.icon && (
            <status.icon className='size-4 text-muted-foreground/80' />
          )}
          <span
            className={cn(
              'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
              statusTone[status.value]
            )}
          >
            {status.label}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Priority' />
    ),
    meta: { className: 'ps-1', tdClassName: 'ps-3' },
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue('priority')
      )

      if (!priority) {
        return null
      }

      return (
        <div className='flex items-center gap-2 text-sm font-semibold'>
          {priority.icon && (
            <priority.icon
              className={cn('size-4 text-muted-foreground', priorityTone[priority.value])}
            />
          )}
          <span className={cn(priorityTone[priority.value])}>{priority.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'assignee',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Assignee' />
    ),
    cell: ({ row }) => (
      <div className='truncate text-sm font-medium'>{row.getValue('assignee')}</div>
    ),
  },
  {
    id: 'dueDate',
    accessorFn: (row) => row.dueDate.getTime(),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Due Date' />
    ),
    cell: ({ row }) => {
      const dueDate = row.original.dueDate
      const isOverdue =
        dueDate.getTime() < Date.now() &&
        !['done', 'canceled'].includes(row.original.status)

      return (
        <div className='space-y-0.5'>
          <p className={cn('text-sm font-medium', isOverdue && 'text-destructive')}>
            {format(dueDate, 'MMM d, yyyy')}
          </p>
          <p className='text-xs text-muted-foreground'>
            {formatDistanceToNowStrict(dueDate, { addSuffix: true })}
          </p>
        </div>
      )
    },
  },
  {
    id: 'actions',
    meta: {
      className: 'w-[50px]',
      tdClassName: 'text-end',
    },
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
