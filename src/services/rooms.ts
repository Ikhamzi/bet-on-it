import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  arrayUnion,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  limitToLast,
} from "firebase/firestore";
import { customAlphabet } from "nanoid/non-secure";
import { db } from "../firebase";
import { createLudoGame, LudoState } from "../game-engine/ludo";
import { createSnakesAndLaddersGame, SLState } from "../game-engine/snakesAndLadders";

export type GameKind = "ludo" | "snakes-ladders";

export interface RoomPlayer {
  uid: string;
  name: string;
  photoURL: string | null;
  colorIndex: number;
}

export interface Room {
  roomCode: string;
  game: GameKind;
  status: "lobby" | "active" | "finished";
  hostUid: string;
  maxPlayers: number;
  minPlayers: number;
  players: RoomPlayer[];
  gameState: LudoState | SLState | null;
  createdAt?: any;
  updatedAt?: any;
}

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

export function gameLimits(game: GameKind) {
  return game === "ludo"
    ? { minPlayers: 2, maxPlayers: 6 }
    : { minPlayers: 2, maxPlayers: 4 };
}

/** Exact seat counts a host can pick when creating a Ludo room. */
export const LUDO_PLAYER_OPTIONS = [2, 3, 4, 5] as const;

export async function createRoom(
  game: GameKind,
  host: { uid: string; name: string; photoURL: string | null },
  options?: { playerCount?: number }
): Promise<string> {
  let { minPlayers, maxPlayers } = gameLimits(game);
  if (game === "ludo" && options?.playerCount) {
    // Host picked an exact seat count — the room fills to exactly that many
    // and won't accept extra joiners.
    minPlayers = options.playerCount;
    maxPlayers = options.playerCount;
  }
  const roomCode = makeCode();
  const room: Room = {
    roomCode,
    game,
    status: "lobby",
    hostUid: host.uid,
    maxPlayers,
    minPlayers,
    players: [{ uid: host.uid, name: host.name, photoURL: host.photoURL, colorIndex: 0 }],
    gameState: null,
  };
  await setDoc(doc(db, "rooms", roomCode), {
    ...room,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return roomCode;
}

export async function joinRoom(
  roomCode: string,
  player: { uid: string; name: string; photoURL: string | null }
): Promise<void> {
  const ref = doc(db, "rooms", roomCode.toUpperCase());
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");
    const room = snap.data() as Room;
    if (room.status !== "lobby") throw new Error("Game already started");
    if (room.players.some((p) => p.uid === player.uid)) return; // already joined
    if (room.players.length >= room.maxPlayers) throw new Error("Room is full");
    const colorIndex = room.players.length;
    tx.update(ref, {
      players: arrayUnion({
        uid: player.uid,
        name: player.name,
        photoURL: player.photoURL,
        colorIndex,
      }),
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeRoom(
  roomCode: string,
  cb: (room: Room | null) => void
): () => void {
  return onSnapshot(doc(db, "rooms", roomCode.toUpperCase()), (snap) => {
    cb(snap.exists() ? (snap.data() as Room) : null);
  });
}

export async function getRoom(roomCode: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomCode.toUpperCase()));
  return snap.exists() ? (snap.data() as Room) : null;
}

export async function startGame(roomCode: string): Promise<void> {
  const ref = doc(db, "rooms", roomCode.toUpperCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Room not found");
  const room = snap.data() as Room;
  if (room.players.length < room.minPlayers) {
    throw new Error(`Need at least ${room.minPlayers} players`);
  }
  const playersForEngine = room.players.map((p) => ({ uid: p.uid, name: p.name }));
  const gameState =
    room.game === "ludo"
      ? createLudoGame(playersForEngine)
      : createSnakesAndLaddersGame(playersForEngine);
  await updateDoc(ref, {
    status: "active",
    gameState,
    updatedAt: serverTimestamp(),
  });
}

export async function pushGameState(
  roomCode: string,
  gameState: LudoState | SLState
): Promise<void> {
  const ref = doc(db, "rooms", roomCode.toUpperCase());
  const winnerUid = (gameState as any).winnerUid;
  await updateDoc(ref, {
    gameState,
    status: winnerUid ? "finished" : "active",
    updatedAt: serverTimestamp(),
  });
}

export async function leaveRoom(roomCode: string, uid: string): Promise<void> {
  const ref = doc(db, "rooms", roomCode.toUpperCase());
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as Room;
    const players = room.players.filter((p) => p.uid !== uid);
    tx.update(ref, { players, updatedAt: serverTimestamp() });
  });
}

export interface ChatMessage {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt?: any;
}

const CHAT_HISTORY_LIMIT = 50;

export async function sendMessage(
  roomCode: string,
  message: { uid: string; name: string; text: string }
): Promise<void> {
  const text = message.text.trim().slice(0, 300);
  if (!text) return;
  const messagesRef = collection(db, "rooms", roomCode.toUpperCase(), "messages");
  await addDoc(messagesRef, {
    uid: message.uid,
    name: message.name,
    text,
    createdAt: serverTimestamp(),
  });
}

export function subscribeMessages(
  roomCode: string,
  cb: (messages: ChatMessage[]) => void
): () => void {
  const messagesRef = collection(db, "rooms", roomCode.toUpperCase(), "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limitToLast(CHAT_HISTORY_LIMIT));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
  });
}
