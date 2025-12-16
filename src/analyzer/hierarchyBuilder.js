/**
 * Hierarchy Builder for Compound/Hierarchical Nodes
 *
 * Creates parent nodes for package prefixes to enable
 * collapsible package hierarchy in Cytoscape.js
 */

/**
 * Build hierarchical parent nodes from flat package list
 * @param {Array} nodes - Flat array of package nodes
 * @param {Object} options - Configuration options
 * @param {number} options.minGroupSize - Minimum children to form a group (default: 2)
 * @param {number} options.maxDepth - Maximum hierarchy depth (default: Infinity)
 * @returns {Array} - Nodes with parent relationships
 */
function buildHierarchy(nodes, options = {}) {
  const { minGroupSize = 2, maxDepth = Infinity } = options;

  // Get all package names
  const packageSet = new Set(nodes.map(n => n.data.id));
  const parentNodes = new Map();

  // Collect all potential parent prefixes
  for (const node of nodes) {
    const parts = node.data.fullName.split('.');

    // Build parent chain (e.g., com, com.example, com.example.app)
    for (let i = 1; i < parts.length; i++) {
      const prefix = parts.slice(0, i).join('.');

      // Skip if this prefix is actually a leaf package
      if (packageSet.has(prefix)) continue;

      if (!parentNodes.has(prefix)) {
        parentNodes.set(prefix, {
          data: {
            id: prefix,
            label: parts[i - 1], // Last segment of prefix
            fullName: prefix,
            fileCount: 0,
            isParent: true,
            isLeaf: false,
            childCount: 0,
            depth: i
          }
        });
      }
    }
  }

  // Count direct children for each parent
  const childCounts = new Map();
  for (const node of nodes) {
    const parts = node.data.fullName.split('.');

    // Find immediate parent
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join('.');
      if (parentNodes.has(prefix)) {
        childCounts.set(prefix, (childCounts.get(prefix) || 0) + 1);
        break;
      }
    }
  }

  // Also count parent-to-parent relationships
  for (const [prefix, parentNode] of parentNodes) {
    const parts = prefix.split('.');
    for (let i = parts.length - 1; i >= 1; i--) {
      const ancestorPrefix = parts.slice(0, i).join('.');
      if (parentNodes.has(ancestorPrefix)) {
        childCounts.set(ancestorPrefix, (childCounts.get(ancestorPrefix) || 0) + 1);
        break;
      }
    }
  }

  // Update child counts and filter by minGroupSize
  for (const [prefix, count] of childCounts) {
    if (parentNodes.has(prefix)) {
      parentNodes.get(prefix).data.childCount = count;
    }
  }

  // Filter parents by minGroupSize and maxDepth
  const validParents = new Map();
  for (const [prefix, parentNode] of parentNodes) {
    if (parentNode.data.childCount >= minGroupSize && parentNode.data.depth <= maxDepth) {
      validParents.set(prefix, parentNode);
    }
  }

  // Build result array with parent assignments
  const hierarchicalNodes = [];

  // Add leaf nodes with parent assignments
  for (const node of nodes) {
    const parts = node.data.fullName.split('.');

    // Find immediate valid parent
    let parent = null;
    for (let i = parts.length - 1; i >= 1; i--) {
      const prefix = parts.slice(0, i).join('.');
      if (validParents.has(prefix)) {
        parent = prefix;
        break;
      }
    }

    hierarchicalNodes.push({
      ...node,
      data: {
        ...node.data,
        parent: parent,
        isParent: false,
        isLeaf: true,
        depth: parts.length
      }
    });
  }

  // Add parent nodes with their parent assignments
  for (const [prefix, parentNode] of validParents) {
    const parts = prefix.split('.');

    // Find this parent's parent
    let grandparent = null;
    for (let i = parts.length - 1; i >= 1; i--) {
      const ancestorPrefix = parts.slice(0, i).join('.');
      if (validParents.has(ancestorPrefix)) {
        grandparent = ancestorPrefix;
        break;
      }
    }

    hierarchicalNodes.push({
      ...parentNode,
      data: {
        ...parentNode.data,
        parent: grandparent
      }
    });
  }

  return hierarchicalNodes;
}

/**
 * Aggregate file counts from children to parents
 * @param {Array} nodes - Nodes with parent relationships
 * @returns {Array} - Nodes with aggregated file counts
 */
function aggregateFileCounts(nodes) {
  const nodeMap = new Map(nodes.map(n => [n.data.id, n]));

  // Process from deepest to shallowest
  const sorted = [...nodes].sort((a, b) => (b.data.depth || 0) - (a.data.depth || 0));

  for (const node of sorted) {
    if (node.data.parent && nodeMap.has(node.data.parent)) {
      const parent = nodeMap.get(node.data.parent);
      parent.data.fileCount = (parent.data.fileCount || 0) + (node.data.fileCount || 0);
    }
  }

  return nodes;
}

/**
 * Propagate cycle status from children to parent nodes
 * @param {Array} nodes - Nodes with inCycle property
 * @returns {Array} - Nodes with hasChildInCycle property on parents
 */
function propagateCycleStatusToParents(nodes) {
  const nodeMap = new Map(nodes.map(n => [n.data.id, n]));

  for (const node of nodes) {
    if (node.data.inCycle && node.data.parent) {
      let current = node.data.parent;
      while (current && nodeMap.has(current)) {
        const parentNode = nodeMap.get(current);
        parentNode.data.hasChildInCycle = true;
        current = parentNode.data.parent;
      }
    }
  }

  return nodes;
}

module.exports = {
  buildHierarchy,
  aggregateFileCounts,
  propagateCycleStatusToParents
};
