document.addEventListener('DOMContentLoaded', () => {
  // Layout selector
  document.getElementById('layout-select').addEventListener('change', (e) => {
    const layoutName = e.target.value;
    const layoutOptions = getLayoutOptions(layoutName);
    cy.layout(layoutOptions).run();
  });

  // Fit button
  document.getElementById('fit-btn').addEventListener('click', () => {
    cy.fit(50);
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    const png = cy.png({
      scale: 2,
      bg: '#1a1a2e',
      full: true
    });
    const link = document.createElement('a');
    link.href = png;
    link.download = 'package-dependencies.png';
    link.click();
  });

  // Show Cycles toggle button
  let cyclesHighlighted = false;
  document.getElementById('show-cycles-btn').addEventListener('click', () => {
    const btn = document.getElementById('show-cycles-btn');

    if (!cycleData || cycleData.count === 0) {
      alert('No circular dependencies detected in this project.');
      return;
    }

    cyclesHighlighted = !cyclesHighlighted;

    if (cyclesHighlighted) {
      btn.textContent = 'Hide Cycles';
      btn.classList.add('active');
      // Fade non-cycle elements and highlight cycle elements
      cy.nodes('[!inCycle]').addClass('faded');
      cy.edges('[!inCycle]').addClass('faded');
      cy.nodes('[?inCycle]').addClass('cycle-highlighted');
      cy.edges('[?inCycle]').addClass('cycle-highlighted');
    } else {
      btn.textContent = 'Show Cycles';
      btn.classList.remove('active');
      // Clear all highlights
      cy.elements().removeClass('faded cycle-highlighted');
    }
  });

  // Expand All button
  document.getElementById('expand-all-btn').addEventListener('click', () => {
    if (typeof expandAll === 'function') {
      expandAll();
    }
  });

  // Collapse All button
  document.getElementById('collapse-all-btn').addEventListener('click', () => {
    if (typeof collapseAll === 'function') {
      collapseAll();
    }
  });
});

function getLayoutOptions(name) {
  const layouts = {
    dagre: {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 80,
      edgeSep: 10,
      padding: 30,
      animate: true,
      animationDuration: 500
    },
    cose: {
      name: 'cose',
      animate: true,
      animationDuration: 500,
      nodeRepulsion: 400000,
      idealEdgeLength: 100,
      edgeElasticity: 100,
      gravity: 80,
      numIter: 1000,
      padding: 30
    },
    breadthfirst: {
      name: 'breadthfirst',
      directed: true,
      padding: 30,
      spacingFactor: 1.5,
      animate: true,
      animationDuration: 500
    },
    circle: {
      name: 'circle',
      padding: 30,
      animate: true,
      animationDuration: 500
    },
    grid: {
      name: 'grid',
      padding: 30,
      animate: true,
      animationDuration: 500,
      rows: undefined,
      cols: undefined
    }
  };

  return layouts[name] || layouts.dagre;
}
