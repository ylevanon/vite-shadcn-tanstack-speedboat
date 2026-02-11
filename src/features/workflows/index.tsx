import { useMemo, useState } from 'react'
import { CheckCircle2, GitBranch, Layers2, RotateCcw, ShieldAlert } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { workflowScenarios } from './data/workflow-scenarios'
import { DepthDistribution } from './components/depth-distribution'
import { WorkflowCanvas } from './components/workflow-canvas'
import { WorkflowInspector } from './components/workflow-inspector'
import { WorkflowReprocessSheet } from './components/workflow-reprocess-sheet'
import { getDepthStats, getNodeEdgeMap, isAcyclic } from './lib/graph-utils'

export function Workflows() {
  const [scenarioId, setScenarioId] = useState(workflowScenarios[0].id)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [reprocessOpen, setReprocessOpen] = useState(false)

  const scenario = useMemo(
    () => workflowScenarios.find((item) => item.id === scenarioId) ?? workflowScenarios[0],
    [scenarioId]
  )

  const selectedNode = useMemo(
    () => scenario.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [scenario.nodes, selectedNodeId]
  )

  const { incoming, outgoing } = useMemo(
    () => getNodeEdgeMap(scenario.edges),
    [scenario.edges]
  )

  const dagValid = useMemo(
    () => isAcyclic(scenario.nodes, scenario.edges),
    [scenario.nodes, scenario.edges]
  )

  const depthStats = useMemo(() => getDepthStats(scenario.nodes), [scenario.nodes])

  const uniqueTeams = useMemo(
    () => new Set(scenario.nodes.map((node) => node.team)).size,
    [scenario.nodes]
  )

  const blockedCount = useMemo(
    () => scenario.nodes.filter((node) => node.status === 'blocked').length,
    [scenario.nodes]
  )

  const rootNodeCount = useMemo(
    () =>
      scenario.nodes.filter((node) => (incoming.get(node.id) ?? []).length === 0)
        .length,
    [incoming, scenario.nodes]
  )

  return (
    <>
      <Header fixed>
        <Search placeholder='Search workflow nodes...' />
        <div className='ms-auto flex items-center gap-2 sm:gap-3'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-5'>
        <section className='app-surface-elevated rounded-3xl p-6 md:p-8'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-3'>
              <p className='inline-flex w-fit items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase text-primary'>
                Workflow Lab
              </p>
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tight md:text-4xl'>
                  DAG Orchestration Studio
                </h1>
                <p className='max-w-3xl text-sm text-muted-foreground md:text-base'>
                  Model complex financial workflows with parallel trees, explicit
                  dependencies, and depth-aware execution gates.
                </p>
              </div>
            </div>
            <div
              className={cn(
                'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
                dagValid
                  ? 'border-emerald-300/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'border-rose-300/70 bg-rose-100/70 text-rose-700 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
              )}
            >
              {dagValid ? (
                <>
                  <CheckCircle2 className='size-4' />
                  Valid DAG
                </>
              ) : (
                <>
                  <ShieldAlert className='size-4' />
                  Cycle Detected
                </>
              )}
            </div>
          </div>

          <div className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
            <div className='metric-tile'>
              <p className='text-sm text-muted-foreground'>Nodes</p>
              <p className='mt-2 text-3xl font-bold leading-none'>
                {scenario.nodes.length}
              </p>
            </div>
            <div className='metric-tile'>
              <p className='text-sm text-muted-foreground'>Edges</p>
              <p className='mt-2 text-3xl font-bold leading-none'>
                {scenario.edges.length}
              </p>
            </div>
            <div className='metric-tile'>
              <p className='text-sm text-muted-foreground'>Teams</p>
              <p className='mt-2 text-3xl font-bold leading-none'>{uniqueTeams}</p>
            </div>
            <div className='metric-tile'>
              <p className='text-sm text-muted-foreground'>Root Nodes</p>
              <p className='mt-2 text-3xl font-bold leading-none'>
                {rootNodeCount}
              </p>
            </div>
            <div className='metric-tile'>
              <p className='text-sm text-muted-foreground'>Blocked Nodes</p>
              <p className='mt-2 text-3xl font-bold leading-none'>{blockedCount}</p>
            </div>
          </div>
        </section>

        <section className='app-surface rounded-3xl p-4 md:p-5'>
          <div className='mb-4 flex flex-wrap gap-2'>
            {workflowScenarios.map((item) => (
              <Button
                key={item.id}
                variant={item.id === scenario.id ? 'default' : 'outline'}
                className='rounded-xl'
                onClick={() => {
                  setScenarioId(item.id)
                  setSelectedNodeId(null)
                  setReprocessOpen(false)
                }}
              >
                {item.name}
              </Button>
            ))}
          </div>

          <div className='mb-4 rounded-2xl border border-border/70 bg-background/70 p-4'>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <GitBranch className='size-4 text-primary' />
              <span className='font-semibold'>{scenario.name}</span>
              <span className='text-muted-foreground'>• {scenario.objective}</span>
            </div>
            <p className='mt-1 text-sm text-muted-foreground'>
              {scenario.description}
            </p>
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setReprocessOpen(true)}
                disabled={!selectedNode}
              >
                <RotateCcw className='size-4' />
                Reprocess
              </Button>
              <p className='text-xs text-muted-foreground'>
                Select a root or intermediary node to open the reprocess view.
              </p>
            </div>
          </div>

          <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
            <WorkflowCanvas
              nodes={scenario.nodes}
              edges={scenario.edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
            />

            <div className='space-y-4 self-start'>
              <DepthDistribution data={depthStats} />

              <div className='app-surface rounded-3xl p-4'>
                <h3 className='text-sm font-semibold'>Scenario Shape</h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {scenario.density === 'high' &&
                    'Many steps at each depth with heavy control gates.'}
                  {scenario.density === 'low' &&
                    'Few nodes per depth for a sparse approval chain.'}
                  {scenario.density === 'mixed' &&
                    'Parallel trees with selective cross-tree dependencies.'}
                </p>
                <div className='mt-3 inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs text-muted-foreground'>
                  <Layers2 className='size-3.5' />
                  Density:{' '}
                  <span className='font-semibold text-foreground'>
                    {scenario.density}
                  </span>
                </div>
              </div>

              <WorkflowInspector
                selectedNode={selectedNode}
                incoming={selectedNode ? (incoming.get(selectedNode.id) ?? []) : []}
                outgoing={selectedNode ? (outgoing.get(selectedNode.id) ?? []) : []}
                allNodes={scenario.nodes}
                onReprocessNode={() => setReprocessOpen(true)}
              />
            </div>
          </div>
        </section>

        <WorkflowReprocessSheet
          open={reprocessOpen}
          onOpenChange={setReprocessOpen}
          selectedNode={selectedNode}
          nodes={scenario.nodes}
          edges={scenario.edges}
        />
      </Main>
    </>
  )
}
