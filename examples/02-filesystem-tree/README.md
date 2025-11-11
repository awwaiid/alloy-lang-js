# Filesystem Tree Example

This example demonstrates a hierarchical filesystem model with subdirectories and visualizes the generated instances as a file tree.

## The Model

The `filesystem-tree.als` file contains an enhanced filesystem model that supports subdirectories. It builds upon the basic filesystem concepts to create a true hierarchical tree structure with:

- **Object**: An abstract signature representing any filesystem object
- **Dir**: A directory that can contain entries pointing to files or other directories
- **File**: A file (leaf node in the tree)
- **Root**: A singleton representing the filesystem root directory
- **Entry**: Maps a name to an object within a directory
- **Name**: Represents names for filesystem objects

### Key Features

The model enforces proper tree structure through several constraints:

1. **Single Parent**: Every object (except Root) is referenced by exactly one entry
2. **Root Isolation**: The Root directory has no parent
3. **Entry Ownership**: All entries belong to some directory
4. **Acyclic**: No directory can be its own ancestor (prevents circular references)
5. **Unique Names**: Each directory has unique names for its entries

The model is configured to generate instances with exactly 3 directories and 4 files, creating interesting hierarchical structures.

## The JavaScript

The `filesystem-tree.js` file demonstrates:

1. **Reading and executing** the Alloy model
2. **Parsing instance data** into a structured format (directories, files, entries, names)
3. **Building a tree structure** by analyzing parent-child relationships through entries
4. **Visualizing the filesystem** as a text-based tree with:
   - 📁 Directory icons
   - 📄 File icons
   - Tree branches (├──, └──, │) for visual hierarchy
   - Recursive traversal of subdirectories

## Setup

First, install dependencies:

```bash
npm install
```

This will install the `alloy-lang` package from npm.

## Running the Example

From this directory:

```bash
npm start
# or
node filesystem-tree.js
```

From the repository root:

```bash
node examples/02-filesystem-tree/filesystem-tree.js
```

## Sample Output

When you run the example, you'll see:

1. **Execution Summary**: Duration and number of instances found
2. **File Tree Visualization**: Each instance displayed as a hierarchical tree structure
3. **Raw Data**: Count of directories, files, entries, and names

Example tree output:
```
Filesystem Tree:

└── 📁 /
    ├── 📄 Name$0
    ├── 📁 Name$1
    │   ├── 📄 Name$2
    │   └── 📄 Name$3
    └── 📄 Name$4
```

## Learning Points

This example shows how to:
- Model hierarchical data structures in Alloy with proper constraints
- Prevent cycles and ensure tree properties using Alloy facts
- Parse and navigate complex relational data from Alloy instances
- Build tree structures from relational data in JavaScript
- Visualize hierarchical data in a user-friendly format
- Work with transitive closure (`^`) in Alloy to enforce acyclic constraints

## Comparison with Example 01

While the first filesystem example (`01-filesystem`) demonstrates basic Alloy concepts with a flat structure, this example shows:
- **Hierarchical modeling**: Directories containing other directories
- **Tree constraints**: Enforcing proper parent-child relationships
- **Advanced visualization**: Rendering nested structures as trees
- **Transitive relationships**: Using Alloy's closure operator to prevent cycles

This makes it a great next step after understanding the basics!
