const alloy = require('alloy-lang');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

// Read the Alloy model file
const alloyModel = readFileSync(join(__dirname, 'hotel.als'), 'utf-8');

console.log('Running Alloy hotel key card model...\n');
console.log('This model demonstrates behavioral modeling with state transitions.\n');

// Execute the Alloy model
const result = alloy.eval(alloyModel);

console.log('=== Execution Summary ===');
console.log(`Duration: ${result.duration}ms`);
console.log(`Number of instances found: ${result.instances.length}`);
console.log();

/**
 * Parse instance data into structured format with temporal states
 */
function parseTrace(instance) {
  const trace = [];

  // For temporal models, we need to extract state at each time step
  // The instance.values contains the full trace across time
  if (instance.values) {
    // First, collect all unique time steps and entities
    const timeSteps = new Set();
    const allRooms = new Set();
    const allGuests = new Set();
    const allKeys = new Set();

    // Scan for entities and time information
    for (const [key, value] of Object.entries(instance.values)) {
      if (key.startsWith('Room$')) {
        allRooms.add(key);
      } else if (key.startsWith('Guest$')) {
        allGuests.add(key);
      } else if (key.startsWith('Key$')) {
        allKeys.add(key);
      }
    }

    // For simplicity, we'll extract state from the trace
    // In a temporal model, state variables may have time-indexed values
    const state = {
      rooms: allRooms,
      guests: allGuests,
      keys: allKeys,
      checkedIn: new Set(),
      validKeys: new Set(),
      locked: new Set(),
      unlocks: new Map(),
      holds: new Map()
    };

    // Parse all entities and relationships
    for (const [key, value] of Object.entries(instance.values)) {
      if (key.startsWith('CheckedIn$')) {
        state.checkedIn.add(key);
      } else if (key.startsWith('ValidKey$')) {
        state.validKeys.add(key);
      } else if (key.startsWith('Locked$')) {
        state.locked.add(key);
      } else if (key === 'KeyMap$0' && value.unlocks) {
        // Parse key -> room mappings
        const unlockData = value.unlocks;
        if (Array.isArray(unlockData)) {
          unlockData.forEach(pair => {
            if (Array.isArray(pair) && pair.length === 2) {
              state.unlocks.set(pair[0], pair[1]);
            }
          });
        }
      } else if (key === 'GuestKeys$0' && value.holds) {
        // Parse guest -> key mappings
        const holdsData = value.holds;
        if (Array.isArray(holdsData)) {
          holdsData.forEach(pair => {
            if (Array.isArray(pair) && pair.length === 2) {
              state.holds.set(pair[0], pair[1]);
            }
          });
        }
      }
    }

    trace.push(state);
  }

  return trace;
}

/**
 * Infer action that occurred between two states
 */
function inferAction(prevState, nextState) {
  if (!prevState) {
    return { type: 'init', description: 'System initialization' };
  }

  // Check for checkin: guest added to CheckedIn, key added to ValidKey
  const newCheckedIn = [...nextState.checkedIn].filter(g => !prevState.checkedIn.has(g));
  const newValidKeys = [...nextState.validKeys].filter(k => !prevState.validKeys.has(k));

  if (newCheckedIn.length > 0 && newValidKeys.length > 0) {
    const guest = newCheckedIn[0];
    const key = newValidKeys[0];
    const room = nextState.unlocks.get(key);
    return {
      type: 'checkin',
      guest,
      key,
      room,
      description: `${guest} checks in to ${room}, receives ${key}`
    };
  }

  // Check for unlock: room removed from Locked
  const unlockedRooms = [...prevState.locked].filter(r => !nextState.locked.has(r));
  if (unlockedRooms.length > 0) {
    const room = unlockedRooms[0];
    // Find which guest/key unlocked it
    for (const [guest, key] of nextState.holds.entries()) {
      if (nextState.unlocks.get(key) === room) {
        return {
          type: 'unlock',
          guest,
          key,
          room,
          description: `${guest} unlocks ${room} with ${key}`
        };
      }
    }
    return {
      type: 'unlock',
      room,
      description: `${room} unlocked`
    };
  }

  // Check for lock: room added to Locked
  const lockedRooms = [...nextState.locked].filter(r => !prevState.locked.has(r));
  if (lockedRooms.length > 0) {
    const room = lockedRooms[0];
    return {
      type: 'lock',
      room,
      description: `${room} locked`
    };
  }

  // Check for checkout: guest removed from CheckedIn, key removed from ValidKey
  const removedCheckedIn = [...prevState.checkedIn].filter(g => !nextState.checkedIn.has(g));
  const removedValidKeys = [...prevState.validKeys].filter(k => !nextState.validKeys.has(k));

  if (removedCheckedIn.length > 0 && removedValidKeys.length > 0) {
    const guest = removedCheckedIn[0];
    const key = removedValidKeys[0];
    return {
      type: 'checkout',
      guest,
      key,
      description: `${guest} checks out, ${key} invalidated`
    };
  }

  // No change detected - stutter
  return {
    type: 'stutter',
    description: 'No state change'
  };
}

