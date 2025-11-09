const tmp = require('tmp');
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

// Resolve the alloy-lang binary path relative to this module
const alloyBinPath = path.join(__dirname, 'lib', 'jdeploy.js');

function evalRaw(alloyProgram) {
  console.log('execAlloyRaw', alloyProgram);
  const alloyTempFileName = tmp.tmpNameSync();
  fs.writeFileSync(alloyTempFileName, alloyProgram);
  const alloyCommand = spawnSync(process.execPath, [alloyBinPath, 'exec', '-o', '-', '-t', 'json', alloyTempFileName], { encoding: 'utf-8' });
  // if there is any stderr, return it wrapped in json
  // otherwise return the stdout
  if (alloyCommand.stderr) {
    return JSON.stringify({ error: alloyCommand.stderr });
  }
  return alloyCommand.stdout;
}

function eval(alloyProgram) {
  return JSON.parse(evalRaw(alloyProgram));
}

module.exports = { evalRaw, eval };
