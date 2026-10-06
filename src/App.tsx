import { useState, useEffect, useRef, useMemo } from 'react'
import type { GameState, LegalAction, Player, PlayerConfig } from './types'
import { createGame, roll, getLegalActions, executeAction, skipActions } from './engine'
import { PATHS, isSafeCell } from './board'
import { chooseAiAction } from './ai'
import { type LogEntry, createRollLog, createMoveLog, createSkipLog } from './moveLog'

const ROWS = 5;
const COLS = 5;

function simulateRoll(): { result: number, cowries: boolean[] } {
  const cowries = [false, false, false, false].map(() => Math.random() > 0.5);
  const upCount = cowries.filter(c => c).length;
  const result = upCount === 0 ? 8 : upCount;
  return { result, cowries };
}

type AnimState = {
  pieceId: string;
  displayIndex: number;
  capturedPieceId?: string | null;
  isFinished?: boolean;
}

type Settings = {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  boardEffects: boolean;
  pieceShadows: boolean;
  showMoveHints: boolean;
  showPlayerStats: boolean;
  showRollHistory: boolean;
  showCaptureNotifs: boolean;
  confirmRestart: boolean;
  largeUI: boolean;
  highContrast: boolean;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  animationsEnabled: true,
  reducedMotion: false,
  boardEffects: true,
  pieceShadows: true,
  showMoveHints: true,
  showPlayerStats: true,
  showRollHistory: true,
  showCaptureNotifs: true,
  confirmRestart: true,
  largeUI: false,
  highContrast: false
};

const SHAPES = ["Circle", "Square", "Diamond", "Triangle", "Star", "Hexagon"] as const;
const SIZES = ["Small", "Medium", "Large"] as const;
const COLORS = [
  "#d32f2f", "#388e3c", "#1976d2", "#f57c00", 
  "#8e24aa", "#00acc1", "#d81b60", "#43a047",
  "#c0ca33", "#fb8c00", "#5e35b1", "#00897b"
];

function loadSavedGame(): GameState | null {
  try {
    const saved = localStorage.getItem('ashta_chamma_save');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.players) {
        // Phase 4 Migration: Ensure at least one human player
        const allAI = Object.values(parsed.players).every((p: any) => p.controlType === "AI");
        if (allAI && parsed.players["P1"]) {
          parsed.players["P1"].controlType = "HUMAN";
        }
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

function saveGame(state: GameState) {
  try {
    localStorage.setItem('ashta_chamma_save', JSON.stringify(state));
  } catch (e) {}
}

function clearSavedGame() {
  localStorage.removeItem('ashta_chamma_save');
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const s = localStorage.getItem('ashta_chamma_settings');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { ...defaultSettings, ...parsed };
        }
      }
    } catch (e) {}
    return defaultSettings;
  });

  const [savedGameExists, setSavedGameExists] = useState<boolean>(!!loadSavedGame());
  const [showMainMenu, setShowMainMenu] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);


  useEffect(() => {
    localStorage.setItem('ashta_chamma_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (gameState) saveGame(gameState);
  }, [gameState]);

  const handleStartGame = (mode: any, pieces: any, controlTypes: any, playerConfigs: any, boardTheme: any) => {
    setGameState(createGame(mode, pieces, controlTypes, playerConfigs, boardTheme));
    setShowMainMenu(false);
  };

  const handleContinue = () => {
    const s = loadSavedGame();
    if (s) {
      setGameState(s);
      setShowMainMenu(false);
    }
  };

  if (showMainMenu) {
    return (
      <div className={`app-container ${settings.largeUI ? 'large-ui' : ''} ${settings.highContrast ? 'high-contrast' : ''}`}>
        <div className="main-menu">
          <h1 className="game-title main-title">ASHTA CHAMMA</h1>
          <div className="menu-buttons-vertical">
            <button className="btn-primary" onClick={() => setShowMainMenu(false)}>NEW GAME</button>
            {savedGameExists && <button className="btn-primary" onClick={handleContinue}>CONTINUE GAME</button>}
            <button className="btn-secondary" onClick={() => setActiveModal("HOW_TO_PLAY")}>HOW TO PLAY</button>
            <button className="btn-secondary" onClick={() => setActiveModal("SETTINGS")}>SETTINGS</button>
          </div>
        </div>

        {activeModal === "SETTINGS" && (
          <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === "HOW_TO_PLAY" && (
          <HowToPlayModal onClose={() => setActiveModal(null)} />
        )}
      </div>
    );
  }

  if (!gameState) {
    return <GameSetup onStart={handleStartGame} onBack={() => { setShowMainMenu(true); setSavedGameExists(!!loadSavedGame()); }} />
  }

  return (
    <div className={`app-container ${settings.largeUI ? 'large-ui' : ''} ${settings.highContrast ? 'high-contrast' : ''}`}>
      <Game 
        game={gameState} 
        setGame={setGameState} 
        settings={settings} 
        setSettings={setSettings} 
        onExit={() => { 
          clearSavedGame();
          setGameState(null); 
          setShowMainMenu(true);
          setSavedGameExists(false);
        }} 
      />
    </div>
  );
}

function SettingsModal({ settings, setSettings, onClose }: { settings: Settings, setSettings: (s: Settings) => void, onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <h2>SETTINGS</h2>
        <div className="settings-grid">
          <div className="settings-section">
            <h3>AUDIO & ANIMATION</h3>
            <label><input type="checkbox" checked={settings.soundEnabled} onChange={e => setSettings({...settings, soundEnabled: e.target.checked})} /> Sound Effects</label>
            <label><input type="checkbox" checked={settings.animationsEnabled} onChange={e => setSettings({...settings, animationsEnabled: e.target.checked})} /> Animations</label>
            <label><input type="checkbox" checked={settings.reducedMotion} onChange={e => setSettings({...settings, reducedMotion: e.target.checked})} /> Reduced Motion</label>
          </div>
          <div className="settings-section">
            <h3>GAMEPLAY & UI</h3>
            <label><input type="checkbox" checked={settings.showMoveHints} onChange={e => setSettings({...settings, showMoveHints: e.target.checked})} /> Show Move Hints</label>
            <label><input type="checkbox" checked={settings.showCaptureNotifs} onChange={e => setSettings({...settings, showCaptureNotifs: e.target.checked})} /> Show Capture Notifications</label>
            <label><input type="checkbox" checked={settings.showPlayerStats} onChange={e => setSettings({...settings, showPlayerStats: e.target.checked})} /> Show Player Statistics</label>
          </div>
          <div className="settings-section">
            <h3>APPEARANCE</h3>
            <label><input type="checkbox" checked={settings.pieceShadows} onChange={e => setSettings({...settings, pieceShadows: e.target.checked})} /> Piece Shadows</label>
            <label><input type="checkbox" checked={settings.boardEffects} onChange={e => setSettings({...settings, boardEffects: e.target.checked})} /> Board Visual Effects</label>
            <label><input type="checkbox" checked={settings.largeUI} onChange={e => setSettings({...settings, largeUI: e.target.checked})} /> Large UI Text</label>
            <label><input type="checkbox" checked={settings.highContrast} onChange={e => setSettings({...settings, highContrast: e.target.checked})} /> High Contrast Mode</label>
          </div>
          <div className="settings-section">
            <h3>SYSTEM</h3>
            <label><input type="checkbox" checked={settings.confirmRestart} onChange={e => setSettings({...settings, confirmRestart: e.target.checked})} /> Confirm before Restart/Exit</label>
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn-primary" onClick={onClose}>SAVE & CLOSE</button>
        </div>
      </div>
    </div>
  )
}

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content htp-modal" onClick={e => e.stopPropagation()}>
        <h2>HOW TO PLAY</h2>
        <div className="htp-content">
          <p><strong>GOAL:</strong> Bring all pieces to the center destination.</p>
          <p><strong>BOARD:</strong> 5x5 grid. Move counter-clockwise around the outer edge, then clockwise in the inner loop.</p>
          <p><strong>COWRIES:</strong> 1=1, 2=2, 3=3, 4=CHAMMA (+extra throw), 0=ASHTA (8 + extra throw + allows 2 entries).</p>
          <p><strong>CAPTURE:</strong> Exact landing captures an opponent. You MUST capture at least one opponent before entering the inner section.</p>
          <p><strong>SAFE CELLS:</strong> Only the 5 marked cross-cells are capture-protected. Multiple friendly pieces can enter on a start cell on Ashta, but normally NO stacking is allowed.</p>
          <p><strong>ASHTA (8):</strong> If you have 2+ pieces at home, you MUST enter two different pieces. If 1 at home, enter it and move another piece 4. If 0 at home, move one piece 8 spaces.</p>
          <p><strong>SPECIAL RULE:</strong> Rolling 4→4→4 or 8→8→8 cancels all those throws and ends your turn immediately.</p>
        </div>
        <button className="btn-primary" onClick={onClose} style={{marginTop: '20px'}}>CLOSE</button>
      </div>
    </div>
  )
}