/**
 * Render state information as text
 */
function renderState(state, stepNum) {
  const lines = [`\n--- Step ${stepNum} ---`];

  lines.push(`\nRooms: ${state.rooms.size}`);
  state.rooms.forEach(room => {
    const isLocked = state.locked.has(room);
    const status = isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED';
    lines.push(`  ${room}: ${status}`);
  });

  lines.push(`\nGuests: ${state.guests.size}`);
  state.guests.forEach(guest => {
    const isCheckedIn = state.checkedIn.has(guest);
    const status = isCheckedIn ? '✓ Checked In' : '✗ Not Checked In';
    lines.push(`  ${guest}: ${status}`);

    // Show which key this guest holds
    for (const [g, k] of state.holds.entries()) {
      if (g === guest) {
        const isValid = state.validKeys.has(k);
        const validStatus = isValid ? '(VALID)' : '(INVALID)';
        lines.push(`    Has ${k} ${validStatus}`);

        // Show which room this key unlocks
        for (const [key, room] of state.unlocks.entries()) {
          if (key === k) {
            lines.push(`      Unlocks ${room}`);
          }
        }
      }
    }
  });

  lines.push(`\nValid Keys: ${state.validKeys.size}`);
  state.validKeys.forEach(key => {
    lines.push(`  ${key}`);
  });

  return lines.join('\n');
}

/**
 * Generate Mermaid state diagram
 */
function generateMermaidStateDiagram(states) {
  const lines = ['```mermaid', 'stateDiagram-v2'];

  states.forEach((state, index) => {
    const stepName = `Step${index}`;
    const lockedCount = state.locked.size;
    const checkedInCount = state.checkedIn.size;
    const validKeysCount = state.validKeys.size;

    lines.push(`  ${stepName}: Step ${index}`);
    lines.push(`  note right of ${stepName}`);
    lines.push(`    Locked: ${lockedCount}`);
    lines.push(`    CheckedIn: ${checkedInCount}`);
    lines.push(`    ValidKeys: ${validKeysCount}`);
    lines.push(`  end note`);

    if (index > 0) {
      lines.push(`  Step${index - 1} --> Step${index}`);
    }
  });

  lines.push('```');
  return lines.join('\n');
}

/**
 * Generate Mermaid sequence diagram from actions
 */
function generateMermaidSequenceDiagram(actions) {
  const lines = ['```mermaid', 'sequenceDiagram'];
  lines.push('    participant G as Guest');
  lines.push('    participant F as FrontDesk');
  lines.push('    participant R as Room');
  lines.push('    participant K as KeyCard');
  lines.push('');

  let hasCheckin = false;
  let hasUnlock = false;
  let hasCheckout = false;

  // Group actions by type to create meaningful sections
  actions.forEach((action, index) => {
    if (index === 0 && action.type === 'init') {
      lines.push('    Note over G,K: Initial State: All rooms locked');
      return;
    }

    switch (action.type) {
      case 'checkin':
        if (!hasCheckin) {
          lines.push('');
          lines.push('    Note over G,K: Check-in Process');
          hasCheckin = true;
        }
        lines.push(`    G->>F: Request check-in for ${action.room || 'room'}`);
        lines.push(`    F->>K: Issue ${action.key || 'key card'}`);
        lines.push(`    F->>R: Assign ${action.key || 'key'} to ${action.room || 'room'}`);
        lines.push(`    F-->>G: Provide ${action.key || 'key card'}`);
        break;

      case 'unlock':
        if (!hasUnlock) {
          lines.push('');
          lines.push('    Note over G,R: Room Access');
          hasUnlock = true;
        }
        lines.push(`    G->>R: Present ${action.key || 'key'} at ${action.room || 'room'}`);
        lines.push(`    R->>K: Validate ${action.key || 'key'}`);
        lines.push('    K-->>R: Valid');
        lines.push('    R->>R: Unlock door');
        lines.push('    R-->>G: Door unlocked');
        break;

      case 'lock':
        if (hasUnlock) {
          lines.push(`    Note over R: ${action.room || 'Room'} door closes and locks`);
        }
        break;

      case 'checkout':
        if (!hasCheckout) {
          lines.push('');
          lines.push('    Note over G,F: Check-out Process');
          hasCheckout = true;
        }
        lines.push(`    G->>F: Check out`);
        lines.push(`    F->>K: Invalidate ${action.key || 'key'}`);
        lines.push(`    K-->>F: ${action.key || 'Key'} deactivated`);
        break;

      case 'stutter':
        // Don't add stutter actions to sequence diagram
        break;
    }
  });

  lines.push('```');
  return lines.join('\n');
}

