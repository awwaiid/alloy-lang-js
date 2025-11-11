const alloy = require('alloy-lang');
const { readFileSync } = require('fs');
const { join } = require('path');

// Read the Alloy model file
const alloyModel = readFileSync(join(__dirname, 'filesystem-tree.als'), 'utf-8');

console.log('Running Alloy filesystem tree model...\n');

// Execute the Alloy model
const result = alloy.eval(alloyModel);

console.log('=== Execution Summary ===');
console.log(`Duration: ${result.duration}ms`);
console.log(`Number of instances found: ${result.instances.length}`);
console.log();

/**
 * Parse instance data into a structured format
 */
function parseInstance(instance) {
  const dirs = new Map();
  const files = new Set();
  const entries = new Map();
  const names = new Map();

  // Extract all values from the instance
  for (const [key, value] of Object.entries(instance.values)) {
    if (key.startsWith('Dir$') || key === 'Root$0') {
      dirs.set(key, value);
    } else if (key.startsWith('File$')) {
      files.add(key);
    } else if (key.startsWith('Entry$')) {
      // Entry data format: { name: [["Name$X"]], object: [["Object$Y"]] }
      const entryInfo = {
        name: value.name && value.name[0] ? value.name[0][0] : null,
        object: value.object && value.object[0] ? value.object[0][0] : null
      };
      entries.set(key, entryInfo);
    } else if (key.startsWith('Name$')) {
      names.set(key, value);
    }
  }

  return { dirs, files, entries, names };
}

/**
 * Build a tree structure from the parsed data
 */
function buildTree(parsed) {
  const { dirs, files, entries } = parsed;
  const tree = new Map();

  // Initialize tree structure for each directory
  dirs.forEach((dirData, dirId) => {
    tree.set(dirId, {
      id: dirId,
      type: 'dir',
      children: [],
      entries: dirData.entries || []
    });
  });

  // Add files to tree
  files.forEach(fileId => {
    tree.set(fileId, {
      id: fileId,
      type: 'file',
      children: []
    });
  });

  // Process entries to build parent-child relationships
  entries.forEach((entryData, entryId) => {
    // Find which directory this entry belongs to
    let parentDir = null;
    dirs.forEach((dirData, dirId) => {
      // Check if this directory's entries field references this entry
      // The entries field in Alloy output format is either undefined or [[entryIds...]]
      if (dirData.entries) {
        // Flatten the nested array structure from Alloy
        const flatEntries = dirData.entries.flat(Infinity);
        if (flatEntries.includes(entryId)) {
          parentDir = dirId;
        }
      }
    });

    if (parentDir && entryData && tree.has(parentDir)) {
      tree.get(parentDir).children.push({
        name: entryData.name,
        object: entryData.object,
        node: tree.get(entryData.object)
      });
    }
  });

  return tree;
}

/**
 * Find the root directory in the tree
 */
function findRoot(tree) {
  for (const [id, node] of tree.entries()) {
    if (id === 'Root$0' || id.startsWith('Root$')) {
      return { id, node };
    }
  }
  return null;
}

/**
 * Render a tree structure as text
 */
function renderTree(node, tree, prefix = '', isRoot = true) {
  const lines = [];

  // Render current node
  if (isRoot) {
    const icon = '📁';
    lines.push(`${icon} /`);
  }

  // Render children
  const children = node.children || [];
  children.forEach((child, index) => {
    const isLast = index === children.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childNode = tree.get(child.object);

    if (childNode) {
      const childIcon = childNode.type === 'dir' ? '📁' : '📄';
      const childName = child.name || child.object;
      lines.push(`${prefix}${connector}${childIcon} ${childName}`);

      // Recursively render subdirectories
      if (childNode.type === 'dir' && childNode.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const subLines = renderTree(childNode, tree, newPrefix, false);
        lines.push(...subLines);
      }
    }
  });

  return lines;
}

// Process and display each instance
result.instances.forEach((instance, index) => {
  console.log(`=== Instance ${index + 1} ===\n`);

  const parsed = parseInstance(instance);
  const tree = buildTree(parsed);
  const root = findRoot(tree);

  if (root) {
    console.log('Filesystem Tree:\n');
    const treeLines = renderTree(root.node, tree);
    console.log(treeLines.join('\n'));
  } else {
    console.log('No root directory found in this instance.');
  }

  console.log('\n--- Summary ---');
  console.log(`Directories: ${parsed.dirs.size}`);
  console.log(`Files: ${parsed.files.size}`);
  console.log(`Entries: ${parsed.entries.size}`);
  console.log(`Names: ${parsed.names.size}`);
  console.log();
});

console.log('Total instances displayed: ${result.instances.length}');
