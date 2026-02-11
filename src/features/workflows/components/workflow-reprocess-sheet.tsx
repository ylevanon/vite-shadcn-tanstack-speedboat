import { useMemo, useState } from 'react'
import { AlertTriangle, GitBranch, ListRestart, Waypoints } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type WorkflowEdge, type WorkflowNode } from '../types'

type ReprocessMode = 'node_only' | 'from_node' | 'from_roots'

type WorkflowReprocessSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedNode: WorkflowNode | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

type Adjacency = {
  incoming: Map<string, string[]>
  outgoing: Map<string, string[]>
}

function buildAdjacency(nodes: WorkflowNode[], edges: WorkflowEdge[]): Adjacency {
  const incoming = new Map<string, string[]>()
  const outgoing = new Map<string, string[]>()

  for (const node of nodes) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  }

  for (const edge of edges) {
    if (!incoming.has(edge.target) || !outgoing.has(edge.source)) continue
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source])
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
  }

  return { incoming, outgoing }
}

function collectReachable(startNodeIds: string[], adjacency: Map<string, string[]>) {
  const visited = new Set<string>()
  const queue = [...startNodeIds]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)
    const neighbors = adjacency.get(current) ?? []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) queue.push(neighbor)
    }
  }

  return visited
}

function parseEtaToMinutes(eta: string) {
  const normalized = eta.trim().toLowerCase()
  const match = normalized.match(/^(\d+)\s*([mh])$/)
  if (!match) return 0

  const value = Number(match[1])
  if (match[2] === 'h') return value * 60
  return value
}

