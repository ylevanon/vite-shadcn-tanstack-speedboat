export type WorkflowNodeStatus =
  | 'queued'
  | 'in_progress'
  | 'at_risk'
  | 'blocked'
  | 'done'

export type WorkflowNode = {
  id: string
  title: string
  subtitle: string
  owner: string
  team: string
  depth: number
  lane: number
  eta: string
  status: WorkflowNodeStatus
}

export type WorkflowEdgeKind = 'blocking' | 'dependency' | 'advisory'

export type WorkflowEdge = {
  id: string
  source: string
  target: string
  kind: WorkflowEdgeKind
  label?: string
}

export type WorkflowScenario = {
  id: string
  name: string
  description: string
  objective: string
  density: 'high' | 'low' | 'mixed'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}
