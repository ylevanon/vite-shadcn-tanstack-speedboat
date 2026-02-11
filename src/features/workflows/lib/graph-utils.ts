import { type WorkflowEdge, type WorkflowNode } from '../types'

export function isAcyclic(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !inDegree.has(edge.target)) continue
    adjacency.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue = Array.from(inDegree.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)

  let visited = 0

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (!nodeId) continue

    visited += 1
    const neighbors = adjacency.get(nodeId) ?? []
    for (const neighbor of neighbors) {
      const next = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, next)
      if (next === 0) queue.push(neighbor)
    }
  }

  return visited === nodes.length
}

export function getDepthStats(nodes: WorkflowNode[]) {
  const buckets = new Map<number, number>()
  for (const node of nodes) {
    buckets.set(node.depth, (buckets.get(node.depth) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([depth, count]) => ({ depth, count }))
}

export function getNodeEdgeMap(edges: WorkflowEdge[]) {
  const incoming = new Map<string, WorkflowEdge[]>()
  const outgoing = new Map<string, WorkflowEdge[]>()

  for (const edge of edges) {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge])
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge])
  }

  return { incoming, outgoing }
}
