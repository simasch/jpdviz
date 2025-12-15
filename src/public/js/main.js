let cy;

async function initGraph() {
  // Fetch graph data from server
  const response = await fetch('/api/graph');
  const graphData = await response.json();

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
    <p><strong>Files:</strong> ${data.fileCount}</p>
    <p><strong>Dependencies:</strong> ${outgoing.length}</p>
    <p><strong>Dependents:</strong> ${incoming.length}</p>
  `;

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
  document.getElementById('stats').innerHTML =
    `${graphData.nodes.length} packages | ${graphData.edges.length} dependencies`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initGraph);
