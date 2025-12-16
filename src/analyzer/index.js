const { findJavaFiles } = require('./fileScanner');
const { parseJavaFile } = require('./javaParser');
const { buildDependencyGraph } = require('./dependencyGraph');
const { detectCycles, markCycleElements } = require('./cycleDetector');
const { propagateCycleStatusToParents } = require('./hierarchyBuilder');

async function analyze(directory, options = {}) {
  console.log(`Scanning for Java files in: ${directory}`);

  // Step 1: Find all Java files
  const javaFiles = await findJavaFiles(directory);
  console.log(`Found ${javaFiles.length} Java files`);

  if (javaFiles.length === 0) {
    console.log('No Java files found in the specified directory.');
    return { nodes: [], edges: [], cycles: [], cycleInfo: [] };
  }

  // Step 2: Parse each file
  const parsedFiles = await Promise.all(
    javaFiles.map(file => parseJavaFile(file))
  );
  console.log(`Parsed ${parsedFiles.length} files`);

  // Step 3: Build dependency graph
  const graph = buildDependencyGraph(parsedFiles, options);
  console.log(`Graph: ${graph.nodes.length} packages, ${graph.edges.length} dependencies`);

  // Step 4: Detect cycles
  const { cycles, cycleInfo } = detectCycles(graph);
  if (cycles.length > 0) {
    console.log(`Detected ${cycles.length} circular dependency group(s)`);
  }

  // Step 5: Mark cycle elements in graph
  let markedGraph = markCycleElements(graph, cycles);

  // Step 6: If hierarchy is enabled and cycles exist, propagate cycle status to parents
  if (options.hierarchy && cycles.length > 0) {
    markedGraph.nodes = propagateCycleStatusToParents(markedGraph.nodes);
  }

  // Log hierarchy info if enabled
  if (options.hierarchy) {
    const parentCount = markedGraph.nodes.filter(n => n.data.isParent).length;
    console.log(`Hierarchy: ${parentCount} parent groups created`);
  }

  return {
    ...markedGraph,
    cycles,
    cycleInfo
  };
}

module.exports = { analyze };
