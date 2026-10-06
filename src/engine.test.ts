import { createGame, roll, getLegalActions, executeAction, skipActions, advanceTurn } from "./engine";
import { PATHS, isSafeCell } from "./board";

describe("Ashta Chamma Engine", () => {
  test("1. board path loading", () => {
    expect(Object.keys(PATHS)).toEqual(["P1", "P2", "P3", "P4"]);
  });

  test("2. P1 route", () => {
    expect(PATHS.P1.length).toBe(25);
    expect(PATHS.P1[0]).toEqual({ r: 0, c: 2 });
    expect(PATHS.P1[24]).toEqual({ r: 2, c: 2 });
  });

  test("3. P2 route", () => {
    expect(PATHS.P2.length).toBe(25);
    expect(PATHS.P2[0]).toEqual({ r: 2, c: 4 });
    expect(PATHS.P2[24]).toEqual({ r: 2, c: 2 });
  });

  test("4. P3 route", () => {
    expect(PATHS.P3.length).toBe(25);
    expect(PATHS.P3[0]).toEqual({ r: 4, c: 2 });
    expect(PATHS.P3[24]).toEqual({ r: 2, c: 2 });
  });

  test("5. P4 route", () => {
    expect(PATHS.P4.length).toBe(25);
    expect(PATHS.P4[0]).toEqual({ r: 2, c: 0 });
    expect(PATHS.P4[24]).toEqual({ r: 2, c: 2 });
  });

  test("6. 2-player turn order", () => {
    const game = createGame("TWO_PLAYER", 4);
    expect(game.turnOrder).toEqual(["P1", "P3"]);
    expect(game.currentPlayerId).toBe("P1");
  });

  test("7. 4-player turn order", () => {
    const game = createGame("FOUR_PLAYER", 4);
    expect(game.turnOrder).toEqual(["P1", "P4", "P3", "P2"]);
    expect(game.currentPlayerId).toBe("P1");
  });

  describe("Movement and Entry", () => {
    test("8. 1 movement", () => {
      const game = createGame("TWO_PLAYER", 4);
      // Need a piece ON_BOARD
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      roll(game, 1);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(1);
      expect(actions[0].spaces).toBe(1);
    });

    test("9. 2 movement", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      roll(game, 2);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(1);
      expect(actions[0].spaces).toBe(2);
    });

    test("10. 3 movement", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      roll(game, 3);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(1);
      expect(actions[0].spaces).toBe(3);
    });

    test("11. 4 entry", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 4);
      const actions = getLegalActions(game);
      expect(actions.some(a => a.actionType === "ENTRY")).toBe(true);
    });

    test("12. 4 movement", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      roll(game, 4);
      const actions = getLegalActions(game);
      // Can enter a new piece OR move the existing one
      expect(actions.some(a => a.actionType === "MOVE" && a.spaces === 4)).toBe(true);
    });

    test("13. 8 with two HOME pieces", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 8);
      const actions = getLegalActions(game);
      expect(actions.every(a => a.actionType === "ENTRY")).toBe(true);
      expect(game.turnState.actionsRemaining.length).toBe(2);
    });

    test("14. 8 with one HOME piece", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[1].state = "ON_BOARD";
      game.players["P1"].pieces[2].state = "ON_BOARD";
      roll(game, 8);
      expect(game.turnState.actionsRemaining[0].type).toBe("ENTRY_ONLY");
      expect(game.turnState.actionsRemaining[1].type).toBe("MOVE_ONLY");
      expect(game.turnState.actionsRemaining[1].value).toBe(4);
    });

    test("15. 8 with zero HOME pieces", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces.forEach(p => p.state = "ON_BOARD");
      roll(game, 8);
      expect(game.turnState.actionsRemaining[0].type).toBe("MOVE_ONLY");
      expect(game.turnState.actionsRemaining[0].value).toBe(8);
    });

    test("16. exact center landing", () => {
      const game = createGame("TWO_PLAYER", 4);
      const p = game.players["P1"].pieces[0];
      p.state = "ON_BOARD";
      p.progressIndex = 22;
      game.players["P1"].hasCaptured = true;
      roll(game, 2);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(1);
      executeAction(game, actions[0]);
      expect(p.state).toBe("FINISHED");
      expect(p.progressIndex).toBe(24);
    });

    test("17. overshoot rejection", () => {
      const game = createGame("TWO_PLAYER", 4);
      const p = game.players["P1"].pieces[0];
      p.state = "ON_BOARD";
      p.progressIndex = 23;
      game.players["P1"].hasCaptured = true;
      roll(game, 2);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(0);
    });

    test("18. finished pieces cannot move", () => {
      const game = createGame("TWO_PLAYER", 4);
      const p = game.players["P1"].pieces[0];
      p.state = "FINISHED";
      p.progressIndex = 24;
      roll(game, 1);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(0);
    });

    test("24. inner movement before capture rejected", () => {
      const game = createGame("TWO_PLAYER", 4);
      const p = game.players["P1"].pieces[0];
      p.state = "ON_BOARD";
      p.progressIndex = 15;
      game.players["P1"].hasCaptured = false;
      roll(game, 1);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(0);
    });

    test("25. inner movement after capture allowed", () => {
      const game = createGame("TWO_PLAYER", 4);
      const p = game.players["P1"].pieces[0];
      p.state = "ON_BOARD";
      p.progressIndex = 15;
      game.players["P1"].hasCaptured = true;
      roll(game, 1);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(1);
    });

    test("26. friendly occupied destination rejected", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      game.players["P1"].pieces[1].state = "ON_BOARD";
      game.players["P1"].pieces[1].progressIndex = 1;
      roll(game, 1);
      const actions = getLegalActions(game);
      // piece 0 moving 1 space would land on piece 1 (index 1), which is rejected.
      // piece 1 moving 1 space lands on index 2, which is free.
      expect(actions.length).toBe(1);
      expect(actions[0].pieceId).toBe(game.players["P1"].pieces[1].id);
    });

    describe("Safe-Cell ENTRY Regression Audit", () => {
      test("R1. P1 ENTRY blocked by opponent on start cell", () => {
        const game = createGame("FOUR_PLAYER", 4);
        // P4 start is (2,0). Its path to (0,2) is index 12.
        game.players["P4"].pieces[0].state = "ON_BOARD";
        game.players["P4"].pieces[0].progressIndex = 12;
        
        roll(game, 4);
        const actions = getLegalActions(game);
        expect(actions.some(a => a.actionType === "ENTRY")).toBe(false);
      });

      test("R2. P2 ENTRY blocked by opponent on start cell", () => {
        const game = createGame("FOUR_PLAYER", 4);
        game.currentPlayerId = "P2";
        // P1 start is (0,2). Its path to P2 start (2,4) is index 12.
        game.players["P1"].pieces[0].state = "ON_BOARD";
        game.players["P1"].pieces[0].progressIndex = 12;
        
        roll(game, 4);
        const actions = getLegalActions(game);
        expect(actions.some(a => a.actionType === "ENTRY")).toBe(false);
      });

      test("R3. P3 ENTRY blocked by opponent on start cell", () => {
        const game = createGame("FOUR_PLAYER", 4);
        game.currentPlayerId = "P3";
        // P2 start is (2,4). Its path to P3 start (4,2) is index 12.
        game.players["P2"].pieces[0].state = "ON_BOARD";
        game.players["P2"].pieces[0].progressIndex = 12;
        
        roll(game, 4);
        const actions = getLegalActions(game);
        expect(actions.some(a => a.actionType === "ENTRY")).toBe(false);
      });

      test("R4. P4 ENTRY blocked by opponent on start cell", () => {
        const game = createGame("FOUR_PLAYER", 4);
        game.currentPlayerId = "P4";
        // P3 start is (4,2). Its path to P4 start (2,0) is index 12.
        game.players["P3"].pieces[0].state = "ON_BOARD";
        game.players["P3"].pieces[0].progressIndex = 12;
        
        roll(game, 4);
        const actions = getLegalActions(game);
        expect(actions.some(a => a.actionType === "ENTRY")).toBe(false);
      });

      test("R5. ENTRY allowed by friendly piece on start cell (Ashta 8 exception)", () => {
        const game = createGame("TWO_PLAYER", 4);
        game.players["P1"].pieces[0].state = "ON_BOARD";
        game.players["P1"].pieces[0].progressIndex = 0;
        
        roll(game, 4);
        const actions = getLegalActions(game);
        expect(actions.some(a => a.actionType === "ENTRY")).toBe(true);
      });

      test("R6. 8 with 2 HOME pieces blocked by opponent", () => {
        const game = createGame("TWO_PLAYER", 4);
        // Opponent P3 at index 8 reaches P1 start (0,2)
        game.players["P3"].pieces[0].state = "ON_BOARD";
        game.players["P3"].pieces[0].progressIndex = 8;
        
        roll(game, 8);
        const actions = getLegalActions(game);
        // Game allows two ENTRY actions. But P1 start is blocked.
        expect(actions.length).toBe(0);
      });
      
      test("R7. Normal movement capture works if target is not safe", () => {
        const game = createGame("TWO_PLAYER", 4);
        game.players["P1"].pieces[0].state = "ON_BOARD";
        game.players["P1"].pieces[0].progressIndex = 2; // (0,0) - NOT safe
        game.players["P3"].pieces[0].state = "ON_BOARD";
        game.players["P3"].pieces[0].progressIndex = 9; // (0,1) - P1 index 1
        
        roll(game, 1);
        const actions = getLegalActions(game);
        expect(actions.length).toBe(1);
        expect(actions[0].actionType).toBe("MOVE");
      });

      test("R8. 8 with 4 HOME pieces allows 2 distinct entries sequentially", () => {
        const game = createGame("TWO_PLAYER", 4);
        roll(game, 8);
        
        let actions = getLegalActions(game);
        expect(actions.filter(a => a.actionType === "ENTRY").length).toBeGreaterThan(0);
        
        // Execute first entry
        const firstEntry = actions.find(a => a.actionType === "ENTRY")!;
        executeAction(game, firstEntry);
        
        // Second entry must still be available
        actions = getLegalActions(game);
        expect(actions.filter(a => a.actionType === "ENTRY").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Capture", () => {
    test("19. capture, 21. capture on normal square succeeds, 22. captured piece returns HOME, 23. hasCaptured becomes true", () => {
      const game = createGame("TWO_PLAYER", 4);
      // P3 piece at P3[9] => (0,1)
      game.players["P3"].pieces[0].state = "ON_BOARD";
      game.players["P3"].pieces[0].progressIndex = 9;

      // P1 at index 0 (0,2), roll 1 -> moves to index 1 (0,1)
      game.players["P1"].pieces[1].state = "ON_BOARD";
      game.players["P1"].pieces[1].progressIndex = 0;
      
      roll(game, 1);
      const actions = getLegalActions(game);
      const capAction = actions.find(a => a.pieceId === game.players["P1"].pieces[1].id)!;
      executeAction(game, capAction);

      expect(game.players["P3"].pieces[0].state).toBe("HOME");
      expect(game.players["P3"].pieces[0].progressIndex).toBe(0);
      expect(game.players["P1"].hasCaptured).toBe(true);
    });

    test("20. capture on safe square rejected, 27. safe square does not permit capture", () => {
      const game = createGame("TWO_PLAYER", 4);
      // P1 piece at 0 (Safe)
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      
      // P3 piece at 7 is (0,3). index 8 is (0,2) which is P1 start.
      game.players["P3"].currentPlayerId = "P3";
      game.currentPlayerId = "P3";
      game.players["P3"].pieces[0].state = "ON_BOARD";
      game.players["P3"].pieces[0].progressIndex = 7;
      
      roll(game, 1);
      const actions = getLegalActions(game);
      expect(actions.length).toBe(0); // Cannot move to safe square occupied by opponent
    });
  });

  describe("Extra Throws", () => {
    test("28. 4 grants extra throw", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 4);
      expect(game.turnState.extraTurnsEarned).toBe(1);
    });

    test("29. 8 grants extra throw", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 8);
      expect(game.turnState.extraTurnsEarned).toBe(1);
    });

    test("30. capture grants extra throw", () => {
      const game = createGame("TWO_PLAYER", 4);
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 0;
      game.players["P3"].pieces[0].state = "ON_BOARD";
      game.players["P3"].pieces[0].progressIndex = 9; // (0,1)
      roll(game, 1);
      const action = getLegalActions(game)[0];
      executeAction(game, action);
      // Action is consumed, extra turn keeps player at P1 and hasRolled = false
      expect(game.currentPlayerId).toBe("P1");
      expect(game.turnState.hasRolled).toBe(false);
    });
  });

  describe("Penalty", () => {
    test("31. 4 -> 4 -> 4 penalty, 36. restores piece positions", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 4);
      let actions = getLegalActions(game);
      executeAction(game, actions[0]); // enters piece 0
      
      roll(game, 4);
      actions = getLegalActions(game);
      executeAction(game, actions[0]); // enters piece 1
      
      expect(game.players["P1"].pieces[0].state).toBe("ON_BOARD");

      roll(game, 4); // Penalty
      // Should rollback to before first 4
      expect(game.players["P1"].pieces[0].state).toBe("HOME");
      expect(game.players["P1"].pieces[1].state).toBe("HOME");
      expect(game.currentPlayerId).toBe("P3");
    });

    test("32. 8 -> 8 -> 8 penalty", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 8);
      const acts1 = getLegalActions(game);
      if (acts1.length > 0) executeAction(game, acts1[0]);
      skipActions(game);

      roll(game, 8);
      skipActions(game);
      
      expect(game.players["P1"].pieces[0].state).toBe("ON_BOARD");

      roll(game, 8); // Penalty
      expect(game.players["P1"].pieces.every(p => p.state === "HOME")).toBe(true);
      expect(game.currentPlayerId).toBe("P3");
    });

    test("Comprehensive rollback of captures and state", () => {
      const game = createGame("TWO_PLAYER", 4);
      
      // P3 piece at (3,0) => P3 path index 13
      game.players["P3"].pieces[0].state = "ON_BOARD";
      game.players["P3"].pieces[0].progressIndex = 13;

      // P1 piece at (0,1) => P1 path index 1
      game.players["P1"].pieces[0].state = "ON_BOARD";
      game.players["P1"].pieces[0].progressIndex = 1;

      // First 4 (Capture)
      roll(game, 4);
      const capAction = getLegalActions(game).find(a => a.actionType === "MOVE" && a.spaces === 4)!;
      executeAction(game, capAction);

      // Verify intermediate state
      expect(game.players["P3"].pieces[0].state).toBe("HOME");
      expect(game.players["P1"].hasCaptured).toBe(true);
      expect(game.turnState.extraTurnsEarned).toBe(1); // 1 for 4, 1 for capture. Then 1 consumed = 1 remaining.
      
      // Since 1 consumed, extraTurnsEarned is 1. We roll again.
      // Second 4
      roll(game, 4);
      skipActions(game); // consumed extra turn

      // Third 4 -> Penalty
      roll(game, 4);

      // Verify Rollback
      expect(game.players["P3"].pieces[0].state).toBe("ON_BOARD");
      expect(game.players["P3"].pieces[0].progressIndex).toBe(13);
      expect(game.players["P1"].pieces[0].progressIndex).toBe(1);
      expect(game.players["P1"].hasCaptured).toBe(false);
      expect(game.currentPlayerId).toBe("P3");
    });

    test("33. 4 -> 8 -> 4 does NOT trigger penalty", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 4);
      executeAction(game, getLegalActions(game)[0]);
      roll(game, 8);
      skipActions(game);
      roll(game, 4);
      expect(game.currentPlayerId).toBe("P1"); // Still P1's turn
    });

    test("34. 8 -> 4 -> 8 does NOT trigger penalty", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 8);
      skipActions(game);
      roll(game, 4);
      skipActions(game);
      roll(game, 8);
      expect(game.currentPlayerId).toBe("P1");
    });

    test("35. 4 -> 4 -> 8 does NOT trigger penalty", () => {
      const game = createGame("TWO_PLAYER", 4);
      roll(game, 4);
      skipActions(game);
      roll(game, 4);
      skipActions(game);
      roll(game, 8);
      expect(game.currentPlayerId).toBe("P1");
    });
  });

  test("41. game ends when all pieces finish, 42. no turns occur after game finishes", () => {
    const game = createGame("TWO_PLAYER", 4);
    // Spread pieces out so they aren't stacked
    game.players["P1"].pieces[0].state = "ON_BOARD"; game.players["P1"].pieces[0].progressIndex = 23;
    game.players["P1"].pieces[1].state = "ON_BOARD"; game.players["P1"].pieces[1].progressIndex = 22;
    game.players["P1"].pieces[2].state = "ON_BOARD"; game.players["P1"].pieces[2].progressIndex = 21;
    game.players["P1"].pieces[3].state = "ON_BOARD"; game.players["P1"].pieces[3].progressIndex = 20;
    game.players["P1"].hasCaptured = true;
    
    // P1 rolls 1, piece 0 finishes. Turn goes to P3.
    roll(game, 1);
    executeAction(game, getLegalActions(game).find(a => a.pieceId === "P1_0")!);
    
    // P3 skips
    roll(game, 1); skipActions(game);

    // P1 rolls 2, piece 1 finishes.
    roll(game, 2);
    executeAction(game, getLegalActions(game).find(a => a.pieceId === "P1_1")!);
    
    // P3 skips
    roll(game, 1); skipActions(game);

    // P1 rolls 3, piece 2 finishes.
    roll(game, 3);
    executeAction(game, getLegalActions(game).find(a => a.pieceId === "P1_2")!);

    // P3 skips
    roll(game, 1); skipActions(game);

    // P1 rolls 4 (extra turn!), piece 3 finishes.
    roll(game, 4);
    executeAction(game, getLegalActions(game).find(a => a.pieceId === "P1_3")!);
    
    expect(game.gameStatus).toBe("FINISHED");
    expect(game.winner).toBe("P1");
    
    roll(game, 1);
    expect(game.turnState.hasRolled).toBe(false); // Ignored
  });
});
