# ASHTA CHAMMA — BOARD MODEL AND GAME ARCHITECTURE

This document establishes the exact internal representation of the Ashta Chamma board and the basic game-state architecture for future development. It strictly follows the rules established in `ASHTA_CHAMMA_RULEBOOK.md`.

## 1. Coordinate System
The game uses a 0-indexed row/column grid system for a 5 × 5 board.
* **Row:** `0..4` (Top to Bottom)
* **Column:** `0..4` (Left to Right)
* `(0,0)` = Top-Left
* `(0,4)` = Top-Right
* `(4,0)` = Bottom-Left
* `(4,4)` = Bottom-Right

## 2. 5×5 Board Representation
Conceptually, the board is represented as follows:
```text
       C0  C1  C2  C3  C4
R0     □   □   S   □   □
R1     □   ■   ■   ■   □
R2     S   ■   X   ■   S
R3     □   ■   ■   ■   □
R4     □   □   S   □   □
```
*(S = Safe/Start, ■ = Inner Path, X = Center, □ = Outer Path)*

Total Cells: 25

## 3. Safe Cells
The 5 safe cells where pieces cannot be captured are explicitly:
```json
safeCells = [
    {"r": 0, "c": 2}, // P1 Start
    {"r": 2, "c": 4}, // P2 Start
    {"r": 4, "c": 2}, // P3 Start
    {"r": 2, "c": 0}, // P4 Start
    {"r": 2, "c": 2}  // Center
]
```
*Note: Corners are NOT safe squares.*

## 4. Player Starting Positions
Players begin on the cardinal safe cells.
* **P1_START:** `{"r": 0, "c": 2}`
* **P2_START:** `{"r": 2, "c": 4}`
* **P3_START:** `{"r": 4, "c": 2}`
* **P4_START:** `{"r": 2, "c": 0}`

## 5. Outer Track
The outer track contains exactly 16 cells. The sequence travels COUNTER-CLOCKWISE.
Below is the exact outer track sequence for each player, starting with their respective starting cell:

**P1 Outer Track:**
`[{"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0}, {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1}, {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4}, {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3}]`

**P2 Outer Track:**
`[{"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3}, {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0}, {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1}, {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4}]`

**P3 Outer Track:**
`[{"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4}, {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3}, {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0}, {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1}]`

**P4 Outer Track:**
`[{"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1}, {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4}, {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3}, {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0}]`

## 6. Inner Track & Inner Gates
The inner section contains exactly 8 cells. The sequence travels CLOCKWISE.
Players transition orthogonally from their final outer-track cell into the inner track via a designated "gate".

* **P1 Gate:** `{"r": 0, "c": 3}` → `{"r": 1, "c": 3}`
* **P2 Gate:** `{"r": 3, "c": 4}` → `{"r": 3, "c": 3}`
* **P3 Gate:** `{"r": 4, "c": 1}` → `{"r": 3, "c": 1}`
* **P4 Gate:** `{"r": 1, "c": 0}` → `{"r": 1, "c": 1}`

## 7. Full Player Paths
Each player's full movement sequence is a 25-cell array. Progress is indexed from `0` to `24`.
* `Index 0`: Starting position
* `Index 15`: End of outer track (last cell before gate)
* `Index 16`: Gate entry (first inner cell)
* `Index 23`: Last inner cell
* `Index 24`: Center destination

**P1_PATH** (Start: Top, Outer: CCW, Inner: CW)
```json
[
    {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0},
    {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1},
    {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4},
    {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3},
    {"r": 1, "c": 3}, {"r": 2, "c": 3}, {"r": 3, "c": 3}, {"r": 3, "c": 2},
    {"r": 3, "c": 1}, {"r": 2, "c": 1}, {"r": 1, "c": 1}, {"r": 1, "c": 2},
    {"r": 2, "c": 2}
]
```

**P2_PATH** (Start: Right, Outer: CCW, Inner: CW)
```json
[
    {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3},
    {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0},
    {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1},
    {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4},
    {"r": 3, "c": 3}, {"r": 3, "c": 2}, {"r": 3, "c": 1}, {"r": 2, "c": 1},
    {"r": 1, "c": 1}, {"r": 1, "c": 2}, {"r": 1, "c": 3}, {"r": 2, "c": 3},
    {"r": 2, "c": 2}
]
```

