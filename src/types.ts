export interface Coordinate {
  r: number;
  c: number;
}

export type PieceState = "HOME" | "ON_BOARD" | "FINISHED";

export interface Piece {
  id: string;
  ownerId: string;
  state: PieceState;
  progressIndex: number;
}

export interface PlayerConfig {
  name: string;
  color: string;
  shape: "Circle" | "Square" | "Diamond" | "Triangle" | "Star" | "Hexagon";
  size: "Small" | "Medium" | "Large";
}

export interface PlayerStats {
  captures: number;
  piecesFinished: number;
  chammaCount: number;
  ashtaCount: number;
  turnsTaken: number;
}

export interface Player {
  id: string;
  active: boolean;
  controlType: "HUMAN" | "AI";
  config: PlayerConfig;
  pieces: Piece[];
  hasCaptured: boolean;
  finishedPieces: number;
  stats: PlayerStats;
}

export interface ActionDefinition {
  type: "ENTRY_ONLY" | "MOVE_ONLY" | "ENTRY_OR_MOVE";
  value: number;
}

export interface TurnState {
  currentResult: number | null;
  consecutiveSpecialCount: number;
  lastSpecialRolled: 4 | 8 | null;
  extraTurnsEarned: number;
  actionsRemaining: ActionDefinition[];
  snapshot: GameState | null;
  hasRolled: boolean;
}

export interface RollHistoryItem {
  turnNumber: number;
  playerId: string;
  result: number;
}

export interface GameState {
  mode: "TWO_PLAYER" | "FOUR_PLAYER";
  pieceCount: 4 | 8;
  boardTheme: "Traditional" | "Classic Wood" | "Ivory" | "Dark Wood";
  players: Record<string, Player>;
  turnOrder: string[];
  currentPlayerId: string;
  turnState: TurnState;
  gameStatus: "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";
  winner: string | null;
  globalStats: {
    totalTurns: number;
    startTime: number;
    durationSeconds: number;
  };
  rollHistory: RollHistoryItem[];
}

export type ActionType = "ENTRY" | "MOVE";

export interface LegalAction {
  actionType: ActionType;
  pieceId: string;
  actionDefIndex: number; // index in actionsRemaining
  spaces: number;
  destinationIndex: number; // target progressIndex
}
