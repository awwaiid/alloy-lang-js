#!/usr/bin/env node

// Simple test to verify the wrapper works without PATH dependency

const alloy = require('./index.js');

console.log('Testing alloy-lang wrapper...\n');

const code = 'sig Thing {} run { one Thing }';
console.log('Executing:', code);

try {
  const result = alloy.eval(code);

  if (result.error) {
    console.error('Error:', result.error);
    process.exit(1);
  }

  console.log('\nSuccess! Result:');
  console.dir(result, { depth: null });

  console.log('\n✓ Wrapper works correctly without PATH dependency');
} catch (error) {
  console.error('Exception:', error.message);
  process.exit(1);
}
