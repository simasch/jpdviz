const fs = require('fs').promises;

const PACKAGE_REGEX = /^\s*package\s+([\w.]+)\s*;/m;
const IMPORT_REGEX = /^\s*import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;/gm;

async function parseJavaFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract package declaration
  const packageMatch = content.match(PACKAGE_REGEX);
  const packageName = packageMatch ? packageMatch[1] : '(default)';

  // Extract imports
  const imports = [];
  let match;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const importPath = match[1];
    // Convert class import to package (remove class name)
    // e.g., "com.example.foo.SomeClass" -> "com.example.foo"
    // e.g., "com.example.foo.*" -> "com.example.foo"
    let packagePart;
    if (importPath.endsWith('.*')) {
      packagePart = importPath.slice(0, -2);
    } else {
      const lastDot = importPath.lastIndexOf('.');
      packagePart = lastDot > 0 ? importPath.substring(0, lastDot) : null;
    }

    if (packagePart && packagePart.includes('.')) {
      imports.push(packagePart);
    }
  }

  return {
    filePath,
    package: packageName,
    imports: [...new Set(imports)] // Remove duplicates
  };
}

module.exports = { parseJavaFile };
