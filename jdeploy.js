#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Path to the Alloy jar file
const jarPath = path.join(__dirname, 'org.alloytools.alloy.dist.jar');

// Get command line arguments (skip first two which are node and script path)
const args = process.argv.slice(2);

// Spawn java process with the jar and forward all arguments
const javaProcess = spawn('java', ['-jar', jarPath, ...args], {
  stdio: 'inherit'
});

// Forward exit code
javaProcess.on('exit', (code) => {
  process.exit(code);
});
