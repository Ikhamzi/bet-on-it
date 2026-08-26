// Snakes & Ladders engine — 2 to 4 players, classic 100-square board.

export interface SLPlayer {
  uid: string;
  name: string;
  colorIndex: number;
  position: number; // 0 = not yet on board, 1..100
}

export interface SLState {
  players: SLPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  diceRolledThisTurn: boolean;
  winnerUid: string | null;
  log: string[];
  lastMove?: { uid: string; from: number; to: number; via?: "snake" | "ladder" };
}

// square -> destination square
export const LADDERS: Record<number, number> = {
  2: 23,
  8: 34,
  20: 77,
  32: 68,
  41: 79,
  74: 88,
  82: 96,
  85: 95,
};

export const SNAKES: Record<number, number> = {
  16: 6,
  46: 25,
  49: 11,
  62: 19,
  64: 60,
  74: 53, // note: won't trigger since 74 is also a ladder start in some sets — avoided below
  89: 68,
  92: 88,
  95: 75,
  98: 78,
};

// Ensure no square is both a ladder start and a snake head (keeps rules unambiguous).
for (const key of Object.keys(SNAKES)) {
  if (LADDERS[Number(key)] !== undefined) delete SNAKES[Number(key)];
}

export function createSnakesAndLaddersGame(
  players: { uid: string; name: string }[]
): SLState {
  if (players.length < 2 || players.length > 4) {
    throw new Error("Snakes & Ladders supports 2 to 4 players");
  }
  return {
    players: players.map((p, i) => ({
      uid: p.uid,
      name: p.name,
      colorIndex: i,
      position: 0,
    })),
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolledThisTurn: false,
    winnerUid: null,
    log: ["Game started"],
  };
}

function cloneState(state: SLState): SLState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    log: [...state.log],
  };
}

function advanceTurn(state: SLState) {
  let next = state.currentPlayerIndex;
  for (let i = 0; i < state.players.length; i++) {
    next = (next + 1) % state.players.length;
    if (state.players[next].position < 100) {
      state.currentPlayerIndex = next;
      break;
    }
  }
  state.diceValue = null;
  state.diceRolledThisTurn = false;
}

export function rollDice(state: SLState, value?: number): SLState {
  if (state.winnerUid || state.diceRolledThisTurn) return state;
  const diceValue = value ?? 1 + Math.floor(Math.random() * 6);
  return {
    ...state,
    diceValue,
    diceRolledThisTurn: true,
    log: [...state.log, `${state.players[state.currentPlayerIndex].name} rolled ${diceValue}`],
  };
}

/** Applies the rolled dice value to the current player's position. */
export function applyMove(state: SLState): SLState {
  if (state.winnerUid || state.diceValue === null) return state;
  const next = cloneState(state);
  const player = next.players[next.currentPlayerIndex];
  const from = player.position;
  let target = from + (next.diceValue as number);

  if (target > 100) {
    // Must roll exact number to finish — overshoot forfeits the move.
    next.log.push(`${player.name} needs an exact roll to finish — no move`);
    const bonusSix = next.diceValue === 6;
    if (!bonusSix) advanceTurn(next);
    else {
      next.diceValue = null;
      next.diceRolledThisTurn = false;
    }
    return next;
  }

  let via: "snake" | "ladder" | undefined;
  if (LADDERS[target] !== undefined) {
    via = "ladder";
    target = LADDERS[target];
  } else if (SNAKES[target] !== undefined) {
    via = "snake";
    target = SNAKES[target];
  }

  player.position = target;
  next.lastMove = { uid: player.uid, from, to: target, via };
  next.log.push(
    `${player.name} moved ${from} -> ${target}${via ? ` (via ${via})` : ""}`
  );

  if (target === 100) {
    next.winnerUid = player.uid;
    next.log.push(`${player.name} wins!`);
    return next;
  }

  const bonusSix = next.diceValue === 6;
  if (bonusSix) {
    next.diceValue = null;
    next.diceRolledThisTurn = false;
  } else {
    advanceTurn(next);
  }
  return next;
}