function GameSetup({ onStart, onBack }: { onStart: (m: any, p: any, c: any, conf: any, th: any) => void, onBack: () => void }) {
  const [mode, setMode] = useState<"TWO_PLAYER" | "FOUR_PLAYER">("TWO_PLAYER");
  const [pieces, setPieces] = useState<number>(4);
  const [configIdx, setConfigIdx] = useState<number>(0);
  const [boardTheme, setBoardTheme] = useState<string>("Traditional");

  const [pConfigs, setPConfigs] = useState<Record<string, PlayerConfig>>({
    P1: { name: "Player 1", color: "#d32f2f", shape: "Circle", size: "Medium" },
    P2: { name: "Player 2", color: "#388e3c", shape: "Square", size: "Medium" },
    P3: { name: "Player 3", color: "#1976d2", shape: "Triangle", size: "Medium" },
    P4: { name: "Player 4", color: "#f57c00", shape: "Diamond", size: "Medium" },
  });

  const configs2 = [
    { label: "Human vs Human", types: { P1: "HUMAN", P3: "HUMAN" } },
    { label: "Human vs AI", types: { P1: "HUMAN", P3: "AI" } }
  ];

  const configs4 = [
    { label: "4 Humans", types: { P1: "HUMAN", P4: "HUMAN", P3: "HUMAN", P2: "HUMAN" } },
    { label: "3 Humans + 1 AI", types: { P1: "HUMAN", P4: "HUMAN", P3: "HUMAN", P2: "AI" } },
    { label: "2 Humans + 2 AI", types: { P1: "HUMAN", P4: "HUMAN", P3: "AI", P2: "AI" } },
    { label: "1 Human + 3 AI", types: { P1: "HUMAN", P4: "AI", P3: "AI", P2: "AI" } }
  ];

  const activeConfigs = mode === "TWO_PLAYER" ? configs2 : configs4;
  const currentConfigIndex = configIdx < activeConfigs.length ? configIdx : 0;
  const activePlayers = mode === "TWO_PLAYER" ? ["P1", "P3"] : ["P1", "P4", "P3", "P2"];

  const updatePConfig = (id: string, key: keyof PlayerConfig, val: any) => {
    setPConfigs(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  }

  return (
    <div className="setup-wrapper">
      <div className="setup-card">
        <button className="btn-secondary" onClick={onBack} style={{marginBottom: '1rem', alignSelf: 'flex-start'}}>← BACK</button>
        <h2>GAME SETUP</h2>
        
        <div className="setup-section">
          <h3>GAME MODE</h3>
          <div className="setup-group">
            <button onClick={() => setMode("TWO_PLAYER")} className={mode === "TWO_PLAYER" ? "selected" : ""}>2 PLAYERS</button>
            <button onClick={() => setMode("FOUR_PLAYER")} className={mode === "FOUR_PLAYER" ? "selected" : ""}>4 PLAYERS</button>
          </div>
        </div>
        
        <div className="setup-section">
          <h3>PLAYER TYPES</h3>
          <div className="setup-group">
            {activeConfigs.map((c, i) => (
              <button key={c.label} onClick={() => setConfigIdx(i)} className={currentConfigIndex === i ? "selected" : ""}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h3>PIECES</h3>
          <div className="setup-group">
            <button onClick={() => setPieces(4)} className={pieces === 4 ? "selected" : ""}>4 Pieces</button>
            <button onClick={() => setPieces(8)} className={pieces === 8 ? "selected" : ""}>8 Pieces</button>
          </div>
        </div>

        <div className="setup-section">
          <h3>BOARD THEME</h3>
          <div className="setup-group">
            {["Traditional", "Classic Wood", "Ivory", "Dark Wood"].map(t => (
              <button key={t} onClick={() => setBoardTheme(t)} className={boardTheme === t ? "selected" : ""}>{t}</button>
            ))}
          </div>
        </div>

        <div className="setup-section">
          <h3>PLAYERS</h3>
          <div className="player-configs">
            {activePlayers.map(pid => (
              <div key={pid} className="player-config-row">
                <strong>{pid}:</strong>
                <input type="text" value={pConfigs[pid].name} onChange={e => updatePConfig(pid, 'name', e.target.value)} maxLength={15} />
                <input type="color" value={pConfigs[pid].color} onChange={e => updatePConfig(pid, 'color', e.target.value)} />
                <select value={pConfigs[pid].shape} onChange={e => updatePConfig(pid, 'shape', e.target.value)}>
                  {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={pConfigs[pid].size} onChange={e => updatePConfig(pid, 'size', e.target.value)}>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary start-btn" onClick={() => {
          const controlTypes: Record<string, "HUMAN" | "AI"> = {};
          activePlayers.forEach(pid => {
            controlTypes[pid] = (activeConfigs[currentConfigIndex].types as any)[pid];
          });
          onStart(mode, pieces, controlTypes, pConfigs, boardTheme);
        }}>
          START GAME
        </button>
      </div>
    </div>
  )
}

function Game({ game, setGame, settings, setSettings, onExit }: { game: GameState, setGame: (g: GameState) => void, settings: Settings, setSettings: (s: Settings) => void, onExit: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ result: number, cowries: boolean[] } | null>(null);
  const [animState, setAnimState] = useState<AnimState | null>(null);
  const [rollbackMsg, setRollbackMsg] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);

  const aiTimeoutRef = useRef<number | null>(null);
  const animationVersionRef = useRef<number>(0);

  const animationsEnabled = settings.animationsEnabled;
  const isAiTurn = game.players[game.currentPlayerId].controlType === "AI";
  const isWaitingForRoll = !game.turnState.hasRolled;
  const isWaitingForAction = game.turnState.hasRolled && !isRolling && !isAnimating && game.gameStatus === "IN_PROGRESS";
  
  const legalActions = useMemo(() => {
    return isWaitingForAction ? getLegalActions(game) : [];
  }, [game, isWaitingForAction]);

  const getCapturedPieceId = (oldGame: GameState, newGame: GameState) => {
    for (const pId of Object.keys(oldGame.players)) {
      if (pId === oldGame.currentPlayerId) continue;
      for (let i = 0; i < oldGame.players[pId].pieces.length; i++) {
        const oldP = oldGame.players[pId].pieces[i];
        const newP = newGame.players[pId].pieces[i];
        if (oldP.state === "ON_BOARD" && newP.state === "HOME") return oldP.id;
      }
    }
    return null;
  }

  const getFinishedPieceId = (oldGame: GameState, newGame: GameState) => {
    const pId = oldGame.currentPlayerId;
    for (let i = 0; i < oldGame.players[pId].pieces.length; i++) {
      const oldP = oldGame.players[pId].pieces[i];
      const newP = newGame.players[pId].pieces[i];
      if (oldP.state === "ON_BOARD" && newP.state === "FINISHED") return oldP.id;
    }
    return null;
  }

  const executeWithAnimation = (action: LegalAction, newGame: GameState) => {
    setIsAnimating(true);
    setRollbackMsg(false);
    const owner = action.pieceId.split('_')[0];
    const piece = game.players[owner].pieces.find(p => p.id === action.pieceId)!;
    
    let startIdx = piece.state === "ON_BOARD" ? piece.progressIndex : -1;
    let endIdx = action.destinationIndex;
    
    const capturedId = getCapturedPieceId(game, newGame);
    const finishedId = getFinishedPieceId(game, newGame);
    const isRollback = game.turnState.specialsConsecutive === 2 && newGame.turnState.specialsConsecutive === 0 && newGame.currentPlayerId !== game.currentPlayerId;
    
    let currentIdx = startIdx;
    
    const step = () => {
      currentIdx++;
      if (currentIdx <= endIdx) {
        setAnimState({ pieceId: action.pieceId, displayIndex: currentIdx });
        setTimeout(step, stepTime);
      } else {
        if (capturedId || finishedId) {
          setAnimState({ 
            pieceId: action.pieceId, 
            displayIndex: endIdx, 
            capturedPieceId: capturedId,
            isFinished: !!finishedId
          });
          setTimeout(() => {
             setAnimState(null);
             setIsAnimating(false);
             if (isRollback) setRollbackMsg(true);
             setGame(newGame);
          }, settings.reducedMotion ? 50 : 500);
        } else {
          setAnimState(null);
          setIsAnimating(false);
          if (isRollback) setRollbackMsg(true);
          setGame(newGame);
        }
      }
    };
    
    if (startIdx < endIdx) {
       step();
    } else {
       setAnimState(null);
       setIsAnimating(false);
       setGame(newGame);
    }
  }

  const stepTime = settings.reducedMotion ? 50 : 250;
  const rollTime = animationsEnabled ? 1400 : (settings.reducedMotion ? 300 : 100);

  useEffect(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (isMenuOpen || activeModal) return; 
    
    if (isAiTurn && !isRolling && !isAnimating) {
      if (isWaitingForRoll) {
        aiTimeoutRef.current = window.setTimeout(() => handleRoll(), animationsEnabled ? 800 : 100);
      } else if (isWaitingForAction) {
        aiTimeoutRef.current = window.setTimeout(() => {
          if (legalActions.length === 0) handleSkip();
          else {
            const action = chooseAiAction(game);
            if (action) {
              const newGame = JSON.parse(JSON.stringify(game));
              const currentLegal = getLegalActions(newGame);
              const toExec = currentLegal.find(a => a.pieceId === action.pieceId && a.actionDefIndex === action.actionDefIndex);
              if (toExec) {
                executeAction(newGame, toExec);
                setMoveHistory(prev => {
                  const log = createMoveLog(game, newGame, action.pieceId);
                  const newLog = [log, ...prev];
                  if (newLog.length > 200) newLog.pop();
                  return newLog;
                });
                executeWithAnimation(toExec, newGame);
              }
            }
          }
        }, animationsEnabled ? 400 : 100);
      }
    } else if (!isAiTurn && !isRolling && !isAnimating) {
      if (isWaitingForAction) {
        if (legalActions.length === 0) {
          aiTimeoutRef.current = window.setTimeout(() => handleSkip(), animationsEnabled ? 600 : 100);
        } else if (legalActions.length === 1) {
          aiTimeoutRef.current = window.setTimeout(() => {
            handlePieceClick(legalActions[0].pieceId);
          }, animationsEnabled ? 600 : 100);
        }
      }
    }
    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); }
  }, [game, isAiTurn, isWaitingForRoll, isWaitingForAction, legalActions.length, isRolling, isAnimating, isMenuOpen, activeModal, animationsEnabled]);

  const handleRoll = () => {
    if (isMenuOpen || activeModal) return;
    const currentVersion = animationVersionRef.current;
    setIsRolling(true);
    setLastRoll(null);
    setRollbackMsg(false);
    setCaptureMsg(null);
    setMoveHistory([]);
    const { result, cowries } = simulateRoll();
    setTimeout(() => {
      if (currentVersion !== animationVersionRef.current) return;
      setLastRoll({ result, cowries });
      const newGame = JSON.parse(JSON.stringify(game));
      roll(newGame, result);
          setGame(newGame);
          setMoveHistory(prev => {
            const log = createRollLog(game, newGame, result);
            const newLog = [log, ...prev];
            if (newLog.length > 200) newLog.pop();
            return newLog;
          });
      setIsRolling(false);
    }, rollTime);
  }

  const handlePieceClick = (pieceId: string) => {
    if (isAiTurn || isRolling || isAnimating || isMenuOpen || activeModal) return; 
    const action = legalActions.find(a => a.pieceId === pieceId);
    if (action) {
      const newGame = JSON.parse(JSON.stringify(game));
      const currentLegal = getLegalActions(newGame);
      const toExec = currentLegal.find(a => a.pieceId === pieceId && a.actionDefIndex === action.actionDefIndex);
      if (toExec) {
        executeAction(newGame, toExec);
        setMoveHistory(prev => {
          const log = createMoveLog(game, newGame, pieceId);
          const newLog = [log, ...prev];
          if (newLog.length > 200) newLog.pop();
          return newLog;
        });
        executeWithAnimation(toExec, newGame);
      }
    }
  }

  const handleSkip = () => {
    if (isMenuOpen || activeModal) return;
    const newGame = JSON.parse(JSON.stringify(game));
    skipActions(newGame);
          setGame(newGame);
          setMoveHistory(prev => {
            const log = createSkipLog(game);
            const newLog = [log, ...prev];
            if (newLog.length > 200) newLog.pop();
            return newLog;
          });
  }

  const resetGameEngine = (sameConfig: boolean) => {
    animationVersionRef.current += 1;
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    setIsAnimating(false);
    setIsRolling(false);
    setAnimState(null);
    setRollbackMsg(false);
    setLastRoll(null);
    setCaptureMsg(null);
    setMoveHistory([]);
    
    if (sameConfig) {
      const controlTypes: Record<string, "HUMAN" | "AI"> = {};
      const pConfigs: Record<string, PlayerConfig> = {};
      for (const p of Object.values(game.players)) {
        controlTypes[p.id] = p.controlType;
        pConfigs[p.id] = p.config;
      }
      setGame(createGame(game.mode, game.pieceCount, controlTypes, pConfigs, game.boardTheme));
      setIsMenuOpen(false);
      setActiveModal(null);
    } else {
      onExit();
    }
  }

  return (
    <div className={`game-root theme-${game.boardTheme.replace(/\s+/g, '-').toLowerCase()}`}>
      
      {/* Absolute top bar for turn status and menu to avoid pushing board down */}
      <div className="top-layout-bar">
        {/* Turn info moved to right column */}
        <div className="menu-btn-container">
          <button className="menu-btn" onClick={() => { setIsMenuOpen(true); setActiveModal("MENU"); }}>☰ MENU</button>
        </div>
      </div>

      <div className="game-main-area">
        
        {/* CENTER: BOARD + HOMES */}
        <div className="board-and-homes">
          <div className="home-top">
            {game.players["P1"] && <HomeArea p={game.players["P1"]} legalActions={legalActions} onClick={handlePieceClick} animState={animState} settings={settings} isActive={game.currentPlayerId === "P1"} />}
          </div>
          <div className="home-left">
            {game.players["P4"] && <HomeArea p={game.players["P4"]} legalActions={legalActions} onClick={handlePieceClick} animState={animState} settings={settings} isActive={game.currentPlayerId === "P4"} />}
          </div>
          
          <div className="board-container">
            <Board game={game} legalActions={legalActions} onPieceClick={handlePieceClick} animState={animState} settings={settings} />
          </div>
          
          <div className="home-right">
            {game.players["P2"] && <HomeArea p={game.players["P2"]} legalActions={legalActions} onClick={handlePieceClick} animState={animState} settings={settings} isActive={game.currentPlayerId === "P2"} />}
          </div>
          <div className="home-bottom">
            {game.players["P3"] && <HomeArea p={game.players["P3"]} legalActions={legalActions} onClick={handlePieceClick} animState={animState} settings={settings} isActive={game.currentPlayerId === "P3"} />}
          </div>
        </div>

        {/* BOTTOM: COWRIES + ACTIONS */}
        
          <div className="right-column-panel">
            <TurnCard game={game} legalActions={legalActions} isWaitingForRoll={isWaitingForRoll} isWaitingForAction={isWaitingForAction} isRolling={isRolling} rollbackMsg={rollbackMsg} captureMsg={captureMsg} />
            <div className="cowrie-action-area">
          {game.gameStatus === "IN_PROGRESS" && (
            <>
              {game.mode === "TWO_PLAYER" ? (
                <div className="rollers-2p-container">
                  <RollerStation 
                    player={game.players["P1"]} 
                    isActive={game.currentPlayerId === "P1"} 
                    isRolling={isRolling} 
                    lastRoll={lastRoll} 
                    animationsEnabled={animationsEnabled} 
                    onRoll={handleRoll} 
                    isAiTurn={isAiTurn} 
                    isWaitingForRoll={isWaitingForRoll}
                    isWaitingForAction={isWaitingForAction}
                    legalActions={legalActions}
                    onSkip={handleSkip}
                  />
                  <RollerStation 
                    player={game.players["P3"]} 
                    isActive={game.currentPlayerId === "P3"} 
                    isRolling={isRolling} 
                    lastRoll={lastRoll} 
                    animationsEnabled={animationsEnabled} 
                    onRoll={handleRoll} 
                    isAiTurn={isAiTurn} 
                    isWaitingForRoll={isWaitingForRoll}
                    isWaitingForAction={isWaitingForAction}
                    legalActions={legalActions}
                    onSkip={handleSkip}
                  />
                </div>
              ) : (
                <div className="rollers-4p-container">
                  <RollerStation 
                    player={game.players[game.currentPlayerId]} 
                    isActive={true} 
                    isRolling={isRolling} 
                    lastRoll={lastRoll} 
                    animationsEnabled={animationsEnabled} 
                    onRoll={handleRoll} 
                    isAiTurn={isAiTurn} 
                    isWaitingForRoll={isWaitingForRoll}
                    isWaitingForAction={isWaitingForAction}
                    legalActions={legalActions}
                    onSkip={handleSkip}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <InfoPanel moveHistory={moveHistory} game={game} />
          </div>
        </div>

      {game.gameStatus === "FINISHED" && (
        <div className="modal-overlay">
          <div className="win-screen">
            <h2>🏆 {game.players[game.winner!].config.name} WINS!</h2>
            <div className="win-stats">
              <p>Finished: {game.players[game.winner!].finishedPieces}</p>
              <p>Captures: {game.players[game.winner!].stats.captures}</p>
              <p>Turns: {game.players[game.winner!].stats.turnsTaken}</p>
            </div>
            <div className="win-actions">
              <button onClick={() => resetGameEngine(true)} className="btn-primary">REMATCH</button>
              <button onClick={() => resetGameEngine(false)}>MAIN MENU</button>
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {activeModal === "MENU" && (
              <div className="menu-list">
                <h2>MENU</h2>
                <button className="menu-btn-item" onClick={() => { setIsMenuOpen(false); setActiveModal(null); }}>Resume Game</button>
                <button className="menu-btn-item" onClick={() => settings.confirmRestart ? setActiveModal("CONFIRM_RESTART") : resetGameEngine(true)}>Restart Game</button>
                <button className="menu-btn-item" onClick={() => settings.confirmRestart ? setActiveModal("CONFIRM_NEW") : resetGameEngine(false)}>New Game</button>
                {settings.showPlayerStats && <button className="menu-btn-item" onClick={() => setActiveModal("STATS")}>Detailed Statistics</button>}
                <button className="menu-btn-item" onClick={() => setActiveModal("SETTINGS")}>Settings</button>
                <button className="menu-btn-item" onClick={() => setActiveModal("HOW_TO_PLAY")}>How to Play</button>
                <button className="menu-btn-item" onClick={() => settings.confirmRestart ? setActiveModal("CONFIRM_EXIT") : resetGameEngine(false)}>Exit to Main Menu</button>
              </div>
            )}
            {activeModal === "SETTINGS" && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setActiveModal("MENU")} />}
            {activeModal === "HOW_TO_PLAY" && <HowToPlayModal onClose={() => setActiveModal("MENU")} />}
            {activeModal === "STATS" && (
              <div className="stats-modal">
                <h2>STATISTICS</h2>
                {game.turnOrder.map(pid => {
                  const p = game.players[pid];
                  return (
                    <div key={pid} className="stat-row">
                      <strong style={{color: p.config.color}}>{p.config.name}</strong>
                      <div>Captures: {p.stats.captures} | Chamma: {p.stats.chammaCount} | Ashta: {p.stats.ashtaCount} | Turns: {p.stats.turnsTaken}</div>
                    </div>
                  );
                })}
                <button className="btn-primary" onClick={() => setActiveModal("MENU")} style={{marginTop:'20px'}}>BACK</button>
              </div>
            )}
            
            {activeModal === "CONFIRM_RESTART" && (
              <div className="confirm-modal">
                <h2>RESTART GAME?</h2>
                <div className="win-actions">
                  <button onClick={() => setActiveModal("MENU")} className="btn-secondary">CANCEL</button>
                  <button className="btn-primary danger" onClick={() => resetGameEngine(true)}>RESTART</button>
                </div>
              </div>
            )}
            {activeModal === "CONFIRM_NEW" && (
              <div className="confirm-modal">
                <h2>NEW GAME?</h2>
                <div className="win-actions">
                  <button onClick={() => setActiveModal("MENU")} className="btn-secondary">CANCEL</button>
                  <button className="btn-primary danger" onClick={() => resetGameEngine(false)}>NEW GAME</button>
                </div>
              </div>
            )}
            {activeModal === "CONFIRM_EXIT" && (
              <div className="confirm-modal">
                <h2>LEAVE THIS GAME?</h2>
                <div className="win-actions">
                  <button onClick={() => setActiveModal("MENU")} className="btn-secondary">CANCEL</button>
                  <button className="btn-primary danger" onClick={() => resetGameEngine(false)}>LEAVE GAME</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function GameHeader({ game, rollbackMsg, captureMsg }: { game: GameState, rollbackMsg: boolean, captureMsg: string | null }) {
  const p = game.players[game.currentPlayerId];
  const isAi = p?.controlType === "AI";
  return (
    <div className="game-header">
      <div className="turn-indicator" style={{color: p.config.color}}>{p.config.name}'S TURN</div>
      <div className="turn-subtext">
        {game.gameStatus === "FINISHED" ? "GAME OVER" : (isAi ? "AI IS THINKING..." : "YOUR MOVE")}
      </div>
      <div className="turn-badges">
        {!game.turnState.hasRolled && game.turnState.extraTurnsEarned > 0 && <span className="extra-turn-badge">EXTRA THROW! </span>}
        {rollbackMsg && <span className="rollback-badge">THREE SPECIALS CANCELLED! </span>}
        {captureMsg && <span className="capture-badge">{captureMsg}</span>}
      </div>
    </div>
  )
}

function PieceShape({ config, pieceClasses, onClick, pieceCount = 1 }: { config: PlayerConfig, pieceClasses: string, onClick?: () => void, pieceCount?: number }) {

  let currentSize = config.size === "Small" ? 0.48 : config.size === "Medium" ? 0.60 : 0.72;
  if (pieceCount === 2) currentSize = Math.min(currentSize, 0.46);
  if (pieceCount === 3) currentSize = Math.min(currentSize, 0.40);
  if (pieceCount >= 4) currentSize = Math.min(currentSize, 0.38);

  const sz = (currentSize * 100) + '%';
  const s = config.shape;
  
  const getShape = (props: any) => {
    if (s === "Circle") return <circle cx="50" cy="50" r="45" {...props} />;
    if (s === "Square") return <rect x="10" y="10" width="80" height="80" rx="8" {...props} />;
    if (s === "Diamond") return <polygon points="50,5 95,50 50,95 5,50" {...props} />;
    if (s === "Triangle") return <polygon points="50,10 10,90 90,90" {...props} />;
    if (s === "Hexagon") return <polygon points="25,10 75,10 95,50 75,90 25,90 5,50" {...props} />;
    if (s === "Star") return <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" {...props} />;
    return null;
  };
  
  
  return (
    <div className={pieceClasses} onClick={onClick} style={{ width: sz, height: sz }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(3px 10px 6px rgba(0,0,0,0.7))' }}>
        <defs>
          <radialGradient id={`grad-top-${config.color.replace('#','')}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="50%" stopColor={config.color} />
            <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
          </radialGradient>
          <linearGradient id={`grad-side-${config.color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={config.color} />
            <stop offset="100%" stopColor="rgba(0,0,0,0.8)" />
          </linearGradient>
        </defs>
        {getShape({ fill: `url(#grad-side-${config.color.replace('#','')})`, transform: "translate(0, 8)" })}
        {getShape({ fill: `url(#grad-side-${config.color.replace('#','')})`, transform: "translate(0, 6)" })}
        {getShape({ fill: `url(#grad-side-${config.color.replace('#','')})`, transform: "translate(0, 4)" })}
        {getShape({ fill: `url(#grad-side-${config.color.replace('#','')})`, transform: "translate(0, 2)" })}
        {getShape({ stroke: "rgba(255,255,255,0.7)", strokeWidth: "1.5", fill: `url(#grad-top-${config.color.replace('#','')})`, transform: "translate(0, 0)" })}
      </svg>
    </div>
  )
}

function Board({ game, legalActions, onPieceClick, animState, settings }: { game: GameState, legalActions: LegalAction[], onPieceClick: (id: string) => void, animState: AnimState | null, settings: Settings }) {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells.push({ r, c });
  }

  const allBoardPieces = Object.values(game.players).flatMap(player => player.pieces).filter(p => {
    if (animState && animState.pieceId === p.id) return animState.displayIndex >= 0;
    return p.state === "ON_BOARD"; // HOME pieces are outside the board
  });

  const getPiecesAt = (r: number, c: number) => {
    return allBoardPieces.filter(p => {
      const path = PATHS[p.ownerId];
      if (animState && animState.pieceId === p.id) {
        if (animState.displayIndex < 0) return false;
        const coord = path[animState.displayIndex];
        return coord.r === r && coord.c === c;
      }
      const coord = path[p.progressIndex];
      return coord.r === r && coord.c === c;
    });
  }

  return (
    <div className={`board ${settings.pieceShadows ? 'with-shadows' : ''}`}>
      {cells.map(cell => {
        const isSafe = isSafeCell(cell.r, cell.c);
        const isCenter = cell.r === 2 && cell.c === 2;
        const isP1Start = cell.r === 0 && cell.c === 2;
        const isP2Start = cell.r === 2 && cell.c === 4;
        const isP3Start = cell.r === 4 && cell.c === 2;
        const isP4Start = cell.r === 2 && cell.c === 0;
        const isInner = cell.r >= 1 && cell.r <= 3 && cell.c >= 1 && cell.c <= 3 && !isCenter;
        const isInnerSafeVisual = settings.boardEffects && ((cell.r === 1 && cell.c === 1) || (cell.r === 1 && cell.c === 3) || (cell.r === 3 && cell.c === 1) || (cell.r === 3 && cell.c === 3));
        
        let className = "cell";
        if (isSafe) className += " safe";
        if (isCenter) className += " center";
        if (isInner) className += " inner-path";
        if (isInnerSafeVisual) className += " inner-safe-visual";
        if (isP1Start) className += " p1-start";
        if (isP2Start) className += " p2-start";
        if (isP3Start) className += " p3-start";
        if (isP4Start) className += " p4-start";

        const cellPieces = getPiecesAt(cell.r, cell.c);

        return (
          <div key={`${cell.r}-${cell.c}`} className={className}>
            {isSafe && !isCenter && <span className="cell-label safe-label">SAFE</span>}
            {isCenter && <span className="cell-label center-label">CENTER</span>}
            <div className="piece-container">
              {(() => {
                const isPlayerTurn = game.turnOrder[game.turnState.currentPlayer === undefined ? game.turnOrder.indexOf(game.currentPlayerId) : game.turnOrder.indexOf(game.turnState.currentPlayer)] === game.currentPlayerId; // Handle both safely just in case
                
                const sortedPieces = [...cellPieces].sort((a, b) => {
                  const aHigh = legalActions.some(act => act.pieceId === a.id) ? 1 : 0;
                  const bHigh = legalActions.some(act => act.pieceId === b.id) ? 1 : 0;
                  return bHigh - aHigh;
                });
                
                return (
                  <>
                    {sortedPieces.slice(0, 4).map(p => {
                      const isHighlighted = settings.showMoveHints && legalActions.some(a => a.pieceId === p.id);
                      const isCaptured = animState && animState.capturedPieceId === p.id;
                      const isFinished = animState && animState.pieceId === p.id && animState.isFinished;
                      const canMove = legalActions.some(a => a.pieceId === p.id);
                      const shouldDim = game.turnState.hasRolled && p.ownerId === game.currentPlayerId && !canMove;
                      
                      let pieceClasses = 'piece';
                      if (isHighlighted) pieceClasses += ' highlighted';
                      if (shouldDim) pieceClasses += ' dimmed';
                      if (isCaptured && settings.animationsEnabled) pieceClasses += ' animating-capture';
                      if (isFinished && settings.animationsEnabled) pieceClasses += ' animating-finish';

                      return <PieceShape key={p.id} config={game.players[p.ownerId].config} pieceClasses={pieceClasses} onClick={() => isHighlighted && onPieceClick(p.id)} pieceCount={cellPieces.length} />
                    })}
                    {cellPieces.length > 4 && <div className="piece-count-badge">{cellPieces.length}</div>}
                  </>
                );
              })()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HomeArea({ p, legalActions, onClick, animState, settings, isActive }: { p: Player, legalActions: LegalAction[], onClick: (id:string)=>void, animState: AnimState | null, settings: Settings, isActive?: boolean }) {

  const pieces = p.pieces.filter(x => {
    if (animState && animState.pieceId === x.id && animState.displayIndex >= 0) return false;
    return x.state === "HOME";
  });
  
  
  const getTextColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };
  const textColor = getTextColor(p.config.color);

  return (
    <div className={`home-area-dock ${isActive ? 'active-dock' : ''}`} style={{ '--player-color': p.config.color, '--text-color': textColor } as React.CSSProperties}>

      <div className="home-name" style={{color: 'var(--text-color)'}}>{p.config.name} HOME</div>
      <div className="dock-pieces">
        {pieces.map(x => {
          const isHighlighted = settings.showMoveHints && legalActions.some(a => a.pieceId === x.id);
          let cls = 'piece';
          if (isHighlighted) cls += ' highlighted';
          return (
            <div key={x.id} className="dock-piece-wrapper">
              <PieceShape config={p.config} pieceClasses={cls} onClick={() => isHighlighted && onClick(x.id)} />
            </div>
          );
        })}
      </div>
      {settings.showPlayerStats && (
        <div className="home-stats-compact" style={{color: 'var(--text-color)'}}>
           ON BOARD: {p.pieces.length - pieces.length - p.finishedPieces} | FINISHED: {p.finishedPieces}
        </div>
      )}
    </div>
  )
}


function TurnCard({ game, legalActions, isWaitingForRoll, isWaitingForAction, isRolling, rollbackMsg, captureMsg }: any) {
  const p = game.players[game.currentPlayerId];
  if (!p) return null;
  const isAi = p.controlType === "AI";

  let status = "";
  if (game.gameStatus === "FINISHED") status = "GAME OVER";
  else if (isRolling) status = "Rolling...";
  else if (isAi && isWaitingForRoll) status = "AI is thinking...";
  else if (isAi && isWaitingForAction && legalActions.length > 0) status = "AI is moving...";
  else if (isAi && isWaitingForAction && legalActions.length === 0) status = "AI is skipping...";
  else if (isWaitingForRoll) status = "Roll the cowries";
  else if (isWaitingForAction && legalActions.length === 0) status = "No legal moves";
  else if (isWaitingForAction && legalActions.length > 0) status = "Choose a piece to move";
  
  if (!isWaitingForRoll && game.turnState.extraTurnsEarned > 0) {
    status = "Extra throw! " + status;
  }

  return (
    <div className="turn-card" style={{ borderColor: p.config.color, boxShadow: `0 0 10px ${p.config.color}80` }}>
      <div className="turn-card-header">
         <div className="turn-card-icon">
           <PieceShape config={p.config} pieceClasses="piece" />
         </div>
         <div className="turn-card-name" style={{ color: p.config.color }}>{p.config.name}'S TURN</div>
      </div>
      <div className="turn-card-status">{status}</div>
      <div className="turn-badges">
        {rollbackMsg && <span className="rollback-badge">THREE SPECIALS CANCELLED! </span>}
        {captureMsg && <span className="capture-badge">{captureMsg}</span>}
      </div>
    </div>
  )
}


function CowrieSVG({ isUp, isRolling }: { isUp: boolean, isRolling: boolean }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="shell-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8e1" />
          <stop offset="100%" stopColor="#d7ccc8" />
        </linearGradient>
        <linearGradient id="shell-down" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8d6e63" />
          <stop offset="100%" stopColor="#3e2723" />
        </linearGradient>
      </defs>
      {isUp ? (
        <g>
          <ellipse cx="50" cy="50" rx="30" ry="45" fill="url(#shell-grad)" stroke="#a1887f" strokeWidth="2" />
          <path d="M50 15 C55 35 55 65 50 85 C45 65 45 35 50 15 Z" fill="#5d4037" />
          <line x1="48" y1="30" x2="52" y2="30" stroke="#fff" strokeWidth="2" />
          <line x1="48" y1="40" x2="52" y2="40" stroke="#fff" strokeWidth="2" />
          <line x1="48" y1="50" x2="52" y2="50" stroke="#fff" strokeWidth="2" />
          <line x1="48" y1="60" x2="52" y2="60" stroke="#fff" strokeWidth="2" />
          <line x1="48" y1="70" x2="52" y2="70" stroke="#fff" strokeWidth="2" />
        </g>
      ) : (
        <g>
          <ellipse cx="50" cy="50" rx="30" ry="45" fill="url(#shell-down)" stroke="#261612" strokeWidth="2" />
          <ellipse cx="40" cy="40" rx="10" ry="15" fill="rgba(255,255,255,0.15)" transform="rotate(-30 40 40)" />
        </g>
      )}
    </svg>
  );
}

function RollerStation({ 
  player, 
  isActive, 
  isRolling, 
  lastRoll, 
  animationsEnabled, 
  onRoll, 
  isAiTurn, 
  isWaitingForRoll,
  isWaitingForAction,
  legalActions,
  onSkip
}: any) {
  return (
    <div className={`roller-station ${isActive ? 'active' : 'inactive'}`} style={{ '--player-color': player.config.color } as React.CSSProperties}>
      <div className="roller-player-name">{player.config.name}'S ROLLER</div>
      
      <div className="cowries-row">
        <div className="cowrie-display">
          {[0,1,2,3].map(i => {
            const isUp = (isActive && lastRoll) ? lastRoll.cowries[i] : false;
            return (
              <div key={i} className="cowrie-wrapper">
                <div className={`cowrie-3d-container ${isActive && isRolling && animationsEnabled ? 'tumbling' : ''}`}>
                  <CowrieSVG isUp={isUp} isRolling={isActive && isRolling && animationsEnabled} />
                </div>
              </div>
            )
          })}
        </div>
        
        {isActive && !isRolling && lastRoll && (
           <div className="cowrie-result-reveal">
             <div className="cowrie-result-text">
               {lastRoll.result === 4 ? 'CHAMMA' : lastRoll.result === 8 ? 'ASHTA' : lastRoll.result}
             </div>
             {(lastRoll.result === 4 || lastRoll.result === 8) && <div className="extra-throw-msg">EXTRA THROW!</div>}
           </div>
        )}
      </div>
      
      {isActive && (
        <div className="action-button-row">
          {isWaitingForRoll && !isAiTurn && <button onClick={onRoll} disabled={isRolling} className="btn-primary">ROLL COWRIES</button>}
          {isWaitingForRoll && isAiTurn && <div className="status-text">AI IS ROLLING...</div>}
          
          {isWaitingForAction && legalActions.length === 0 && !isAiTurn && (
             <div className="no-moves-box">
                <div className="status-text">NO LEGAL MOVES</div>
             </div>
          )}
          {isWaitingForAction && legalActions.length === 0 && isAiTurn && <div className="status-text">AI IS SKIPPING...</div>}
          
          {isWaitingForAction && !isAiTurn && legalActions.length > 1 && (
            <div className="prompt-box">
              <strong>CHOOSE A PIECE</strong>
            </div>
          )}
          {isWaitingForAction && !isAiTurn && legalActions.length === 1 && (
            <div className="status-text" style={{color: '#ffeb3b', marginTop: '10px'}}>AUTO-MOVING...</div>
          )}
          {isWaitingForAction && isAiTurn && legalActions.length > 0 && <div className="status-text">AI IS MOVING...</div>}
        </div>
      )}
    </div>
  );
}

function InfoPanel({ moveHistory, game }: { moveHistory: any[], game: GameState }) {
  const [filter, setFilter] = useState<"ALL" | "CAPTURES">("ALL");
  const capturesPerPlayer: Record<string, number> = {};
  for (const pid of game.turnOrder) capturesPerPlayer[game.players[pid].config.name] = game.players[pid].stats.captures;
  const summary = Object.entries(capturesPerPlayer).map(([name, count]) => `${name}: ${count}`).join(' | ');
  const displayedLog = filter === "ALL" ? moveHistory : moveHistory.filter((x: any) => x.isCapture);
  
  // Mobile toggle state
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="info-panel">
      <div className="info-tabs">
        <button className="tab active" onClick={() => setIsOpenMobile(!isOpenMobile)}>History {isOpenMobile ? '▲' : '▼'}</button>
      </div>
      <div className={`info-content ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="history-summary">Captures - {summary}</div>
        <div className="history-filters">
          <button className={filter === "ALL" ? "btn-filter active" : "btn-filter"} onClick={() => setFilter("ALL")}>All</button>
          <button className={filter === "CAPTURES" ? "btn-filter active" : "btn-filter"} onClick={() => setFilter("CAPTURES")}>Captures</button>
        </div>
        <div className="history-list">
          {displayedLog.map((entry: any) => (
            <div key={entry.id} className={`history-entry ${entry.isCapture ? 'capture' : ''}`}>
               <span className="history-turn">T{entry.turn}</span>
               <span className="history-player" style={{ color: entry.playerColor }}>● {entry.playerName}</span>
               <span className="history-text">{entry.text}</span>
            </div>
          ))}
          {displayedLog.length === 0 && <div className="history-empty">No moves yet.</div>}
        </div>
      </div>
    </div>
  )
}



