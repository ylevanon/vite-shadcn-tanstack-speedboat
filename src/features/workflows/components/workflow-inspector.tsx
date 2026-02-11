import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type WorkflowEdge, type WorkflowNode } from '../types'

type WorkflowInspectorProps = {
  selectedNode: WorkflowNode | null
  incoming: WorkflowEdge[]
  outgoing: WorkflowEdge[]
  allNodes: WorkflowNode[]
  onReprocessNode: (node: WorkflowNode) => void
}

const edgeLabel: Record<WorkflowEdge['kind'], string> = {
  blocking: 'Blocking',
  dependency: 'Dependency',
  advisory: 'Advisory',
}

export function WorkflowInspector({
  selectedNode,
  incoming,
  outgoing,
  allNodes,
  onReprocessNode,
}: WorkflowInspectorProps) {
  if (!selectedNode) {
    return (
      <aside className='app-surface rounded-3xl p-5'>
        <h3 className='text-base font-semibold'>Node Inspector</h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Select a node in the canvas to inspect dependencies, ownership, and
          edge rules.
        </p>
      </aside>
    )
  }

  const findTitle = (id: string) => allNodes.find((node) => node.id === id)?.title ?? id

  return (
    <aside className='app-surface space-y-4 rounded-3xl p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold'>{selectedNode.title}</h3>
          <p className='text-sm text-muted-foreground'>{selectedNode.subtitle}</p>
        </div>
        <Button
          size='sm'
          variant='outline'
          className='shrink-0'
          onClick={() => onReprocessNode(selectedNode)}
        >
          <RotateCcw className='size-4' />
          Reprocess
        </Button>
      </div>

      <div className='rounded-2xl border border-border/70 p-3 text-sm'>
        <p>
          <span className='text-muted-foreground'>Owner:</span> {selectedNode.owner}
        </p>
        <p>
          <span className='text-muted-foreground'>Team:</span> {selectedNode.team}
        </p>
        <p>
          <span className='text-muted-foreground'>Depth:</span> {selectedNode.depth}
        </p>
        <p>
          <span className='text-muted-foreground'>ETA:</span> {selectedNode.eta}
        </p>
      </div>

      <div className='space-y-2'>
        <h4 className='text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
          Incoming Dependencies
        </h4>
        {incoming.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No incoming dependencies.</p>
        ) : (
          <ul className='space-y-2'>
            {incoming.map((edge) => (
              <li key={edge.id} className='rounded-xl border border-border/70 p-2 text-sm'>
                <p className='font-medium'>{findTitle(edge.source)}</p>
                <p className='text-xs text-muted-foreground'>
                  {edgeLabel[edge.kind]}
                  {edge.label ? ` • ${edge.label}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className='space-y-2'>
        <h4 className='text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
          Outgoing Dependencies
        </h4>
        {outgoing.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No downstream dependencies.</p>
        ) : (
          <ul className='space-y-2'>
            {outgoing.map((edge) => (
              <li key={edge.id} className='rounded-xl border border-border/70 p-2 text-sm'>
                <p className='font-medium'>{findTitle(edge.target)}</p>
                <p className='text-xs text-muted-foreground'>
                  {edgeLabel[edge.kind]}
                  {edge.label ? ` • ${edge.label}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
