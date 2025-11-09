const alloy = require('alloy-lang');
const { readFileSync } = require('fs');
const { join } = require('path');

// __dirname is available in CommonJS modules

// Read the Alloy model file
const alloyModel = readFileSync(join(__dirname, 'filesystem.als'), 'utf-8');

console.log('Running Alloy filesystem model...\n');

// Execute the Alloy model
const result = alloy.eval(alloyModel);

console.log('=== Execution Summary ===');
console.log(`Duration: ${result.duration}ms`);
console.log(`Number of instances found: ${result.instances.length}`);
console.log();

// Explore the first instance
if (result.instances.length > 0) {
  const instance = result.instances[0];

  console.log('=== First Instance ===');
  console.log(`State: ${instance.state}`);
  console.log();

  console.log('Values in this instance:');
  Object.keys(instance.values).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log();

  // Filter and display different types of objects
  const dirs = Object.keys(instance.values).filter(k => k.startsWith('Dir$') || k === 'Root$0');
  const files = Object.keys(instance.values).filter(k => k.startsWith('File$'));
  const entries = Object.keys(instance.values).filter(k => k.startsWith('Entry$'));
  const names = Object.keys(instance.values).filter(k => k.startsWith('Name$'));

  console.log('=== Object Breakdown ===');
  console.log(`Directories: ${dirs.length}`);
  dirs.forEach(dir => console.log(`  - ${dir}`));
  console.log();

  console.log(`Files: ${files.length}`);
  files.forEach(file => console.log(`  - ${file}`));
  console.log();

  console.log(`Entries: ${entries.length}`);
  entries.forEach(entry => console.log(`  - ${entry}`));
  console.log();

  console.log(`Names: ${names.length}`);
  names.forEach(name => console.log(`  - ${name}`));
  console.log();

  // Display the full result structure for deeper exploration
  console.log('=== Full Instance Data ===');
  console.dir(instance, { depth: null });
}
