# ASHTA CHAMMA — RULEBOOK AND GAME SPECIFICATION

This document serves as the single source of truth and definitive specification for the digital implementation of Ashta Chamma. All future development phases, AI logic, and UI mechanics MUST strictly adhere to these rules.

If future implementation requirements conflict with this rulebook, the conflict must be reported instead of silently altering these rules.

---

## 1. Project Overview
This project is a digital adaptation of the traditional Indian board game Ashta Chamma (also known as Chowka Bara). The digital game will support 2 or 4 human players locally on the same device, with eventual support for AI opponents. It uses traditional four-cowrie throwing mechanics, specific capture rules, and fixed inner-path movement. 

The game must feel like an authentic Ashta Chamma experience and should NOT be simplified into a generic Ludo or Pachisi clone. Online multiplayer is out of scope for the current project.

---

## 2. Authoritative Rule Principle
There are numerous regional and historical variations of Ashta Chamma across India. 
1. The rules explicitly specified in this document are **AUTHORITATIVE** for this project.
2. They override rules found on external websites or in other implementations.
3. Traditional variations discovered through research are documented in Section 19 ("Known Traditional Variations") but **DO NOT** override the rules implemented here.
4. Any unresolved mechanics are explicitly marked as "UNRESOLVED — DO NOT IMPLEMENT YET" to prevent guessing.
5. Ludo or Pachisi mechanics must not be introduced unless explicitly approved later.

---

## 3. Board Definition
* **Grid:** The board is a 5 × 5 grid containing 25 cells in total. (Reference image is the visual authority).
* **Zones:** 
  * Four player starting/home areas situated around the four sides of the board.
  * A central destination/home area.
* **Special Squares:** Certain squares are marked with an "X" or cross, designating them as Safe Squares.
* **Sections:** The board consists of an outer route and an inner section.
* **UNRESOLVED — DO NOT IMPLEMENT YET:** The exact cell coordinates, path ordering, and strict route mapping are not defined in Phase 0 and require resolution in PHASE 1 based on the visual reference.

---

## 4. Player Modes
The game supports two exact player configurations:

**A) 2-Player Mode:**
* Exactly 2 players.
* Players are positioned on opposite sides of the board.
* Only their two starting areas are active and occupied.
* The remaining two starting areas remain completely unused (no phantom players or pieces).

**B) 4-Player Mode:**
* Exactly 4 players.
* One player occupies each of the four starting areas.

---

## 5. Piece Configuration
At game creation, players select the total piece count:
* **4 pieces per player** OR **8 pieces per player**
* All players in the match must use the same selected piece count.
* Arbitrary numbers of pieces (e.g., 3, 5, 6, 7) are strictly prohibited.

---

## 6. Cowrie Mechanics
The game relies on four virtual cowrie shells. Each cowrie can either be open (mouth/white facing up) or closed.

Movement values are derived as follows:
* **1 open cowrie:** Movement value of 1
* **2 open cowries:** Movement value of 2
* **3 open cowries:** Movement value of 3
* **4 open cowries:** Movement value of 4 (Called **CHAMMA**)
* **0 open cowries:** Movement value of 8 (Called **ASHTA**)

*Note: The digital interface must eventually display the four individual cowries being thrown.*

---

## 7. Piece-Entry Mechanics
Entering a piece from the starting/home area requires specific special results.

* **Result of 4 (CHAMMA):** Allows exactly ONE piece to enter the board from the home area.
* **Result of 8 (ASHTA):** This is a special result representing **TWO** distinct entry/movement actions.
  * *If at least two pieces are at home:* The player MUST bring two pieces out onto the board.
  * *If exactly one piece is at home:* That one piece enters the board. The remaining 4 movement value MUST be used by another piece already on the board. (This secondary move is only legal if a valid 4-space movement exists).
  * *If no pieces are at home:* The 8 functions as a standard 8-space movement for a single piece.

---

## 8. Movement Mechanics
* Movement is sequential along a fixed route.
* A piece **cannot**:
  * Move backward.
  * Jump outside the defined board route.
  * Move beyond its final destination.
  * Occupy an already occupied square illegally (see Section 10).
* **UNRESOLVED — DO NOT IMPLEMENT YET:** Exact board route mapping.

---

