function buildDependencyGraph(parsedFiles, options = {}) {
  const { exclude = [] } = options;

  // Collect all unique packages in the project
  const projectPackages = new Set(
    parsedFiles.map(f => f.package).filter(p => p !== '(default)')
  );

  // Build nodes and edges
  const nodes = new Map();
  const edges = new Map();

  for (const file of parsedFiles) {
    const sourcePackage = file.package;

    // Skip default package and excluded packages
    if (sourcePackage === '(default)') continue;
    if (shouldExclude(sourcePackage, exclude)) continue;

    // Add source package as node
    if (!nodes.has(sourcePackage)) {
      nodes.set(sourcePackage, {
        data: {
          id: sourcePackage,
          label: getShortName(sourcePackage),
          fullName: sourcePackage,
          fileCount: 0
        }
      });
    }
    nodes.get(sourcePackage).data.fileCount++;

    // Process imports
    for (const importedPackage of file.imports) {
      if (shouldExclude(importedPackage, exclude)) continue;
      if (importedPackage === sourcePackage) continue; // Skip self-references

      // Only include internal dependencies (packages within the project)
      const isInternal = projectPackages.has(importedPackage);

      if (isInternal) {
        // Ensure imported package node exists
        if (!nodes.has(importedPackage)) {
          nodes.set(importedPackage, {
            data: {
              id: importedPackage,
              label: getShortName(importedPackage),
              fullName: importedPackage,
              fileCount: 0
            }
          });
        }

        // Add edge
        const edgeId = `${sourcePackage}->${importedPackage}`;
        if (!edges.has(edgeId)) {
          edges.set(edgeId, {
            data: {
              id: edgeId,
              source: sourcePackage,
              target: importedPackage,
              weight: 0
            }
          });
        }
        edges.get(edgeId).data.weight++;
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values())
  };
}

function getShortName(packageName) {
  const parts = packageName.split('.');
  // Show last 2 segments for readability
  return parts.length > 2 ? parts.slice(-2).join('.') : packageName;
}

function shouldExclude(packageName, excludePatterns) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return regex.test(packageName);
    }
    return packageName.startsWith(pattern);
  });
}

module.exports = { buildDependencyGraph };