export function WorkflowReprocessSheet({
  open,
  onOpenChange,
  selectedNode,
  nodes,
  edges,
}: WorkflowReprocessSheetProps) {
  const [mode, setMode] = useState<ReprocessMode>('from_node')
  const [includeAdvisoryEdges, setIncludeAdvisoryEdges] = useState(false)
  const [resetDoneNodes, setResetDoneNodes] = useState(true)
  const [note, setNote] = useState('')

  const activeEdges = useMemo(() => {
    if (includeAdvisoryEdges) return edges
    return edges.filter((edge) => edge.kind !== 'advisory')
  }, [edges, includeAdvisoryEdges])

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  )

  const { incoming, outgoing } = useMemo(
    () => buildAdjacency(nodes, activeEdges),
    [activeEdges, nodes]
  )

  const rootNodeIds = useMemo(
    () =>
      nodes
        .filter((node) => (incoming.get(node.id) ?? []).length === 0)
        .map((node) => node.id),
    [incoming, nodes]
  )

  const rootAncestors = useMemo(() => {
    if (!selectedNode) return []

    const ancestors = collectReachable([selectedNode.id], incoming)
    return rootNodeIds.filter((rootId) => ancestors.has(rootId))
  }, [incoming, rootNodeIds, selectedNode])

  const startNodeIds = useMemo(() => {
    if (!selectedNode) return []

    if (mode === 'node_only') return [selectedNode.id]
    if (mode === 'from_roots') {
      return rootAncestors.length > 0 ? rootAncestors : [selectedNode.id]
    }
    return [selectedNode.id]
  }, [mode, rootAncestors, selectedNode])

  const impactedIds = useMemo(() => {
    if (mode === 'node_only') return new Set(startNodeIds)
    return collectReachable(startNodeIds, outgoing)
  }, [mode, outgoing, startNodeIds])

  const impactedNodes = useMemo(
    () =>
      nodes
        .filter((node) => impactedIds.has(node.id))
        .sort((a, b) => a.depth - b.depth || a.lane - b.lane || a.title.localeCompare(b.title)),
    [impactedIds, nodes]
  )

  const blockedCount = useMemo(
    () => impactedNodes.filter((node) => node.status === 'blocked').length,
    [impactedNodes]
  )

  const estimatedMinutes = useMemo(
    () => impactedNodes.reduce((sum, node) => sum + parseEtaToMinutes(node.eta), 0),
    [impactedNodes]
  )

  const depthRange = useMemo(() => {
    if (impactedNodes.length === 0) return 'n/a'
    const min = Math.min(...impactedNodes.map((node) => node.depth))
    const max = Math.max(...impactedNodes.map((node) => node.depth))
    return min === max ? `${min}` : `${min}-${max}`
  }, [impactedNodes])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-xl'>
        <SheetHeader className='pb-1 text-start'>
          <SheetTitle className='inline-flex items-center gap-2'>
            <ListRestart className='size-4 text-primary' />
            Reprocess View
          </SheetTitle>
          <SheetDescription>
            Choose where to restart execution from this graph. This screen is UI-only
            and does not trigger backend orchestration yet.
          </SheetDescription>
        </SheetHeader>

        {!selectedNode ? (
          <div className='px-4 pb-6 text-sm text-muted-foreground'>
            Select a node first, then open reprocess.
          </div>
        ) : (
          <div className='space-y-5 overflow-y-auto px-4 pb-4'>
            <div className='rounded-2xl border border-border/70 bg-background/60 p-3'>
              <p className='text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
                Selected Checkpoint
              </p>
              <p className='mt-1 text-sm font-semibold'>{selectedNode.title}</p>
              <p className='text-xs text-muted-foreground'>{selectedNode.subtitle}</p>
              <p className='mt-2 text-xs text-muted-foreground'>
                Team {selectedNode.team} • Depth {selectedNode.depth} • ETA{' '}
                {selectedNode.eta}
              </p>
            </div>

            <div className='space-y-2'>
              <Label className='text-xs tracking-[0.08em] uppercase'>Reprocess Scope</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as ReprocessMode)}
                className='gap-2'
              >
                <label
                  htmlFor='scope-node-only'
                  className='flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3'
                >
                  <RadioGroupItem id='scope-node-only' value='node_only' className='mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>Selected node only</p>
                    <p className='text-xs text-muted-foreground'>
                      Retry this intermediary checkpoint without cascading downstream.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor='scope-from-node'
                  className='flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3'
                >
                  <RadioGroupItem id='scope-from-node' value='from_node' className='mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>From selected node</p>
                    <p className='text-xs text-muted-foreground'>
                      Reprocess from this intermediary point through all downstream dependencies.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor='scope-from-roots'
                  className='flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3'
                >
                  <RadioGroupItem id='scope-from-roots' value='from_roots' className='mt-0.5' />
                  <div>
                    <p className='text-sm font-medium'>From upstream root(s)</p>
                    <p className='text-xs text-muted-foreground'>
                      Restart the branch from root checkpoints feeding this node.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className='space-y-3 rounded-2xl border border-border/70 p-3'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <Label htmlFor='include-advisory'>Include advisory edges</Label>
                  <p className='text-xs text-muted-foreground'>
                    Include soft dependencies in reprocess scope calculation.
                  </p>
                </div>
                <Switch
                  id='include-advisory'
                  checked={includeAdvisoryEdges}
                  onCheckedChange={setIncludeAdvisoryEdges}
                />
              </div>

              <div className='flex items-center justify-between gap-3'>
                <div>
                  <Label htmlFor='reset-done'>Reset completed nodes</Label>
                  <p className='text-xs text-muted-foreground'>
                    Mark done nodes in scope as pending for this replay.
                  </p>
                </div>
                <Switch
                  id='reset-done'
                  checked={resetDoneNodes}
                  onCheckedChange={setResetDoneNodes}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='reprocess-note'>Operator note</Label>
              <Textarea
                id='reprocess-note'
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder='Why are we replaying this branch? (optional)'
              />
            </div>

            <div className='space-y-3 rounded-2xl border border-border/70 p-3'>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                <Waypoints className='size-4 text-primary' />
                Reprocess Preview
              </div>

              <div className='flex flex-wrap gap-2'>
                {startNodeIds.map((nodeId) => (
                  <span
                    key={nodeId}
                    className='inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs'
                  >
                    <GitBranch className='size-3.5 text-primary' />
                    {nodeById.get(nodeId)?.title ?? nodeId}
                  </span>
                ))}
              </div>

              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='rounded-lg border border-border/70 bg-background/70 p-2'>
                  <p className='text-xs text-muted-foreground'>Impacted nodes</p>
                  <p className='text-lg font-semibold'>{impactedNodes.length}</p>
                </div>
                <div className='rounded-lg border border-border/70 bg-background/70 p-2'>
                  <p className='text-xs text-muted-foreground'>Depth span</p>
                  <p className='text-lg font-semibold'>{depthRange}</p>
                </div>
                <div className='rounded-lg border border-border/70 bg-background/70 p-2'>
                  <p className='text-xs text-muted-foreground'>Blocked in scope</p>
                  <p className='text-lg font-semibold'>{blockedCount}</p>
                </div>
                <div className='rounded-lg border border-border/70 bg-background/70 p-2'>
                  <p className='text-xs text-muted-foreground'>Est. replay ETA</p>
                  <p className='text-lg font-semibold'>{estimatedMinutes}m</p>
                </div>
              </div>

              <ul className='max-h-56 space-y-2 overflow-y-auto'>
                {impactedNodes.map((node) => (
                  <li
                    key={node.id}
                    className='rounded-lg border border-border/70 px-2 py-1.5 text-xs'
                  >
                    <p className='font-medium'>{node.title}</p>
                    <p className='text-muted-foreground'>
                      Depth {node.depth} • {node.team} • {node.status.replace('_', ' ')}
                    </p>
                  </li>
                ))}
              </ul>

              {mode === 'from_roots' && rootAncestors.length === 0 && (
                <p className='inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400'>
                  <AlertTriangle className='size-3.5' />
                  No upstream roots were found for this selection; falling back to selected
                  node.
                </p>
              )}
            </div>
          </div>
        )}

        <SheetFooter className='border-t border-border/70 pt-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled>Queue Reprocess (Coming Soon)</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
