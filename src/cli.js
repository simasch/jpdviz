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
  .option('-c, --cycles', 'Report circular dependencies to console', false)
  .option('-H, --hierarchy', 'Enable hierarchical package grouping (compound nodes)', false)
  .option('--min-group <number>', 'Minimum packages to form a group (default: 2)', '2')
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
        exclude: options.exclude || [],
        hierarchy: options.hierarchy,
        hierarchyOptions: {
          minGroupSize: parseInt(options.minGroup, 10) || 2
        }
      });

      if (graphData.nodes.length === 0) {
        console.error('No packages found to visualize. Make sure the directory contains Java files with package declarations.');
        process.exit(1);
      }

      // Report cycles to console if requested
      if (options.cycles && graphData.cycles && graphData.cycles.length > 0) {
        console.log('\n' + '='.repeat(50));
        console.log('CIRCULAR DEPENDENCIES DETECTED');
        console.log('='.repeat(50) + '\n');

        graphData.cycleInfo.forEach((info, index) => {
          console.log(`Cycle ${index + 1} (${info.size} packages):`);
          info.packages.forEach(pkg => console.log(`  - ${pkg}`));
          console.log('  Edges causing cycle:');
          info.edges.forEach(edge => {
            console.log(`    ${edge.from} -> ${edge.to} (${edge.weight} import${edge.weight > 1 ? 's' : ''})`);
          });
          console.log('');
        });

        console.log('='.repeat(50) + '\n');
      } else if (options.cycles) {
        console.log('\nNo circular dependencies detected.\n');
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
