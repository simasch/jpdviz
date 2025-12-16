const express = require('express');
const path = require('path');

function startServer(graphData, options = {}) {
  const { port = 3000, open: autoOpen = true } = options;
  const app = express();

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));

  // API endpoint for graph data
  app.get('/api/graph', (req, res) => {
    res.json({
      nodes: graphData.nodes,
      edges: graphData.edges
    });
  });

  // API endpoint for cycle detection results
  app.get('/api/cycles', (req, res) => {
    res.json({
      count: graphData.cycles ? graphData.cycles.length : 0,
      cycles: graphData.cycles || [],
      cycleInfo: graphData.cycleInfo || []
    });
  });

  // API endpoint for graph statistics
  app.get('/api/stats', (req, res) => {
    res.json({
      nodeCount: graphData.nodes.length,
      edgeCount: graphData.edges.length,
      cycleCount: graphData.cycles ? graphData.cycles.length : 0,
      packages: graphData.nodes.map(n => n.data.fullName).sort()
    });
  });

  const server = app.listen(port, async () => {
    const url = `http://localhost:${port}`;
    console.log(`\nVisualization server running at ${url}`);
    console.log('Press Ctrl+C to stop the server\n');

    if (autoOpen) {
      const open = (await import('open')).default;
      open(url);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      process.exit(0);
    });
  });
}

module.exports = { startServer };
