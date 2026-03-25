import { Vector3, Waypoint, Obstacle } from '../types';

interface Node {
  position: Vector3;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost
  parent: Node | null;
}

export class AStar {
  private obstacles: Obstacle[];

  constructor(obstacles: Obstacle[] = []) {
    this.obstacles = obstacles;
  }

  // Calculate Euclidean distance
  private distance(a: Vector3, b: Vector3): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    );
  }

  // Check if position collides with obstacles
  private isCollision(position: Vector3): boolean {
    return this.obstacles.some(obstacle => {
      const dist = this.distance(position, obstacle.position);
      return dist < obstacle.radius + 0.5; // Add safety margin
    });
  }

  // Get neighbors (8 directions in 3D space)
  private getNeighbors(node: Node, goal: Vector3, stepSize: number = 1): Node[] {
    const neighbors: Node[] = [];
    const directions = [
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 1, z: 0 },
      { x: -1, y: 1, z: 0 },
      { x: 1, y: 0, z: 1 },
      { x: -1, y: 0, z: 1 },
    ];

    for (const dir of directions) {
      const newPos: Vector3 = {
        x: node.position.x + dir.x * stepSize,
        y: node.position.y + dir.y * stepSize,
        z: node.position.z + dir.z * stepSize,
      };

      // Skip if collision
      if (this.isCollision(newPos)) continue;

      // Skip if below ground
      if (newPos.y < 0.5) continue;

      const g = node.g + this.distance(node.position, newPos);
      const h = this.distance(newPos, goal);
      const f = g + h;

      neighbors.push({
        position: newPos,
        g,
        h,
        f,
        parent: node,
      });
    }

    return neighbors;
  }

  // Main A* algorithm
  findPath(start: Vector3, goal: Vector3): Vector3[] {
    const openList: Node[] = [];
    const closedList: Node[] = [];

    // Create start node
    const startNode: Node = {
      position: start,
      g: 0,
      h: this.distance(start, goal),
      f: this.distance(start, goal),
      parent: null,
    };

    openList.push(startNode);

    let iterations = 0;
    const maxIterations = 1000; // Prevent infinite loop

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++;

      // Get node with lowest f score
      openList.sort((a, b) => a.f - b.f);
      const currentNode = openList.shift()!;

      // Check if we reached goal
      if (this.distance(currentNode.position, goal) < 1) {
        // Reconstruct path
        const path: Vector3[] = [];
        let node: Node | null = currentNode;
        while (node !== null) {
          path.unshift(node.position);
          node = node.parent;
        }
        return path;
      }

      closedList.push(currentNode);

      // Check neighbors
      const neighbors = this.getNeighbors(currentNode, goal);
      for (const neighbor of neighbors) {
        // Skip if in closed list
        if (closedList.some(n => 
          n.position.x === neighbor.position.x &&
          n.position.y === neighbor.position.y &&
          n.position.z === neighbor.position.z
        )) {
          continue;
        }

        // Check if in open list with better score
        const existingIndex = openList.findIndex(n =>
          n.position.x === neighbor.position.x &&
          n.position.y === neighbor.position.y &&
          n.position.z === neighbor.position.z
        );

        if (existingIndex === -1) {
          openList.push(neighbor);
        } else if (neighbor.g < openList[existingIndex].g) {
          openList[existingIndex] = neighbor;
        }
      }
    }

    // No path found, return direct line
    console.warn('No path found, using direct line');
    return [start, goal];
  }

  updateObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
  }
}
