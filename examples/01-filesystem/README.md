# Filesystem Example

This example demonstrates using the `alloy-lang` JavaScript library to run an Alloy model and explore the results programmatically.

## The Model

The `filesystem.als` file contains a simple structural model from the [Practical Alloy](https://practicalalloy.github.io/) book. It models a basic filesystem with:

- **Object**: An abstract signature representing any filesystem object
- **Dir**: A directory, which can contain entries
- **File**: A file (no contents modeled)
- **Root**: A singleton representing the filesystem root directory
- **Entry**: Maps a name to an object within a directory
- **Name**: Represents names for filesystem objects

## The JavaScript

The `filesystem.js` file demonstrates:

1. Reading an Alloy model from a file
2. Executing the model using `alloy.eval()`
3. Exploring the results:
   - Checking execution metadata (duration, number of instances)
   - Examining the values in a generated instance
   - Categorizing objects by type (directories, files, entries, names)
   - Displaying the full instance structure

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
node filesystem.js
```

From the repository root:

```bash
node examples/01-filesystem/filesystem.js
```

## Sample Output

When you run the example, you'll see:

1. **Execution Summary**: Shows how long it took to find instances and how many were found
2. **Object Breakdown**: Categorizes the found objects:
   - Directories (including the Root)
   - Files
   - Entries (directory entries mapping names to objects)
   - Names (the names used in the filesystem)
3. **Full Instance Data**: The complete JSON structure showing all relationships

For example, you might see:
- A Root directory
- Several Entry objects (e.g., Entry$0, Entry$1, Entry$2, Entry$3)
- Name objects representing filesystem names
- The relationships showing which entries map to which names and objects

The full instance data reveals the internal structure, showing how each Entry has:
- A `name` field pointing to a Name
- An `object` field pointing to either a File or Dir

## Learning Points

This example shows how to:
- Load Alloy models from files in your JavaScript code
- Execute models and retrieve instances
- Programmatically explore the structure of generated instances
- Filter and categorize the objects in an instance
