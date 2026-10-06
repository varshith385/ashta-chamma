import type { GameState, LegalAction } from "./types";
import { executeAction, getLegalActions } from "./engine";
import { PATHS, isSafeCell } from "./board";

export function chooseAiAction(gameState: GameState): LegalAction | null {
  const legalActions = getLegalActions(gameState);
  if (legalActions.length === 0) return null;

  // Evaluate all legal actions
  const evaluatedActions = legalActions.map(action => {
    const clone = JSON.parse(JSON.stringify(gameState));
    const toExec = getLegalActions(clone).find(
      a => a.pieceId === action.pieceId && a.actionDefIndex === action.actionDefIndex
    );
    
    if (!toExec) {
      // Should never happen, but fallback to 0 score
      return { action, score: 0 };
    }

    executeAction(clone, toExec);

    let score = 0;

    // Priority 1: Winning Move
    if (clone.gameStatus === "FINISHED") {
      score += 10000;
    }

    // Priority 2: Capture
    const oppHomeBefore = Object.values(gameState.players)
      .filter(p => p.id !== gameState.currentPlayerId)
      .reduce((sum, p) => sum + p.pieces.filter(piece => piece.state === "HOME").length, 0);
      
    const oppHomeAfter = Object.values(clone.players)
      .filter(p => p.id !== clone.currentPlayerId)
      .reduce((sum, p) => sum + p.pieces.filter(piece => piece.state === "HOME").length, 0);

    if (oppHomeAfter > oppHomeBefore) {
      score += 1000;
    }

    // Priority 3: Inner Entry
    const piece = gameState.players[gameState.currentPlayerId].pieces.find(p => p.id === action.pieceId)!;
    if (piece.state === "ON_BOARD" && piece.progressIndex < 16 && action.destinationIndex >= 16) {
      score += 500;
    }

    // Priority 6: Reduce Home Pieces
    if (action.actionType === "ENTRY") {
      score += 50;
    }

    // Priority 4 & 5: Finish Progress & Move most advanced piece
    if (action.actionType === "MOVE") {
      score += action.destinationIndex;
    }

    // Priority 7: Safe Positioning
    if (action.actionType === "MOVE") {
      const path = PATHS[gameState.currentPlayerId];
      const destCoord = path[action.destinationIndex];
      if (destCoord && isSafeCell(destCoord.r, destCoord.c)) {
        score += 10;
      }
    }

    return { action, score };
  });

  // Sort by score descending. Tie breaking: prefer higher progressIndex, then lower pieceId for determinism
  evaluatedActions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    
    // Tie breaker 1: destination index (already factored in score, but just in case)
    if (b.action.destinationIndex !== a.action.destinationIndex) {
      return b.action.destinationIndex - a.action.destinationIndex;
    }
    
    // Tie breaker 2: alphabetical piece ID for total determinism
    return a.action.pieceId.localeCompare(b.action.pieceId);
  });

  return evaluatedActions[0].action;
}
