import type { GameState, Player, Piece, ActionDefinition, LegalAction, Coordinate } from "./types";
import { PATHS, isSafeCell } from "./board";

export function createGame(
  mode: "TWO_PLAYER" | "FOUR_PLAYER", 
  pieceCount: 4 | 8, 
  controlTypes?: Record<string, "HUMAN" | "AI">,
  playerConfigs?: Record<string, any>,
  boardTheme?: "Traditional" | "Classic Wood" | "Ivory" | "Dark Wood"
): GameState {
  const turnOrder = mode === "TWO_PLAYER" ? ["P1", "P3"] : ["P1", "P4", "P3", "P2"];
  const players: Record<string, Player> = {};

  const defaultColors: Record<string, string> = {
    P1: "#d32f2f", // Red
    P2: "#388e3c", // Green
    P3: "#1976d2", // Blue
    P4: "#f57c00"  // Orange
  };

  for (const id of turnOrder) {
    const pieces: Piece[] = [];
    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        id: `${id}_${i}`,
        ownerId: id,
        state: "HOME",
        progressIndex: 0
      });
    }
    players[id] = {
      id,
      active: true,
      controlType: controlTypes?.[id] || "HUMAN",
      config: playerConfigs?.[id] || {
        name: `Player ${id[1]}`,
        color: defaultColors[id],
        shape: "Circle",
        size: "Medium"
      },
      pieces,
      hasCaptured: false,
      finishedPieces: 0,
      stats: {
        captures: 0,
        piecesFinished: 0,
        chammaCount: 0,
        ashtaCount: 0,
        turnsTaken: 0
      }
    };
  }

  return {
    mode,
    pieceCount,
    boardTheme: boardTheme || "Traditional",
    players,
    turnOrder,
    currentPlayerId: turnOrder[0],
    gameStatus: "IN_PROGRESS",
    winner: null,
    turnState: {
      currentResult: null,
      consecutiveSpecialCount: 0,
      lastSpecialRolled: null,
      extraTurnsEarned: 0,
      actionsRemaining: [],
      snapshot: null,
      hasRolled: false
    },
    globalStats: {
      totalTurns: 1,
      startTime: Date.now(),
      durationSeconds: 0
    },
    rollHistory: []
  };
}

export function roll(state: GameState, result: number) {
  if (state.gameStatus !== "IN_PROGRESS") return;

  const isSpecial = result === 4 || result === 8;

  if (isSpecial) {
    if (state.turnState.lastSpecialRolled === result) {
      state.turnState.consecutiveSpecialCount++;
    } else {
      // Snapshot before modifying any state for this roll
      state.turnState.snapshot = JSON.parse(JSON.stringify(state));
      state.turnState.lastSpecialRolled = result;
      state.turnState.consecutiveSpecialCount = 1;
    }

    if (state.turnState.consecutiveSpecialCount === 3) {
      const snapshot = state.turnState.snapshot!;
      // Discard current state, restore snapshot
      Object.assign(state, JSON.parse(JSON.stringify(snapshot)));
      advanceTurn(state);
      return;
    }

    state.turnState.extraTurnsEarned++;
  } else {
    state.turnState.lastSpecialRolled = null;
    state.turnState.consecutiveSpecialCount = 0;
    state.turnState.snapshot = null;
  }

  state.turnState.hasRolled = true;
  state.turnState.currentResult = result;
  state.turnState.actionsRemaining = [];

  const player = state.players[state.currentPlayerId];
  if (result === 4) player.stats.chammaCount++;
  if (result === 8) player.stats.ashtaCount++;

  state.rollHistory.unshift({
    turnNumber: state.globalStats.totalTurns,
    playerId: state.currentPlayerId,
    result
  });
  if (state.rollHistory.length > 20) state.rollHistory.pop();

  if (result === 8) {
    const homePieces = player.pieces.filter(p => p.state === "HOME");
    if (homePieces.length >= 2) {
      state.turnState.actionsRemaining.push({ type: "ENTRY_ONLY", value: 4 });
      state.turnState.actionsRemaining.push({ type: "ENTRY_ONLY", value: 4 });
    } else if (homePieces.length === 1) {
      state.turnState.actionsRemaining.push({ type: "ENTRY_ONLY", value: 4 });
      state.turnState.actionsRemaining.push({ type: "MOVE_ONLY", value: 4 });
    } else {
      state.turnState.actionsRemaining.push({ type: "MOVE_ONLY", value: 8 });
    }
  } else if (result === 4) {
    state.turnState.actionsRemaining.push({ type: "ENTRY_OR_MOVE", value: 4 });
  } else {
    state.turnState.actionsRemaining.push({ type: "MOVE_ONLY", value: result });
  }
}

