import { createGame, roll, executeAction, getLegalActions, advanceTurn } from './engine';
import { chooseAiAction } from './ai';
import { PATHS } from './board';

describe("AI Player", () => {
  it("1. AI returns null when there are no legal actions", () => {
    const game = createGame("TWO_PLAYER", 4);
    expect(chooseAiAction(game)).toBeNull();
  });

  it("2. AI always selects an action from getLegalActions()", () => {
    const game = createGame("TWO_PLAYER", 4);
    roll(game, 4);
    const action = chooseAiAction(game);
    expect(action).not.toBeNull();
    const legals = getLegalActions(game);
    expect(legals.some(a => a.pieceId === action!.pieceId && a.actionDefIndex === action!.actionDefIndex)).toBe(true);
  });

  it("3. AI chooses an immediate winning action", () => {
    const game = createGame("TWO_PLAYER", 4);
    game.players["P1"].finishedPieces = 3;
    const p = game.players["P1"].pieces[0];
    p.state = "ON_BOARD";
    p.progressIndex = 23;
    game.players["P1"].hasCaptured = true;
    roll(game, 1);
    
    const action = chooseAiAction(game);
    expect(action!.pieceId).toBe(p.id);
    expect(action!.destinationIndex).toBe(24);
  });

  it("4. AI prefers capture over ordinary movement", () => {
    const game = createGame("TWO_PLAYER", 4);
    
    // P1 at index 1 can move 2 to index 3 (which is coord 1,0)
    const p1 = game.players["P1"].pieces[0];
    p1.state = "ON_BOARD";
    p1.progressIndex = 1;
    
    // Another P1 piece that can just move normally
    const p1_other = game.players["P1"].pieces[1];
    p1_other.state = "ON_BOARD";
    p1_other.progressIndex = 5;

    // Put P3 opponent exactly at P1's index 3 coord
    const p3 = game.players["P3"].pieces[0];
    p3.state = "ON_BOARD";
    // Find P3 progressIndex that matches P1 path[3]
    const targetCoord = PATHS["P1"][3];
    const p3Index = PATHS["P3"].findIndex(c => c.r === targetCoord.r && c.c === targetCoord.c);
    p3.progressIndex = p3Index;

    roll(game, 2); // P1 rolls 2. P1 piece[0] moving 2 lands on P3 -> Capture!
    
    const action = chooseAiAction(game);
    expect(action!.pieceId).toBe(p1.id);
  });

  it("5. AI prefers inner entry over weaker ordinary progress", () => {
    const game = createGame("TWO_PLAYER", 4);
    game.players["P1"].hasCaptured = true; // Unlock inner

    // Can enter inner path (index 16)
    const p1 = game.players["P1"].pieces[0];
    p1.state = "ON_BOARD";
    p1.progressIndex = 15;

    // Just ordinary progress
    const p1_other = game.players["P1"].pieces[1];
    p1_other.state = "ON_BOARD";
    p1_other.progressIndex = 5;

    roll(game, 1);
    const action = chooseAiAction(game);
    expect(action!.pieceId).toBe(p1.id);
    expect(action!.destinationIndex).toBe(16);
  });

  it("6. AI prefers stronger progress when no capture/win exists", () => {
    const game = createGame("TWO_PLAYER", 4);
    
    const p1 = game.players["P1"].pieces[0];
    p1.state = "ON_BOARD";
    p1.progressIndex = 10;

    const p1_other = game.players["P1"].pieces[1];
    p1_other.state = "ON_BOARD";
    p1_other.progressIndex = 2;

    roll(game, 3);
    const action = chooseAiAction(game);
    // piece[0] moving is more advanced progress (13 > 5)
    expect(action!.pieceId).toBe(p1.id);
  });

  it("7. AI handles 8 with two HOME pieces", () => {
    const game = createGame("TWO_PLAYER", 4);
    roll(game, 8); // Should give two entries
    const action = chooseAiAction(game);
    expect(action!.actionType).toBe("ENTRY");
  });

  it("8. AI handles 8 with exactly one HOME piece", () => {
    const game = createGame("TWO_PLAYER", 4);
    game.players["P1"].pieces[0].state = "ON_BOARD";
    game.players["P1"].pieces[0].progressIndex = 1;
    game.players["P1"].pieces[1].state = "ON_BOARD";
    game.players["P1"].pieces[1].progressIndex = 2;
    game.players["P1"].pieces[2].state = "ON_BOARD";
    game.players["P1"].pieces[2].progressIndex = 3;
    // piece[3] is the only HOME piece
    roll(game, 8);
    const action = chooseAiAction(game);
    expect(action).not.toBeNull();
  });

  it("9. AI handles 8 with zero HOME pieces", () => {
    const game = createGame("TWO_PLAYER", 4);
    game.players["P1"].pieces.forEach((p, i) => {
      p.state = "ON_BOARD";
      p.progressIndex = i;
    });
    roll(game, 8);
    const action = chooseAiAction(game);
    expect(action!.actionType).toBe("MOVE");
    expect(action!.spaces).toBe(8);
  });

  it("10. AI decisions are deterministic", () => {
    const game = createGame("TWO_PLAYER", 4);
    roll(game, 4);
    const action1 = chooseAiAction(game);
    const action2 = chooseAiAction(JSON.parse(JSON.stringify(game)));
    expect(action1!.pieceId).toBe(action2!.pieceId);
  });

  it("11. AI never produces an illegal action", () => {
    const game = createGame("TWO_PLAYER", 4);
    roll(game, 1); // Only HOME pieces, so roll 1 has no legal moves
    expect(chooseAiAction(game)).toBeNull();
  });

  it("12. AI works for P1", () => {
    const game = createGame("FOUR_PLAYER", 4);
    game.currentPlayerId = "P1";
    roll(game, 4);
    expect(chooseAiAction(game)).not.toBeNull();
  });

  it("13. AI works for P2", () => {
    const game = createGame("FOUR_PLAYER", 4);
    game.currentPlayerId = "P2";
    roll(game, 4);
    expect(chooseAiAction(game)).not.toBeNull();
  });

  it("14. AI works for P3", () => {
    const game = createGame("FOUR_PLAYER", 4);
    game.currentPlayerId = "P3";
    roll(game, 4);
    expect(chooseAiAction(game)).not.toBeNull();
  });

  it("15. AI works for P4", () => {
    const game = createGame("FOUR_PLAYER", 4);
    game.currentPlayerId = "P4";
    roll(game, 4);
    expect(chooseAiAction(game)).not.toBeNull();
  });
});
