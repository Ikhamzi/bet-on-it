import { createLudoGame, rollDice as ludoRoll, getLegalMoves, moveToken, passTurn } from "../src/game-engine/ludo";
import { createSnakesAndLaddersGame, rollDice as slRoll, applyMove } from "../src/game-engine/snakesAndLadders";

function simulateLudo(numPlayers: number) {
  const players = Array.from({ length: numPlayers }, (_, i) => ({ uid: `p${i}`, name: `P${i}` }));
  let state = createLudoGame(players);
  let turns = 0;
  const maxTurns = 20000;
  while (!state.winnerUid && turns < maxTurns) {
    turns++;
    state = ludoRoll(state);
    const legal = getLegalMoves(state);
    if (legal.length === 0) {
      state = passTurn(state);
      continue;
    }
    const pick = legal[Math.floor(Math.random() * legal.length)];
    state = moveToken(state, pick.tokenIndex);
  }
  if (!state.winnerUid) throw new Error(`Ludo(${numPlayers}p) did not finish within ${maxTurns} turns`);
  console.log(`Ludo ${numPlayers}p: winner=${state.winnerUid} in ${turns} turns, trackLength=${state.trackLength}`);
}

function simulateSL(numPlayers: number) {
  const players = Array.from({ length: numPlayers }, (_, i) => ({ uid: `p${i}`, name: `P${i}` }));
  let state = createSnakesAndLaddersGame(players);
  let turns = 0;
  const maxTurns = 20000;
  while (!state.winnerUid && turns < maxTurns) {
    turns++;
    state = slRoll(state);
    state = applyMove(state);
  }
  if (!state.winnerUid) throw new Error(`S&L(${numPlayers}p) did not finish within ${maxTurns} turns`);
  console.log(`Snakes&Ladders ${numPlayers}p: winner=${state.winnerUid} in ${turns} turns`);
}

for (const n of [2, 3, 4, 5, 6]) simulateLudo(n);
for (const n of [2, 3, 4]) simulateSL(n);

console.log("All simulations completed successfully.");
