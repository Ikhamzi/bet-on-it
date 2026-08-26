// Ludo engine — supports 2 to 6 players.
//
// Board model: classic Ludo has 4 symmetric "arms" of 13 squares around a
// 52-square shared track, each player entering the track at `armIndex * 13`
// and peeling off into a 6-square private home stretch after one full lap.
// This engine generalizes that to N players by using N arms of 13 squares
// each (track length = 13 * N), which reduces to the exact classic board
// when N = 4.

export type TokenState = "yard" | "active" | "home";

export interface Token {
  state: TokenState;
  /** Position along the *shared* track (0..trackLength-1) when state === 'active'. */
  trackPos: number;
  /** Position along this player's private home stretch (0..5) when entering it. */
  homePos: number;
}

export interface LudoPlayer {
  uid: string;
  name: string;
  colorIndex: number; // 0..numPlayers-1, also = arm index
  tokens: Token[]; // length 4
  finishedCount: number;
}

export interface LudoState {
  numPlayers: number;
  trackLength: number;
  players: LudoPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  diceRolledThisTurn: boolean;
  consecutiveSixes: number;
  winnerUid: string | null;
  log: string[];
}

export const TOKENS_PER_PLAYER = 4;
export const ARM_LENGTH = 13;
export const HOME_STRETCH_LENGTH = 6;

export function createLudoGame(players: { uid: string; name: string }[]): LudoState {
  const numPlayers = players.length;
  if (numPlayers < 2 || numPlayers > 6) {
    throw new Error("Ludo supports 2 to 6 players");
  }
  const trackLength = ARM_LENGTH * numPlayers;
  return {
    numPlayers,
    trackLength,
    players: players.map((p, i) => ({
      uid: p.uid,
      name: p.name,
      colorIndex: i,
      finishedCount: 0,
      tokens: Array.from({ length: TOKENS_PER_PLAYER }, () => ({
        state: "yard" as TokenState,
        trackPos: -1,
        homePos: -1,
      })),
    })),
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolledThisTurn: false,
    consecutiveSixes: 0,
    winnerUid: null,
    log: ["Game started"],
  };
}

/** Entry square on the shared track for a given player. */
export function startSquare(state: LudoState, colorIndex: number): number {
  return colorIndex * ARM_LENGTH;
}

/** Squares that are "safe" (no capture allowed): every player's start square,
 * plus one star square roughly at the mid-point of each arm. */
export function isSafeSquare(state: LudoState, trackPos: number): boolean {
  for (let c = 0; c < state.numPlayers; c++) {
    if (trackPos === startSquare(state, c)) return true;
    if (trackPos === (startSquare(state, c) + 8) % state.trackLength) return true;
  }
  return false;
}

function absoluteToRelative(state: LudoState, colorIndex: number, abs: number): number {
  const start = startSquare(state, colorIndex);
  return (abs - start + state.trackLength) % state.trackLength;
}

/** Relative distance travelled (from a player's own start square) before a
 * token peels off into its private home stretch: one full lap minus 1
 * square, so it scales with the number of players (52-length board with
 * 4 players gives the classic 51, matching real Ludo exactly). */
function relativeEntryToHome(state: LudoState): number {
  return state.trackLength - 1;
}

export interface LegalMove {
  tokenIndex: number;
  description: string;
}

export function getLegalMoves(state: LudoState): LegalMove[] {
  if (state.winnerUid || state.diceValue === null) return [];
  const player = state.players[state.currentPlayerIndex];
  const moves: LegalMove[] = [];

  player.tokens.forEach((token, idx) => {
    if (token.state === "yard") {
      if (state.diceValue === 6) {
        moves.push({ tokenIndex: idx, description: "Bring out of yard" });
      }
      return;
    }
    if (token.state === "home") return; // already finished

    if (token.state === "active") {
      const rel = absoluteToRelative(state, player.colorIndex, token.trackPos);
      const newRel = rel + (state.diceValue as number);
      if (newRel > relativeEntryToHome(state) + HOME_STRETCH_LENGTH) {
        return; // overshoots the finish, illegal
      }
      moves.push({ tokenIndex: idx, description: "Move token" });
    }
  });

  return moves;
}

export function rollDice(state: LudoState, value?: number): LudoState {
  if (state.winnerUid) return state;
  if (state.diceRolledThisTurn) return state;
  const diceValue = value ?? 1 + Math.floor(Math.random() * 6);
  return {
    ...state,
    diceValue,
    diceRolledThisTurn: true,
    log: [...state.log, `${state.players[state.currentPlayerIndex].name} rolled ${diceValue}`],
  };
}

function cloneState(state: LudoState): LudoState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      tokens: p.tokens.map((t) => ({ ...t })),
    })),
    log: [...state.log],
  };
}

function advanceTurn(state: LudoState, extraTurn: boolean) {
  if (!extraTurn) {
    let next = state.currentPlayerIndex;
    for (let i = 0; i < state.numPlayers; i++) {
      next = (next + 1) % state.numPlayers;
      const p = state.players[next];
      if (p.finishedCount < TOKENS_PER_PLAYER) {
        state.currentPlayerIndex = next;
        break;
      }
    }
  }
  state.diceValue = null;
  state.diceRolledThisTurn = false;
}

export function moveToken(state: LudoState, tokenIndex: number): LudoState {
  if (state.winnerUid || state.diceValue === null) return state;
  const legal = getLegalMoves(state).some((m) => m.tokenIndex === tokenIndex);
  if (!legal) return state;

  const next = cloneState(state);
  const player = next.players[next.currentPlayerIndex];
  const token = player.tokens[tokenIndex];
  const diceValue = next.diceValue as number;
  let captured = false;

  if (token.state === "yard") {
    token.state = "active";
    token.trackPos = startSquare(next, player.colorIndex);
  } else {
    const rel = absoluteToRelative(next, player.colorIndex, token.trackPos);
    const newRel = rel + diceValue;
    const entryToHome = relativeEntryToHome(next);
    if (newRel === entryToHome + HOME_STRETCH_LENGTH) {
      token.state = "home";
      token.trackPos = -1;
      token.homePos = HOME_STRETCH_LENGTH - 1;
      player.finishedCount += 1;
    } else if (newRel > entryToHome) {
      token.homePos = newRel - entryToHome - 1;
      token.trackPos = -1;
      token.state = "active"; // still "active" but tracked via homePos; trackPos=-1 signals home stretch
    } else {
      token.trackPos = (startSquare(next, player.colorIndex) + newRel) % next.trackLength;
    }
  }

  // Capture logic: only when landing on the shared track (trackPos >= 0)
  if (token.trackPos >= 0 && !isSafeSquare(next, token.trackPos)) {
    for (const other of next.players) {
      if (other.uid === player.uid) continue;
      other.tokens.forEach((ot) => {
        if (ot.state === "active" && ot.trackPos === token.trackPos) {
          ot.state = "yard";
          ot.trackPos = -1;
          ot.homePos = -1;
          captured = true;
        }
      });
    }
  }

  next.log.push(
    `${player.name} moved token ${tokenIndex + 1}${captured ? " and captured!" : ""}`
  );

  if (player.finishedCount === TOKENS_PER_PLAYER) {
    next.winnerUid = player.uid;
    next.log.push(`${player.name} wins!`);
    return next;
  }

  const bonusSix = diceValue === 6;
  const extraTurn = bonusSix || captured;
  advanceTurn(next, extraTurn);
  return next;
}

/** Call when the current player has no legal moves after rolling — passes the turn. */
export function passTurn(state: LudoState): LudoState {
  const next = cloneState(state);
  advanceTurn(next, false);
  return next;
}
