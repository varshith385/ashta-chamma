import type { GameState, Player } from './types';

export type LogEntry = {
  id: number;
  turn: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  roll: number | null;
  text: string;
  isCapture: boolean;
};

export function createRollLog(oldState: GameState, newState: GameState, rollResult: number): LogEntry {
  const pId = oldState.currentPlayerId;
  const p = oldState.players[pId];
  
  let text = `Rolled ${rollResult === 4 ? '4 (Chamma)' : rollResult === 8 ? '8 (Ashta)' : rollResult}`;
  
  // Check for rollback (three specials in a row)
  if (oldState.turnState.extraTurnsEarned === 2 && newState.turnState.extraTurnsEarned === 0 && (rollResult === 4 || rollResult === 8)) {
    text = `Rolled ${rollResult}. Three specials in a row - all throws cancelled!`;
  }

  return {
    id: Date.now() + Math.random(),
    turn: oldState.turnState.turnNumber || 0,
    playerId: pId,
    playerName: p.config.name,
    playerColor: p.config.color,
    roll: rollResult,
    text: text,
    isCapture: false
  };
}

export function createMoveLog(oldState: GameState, newState: GameState, pieceId: string): LogEntry {
  const pId = oldState.currentPlayerId;
  const p = oldState.players[pId];
  const oldPiece = p.pieces.find((x: any) => x.id === pieceId);
  const newPiece = newState.players[pId]?.pieces.find((x: any) => x.id === pieceId);
  
  let text = `Moved piece`;
  let isCapture = false;

  if (oldPiece?.state === "HOME" && newPiece?.state === "ON_BOARD") {
    text = `Entered piece onto the board`;
  } else if (oldPiece?.state === "ON_BOARD" && newPiece?.state === "FINISHED") {
    text = `Piece reached the center!`;
  } else if (oldPiece?.state === "ON_BOARD" && newPiece?.state === "ON_BOARD") {
    text = `Moved piece to square ${newPiece.progressIndex}`;
  }

  // Detect captures
  const capturedOpponents: string[] = [];
  for (const oppId of newState.turnOrder) {
    if (oppId === pId) continue;
    const oldHome = oldState.players[oppId].pieces.filter((x: any) => x.state === "HOME").length;
    const newHome = newState.players[oppId].pieces.filter((x: any) => x.state === "HOME").length;
    if (newHome > oldHome) {
      capturedOpponents.push(newState.players[oppId].config.name);
      isCapture = true;
    }
  }

  if (isCapture) {
    text += ` and captured ${capturedOpponents.join(', ')}'s piece!`;
  }

  return {
    id: Date.now() + Math.random(),
    turn: oldState.turnState.turnNumber || 0,
    playerId: pId,
    playerName: p.config.name,
    playerColor: p.config.color,
    roll: null,
    text: text,
    isCapture: isCapture
  };
}

export function createSkipLog(oldState: GameState): LogEntry {
  const pId = oldState.currentPlayerId;
  const p = oldState.players[pId];
  return {
    id: Date.now() + Math.random(),
    turn: oldState.turnState.turnNumber || 0,
    playerId: pId,
    playerName: p.config.name,
    playerColor: p.config.color,
    roll: null,
    text: `No legal moves - turn passed`,
    isCapture: false
  };
}
