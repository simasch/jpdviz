/**
 * Cycle Detection using Tarjan's Strongly Connected Components Algorithm
 *
 * Finds all circular dependencies in a package dependency graph.
 * A cycle exists when an SCC contains more than one node.
 */

/**
 * Detect cycles in the dependency graph
 * @param {Object} graph - Graph with nodes and edges arrays
 * @returns {Object} - { cycles: Array<Array<string>>, cycleInfo: Array<Object> }
 */
function detectCycles(graph) {
  // Build adjacency list from edges
  const adjacency = buildAdjacencyList(graph);

  // Run Tarjan's algorithm to find SCCs
  const sccs = tarjanSCC(adjacency);

  // Filter to cycles (SCCs with size > 1)
  const cycles = sccs.filter(scc => scc.length > 1);

  // Build detailed cycle info with edge evidence
  const cycleInfo = buildCycleInfo(cycles, graph);

  return { cycles, cycleInfo };
}

/**
 * Build adjacency list from graph edges
 * @param {Object} graph - Graph with nodes and edges
 * @returns {Map<string, Array<string>>} - Adjacency list
 */
function buildAdjacencyList(graph) {
  const adjacency = new Map();

  // Initialize all nodes with empty adjacency lists
  for (const node of graph.nodes) {
    adjacency.set(node.data.id, []);
  }

  // Add edges to adjacency list
  for (const edge of graph.edges) {
    const source = edge.data.source;
    const target = edge.data.target;
    if (adjacency.has(source)) {
      adjacency.get(source).push(target);
    }
  }

  return adjacency;
}

/**
 * Tarjan's Strongly Connected Components Algorithm
 * Time complexity: O(V + E)
 *
 * @param {Map<string, Array<string>>} adjacency - Adjacency list
 * @returns {Array<Array<string>>} - List of SCCs
 */
function tarjanSCC(adjacency) {
  let indexCounter = 0;
  const stack = [];
  const lowlinks = new Map();
  const indices = new Map();
  const onStack = new Set();
  const sccs = [];

  function strongconnect(node) {
    // Set the depth index for this node
    indices.set(node, indexCounter);
    lowlinks.set(node, indexCounter);
    indexCounter++;
    stack.push(node);
    onStack.add(node);

    // Consider successors of this node
    const successors = adjacency.get(node) || [];
    for (const successor of successors) {
      if (!indices.has(successor)) {
        // Successor has not been visited; recurse on it
        strongconnect(successor);
        lowlinks.set(node, Math.min(lowlinks.get(node), lowlinks.get(successor)));
      } else if (onStack.has(successor)) {
        // Successor is on stack and hence in current SCC
        lowlinks.set(node, Math.min(lowlinks.get(node), indices.get(successor)));
      }
    }

    // If node is a root node, pop the stack and generate an SCC
    if (lowlinks.get(node) === indices.get(node)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== node);
      sccs.push(scc);
    }
  }

  // Run algorithm on all nodes
  for (const node of adjacency.keys()) {
    if (!indices.has(node)) {
      strongconnect(node);
    }
  }

  return sccs;
}

/**
 * Build detailed info about each cycle including which edges cause it
 * @param {Array<Array<string>>} cycles - List of cycles (SCCs with size > 1)
 * @param {Object} graph - Original graph
 * @returns {Array<Object>} - Detailed cycle information
 */
function buildCycleInfo(cycles, graph) {
  const cycleInfo = [];

  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    const cycleSet = new Set(cycle);

    // Find all edges within this cycle
    const cycleEdges = graph.edges.filter(edge =>
      cycleSet.has(edge.data.source) && cycleSet.has(edge.data.target)
    );

    cycleInfo.push({
      index: i,
      packages: cycle,
      edges: cycleEdges.map(e => ({
        from: e.data.source,
        to: e.data.target,
        weight: e.data.weight
      })),
      size: cycle.length
    });
  }

  return cycleInfo;
}

/**
 * Find which cycle index a package belongs to
 * @param {string} packageId - Package ID to find
 * @param {Array<Array<string>>} cycles - List of cycles
 * @returns {number} - Cycle index or -1 if not in any cycle
 */
function findCycleIndex(packageId, cycles) {
  for (let i = 0; i < cycles.length; i++) {
    if (cycles[i].includes(packageId)) {
      return i;
    }
  }
  return -1;
}

/**
 * Mark nodes and edges that are part of cycles
 * @param {Object} graph - Graph with nodes and edges
 * @param {Array<Array<string>>} cycles - Detected cycles
 * @returns {Object} - Graph with inCycle markers
 */
function markCycleElements(graph, cycles) {
  const cyclePackages = new Set(cycles.flat());

  // Mark nodes
  const markedNodes = graph.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      inCycle: cyclePackages.has(node.data.id),
      cycleIndex: findCycleIndex(node.data.id, cycles)
    }
  }));

  // Mark edges (edge is in cycle if both endpoints are in the same cycle)
  const markedEdges = graph.edges.map(edge => {
    const sourceInCycle = cyclePackages.has(edge.data.source);
    const targetInCycle = cyclePackages.has(edge.data.target);
    const sourceCycleIndex = findCycleIndex(edge.data.source, cycles);
    const targetCycleIndex = findCycleIndex(edge.data.target, cycles);

    return {
      ...edge,
      data: {
        ...edge.data,
        inCycle: sourceInCycle && targetInCycle && sourceCycleIndex === targetCycleIndex
      }
    };
  });

  return {
    nodes: markedNodes,
    edges: markedEdges
  };
}

module.exports = {
  detectCycles,
  markCycleElements,
  findCycleIndex
};