export function advanceTurn(state: GameState) {
  const currentIndex = state.turnOrder.indexOf(state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % state.turnOrder.length;
  state.currentPlayerId = state.turnOrder[nextIndex];
  state.turnState = {
    currentResult: null,
    consecutiveSpecialCount: 0,
    lastSpecialRolled: null,
    extraTurnsEarned: 0,
    actionsRemaining: [],
    snapshot: null,
    hasRolled: false
  };
  state.players[state.currentPlayerId].stats.turnsTaken++;
  state.globalStats.totalTurns++;
  if (state.gameStatus === "IN_PROGRESS") {
    state.globalStats.durationSeconds = Math.floor((Date.now() - state.globalStats.startTime) / 1000);
  }
}

export function skipActions(state: GameState) {
  state.turnState.actionsRemaining = [];
  if (state.turnState.extraTurnsEarned > 0) {
    state.turnState.hasRolled = false;
    state.turnState.extraTurnsEarned--;
  } else {
    advanceTurn(state);
  }
}

function isOccupiedByFriendly(state: GameState, playerId: string, destIndex: number): boolean {
  const player = state.players[playerId];
  return player.pieces.some(p => p.state === "ON_BOARD" && p.progressIndex === destIndex);
}

function getOpponentAt(state: GameState, playerId: string, coord: Coordinate): string | null {
  for (const pid of state.turnOrder) {
    if (pid === playerId) continue;
    const opp = state.players[pid];
    const path = PATHS[pid];
    for (const p of opp.pieces) {
      if (p.state === "ON_BOARD") {
        const c = path[p.progressIndex];
        if (c.r === coord.r && c.c === coord.c) {
          return p.id;
        }
      }
    }
  }
  return null;
}

export function getLegalActions(state: GameState): LegalAction[] {
  if (!state.turnState.hasRolled || state.turnState.actionsRemaining.length === 0) return [];
  const player = state.players[state.currentPlayerId];
  const actions: LegalAction[] = [];

  state.turnState.actionsRemaining.forEach((def, index) => {
    player.pieces.forEach(piece => {
      if (piece.state === "FINISHED") return;

      if (piece.state === "HOME") {
        if (def.type === "ENTRY_ONLY" || def.type === "ENTRY_OR_MOVE") {
          const path = PATHS[state.currentPlayerId];
          const destCoord = path[0];
          // Allow multiple entries on start cell for Ashta 8
          if (!getOpponentAt(state, state.currentPlayerId, destCoord)) {
            actions.push({
              actionType: "ENTRY",
              pieceId: piece.id,
              actionDefIndex: index,
              spaces: 0,
              destinationIndex: 0
            });
          }
        }
      } else if (piece.state === "ON_BOARD") {
        if (def.type === "MOVE_ONLY" || def.type === "ENTRY_OR_MOVE") {
          const dest = piece.progressIndex + def.value;
          if (dest > 24) return;
          if (dest >= 16 && !player.hasCaptured) return;
          if (isOccupiedByFriendly(state, state.currentPlayerId, dest)) return;
          
          const path = PATHS[state.currentPlayerId];
          const destCoord = path[dest];
          if (getOpponentAt(state, state.currentPlayerId, destCoord)) {
             if (isSafeCell(destCoord.r, destCoord.c) || dest === 24) return;
          }
          
          actions.push({
            actionType: "MOVE",
            pieceId: piece.id,
            actionDefIndex: index,
            spaces: def.value,
            destinationIndex: dest
          });
        }
      }
    });
  });

  return actions;
}

export function executeAction(state: GameState, action: LegalAction) {
  const player = state.players[state.currentPlayerId];
  const piece = player.pieces.find(p => p.id === action.pieceId)!;

  if (action.actionType === "ENTRY") {
    piece.state = "ON_BOARD";
    piece.progressIndex = 0;
  } else {
    piece.progressIndex = action.destinationIndex;
    if (piece.progressIndex === 24) {
      piece.state = "FINISHED";
      player.finishedPieces++;
    }
  }

  state.turnState.actionsRemaining.splice(action.actionDefIndex, 1);

  if (piece.state === "ON_BOARD") {
    const path = PATHS[state.currentPlayerId];
    const coord = path[piece.progressIndex];
    const oppPieceId = getOpponentAt(state, state.currentPlayerId, coord);
    if (oppPieceId) {
      const oppPlayerId = oppPieceId.split('_')[0];
      const opp = state.players[oppPlayerId];
      const oppPiece = opp.pieces.find(p => p.id === oppPieceId)!;
      oppPiece.state = "HOME";
      oppPiece.progressIndex = 0;
      player.hasCaptured = true;
      player.stats.captures++;
      state.turnState.extraTurnsEarned++;
    }
  }

  if (player.finishedPieces === state.pieceCount) {
    state.gameStatus = "FINISHED";
    state.winner = player.id;
    player.stats.piecesFinished = player.finishedPieces;
    state.globalStats.durationSeconds = Math.floor((Date.now() - state.globalStats.startTime) / 1000);
    state.turnState.hasRolled = false;
    state.turnState.actionsRemaining = [];
    return;
  }

  if (state.turnState.actionsRemaining.length === 0) {
    if (state.turnState.extraTurnsEarned > 0) {
      state.turnState.hasRolled = false;
      state.turnState.extraTurnsEarned--;
    } else {
      advanceTurn(state);
    }
  }
}
