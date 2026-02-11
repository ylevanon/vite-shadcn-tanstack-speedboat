import { useMemo } from 'react'
import { Clock3, Link2, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type WorkflowEdge, type WorkflowNode } from '../types'

const nodeWidth = 240
const nodeHeight = 112
const horizontalGap = 110
const verticalGap = 22
const laneGap = 24
const padding = 56

type CanvasProps = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
}

type NodePosition = {
  x: number
  y: number
}

const statusTone: Record<WorkflowNode['status'], string> = {
  queued:
    'border-slate-300/70 bg-slate-100/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200',
  in_progress:
    'border-sky-300/70 bg-sky-100/70 text-sky-700 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  at_risk:
    'border-amber-300/70 bg-amber-100/70 text-amber-700 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  blocked:
    'border-rose-300/70 bg-rose-100/70 text-rose-700 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  done: 'border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const edgeStyleByKind: Record<WorkflowEdge['kind'], string> = {
  blocking: 'stroke-primary',
  dependency: 'stroke-sky-500 dark:stroke-sky-400',
  advisory: 'stroke-muted-foreground',
}

function getEdgeStrokeWidth(kind: WorkflowEdge['kind']) {
  if (kind === 'blocking') return 2.5
  if (kind === 'dependency') return 2
  return 1.6
}

function getEdgeDash(kind: WorkflowEdge['kind']) {
  if (kind === 'dependency') return '7 5'
  if (kind === 'advisory') return '4 6'
  return undefined
}

function getPositions(nodes: WorkflowNode[]) {
  const byDepth = new Map<number, WorkflowNode[]>()
  for (const node of nodes) {
    byDepth.set(node.depth, [...(byDepth.get(node.depth) ?? []), node])
  }

  const sortedDepths = Array.from(byDepth.keys()).sort((a, b) => a - b)
  const positions = new Map<string, NodePosition>()
  let canvasHeight = 0

  for (const depth of sortedDepths) {
    const column = (byDepth.get(depth) ?? [])
      .slice()
      .sort((a, b) => a.lane - b.lane || a.title.localeCompare(b.title))

    let y = padding
    let previousLane = column[0]?.lane
    for (const node of column) {
      if (previousLane !== undefined && node.lane !== previousLane) {
        y += laneGap
      }

      positions.set(node.id, {
        x: padding + depth * (nodeWidth + horizontalGap),
        y,
      })

      y += nodeHeight + verticalGap
      previousLane = node.lane
    }

    canvasHeight = Math.max(canvasHeight, y)
  }

  const maxDepth =
    sortedDepths.length > 0 ? sortedDepths[sortedDepths.length - 1] : 0
  const canvasWidth = padding * 2 + (maxDepth + 1) * nodeWidth + maxDepth * horizontalGap

  return {
    positions,
    canvasWidth,
    canvasHeight: canvasHeight + padding,
  }
}

function buildEdgePath(source: NodePosition, target: NodePosition) {
  const startX = source.x + nodeWidth
  const startY = source.y + nodeHeight / 2
  const endX = target.x
  const endY = target.y + nodeHeight / 2

  const delta = Math.max(78, (endX - startX) * 0.45)

  return `M ${startX} ${startY} C ${startX + delta} ${startY}, ${endX - delta} ${endY}, ${endX} ${endY}`
}

export function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}: CanvasProps) {
  const { positions, canvasWidth, canvasHeight } = useMemo(
    () => getPositions(nodes),
    [nodes]
  )

  const selectedLinks = useMemo(() => {
    if (!selectedNodeId) return new Set<string>()
    const connected = edges
      .filter(
        (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
      )
      .map((edge) => edge.id)

    return new Set(connected)
  }, [edges, selectedNodeId])

  return (
    <div className='app-surface-elevated relative overflow-hidden rounded-3xl p-3 md:p-4'>
      <div className='overflow-auto rounded-2xl border border-border/60 bg-background/75 p-2'>
        <div
          className='relative'
          style={{ width: canvasWidth, minHeight: canvasHeight }}
        >
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className='pointer-events-none absolute inset-0'
            aria-hidden='true'
          >
            <defs>
              <marker
                id='workflow-arrow'
                markerWidth='8'
                markerHeight='8'
                refX='7'
                refY='4'
                orient='auto'
              >
                <path d='M0,0 L8,4 L0,8 z' className='fill-current opacity-85' />
              </marker>
            </defs>

            {edges.map((edge) => {
              const sourcePos = positions.get(edge.source)
              const targetPos = positions.get(edge.target)
              if (!sourcePos || !targetPos) return null

              const isConnectedToSelection =
                !selectedNodeId || selectedLinks.has(edge.id)

              return (
                <g
                  key={edge.id}
                  className={cn(
                    edgeStyleByKind[edge.kind],
                    !isConnectedToSelection && 'opacity-20'
                  )}
                >
                  <path
                    d={buildEdgePath(sourcePos, targetPos)}
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={getEdgeStrokeWidth(edge.kind)}
                    strokeDasharray={getEdgeDash(edge.kind)}
                    markerEnd='url(#workflow-arrow)'
                  />
                </g>
              )
            })}
          </svg>

          {nodes.map((node) => {
            const position = positions.get(node.id)
            if (!position) return null

            const isSelected = node.id === selectedNodeId
            const isRelated =
              !selectedNodeId ||
              isSelected ||
              edges.some(
                (edge) =>
                  (edge.source === selectedNodeId && edge.target === node.id) ||
                  (edge.target === selectedNodeId && edge.source === node.id)
              )

            return (
              <button
                key={node.id}
                type='button'
                onClick={() => onSelectNode(node.id)}
                className={cn(
                  'absolute space-y-3 rounded-2xl border bg-card/95 p-4 text-start shadow-sm transition',
                  'hover:-translate-y-0.5 hover:shadow-md',
                  isSelected && 'border-primary ring-2 ring-primary/20',
                  !isRelated && 'opacity-45'
                )}
                style={{
                  left: position.x,
                  top: position.y,
                  width: nodeWidth,
                  minHeight: nodeHeight,
                }}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-semibold'>{node.title}</p>
                    <p className='line-clamp-2 text-xs text-muted-foreground'>
                      {node.subtitle}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                      statusTone[node.status]
                    )}
                  >
                    {node.status.replace('_', ' ')}
                  </span>
                </div>

                <div className='grid gap-1 text-xs text-muted-foreground'>
                  <p className='inline-flex items-center gap-1'>
                    <UserRound className='size-3.5' />
                    {node.owner}
                  </p>
                  <p className='inline-flex items-center gap-1'>
                    <Link2 className='size-3.5' />
                    {node.team}
                  </p>
                  <p className='inline-flex items-center gap-1'>
                    <Clock3 className='size-3.5' />
                    ETA {node.eta}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