## 9. Capture Mechanics
* A capture occurs when a piece lands **EXACTLY** on a square occupied by an opponent's piece.
* Simply passing over an opponent's piece does **NOT** capture it.
* **Results of a capture:**
  * The captured piece is returned to its starting/home area, resetting its progress.
  * The capturing player earns an **extra throw**.
* **Exception:** Opponent pieces positioned on Safe Squares (X) cannot be captured.

---

## 10. Safe-Square Rules
* Squares marked with an "X" or cross on the reference board are **SAFE**.
* A piece located on a safe square is completely protected and cannot be captured.
* **UNRESOLVED — DO NOT IMPLEMENT YET:** The exact list and coordinates of the safe squares.

---

## 11. Inner-Section Rules
* The board is divided into an outer section and an inner section.
* **Prerequisite:** A player must capture at least **ONE** opponent piece before any of their own pieces are allowed to enter the inner section.
* **Player-Level Unlock:** This unlock requirement applies to the player, not individual pieces. Once a player makes their first capture, *all* of their pieces (current and future) are permitted to enter the inner section for the rest of the game.

---

## 12. Exact-Movement Rules
* A piece must have the exact movement value required to land precisely in the central destination/home.
* A piece cannot overshoot its destination.
  * *Example:* If a piece is 2 spaces away from the center:
    * Result 2: Legal.
    * Result 3, 4, or 8: Illegal for that specific piece.
* Only **ONE** piece may occupy a board square at any given time. There is **NO** stacking, **NO** multiple-piece blocking, and **NO** friendly-piece stacking. If a move lands on a square occupied by the player's own piece, it is illegal.
* If a player rolls a value that multiple pieces can legally use, the player chooses which piece to move (subject to the piece-entry rules for 4 and 8).

---

## 13. Extra-Turn Rules
A player receives an additional throw immediately following:
1. Rolling a **4 (CHAMMA)**
2. Rolling an **8 (ASHTA)**
3. Successfully capturing an opponent's piece

These mechanics stack and interact. The game state engine must track the "current throw", extra turns earned, and complex 8-moves explicitly rather than following a simple "roll -> move -> next player" loop.

---

## 14. Three-Consecutive 4/8 Rule
The game employs a traditional penalty/void rule for identical consecutive special throws.
* If a player rolls a sequence of three **IDENTICAL** consecutive special results (i.e., exactly 4→4→4 or exactly 8→8→8), a penalty is triggered.
* Mixed sequences (e.g., 4→8→4, 8→4→8, 4→4→8, 8→8→4) do **NOT** trigger the penalty.
* **Penalty Behavior:** When 4→4→4 or 8→8→8 occurs:
  * All three throws are cancelled.
  * All movement/actions resulting from those three throws are cancelled (pieces return to where they were before the first throw of the sequence).
  * The player's turn ends immediately.
  * Control passes to the next player.
* The consecutive counter resets to 0 immediately if the player rolls a 1, 2, or 3.

---

## 15. Winning Conditions
* A player wins when **ALL** of their pieces reach the central destination area.
* 4-piece game: 4/4 pieces must finish.
* 8-piece game: 8/8 pieces must finish.
* The first player to accomplish this is the winner.

---

## 16. 2-Player Configuration
* Players sit opposite each other.
* Turn alternates strictly between the two active players.
* The two unused starting positions remain completely empty; no phantom players are simulated.
* Movement routes remain identical to the standard board design.

---

## 17. 4-Player Configuration
* One player per starting area.
* **Player Positions:**
  * P1 = Top
  * P2 = Right
  * P3 = Bottom
  * P4 = Left
* **Turn Order:** Sequential counter-clockwise rotation (P1 → P4 → P3 → P2 → P1).
* All players interact and can capture each other.

---

## 18. Complete Edge Cases
The future implementation must handle the following situations without freezing or defaulting to illegal moves. Where unconfirmed, rules must be finalized before coding.

