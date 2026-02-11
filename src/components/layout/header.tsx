import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-40 h-[4.5rem]',
        fixed && 'header-fixed peer/header sticky top-0 w-full px-2 pt-2 md:px-4',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 rounded-2xl px-3 sm:gap-4 sm:px-4',
          fixed && 'app-surface',
          fixed && offset > 10 && 'app-surface-elevated'
        )}
      >
        <SidebarTrigger
          variant='outline'
          className='size-9 rounded-xl border-background/80 bg-background/90'
        />
        <Separator orientation='vertical' className='h-6 opacity-70 max-sm:hidden' />
        {children}
      </div>
    </header>
  )
}