**P3_PATH** (Start: Bottom, Outer: CCW, Inner: CW)
```json
[
    {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4},
    {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3},
    {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0},
    {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1},
    {"r": 3, "c": 1}, {"r": 2, "c": 1}, {"r": 1, "c": 1}, {"r": 1, "c": 2},
    {"r": 1, "c": 3}, {"r": 2, "c": 3}, {"r": 3, "c": 3}, {"r": 3, "c": 2},
    {"r": 2, "c": 2}
]
```

**P4_PATH** (Start: Left, Outer: CCW, Inner: CW)
```json
[
    {"r": 2, "c": 0}, {"r": 3, "c": 0}, {"r": 4, "c": 0}, {"r": 4, "c": 1},
    {"r": 4, "c": 2}, {"r": 4, "c": 3}, {"r": 4, "c": 4}, {"r": 3, "c": 4},
    {"r": 2, "c": 4}, {"r": 1, "c": 4}, {"r": 0, "c": 4}, {"r": 0, "c": 3},
    {"r": 0, "c": 2}, {"r": 0, "c": 1}, {"r": 0, "c": 0}, {"r": 1, "c": 0},
    {"r": 1, "c": 1}, {"r": 1, "c": 2}, {"r": 1, "c": 3}, {"r": 2, "c": 3},
    {"r": 3, "c": 3}, {"r": 3, "c": 2}, {"r": 3, "c": 1}, {"r": 2, "c": 1},
    {"r": 2, "c": 2}
]
```

## 8. Player Modes and Turn Order
* **2-Player Mode:** P1 (Top) and P3 (Bottom) are active. Turn order is `P1 → P3 → P1`.
* **4-Player Mode:** P1 (Top), P2 (Right), P3 (Bottom), P4 (Left) are active. Turn order is Counter-Clockwise: `P1 → P4 → P3 → P2 → P1`.

## 9. Game-State Architecture
```typescript
interface GameState {
    mode: "TWO_PLAYER" | "FOUR_PLAYER";
    pieceCount: 4 | 8;
    players: Record<string, PlayerState>;
    turnOrder: string[]; // E.g., ["P1", "P4", "P3", "P2"]
    currentPlayerId: string;
    turnState: TurnState;
    gameStatus: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
}

interface PlayerState {
    id: string; 
    active: boolean;
    pieces: PieceState[];
    hasCaptured: boolean; // True allows entry to inner path at index 16
}

interface PieceState {
    id: string;
    ownerId: string;
    state: "HOME" | "ON_BOARD" | "FINISHED";
    progressIndex: number; // 0 to 24 (maps to the player's full path array)
}

interface TurnState {
    currentResult: number; // 1, 2, 3, 4, 8
    consecutiveSpecialCount: number; // Triggers penalty on 3 identical specials
    lastSpecialRolled: 4 | 8 | null; 
    extraTurnsEarned: number;
    actionsRemaining: ActionDefinition[]; // Explicit component actions (e.g. for split 8)
}

type ActionDefinition = 
    | { type: "ENTRY_ONLY" }
    | { type: "MOVE_ONLY", value: number }
    | { type: "ENTRY_OR_MOVE", value: number }; 
```

---

## 10. PHASE 1 BOARD VALIDATION
This report confirms that the internal mapping perfectly satisfies the project constraints.

* **Total Cells Validated:** The set of all distinct coordinates across all paths yields exactly 25 cells.
* **Outer Cells Validated:** Each path's first 16 cells exclusively use `r=0,4` or `c=0,4` plus the gate entries. Set union equals exactly 16 perimeter cells.
* **Inner Cells Validated:** Each path's indices 16-23 exclusively use `r=1,2,3` and `c=1,2,3` excluding the center. Set union equals exactly 8 inner cells.
* **Safe Cells Validated:** `safeCells` length is 5. They map correctly to `(0,2)`, `(2,4)`, `(4,2)`, `(2,0)`, and `(2,2)`.
* **Path Validations (P1, P2, P3, P4):**
  * Length: Each path is exactly 25 elements.
  * Start: Match established starting cells at index 0.
  * Duplicates: No coordinate appears twice within a single player's path.
  * Outer Direction: Confirmed Counter-Clockwise orthogonal steps.
  * Inner Direction: Confirmed Clockwise orthogonal steps.
  * Gates: Confirmed orthogonal inward steps from outer perimeter to inner ring.
  * Center: All paths terminate precisely at `(2,2)` at index 24.