// Process and display results
if (result.instances.length > 0) {
  console.log('=== Trace Visualization ===\n');

  const instance = result.instances[0];
  const trace = parseTrace(instance);

  trace.forEach((state, index) => {
    console.log(renderState(state, index));
  });

  console.log('\n=== Summary ===');
  console.log(`Total steps in trace: ${trace.length}`);

  if (trace.length > 0) {
    const finalState = trace[trace.length - 1];
    console.log(`Final state:`);
    console.log(`  - Rooms: ${finalState.rooms.size}`);
    console.log(`  - Guests: ${finalState.guests.size}`);
    console.log(`  - Locked rooms: ${finalState.locked.size}`);
    console.log(`  - Checked-in guests: ${finalState.checkedIn.size}`);
    console.log(`  - Valid keys: ${finalState.validKeys.size}`);
  }

  // Infer actions from state transitions
  const actions = [];
  trace.forEach((state, index) => {
    const prevState = index > 0 ? trace[index - 1] : null;
    const action = inferAction(prevState, state);
    actions.push(action);
  });

  // Generate markdown output file with visualizations
  const markdown = [];
  markdown.push('# Hotel Key Card System - Trace Visualization\n');
  markdown.push('This trace shows the execution of a hotel key card system model.\n');

  markdown.push('## System Overview\n');
  markdown.push('The hotel key card system models the following:');
  markdown.push('- **Guests** can check in to **Rooms**');
  markdown.push('- Each guest receives a **Key** card during check-in');
  markdown.push('- Keys can **unlock** their assigned rooms');
  markdown.push('- Rooms can be **locked** or **unlocked**');
  markdown.push('- When guests **check out**, their keys become **invalid**\n');

  markdown.push('## Sequence Diagram\n');
  markdown.push('This diagram is dynamically generated from the actual trace execution:\n');
  markdown.push(generateMermaidSequenceDiagram(actions));
  markdown.push('\n');

  markdown.push('## State Transition Diagram\n');
  markdown.push(generateMermaidStateDiagram(trace));
  markdown.push('\n');

  markdown.push('## Actions Supported\n');
  markdown.push('1. **checkin**: Guest checks in, receives a valid key for a room');
  markdown.push('2. **unlock**: Guest uses valid key to unlock their room');
  markdown.push('3. **lock**: A room door locks (e.g., when closed)');
  markdown.push('4. **checkout**: Guest checks out, their key becomes invalid\n');

  markdown.push('## Safety Properties\n');
  markdown.push('The model verifies:');
  markdown.push('- **OnlyValidKeysUnlock**: Rooms can only be unlocked by valid keys');
  markdown.push('- **CheckedOutGuestsCannotUnlock**: Keys become invalid after checkout\n');

  markdown.push('## Detailed Trace\n');
  trace.forEach((state, index) => {
    const action = actions[index];
    markdown.push(`### Step ${index}\n`);

    // Show action that occurred
    if (action) {
      markdown.push(`**Action**: \`${action.type}\` - ${action.description}\n`);
    }

    if (state.rooms.size > 0) {
      markdown.push('**Rooms:**');
      state.rooms.forEach(room => {
        const isLocked = state.locked.has(room);
        const status = isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED';
        markdown.push(`- ${room}: ${status}`);
      });
      markdown.push('');
    }

    if (state.guests.size > 0) {
      markdown.push('**Guests:**');
      state.guests.forEach(guest => {
        const isCheckedIn = state.checkedIn.has(guest);
        const status = isCheckedIn ? '✓ Checked In' : '✗ Not Checked In';
        markdown.push(`- ${guest}: ${status}`);

        for (const [g, k] of state.holds.entries()) {
          if (g === guest) {
            const isValid = state.validKeys.has(k);
            const validStatus = isValid ? '(VALID)' : '(INVALID)';
            markdown.push(`  - Has ${k} ${validStatus}`);

            for (const [key, room] of state.unlocks.entries()) {
              if (key === k) {
                markdown.push(`    - Unlocks ${room}`);
              }
            }
          }
        }
      });
      markdown.push('');
    }
  });

  // Write markdown file
  const outputPath = join(__dirname, 'output.md');
  writeFileSync(outputPath, markdown.join('\n'), 'utf-8');
  console.log(`\nVisualization written to: ${outputPath}`);
} else {
  console.log('No instances found. The model may be unsatisfiable or need adjustment.');
}

console.log('\nDone!');
