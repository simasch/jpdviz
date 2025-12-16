let cy;
let cycleData = null;
const collapsedNodes = new Set();

async function initGraph() {
  // Fetch graph data from server
  const response = await fetch('/api/graph');
  const graphData = await response.json();

  // Fetch cycle data
  const cycleResponse = await fetch('/api/cycles');
  cycleData = await cycleResponse.json();

  // Initialize Cytoscape
  cy = cytoscape({
    container: document.getElementById('cy'),

    elements: {
      nodes: graphData.nodes,
      edges: graphData.edges
    },

    style: [
      // Node styles
      {
        selector: 'node',
        style: {
          'background-color': '#4a90d9',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '11px',
          'color': '#fff',
          'text-outline-color': '#4a90d9',
          'text-outline-width': 2,
          'width': 'mapData(fileCount, 1, 20, 50, 120)',
          'height': 'mapData(fileCount, 1, 20, 50, 120)',
          'border-width': 2,
          'border-color': '#2d6cb5'
        }
      },
      // Highlighted node
      {
        selector: 'node:selected',
        style: {
          'background-color': '#e94560',
          'border-width': 3,
          'border-color': '#c73e54',
          'text-outline-color': '#e94560'
        }
      },
      // Faded nodes (not connected to selected)
      {
        selector: 'node.faded',
        style: {
          'opacity': 0.3
        }
      },
      // Connected nodes
      {
        selector: 'node.connected',
        style: {
          'opacity': 1,
          'border-color': '#e94560',
          'border-width': 2
        }
      },
      // Edge styles
      {
        selector: 'edge',
        style: {
          'width': 'mapData(weight, 1, 10, 1, 4)',
          'line-color': '#4a5568',
          'target-arrow-color': '#4a5568',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1
        }
      },
      // Faded edges
      {
        selector: 'edge.faded',
        style: {
          'opacity': 0.15
        }
      },
      // Outgoing edges (dependencies)
      {
        selector: 'edge.outgoing',
        style: {
          'line-color': '#e94560',
          'target-arrow-color': '#e94560',
          'width': 3,
          'opacity': 1
        }
      },
      // Incoming edges (dependents)
      {
        selector: 'edge.incoming',
        style: {
          'line-color': '#27ae60',
          'target-arrow-color': '#27ae60',
          'width': 3,
          'opacity': 1
        }
      },
      // Nodes in a cycle
      {
        selector: 'node[?inCycle]',
        style: {
          'border-color': '#ff4444',
          'border-width': 4
        }
      },
      // Edges in a cycle
      {
        selector: 'edge[?inCycle]',
        style: {
          'line-color': '#ff6b6b',
          'target-arrow-color': '#ff6b6b',
          'line-style': 'dashed'
        }
      },
      // Cycle highlighted state
      {
        selector: '.cycle-highlighted',
        style: {
          'opacity': 1
        }
      },
      // Parent (compound) nodes
      {
        selector: 'node[?isParent]',
        style: {
          'background-color': '#2d3748',
          'background-opacity': 0.7,
          'border-color': '#4a5568',
          'border-width': 2,
          'text-valign': 'top',
          'text-halign': 'center',
          'font-size': '10px',
          'color': '#a0aec0',
          'padding': '20px',
          'shape': 'roundrectangle',
          'text-margin-y': -5
        }
      },
      // Collapsed parent nodes
      {
        selector: 'node[?isParent].collapsed',
        style: {
          'background-color': '#4a5568',
          'border-color': '#718096',
          'text-valign': 'center',
          'padding': '10px'
        }
      },
      // Parent nodes with children in a cycle
      {
        selector: 'node[?hasChildInCycle]',
        style: {
          'border-color': '#ff8800',
          'border-width': 3,
          'border-style': 'dashed'
        }
      },
      // Hidden elements (collapsed children)
      {
        selector: '.hidden',
        style: {
          'display': 'none'
        }
      }
    ],

    layout: {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      edgeSep: 10,
      rankSep: 80,
      padding: 30,
      animate: true,
      animationDuration: 500
    },

    // Interaction settings
    minZoom: 0.1,
    maxZoom: 3,
    wheelSensitivity: 0.3
  });

  // Event handlers
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    showPackageInfo(node);
    highlightConnections(node);
  });

  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      clearHighlights();
      clearPackageInfo();
    }
  });

  // Double-tap on parent nodes to collapse/expand
  cy.on('doubleTap', 'node[?isParent]', function(evt) {
    const node = evt.target;
    const nodeId = node.data('id');

    if (collapsedNodes.has(nodeId)) {
      expandNode(node);
    } else {
      collapseNode(node);
    }
  });

  // Update stats
  updateStats(graphData);
}

