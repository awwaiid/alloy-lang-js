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
 * Parse instance data into structured format
 */
function parseTrace(instance) {
  const trace = [];

  // Extract state information if available
  if (instance.values) {
    const state = {
      rooms: new Set(),
      guests: new Set(),
      keys: new Set(),
      checkedIn: new Set(),
      validKeys: new Set(),
      locked: new Set(),
      unlocks: new Map(),
      holds: new Map()
    };

    // Parse all entities and relationships
    for (const [key, value] of Object.entries(instance.values)) {
      if (key.startsWith('Room$')) {
        state.rooms.add(key);
      } else if (key.startsWith('Guest$')) {
        state.guests.add(key);
      } else if (key.startsWith('Key$')) {
        state.keys.add(key);
      } else if (key.startsWith('CheckedIn$')) {
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
 * Generate Mermaid sequence diagram
 */
function generateMermaidSequenceDiagram() {
  return `\`\`\`mermaid
sequenceDiagram
    participant Guest
    participant FrontDesk
    participant Room
    participant KeyCard

    Note over Guest,KeyCard: Hotel Check-in Process

    Guest->>FrontDesk: Request check-in for Room 101
    FrontDesk->>KeyCard: Issue new key card
    FrontDesk->>Room: Assign KeyCard to Room 101
    FrontDesk-->>Guest: Provide KeyCard

    Note over Guest,Room: Guest Uses Key

    Guest->>Room: Present KeyCard at door
    Room->>KeyCard: Validate key
    alt Key is valid
        KeyCard-->>Room: Valid
        Room->>Room: Unlock door
        Room-->>Guest: Door unlocked
    else Key is invalid
        KeyCard-->>Room: Invalid
        Room-->>Guest: Access denied
    end

    Note over Guest,FrontDesk: Check-out Process

    Guest->>FrontDesk: Check out
    FrontDesk->>KeyCard: Invalidate key
    FrontDesk->>Room: Lock room
    Room-->>FrontDesk: Room secured
\`\`\``;
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
  markdown.push(generateMermaidSequenceDiagram());
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
    markdown.push(`### Step ${index}\n`);

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
