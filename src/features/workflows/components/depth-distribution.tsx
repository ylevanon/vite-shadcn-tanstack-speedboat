type DepthDistributionProps = {
  data: Array<{ depth: number; count: number }>
}

export function DepthDistribution({ data }: DepthDistributionProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className='app-surface rounded-3xl p-5'>
      <h3 className='text-sm font-semibold'>Depth Distribution</h3>
      <p className='mb-4 text-xs text-muted-foreground'>
        Node count per depth layer
      </p>

      <div className='space-y-3.5'>
        {data.map((item) => (
          <div key={item.depth} className='space-y-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='font-medium'>Depth {item.depth}</span>
              <span className='text-muted-foreground'>{item.count}</span>
            </div>
            <div className='h-2.5 rounded-full bg-secondary/70'>
              <div
                className='h-full rounded-full bg-primary'
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
