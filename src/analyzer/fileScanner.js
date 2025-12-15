const { glob } = require('glob');
const path = require('path');

async function findJavaFiles(directory) {
  const pattern = path.join(directory, '**/*.java');
  const files = await glob(pattern, {
    nodir: true,
    ignore: [
      '**/node_modules/**',
      '**/build/**',
      '**/target/**',
      '**/bin/**',
      '**/out/**',
      '**/.gradle/**'
    ]
  });
  return files;
}

module.exports = { findJavaFiles };