function showPackageInfo(node) {
  const data = node.data();
  const incoming = cy.edges(`[target = "${data.id}"]`);
  const outgoing = cy.edges(`[source = "${data.id}"]`);

  const dependsOn = outgoing.map(e => e.target().data('label')).sort();
  const usedBy = incoming.map(e => e.source().data('label')).sort();

  let infoHtml = `
    <p><strong>Package:</strong><br>${data.fullName}</p>
    <p><strong>Files:</strong> ${data.fileCount || 0}</p>
  `;

  // Show hierarchy info for parent nodes
  if (data.isParent) {
    const childCount = data.childCount || 0;
    infoHtml += `
      <p><strong>Type:</strong> Group</p>
      <p><strong>Children:</strong> ${childCount}</p>
      <p class="hint">Double-click to ${collapsedNodes.has(data.id) ? 'expand' : 'collapse'}</p>
    `;
  } else {
    infoHtml += `
      <p><strong>Dependencies:</strong> ${outgoing.length}</p>
      <p><strong>Dependents:</strong> ${incoming.length}</p>
    `;
  }

  if (dependsOn.length > 0) {
    infoHtml += `
      <h4>Depends on:</h4>
      <ul>${dependsOn.map(name => `<li>${name}</li>`).join('')}</ul>
    `;
  }

  if (usedBy.length > 0) {
    infoHtml += `
      <h4>Used by:</h4>
      <ul>${usedBy.map(name => `<li>${name}</li>`).join('')}</ul>
    `;
  }

  // Show cycle information if this node is in a cycle
  if (data.inCycle && cycleData && cycleData.cycleInfo) {
    const cycleInfo = cycleData.cycleInfo.find(c => c.index === data.cycleIndex);
    if (cycleInfo) {
      infoHtml += `
        <h4 class="cycle-warning">Circular Dependency</h4>
        <p>Part of a cycle with ${cycleInfo.size} packages:</p>
        <ul class="cycle-list">
          ${cycleInfo.packages.map(pkg => `<li>${pkg}</li>`).join('')}
        </ul>
      `;
    }
  }

  document.getElementById('package-info').innerHTML = infoHtml;
}

function highlightConnections(node) {
  clearHighlights();

  const nodeId = node.data('id');

  // Get connected edges
  const outgoing = cy.edges(`[source = "${nodeId}"]`);
  const incoming = cy.edges(`[target = "${nodeId}"]`);

  // Get connected nodes
  const connectedNodes = new Set();
  connectedNodes.add(nodeId);
  outgoing.forEach(e => connectedNodes.add(e.target().data('id')));
  incoming.forEach(e => connectedNodes.add(e.source().data('id')));

  // Fade all elements first
  cy.elements().addClass('faded');

  // Highlight connected nodes
  cy.nodes().forEach(n => {
    if (connectedNodes.has(n.data('id'))) {
      n.removeClass('faded').addClass('connected');
    }
  });

  // Highlight edges
  outgoing.removeClass('faded').addClass('outgoing');
  incoming.removeClass('faded').addClass('incoming');

  // Selected node should not be faded
  node.removeClass('faded').removeClass('connected');
}

function clearHighlights() {
  cy.elements().removeClass('faded outgoing incoming connected');
}

function clearPackageInfo() {
  document.getElementById('package-info').innerHTML = 'Click a package to see details';
}

function updateStats(graphData) {
  let statsHtml = `${graphData.nodes.length} packages | ${graphData.edges.length} dependencies`;
  if (cycleData && cycleData.count > 0) {
    statsHtml += ` | <span class="cycle-warning">${cycleData.count} cycle${cycleData.count > 1 ? 's' : ''}</span>`;
  }
  document.getElementById('stats').innerHTML = statsHtml;
}

// Collapse a parent node (hide its children)
function collapseNode(parentNode) {
  const nodeId = parentNode.data('id');

  // Find all descendant nodes (children, grandchildren, etc.)
  const descendants = cy.nodes().filter(n => {
    let current = n.data('parent');
    while (current) {
      if (current === nodeId) return true;
      const parentNodeObj = cy.getElementById(current);
      if (parentNodeObj.length === 0) break;
      current = parentNodeObj.data('parent');
    }
    return false;
  });

  // Hide descendants and their connected edges
  descendants.addClass('hidden');
  descendants.connectedEdges().addClass('hidden');

  // Mark as collapsed
  parentNode.addClass('collapsed');
  collapsedNodes.add(nodeId);
}

// Expand a parent node (show its children)
function expandNode(parentNode) {
  const nodeId = parentNode.data('id');

  // Find immediate children only
  const children = cy.nodes().filter(n => n.data('parent') === nodeId);

  // Show children (but not their children if they're collapsed)
  children.forEach(child => {
    const childId = child.data('id');
    if (!collapsedNodes.has(childId)) {
      child.removeClass('hidden');
    } else {
      // Still show the collapsed parent itself
      child.removeClass('hidden');
    }
  });

  // Show edges between visible nodes
  cy.edges().forEach(edge => {
    const source = edge.source();
    const target = edge.target();
    if (!source.hasClass('hidden') && !target.hasClass('hidden')) {
      edge.removeClass('hidden');
    }
  });

  // Mark as expanded
  parentNode.removeClass('collapsed');
  collapsedNodes.delete(nodeId);
}

// Expand all parent nodes
function expandAll() {
  cy.nodes('[?isParent]').forEach(node => {
    if (collapsedNodes.has(node.data('id'))) {
      expandNode(node);
    }
  });
}

// Collapse all parent nodes (from deepest to shallowest)
function collapseAll() {
  const parents = cy.nodes('[?isParent]').sort((a, b) =>
    (b.data('depth') || 0) - (a.data('depth') || 0)
  );

  parents.forEach(node => {
    if (!collapsedNodes.has(node.data('id'))) {
      collapseNode(node);
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGraph);
