#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { analyze } = require('./analyzer');
const { startServer } = require('./server');

program
  .name('pkgviz')
  .description('Visualize Java package dependencies with Cytoscape.js')
  .argument('<directory>', 'Path to Java project/source directory')
  .option('-p, --port <number>', 'Server port', '3000')
  .option('-o, --open', 'Auto-open browser', true)
  .option('--no-open', 'Do not auto-open browser')
  .option('-e, --exclude <patterns...>', 'Package patterns to exclude (e.g., "java.*" "javax.*")')
  .action(async (directory, options) => {
    try {
      const absolutePath = path.resolve(directory);

      // Verify directory exists
      if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Directory not found: ${absolutePath}`);
        process.exit(1);
      }

      if (!fs.statSync(absolutePath).isDirectory()) {
        console.error(`Error: Not a directory: ${absolutePath}`);
        process.exit(1);
      }

      const graphData = await analyze(absolutePath, {
        exclude: options.exclude || []
      });

      if (graphData.nodes.length === 0) {
        console.error('No packages found to visualize. Make sure the directory contains Java files with package declarations.');
        process.exit(1);
      }

      startServer(graphData, {
        port: parseInt(options.port, 10),
        open: options.open
      });
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
