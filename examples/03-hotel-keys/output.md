# Hotel Key Card System - Trace Visualization

This trace shows the execution of a hotel key card system model.

## System Overview

The hotel key card system models the following:
- **Guests** can check in to **Rooms**
- Each guest receives a **Key** card during check-in
- Keys can **unlock** their assigned rooms
- Rooms can be **locked** or **unlocked**
- When guests **check out**, their keys become **invalid**

## Sequence Diagram

This diagram is dynamically generated from the actual trace execution:

```mermaid
sequenceDiagram
    participant G as Guest
    participant F as FrontDesk
    participant R as Room
    participant K as KeyCard

    Note over G,K: Initial State: All rooms locked

    Note over G,K: Check-in Process
    G->>F: Request check-in for Room$0
    F->>K: Issue Key$0
    F->>R: Assign Key$0 to Room$0
    F-->>G: Provide Key$0

    Note over G,R: Room Access
    G->>R: Present Key$0 at Room$0
    R->>K: Validate Key$0
    K-->>R: Valid
    R->>R: Unlock door
    R-->>G: Door unlocked
    Note over R: Room$0 door closes and locks
    G->>R: Present Key$0 at Room$0
    R->>K: Validate Key$0
    K-->>R: Valid
    R->>R: Unlock door
    R-->>G: Door unlocked
    Note over R: Room$0 door closes and locks

    Note over G,F: Check-out Process
    G->>F: Check out
    F->>K: Invalidate Key$0
    K-->>F: Key$0 deactivated
```

## State Transition Diagram

```mermaid
stateDiagram-v2
  Step0: Step 0
  note right of Step0
    Locked: 2
    CheckedIn: 0
    ValidKeys: 0
  end note
  Step1: Step 1
  note right of Step1
    Locked: 2
    CheckedIn: 1
    ValidKeys: 1
  end note
  Step0 --> Step1
  Step2: Step 2
  note right of Step2
    Locked: 1
    CheckedIn: 1
    ValidKeys: 1
  end note
  Step1 --> Step2
  Step3: Step 3
  note right of Step3
    Locked: 2
    CheckedIn: 1
    ValidKeys: 1
  end note
  Step2 --> Step3
  Step4: Step 4
  note right of Step4
    Locked: 1
    CheckedIn: 1
    ValidKeys: 1
  end note
  Step3 --> Step4
  Step5: Step 5
  note right of Step5
    Locked: 2
    CheckedIn: 1
    ValidKeys: 1
  end note
  Step4 --> Step5
  Step6: Step 6
  note right of Step6
    Locked: 2
    CheckedIn: 0
    ValidKeys: 0
  end note
  Step5 --> Step6
  Step7: Step 7
  note right of Step7
    Locked: 2
    CheckedIn: 0
    ValidKeys: 0
  end note
  Step6 --> Step7
```

## Actions Supported

1. **checkin**: Guest checks in, receives a valid key for a room
2. **unlock**: Guest uses valid key to unlock their room
3. **lock**: A room door locks (e.g., when closed)
4. **checkout**: Guest checks out, their key becomes invalid

## Safety Properties

The model verifies:
- **OnlyValidKeysUnlock**: Rooms can only be unlocked by valid keys
- **CheckedOutGuestsCannotUnlock**: Keys become invalid after checkout

## Detailed Trace

### Step 0

**Action**: `init` - System initialization

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✗ Not Checked In

### Step 1

**Action**: `checkin` - Guest$0 checks in to Room$0, receives Key$0

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✓ Checked In
  - Has Key$0 (VALID)
    - Unlocks Room$0

### Step 2

**Action**: `unlock` - Guest$0 unlocks Room$0 with Key$0

**Rooms:**
- Room$0: 🔓 UNLOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✓ Checked In
  - Has Key$0 (VALID)
    - Unlocks Room$0

### Step 3

**Action**: `lock` - Room$0 locked

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✓ Checked In
  - Has Key$0 (VALID)
    - Unlocks Room$0

### Step 4

**Action**: `unlock` - Guest$0 unlocks Room$0 with Key$0

**Rooms:**
- Room$0: 🔓 UNLOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✓ Checked In
  - Has Key$0 (VALID)
    - Unlocks Room$0

### Step 5

**Action**: `lock` - Room$0 locked

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✓ Checked In
  - Has Key$0 (VALID)
    - Unlocks Room$0

### Step 6

**Action**: `checkout` - Guest$0 checks out, Key$0 invalidated

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✗ Not Checked In
  - Has Key$0 (INVALID)

### Step 7

**Action**: `stutter` - No state change

**Rooms:**
- Room$0: 🔒 LOCKED
- Room$1: 🔒 LOCKED

**Guests:**
- Guest$0: ✗ Not Checked In
  - Has Key$0 (INVALID)

## Summary

This trace demonstrates a complete guest lifecycle:

1. **Initial State**: System starts with all rooms locked and no guests
2. **Check-in**: Guest checks in and receives a valid key card
3. **Room Access**: Guest can unlock their assigned room multiple times
4. **Door Locking**: Rooms automatically lock when doors close
5. **Check-out**: Guest checks out, invalidating their key card
6. **Security**: After checkout, the key cannot unlock any rooms

The model successfully verifies both safety properties:
- Only valid keys can unlock rooms (validated at steps 2 and 4)
- Checked-out guests cannot unlock rooms (validated at steps 6 and 7)
