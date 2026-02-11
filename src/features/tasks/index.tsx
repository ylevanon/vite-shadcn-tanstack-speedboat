import { useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListTodo,
  TrendingUp,
} from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { tasks } from './data/tasks'

const referenceNow = Date.now()

export function Tasks() {
  const metrics = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.status === 'done').length
    const inProgress = tasks.filter(
      (task) => task.status === 'in progress'
    ).length
    const highRisk = tasks.filter((task) =>
      ['critical', 'high'].includes(task.priority)
    ).length
    const overdue = tasks.filter(
      (task) =>
        task.dueDate.getTime() < referenceNow &&
        !['done', 'canceled'].includes(task.status)
    ).length

    return {
      total,
      completed,
      inProgress,
      highRisk,
      overdue,
      completionRate: Math.round((completed / total) * 100),
    }
  }, [])

  const nextDeadlines = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !['done', 'canceled'].includes(task.status) &&
            task.dueDate.getTime() >= referenceNow
        )
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 3),
    []
  )

  return (
    <TasksProvider>
      <Header fixed>
        <Search placeholder='Search tasks, assignees, IDs...' />
        <div className='ms-auto flex items-center gap-2 sm:gap-3'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5 sm:gap-6'>
        <section className='app-surface-elevated relative overflow-hidden rounded-3xl p-6 md:p-8'>
          <div className='pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-24 -start-14 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl' />

          <div className='relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-3'>
              <p className='inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase text-primary'>
                Operations Desk
              </p>
              <div className='space-y-2'>
                <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
                  Tasks Command Center
                </h2>
                <p className='max-w-2xl text-sm text-muted-foreground md:text-base'>
                  A live execution surface for workflows, SLAs, and team
                  throughput. Track deadlines early and move blockers before
                  they hit delivery.
                </p>
              </div>
            </div>
            <div className='flex flex-wrap gap-2'>
              <TasksPrimaryButtons />
            </div>
          </div>

          <div className='relative mt-6 space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium text-muted-foreground'>
                Completion this cycle
              </span>
              <span className='font-semibold'>{metrics.completionRate}%</span>
            </div>
            <div className='h-2.5 w-full rounded-full bg-secondary/80'>
              <div
                className='h-full rounded-full bg-primary transition-all'
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>
        </section>

        <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <div className='metric-tile'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Open Queue</p>
                <p className='mt-2 text-3xl font-bold leading-none'>
                  {metrics.total}
                </p>
              </div>
              <span className='rounded-xl bg-primary/12 p-2 text-primary'>
                <ListTodo className='size-5' />
              </span>
            </div>
            <p className='mt-4 text-sm text-muted-foreground'>
              {metrics.inProgress} tasks currently in progress
            </p>
          </div>

          <div className='metric-tile'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Completed</p>
                <p className='mt-2 text-3xl font-bold leading-none'>
                  {metrics.completed}
                </p>
              </div>
              <span className='rounded-xl bg-emerald-500/12 p-2 text-emerald-600 dark:text-emerald-400'>
                <CheckCircle2 className='size-5' />
              </span>
            </div>
            <p className='mt-4 text-sm text-muted-foreground'>
              Delivery velocity is trending positive this week
            </p>
          </div>

          <div className='metric-tile'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>High Risk</p>
                <p className='mt-2 text-3xl font-bold leading-none'>
                  {metrics.highRisk}
                </p>
              </div>
              <span className='rounded-xl bg-amber-500/12 p-2 text-amber-600 dark:text-amber-400'>
                <AlertTriangle className='size-5' />
              </span>
            </div>
            <p className='mt-4 text-sm text-muted-foreground'>
              Priority high/critical tasks needing close monitoring
            </p>
          </div>

          <div className='metric-tile'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Overdue</p>
                <p className='mt-2 text-3xl font-bold leading-none'>
                  {metrics.overdue}
                </p>
              </div>
              <span className='rounded-xl bg-sky-500/12 p-2 text-sky-600 dark:text-sky-400'>
                <Clock3 className='size-5' />
              </span>
            </div>
            <p className='mt-4 flex items-center gap-1.5 text-sm text-muted-foreground'>
              <TrendingUp className='size-4 text-primary' />
              {nextDeadlines[0]
                ? `Upcoming: ${nextDeadlines[0].id}`
                : 'No upcoming deadlines'}
            </p>
          </div>
        </section>

        <section className='app-surface flex flex-1 flex-col gap-4 rounded-3xl p-4 sm:p-5'>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div>
              <h3 className='text-xl font-semibold tracking-tight'>
                Execution Queue
              </h3>
              <p className='text-sm text-muted-foreground'>
                Filter, prioritize, and act on active workstreams.
              </p>
            </div>
            <TasksPrimaryButtons />
          </div>
          <TasksTable data={tasks} />
        </section>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
