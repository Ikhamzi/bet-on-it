import type { GameKind } from "../services/rooms";

export type RootStackParamList = {
  Home: undefined;
  Lobby: { game: GameKind; roomCode?: string };
  Game: { roomCode: string };
};
