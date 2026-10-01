import * as THREE from 'three';

export interface Point2D { x: number; y: number; }
export interface Edge { id: string; p1: string; p2: string; }
export interface Node { id: string; p: Point2D; }
export interface Polygon { id: string; points: Point2D[]; }

const TOLERANCE = 0.05; // 5cm physical tolerance

function dist(a: Point2D, b: Point2D) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getIntersection(A: Point2D, B: Point2D, C: Point2D, D: Point2D): Point2D | null {
  const denom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
  if (Math.abs(denom) < 1e-6) return null; // Parallel

  const ua = ((D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x)) / denom;
  const ub = ((B.x - A.x) * (A.y - C.y) - (B.y - A.y) * (A.x - C.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: A.x + ua * (B.x - A.x),
      y: A.y + ua * (B.y - A.y)
    };
  }
  return null;
}

export class CuttingNetwork {
  nodes: Map<string, Node> = new Map();
  edges: Map<string, Edge> = new Map();
  adj: Map<string, Set<string>> = new Map();
  closedRegions: Polygon[] = [];
  openStrokes: Point2D[][] = []; // For rendering open lines

  constructor() {}

  reset() {
    this.nodes.clear();
    this.edges.clear();
    this.adj.clear();
    this.closedRegions = [];
    this.openStrokes = [];
  }

  // Returns node ID, either existing or newly created
  private addOrFindNode(p: Point2D): string {
    for (const [id, node] of this.nodes) {
      if (dist(node.p, p) < TOLERANCE) return id;
    }
    const id = `n_${Math.random().toString(36).substr(2, 9)}`;
    this.nodes.set(id, { id, p });
    this.adj.set(id, new Set());
    return id;
  }

  private addEdgeUnsafe(n1: string, n2: string) {
    if (n1 === n2) return;
    if (this.adj.get(n1)?.has(n2)) return;
    
    const id = `e_${Math.random().toString(36).substr(2, 9)}`;
    this.edges.set(id, { id, p1: n1, p2: n2 });
    this.adj.get(n1)!.add(n2);
    this.adj.get(n2)!.add(n1);
  }

  private removeEdgeUnsafe(n1: string, n2: string) {
    this.adj.get(n1)?.delete(n2);
    this.adj.get(n2)?.delete(n1);
    for (const [id, edge] of this.edges) {
      if ((edge.p1 === n1 && edge.p2 === n2) || (edge.p1 === n2 && edge.p2 === n1)) {
        this.edges.delete(id);
      }
    }
  }

  // Adds a segment and handles ALL intersections (splitting existing edges)
  addSegment(pA: Point2D, pB: Point2D): Polygon[] {
    if (dist(pA, pB) < 1e-4) return []; // Too small

    let intersections: { p: Point2D, edgeToSplit?: Edge, t: number }[] = [];

    // Check against all existing edges
    for (const [edgeId, edge] of this.edges) {
      const C = this.nodes.get(edge.p1)!.p;
      const D = this.nodes.get(edge.p2)!.p;
      
      const ix = getIntersection(pA, pB, C, D);
      if (ix) {
        // Only consider it an intersection if it's not right at the endpoints
        if (dist(ix, C) > TOLERANCE && dist(ix, D) > TOLERANCE && 
            dist(ix, pA) > TOLERANCE && dist(ix, pB) > TOLERANCE) {
          intersections.push({ p: ix, edgeToSplit: edge, t: dist(pA, ix) });
        }
      }
    }

    // Sort intersections along the new segment pA -> pB
    intersections.sort((a, b) => a.t - b.t);

    let lastNodeId = this.addOrFindNode(pA);

    for (const ix of intersections) {
      const ixNodeId = this.addOrFindNode(ix.p);
      
      // Split the existing edge
      if (ix.edgeToSplit) {
        this.removeEdgeUnsafe(ix.edgeToSplit.p1, ix.edgeToSplit.p2);
        this.addEdgeUnsafe(ix.edgeToSplit.p1, ixNodeId);
        this.addEdgeUnsafe(ixNodeId, ix.edgeToSplit.p2);
      }

      // Add segment from last node to this intersection
      this.addEdgeUnsafe(lastNodeId, ixNodeId);
      lastNodeId = ixNodeId;
    }

    // Finally, connect to the end point
    const endNodeId = this.addOrFindNode(pB);
    this.addEdgeUnsafe(lastNodeId, endNodeId);

    return this.detectNewLoops();
  }

  // Detect minimal cycles using BFS
  private detectNewLoops(): Polygon[] {
    const newPolygons: Polygon[] = [];

    // A simple cycle detection for a planar graph:
    // For every edge, try to find the shortest path back to the start
    // that doesn't use the edge itself.
    // This is computationally intensive for huge graphs, but our graph is small.

    const visitedEdges = new Set<string>();

    for (const [n1, neighbors] of this.adj) {
      for (const n2 of neighbors) {
        const edgeKey = n1 < n2 ? `${n1}-${n2}` : `${n2}-${n1}`;
        if (visitedEdges.has(edgeKey)) continue;
        visitedEdges.add(edgeKey);

        // Find shortest path from n1 to n2 without using edge n1-n2
        const path = this.shortestPath(n1, n2, edgeKey);
        if (path) {
          // We found a cycle!
          const cyclePts = path.map(nId => this.nodes.get(nId)!.p);
          
          // Verify it has significant area (not a degenerate sliver)
          if (this.calculateArea(cyclePts) > 0.05) { // Minimum 0.05 sq meters
            // Check if this cycle is already known
            if (!this.isCycleKnown(cyclePts)) {
              const newRegion = {
                id: `poly_${Math.random().toString(36).substr(2, 9)}`,
                points: cyclePts
              };
              this.closedRegions.push(newRegion);
              newPolygons.push(newRegion);
            }
          }
        }
      }
    }

    return newPolygons;
  }

  private shortestPath(start: string, target: string, ignoreEdgeKey: string): string[] | null {
    const queue: { id: string, path: string[] }[] = [{ id: start, path: [start] }];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.id === target) return curr.path;

      const neighbors = this.adj.get(curr.id) || new Set();
      for (const next of neighbors) {
        const eKey = curr.id < next ? `${curr.id}-${next}` : `${next}-${curr.id}`;
        if (eKey === ignoreEdgeKey) continue;

        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, path: [...curr.path, next] });
        }
      }
    }
    return null;
  }

  private calculateArea(pts: Point2D[]): number {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(area / 2.0);
  }

  private getCenter(pts: Point2D[]): Point2D {
    let cx = 0, cy = 0;
    for (const p of pts) {
      cx += p.x; cy += p.y;
    }
    return { x: cx / pts.length, y: cy / pts.length };
  }

  private isCycleKnown(pts: Point2D[]): boolean {
    const newArea = this.calculateArea(pts);
    const newCenter = this.getCenter(pts);
    for (const region of this.closedRegions) {
      const existingArea = this.calculateArea(region.points);
      const existingCenter = this.getCenter(region.points);
      // If areas and centers are nearly identical, it's the same loop
      if (Math.abs(newArea - existingArea) < 0.01 && dist(newCenter, existingCenter) < 0.05) {
        return true;
      }
    }
    return false;
  }
}
export const globalCuttingNetwork = new CuttingNetwork();
