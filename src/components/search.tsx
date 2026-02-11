import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-provider'
import { Button } from './ui/button'

type SearchProps = {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({
  className = '',
  placeholder = 'Search',
}: SearchProps) {
  const { setOpen } = useSearch()
  return (
    <Button
      variant='outline'
      className={cn(
        'group relative h-10 w-full flex-1 justify-start rounded-xl bg-background/90 text-sm font-medium text-muted-foreground shadow-sm hover:bg-accent sm:w-44 sm:pe-12 md:flex-none lg:w-56 xl:w-72',
        className
      )}
      onClick={() => setOpen(true)}
    >
      <SearchIcon
        aria-hidden='true'
        className='absolute start-2.5 top-1/2 -translate-y-1/2'
        size={16}
      />
      <span className='ms-5'>{placeholder}</span>
      <kbd className='pointer-events-none absolute end-1 top-1 hidden h-7 items-center gap-1 rounded-md border bg-muted/70 px-2 font-mono text-[10px] font-medium opacity-100 select-none group-hover:bg-accent sm:flex'>
        <span className='text-xs'>⌘</span>K
      </kbd>
    </Button>
  )
}
