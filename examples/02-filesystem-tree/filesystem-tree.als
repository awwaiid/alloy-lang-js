module filesystem_tree

// Abstract base for all filesystem objects
abstract sig Object {}

// Directory can contain entries pointing to files or other directories
sig Dir extends Object {
  entries : set Entry
}

// Files are leaf nodes
sig File extends Object {}

// Single root directory for the filesystem
one sig Root extends Dir {}

// Entry maps a name to an object within a directory
sig Entry {
  object : one Object,
  name   : one Name
}

// Names for filesystem objects
sig Name {}

// Facts to enforce tree structure

// All entries belong to some directory
fact entriesBelongToDirectories {
  all e: Entry | one d: Dir | e in d.entries
}

// Root is not in any entry (it's the top of the tree)
fact rootHasNoParent {
  no e: Entry | e.object = Root
}

// Each directory has unique names for its entries
fact uniqueNamesPerDirectory {
  all d: Dir | all disj e1, e2: d.entries | e1.name != e2.name
}

// Constraint: Root should have at least one entry to make instances interesting
fact rootHasEntries {
  #Root.entries > 0
}

// Generate instances with a reasonable tree structure
run example {} for 4
