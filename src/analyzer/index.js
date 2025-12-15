const { findJavaFiles } = require('./fileScanner');
const { parseJavaFile } = require('./javaParser');
const { buildDependencyGraph } = require('./dependencyGraph');

async function analyze(directory, options = {}) {
  console.log(`Scanning for Java files in: ${directory}`);

  // Step 1: Find all Java files
  const javaFiles = await findJavaFiles(directory);
  console.log(`Found ${javaFiles.length} Java files`);

  if (javaFiles.length === 0) {
    console.log('No Java files found in the specified directory.');
    return { nodes: [], edges: [] };
  }

  // Step 2: Parse each file
  const parsedFiles = await Promise.all(
    javaFiles.map(file => parseJavaFile(file))
  );
  console.log(`Parsed ${parsedFiles.length} files`);

  // Step 3: Build dependency graph
  const graph = buildDependencyGraph(parsedFiles, options);
  console.log(`Graph: ${graph.nodes.length} packages, ${graph.edges.length} dependencies`);

  return graph;
}

module.exports = { analyze };