1. **4 when all pieces are already outside:** The 4 acts as a standard 4-space movement for any legal piece on the board.
2. **4 when all pieces are still at home:** The player must enter exactly one piece onto the starting square.
3. **4 when no legal movement exists:** Turn is forfeited/passed unless the extra turn rule applies.
4. **8 with two or more pieces at home:** Player MUST enter two pieces.
5. **8 with exactly one piece at home:** One piece enters. The remaining 4-movement must be applied to another legal piece.
6. **8 with zero pieces at home:** The 8 acts as a standard 8-space movement for one piece.
7. **8 when the second movement has no legal destination:** Player moves the first piece (entry) but forfeits the secondary 4-movement.
8. **Multiple legal pieces for the same throw:** The player manually selects which piece to move.
9. **Own piece occupying the destination:** Movement is illegal; player must choose another piece or pass.
10. **Opponent occupying destination:** Triggers a capture, granting an extra turn, returning opponent home.
11. **Opponent occupying a safe square:** Capture is prevented; moving to that square is illegal.
12. **Capture followed by extra throw:** Player moves, resolves capture, and rolls again.
13. **4 followed by 4:** Consecutive counter goes to 2. Player moves and rolls again.
14. **4 followed by 8:** Consecutive counter goes to 2. Player moves and rolls again.
15. **8 followed by 4:** Consecutive counter goes to 2. Player moves and rolls again.
16. **Three consecutive 4/8 results:** Triggers the penalty/void rule (Exact penalty behavior to be confirmed).
17. **A normal result breaking the consecutive-special sequence:** Resets the consecutive 4/8 counter to 0.
18. **Player has already captured and unlocks inner section:** Pieces reaching the entry point to the inner section may proceed inward.
19. **Player has not captured and tries to enter inner section:** Piece is blocked from entering and must circle the outer path again (or movement is illegal, exact behavior **UNRESOLVED — DO NOT IMPLEMENT YET**).
20. **Exact final movement:** Piece reaches central home and is removed from active board play.
21. **Attempt to overshoot final destination:** Movement is illegal.
22. **Last remaining piece reaches home:** Player achieves victory.
23. **All pieces reach home and game ends:** UI declares winner. Match terminates or allows others to play for 2nd/3rd.
24. **2-player mode with two unused starting areas:** Board logic ignores unused starting cells.
25. **4-player turn rotation:** Sequential shifting.
26. **A player has no legal movement for any piece:** Turn is forfeited and passes to the next player.
27. **Multiple extra-turn conditions occurring in sequence:** Extra turns stack or queue appropriately so the player receives all earned throws.

---

## 19. Known Traditional Variations
Research indicates several regional and historical variations of Ashta Chamma (also known as Chowka Bara, Katte Mane, Daayam, Champool). 

* **Board Dimensions:** 7x7 and 9x9 variations exist.
* **Dice Variations:** Some variants use 6 cowries or traditional stick dice.
* **Nomenclature:** The result "4" is often "Chamma" or "Chowka". The result "8" is "Ashta" or "Baara".
* **Safe Squares:** Some local rules enforce "safe" squares arbitrarily based on house rules, or allow multiple friendly pieces to stack on safe squares.
* **Entry Rules:** Some rules demand a 4 or 8 to merely enter the board, but treat the result as a simple value rather than splitting "8" into two entry actions.
* **Inner Path Loop:** Some regions state that pieces continue looping the outer circle forever if no capture is made.

**IMPORTANT:** These variations are strictly documented for reference. They **DO NOT** replace the explicit project decisions made in this rulebook.

---

## 20. Explicit Project Decisions
* **Board:** Strictly 5x5 grid.
* **Entry on 8:** Strictly treated as **TWO** entries if two pieces are at home, or one entry + 4 movement. It is not simply an 8-space move unless all pieces are out.
* **Stacking:** Strictly **NO** stacking. One piece per square at all times.
* **Inner Section Entry:** Unlock is granted at the player level (one capture unlocks for all pieces).

---

## 21. Unresolved Questions
These items must be resolved prior to or during Phase 1/2 coding:
1. Exact cell coordinate mapping and linear route order (Pending review of reference image).
2. Safe-square absolute coordinates (Pending review of reference image).
3. Behavior of a piece that has not unlocked the inner section (Does it continue looping the outer path, or is it blocked?).

---

## 22. Future AI Requirements
The system must eventually support AI players.
* The game state and movement logic engine must be fully decoupled from the UI.
* The AI will utilize the exact same validation engine and ruleset as human players.
* AI must support diverse configurations: Human vs AI (2P), AI vs AI (2P), and mixed 4-player lobbies (e.g., 1 Human vs 3 AI).

---

## 23. Phase 1 Requirements
Phase 1 must map the board conceptually without implementing gameplay logic:
* Map the 5x5 grid coordinates.
* Define the explicit linear path array for each player's route.
* Map the exact coordinates of the Safe Squares (X) based on the visual reference.
* Map the inner section layout.
* Confirm unresolved rule behaviors with the project owner.
