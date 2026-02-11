import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTasks } from './tasks-provider'

export function TasksPrimaryButtons() {
  const { setOpen } = useTasks()
  return (
    <div className='flex flex-wrap gap-2'>
      <Button
        variant='outline'
        className='h-10 rounded-xl border-border/70 bg-background/80 px-4 font-medium'
        onClick={() => setOpen('import')}
      >
        <Download className='size-4' />
        <span>Import CSV</span>
      </Button>
      <Button
        className='h-10 rounded-xl px-4 font-semibold shadow-md'
        onClick={() => setOpen('create')}
      >
        <Plus className='size-4' />
        <span>New Task</span>
      </Button>
    </div>
  )
}
