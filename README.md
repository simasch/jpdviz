# Java Package Dependency Visualizer

A CLI tool that analyzes Java package dependencies and visualizes them interactively using Cytoscape.js.

## Installation

```bash
npm install
```

## Usage

```bash
node src/cli.js <path-to-java-project>
```

This will:

1. Scan the directory for all `.java` files
2. Parse package declarations and import statements
3. Build a dependency graph
4. Start a local web server
5. Open your browser with an interactive visualization

### Options

| Option                        | Description                 | Default |
|-------------------------------|-----------------------------|---------|
| `-p, --port <number>`         | Server port                 | 3000    |
| `-o, --open`                  | Auto-open browser           | true    |
| `--no-open`                   | Don't auto-open browser     | -       |
| `-e, --exclude <patterns...>` | Package patterns to exclude | -       |

### Examples

```bash
# Basic usage
node src/cli.js ~/projects/my-java-app

# Custom port
node src/cli.js ~/projects/my-java-app --port 8080

# Don't auto-open browser
node src/cli.js ~/projects/my-java-app --no-open

# Exclude standard library packages
node src/cli.js ~/projects/my-java-app --exclude "java.*" "javax.*" "sun.*"
```

## Features

### Interactive Graph

- **Click** a package node to see its dependencies and dependents
- **Drag** nodes to rearrange the layout
- **Scroll** to zoom in/out
- **Pan** by dragging the background

### Visual Encoding

- **Node size**: Proportional to the number of files in the package
- **Edge width**: Proportional to the number of imports between packages
- **Red edges**: Outgoing dependencies (this package depends on...)
- **Green edges**: Incoming dependencies (...depends on this package)

### Layout Options

Switch between 5 layout algorithms:

| Layout                    | Best For                                 |
|---------------------------|------------------------------------------|
| **Hierarchical (Dagre)**  | Showing dependency direction clearly     |
| **Force-Directed (COSE)** | Exploring clusters and overall structure |
| **Breadth-First**         | Tree-like hierarchies                    |
| **Circle**                | Seeing all packages equally              |
| **Grid**                  | Dense graphs with many packages          |

### Export

Click "Export PNG" to save the current graph as an image.

## How It Works

1. **File Scanner**: Recursively finds all `*.java` files (ignoring build directories)
2. **Java Parser**: Extracts `package` declarations and `import` statements using regex
3. **Graph Builder**: Creates nodes for each package and edges for dependencies
4. **Web Server**: Serves the visualization and provides graph data via `/api/graph`
5. **Cytoscape.js**: Renders the interactive graph in the browser

## API Endpoints

| Endpoint         | Description                                  |
|------------------|----------------------------------------------|
| `GET /`          | Web visualization                            |
| `GET /api/graph` | Graph data (nodes and edges)                 |
| `GET /api/stats` | Statistics (package count, dependency count) |

## Project Structure

```
pkgviz2/
├── package.json
├── README.md
└── src/
    ├── cli.js                  # CLI entry point
    ├── server.js               # Express web server
    ├── analyzer/
    │   ├── index.js            # Main orchestrator
    │   ├── fileScanner.js      # Find *.java files
    │   ├── javaParser.js       # Parse package/imports
    │   └── dependencyGraph.js  # Build graph structure
    └── public/
        ├── index.html
        ├── css/styles.css
        └── js/
            ├── main.js         # Cytoscape initialization
            └── controls.js     # UI controls
```

