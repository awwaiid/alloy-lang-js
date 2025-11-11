/*
 * Hotel Key Card System - Behavioral Modeling Example
 *
 * This model demonstrates state transitions in a hotel key card system
 * where guests can check in to rooms, unlock doors with valid keys,
 * and check out (invalidating their keys).
 */

// Static signatures
sig Room {}
sig Guest {}
sig Key {}

// State variables
var sig CheckedIn in Guest {}
var sig ValidKey in Key {}
var sig Locked in Room {}

// Relation: which key unlocks which room
var one sig KeyMap {
  var unlocks: Key -> Room
}

// Relation: which guest has which key
var one sig GuestKeys {
  var holds: Guest -> Key
}

// Initialize: all rooms locked, no guests checked in, no valid keys
pred init {
  CheckedIn = none
  ValidKey = none
  Locked = Room
  no KeyMap.unlocks
  no GuestKeys.holds
}

// Action: guest checks into a room, receives a key
pred checkin[g: Guest, r: Room, k: Key] {
  // Guards
  g not in CheckedIn
  r in Locked
  k not in ValidKey

  // Effects
  CheckedIn' = CheckedIn + g
  ValidKey' = ValidKey + k
  Locked' = Locked
  KeyMap.unlocks' = KeyMap.unlocks + (k -> r)
  GuestKeys.holds' = GuestKeys.holds + (g -> k)
}

// Action: guest uses key to unlock room
pred unlock[g: Guest, k: Key, r: Room] {
  // Guards
  g in CheckedIn
  k in ValidKey
  r in Locked
  k -> r in KeyMap.unlocks
  g -> k in GuestKeys.holds

  // Effects
  CheckedIn' = CheckedIn
  ValidKey' = ValidKey
  Locked' = Locked - r
  KeyMap.unlocks' = KeyMap.unlocks
  GuestKeys.holds' = GuestKeys.holds
}

// Action: room is locked again (e.g., door closes)
pred lock[r: Room] {
  // Guards
  r not in Locked

  // Effects
  CheckedIn' = CheckedIn
  ValidKey' = ValidKey
  Locked' = Locked + r
  KeyMap.unlocks' = KeyMap.unlocks
  GuestKeys.holds' = GuestKeys.holds
}

// Action: guest checks out, key becomes invalid
pred checkout[g: Guest, k: Key] {
  // Guards
  g in CheckedIn
  g -> k in GuestKeys.holds
  k in ValidKey

  // Effects
  CheckedIn' = CheckedIn - g
  ValidKey' = ValidKey - k
  Locked' = Locked
  KeyMap.unlocks' = KeyMap.unlocks - (k -> Room)
  GuestKeys.holds' = GuestKeys.holds - (g -> k)
}

// Stutter: nothing changes
pred stutter {
  CheckedIn' = CheckedIn
  ValidKey' = ValidKey
  Locked' = Locked
  KeyMap.unlocks' = KeyMap.unlocks
  GuestKeys.holds' = GuestKeys.holds
}

// Transition system: at each step, one of the actions occurs or the system stutters
fact transitions {
  init
  always (
    stutter or
    (some g: Guest, r: Room, k: Key | checkin[g, r, k]) or
    (some g: Guest, k: Key, r: Room | unlock[g, k, r]) or
    (some r: Room | lock[r]) or
    (some g: Guest, k: Key | checkout[g, k])
  )
}

// Safety property: A room can only be unlocked by a valid key
assert OnlyValidKeysUnlock {
  always (
    all r: Room, k: Key |
      (k -> r in KeyMap.unlocks and r not in Locked) implies k in ValidKey
  )
}

// Safety property: Checked out guests cannot unlock rooms
assert CheckedOutGuestsCannotUnlock {
  always (
    all g: Guest, k: Key |
      (g not in CheckedIn and g -> k in GuestKeys.holds) implies k not in ValidKey
  )
}

// Run command to generate example traces
run {
  eventually (some g: Guest | g in CheckedIn)
  eventually (some r: Room | r not in Locked)
  eventually (some g: Guest | g not in CheckedIn and once (g in CheckedIn))
} for 5 but 8 steps

// Check assertions
check OnlyValidKeysUnlock for 5 but 8 steps
check CheckedOutGuestsCannotUnlock for 5 but 8 steps
