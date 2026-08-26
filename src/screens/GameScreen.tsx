import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/AuthContext";
import {
  Room,
  pushGameState,
  subscribeRoom,
  leaveRoom,
  ChatMessage,
  sendMessage,
  subscribeMessages,
} from "../services/rooms";
import { theme, PLAYER_COLORS } from "../theme/colors";
import Dice from "../components/Dice";
import PlayerBadge from "../components/PlayerBadge";
import LudoBoard from "../components/LudoBoard";
import SnakesLaddersBoard from "../components/SnakesLaddersBoard";
import ChatPanel from "../components/ChatPanel";
import {
  LudoState,
  getLegalMoves as getLudoLegalMoves,
  rollDice as ludoRollDice,
  moveToken,
  passTurn,
} from "../game-engine/ludo";
import {
  SLState,
  rollDice as slRollDice,
  applyMove as slApplyMove,
} from "../game-engine/snakesAndLadders";

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

export default function GameScreen({ route, navigation }: Props) {
  const { roomCode } = route.params;
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [rolling, setRolling] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeRoom(roomCode, setRoom);
    return unsub;
  }, [roomCode]);

  useEffect(() => {
    const unsub = subscribeMessages(roomCode, setMessages);
    return unsub;
  }, [roomCode]);

  useEffect(() => {
    if (chatOpen) setSeenCount(messages.length);
  }, [chatOpen, messages.length]);

  const unreadCount = chatOpen ? 0 : Math.max(0, messages.length - seenCount);

  const isLudo = room?.game === "ludo";
  const gameState = room?.gameState as (LudoState | SLState | null);

  const currentPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
  }, [gameState]);

  const isMyTurn = !!user && currentPlayer?.uid === user.uid;

  if (!room || !gameState || !user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.textMuted }}>Loading game…</Text>
      </View>
    );
  }

  const handleRoll = async () => {
    if (!isMyTurn || gameState.diceRolledThisTurn) return;
    setRolling(true);
    let next: LudoState | SLState;
    if (isLudo) {
      next = ludoRollDice(gameState as LudoState);
      const legal = getLudoLegalMoves(next as LudoState);
      if (legal.length === 0) {
        // No legal moves at all (e.g. rolled non-6 with everything in yard) — pass after showing dice.
        setTimeout(async () => {
          await pushGameState(roomCode, passTurn(next as LudoState));
          setRolling(false);
        }, 700);
        await pushGameState(roomCode, next);
        return;
      }
    } else {
      next = slRollDice(gameState as SLState);
      setTimeout(async () => {
        await pushGameState(roomCode, slApplyMove(next as SLState));
        setRolling(false);
      }, 600);
      await pushGameState(roomCode, next);
      return;
    }
    await pushGameState(roomCode, next);
    setRolling(false);
  };

  const handleMoveToken = async (tokenIndex: number) => {
    if (!isMyTurn || !isLudo) return;
    const next = moveToken(gameState as LudoState, tokenIndex);
    await pushGameState(roomCode, next);
  };

  const handleLeave = async () => {
    await leaveRoom(roomCode, user.uid);
    navigation.popToTop();
  };

  const handleSendMessage = (text: string) => {
    sendMessage(roomCode, { uid: user.uid, name: user.displayName ?? "Player", text });
  };

  const winner = room.players.find((p) => p.uid === gameState.winnerUid);

  const ludoLegalMoves = isLudo && isMyTurn ? getLudoLegalMoves(gameState as LudoState) : [];

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isLudo ? "Ludo" : "Snakes & Ladders"}</Text>
        <Pressable onPress={handleLeave}>
          <Text style={styles.leave}>Leave</Text>
        </Pressable>
      </View>

      {winner ? (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>🏆 {winner.name} wins!</Text>
        </View>
      ) : null}

      <View style={styles.playersRow}>
        {room.players.map((p) => (
          <PlayerBadge
            key={p.uid}
            name={p.name}
            photoURL={p.photoURL}
            colorIndex={p.colorIndex}
            active={currentPlayer?.uid === p.uid && !winner}
          />
        ))}
      </View>

      <View style={styles.boardWrap}>
        {isLudo ? (
          <LudoBoard state={gameState as LudoState} />
        ) : (
          <SnakesLaddersBoard players={(gameState as SLState).players} />
        )}
      </View>

      {!winner && (
        <View style={styles.controls}>
          <Text style={styles.turnText}>
            {isMyTurn ? "Your turn" : `${currentPlayer?.name ?? ""}'s turn`}
          </Text>
          <Dice
            value={gameState.diceValue}
            disabled={!isMyTurn || gameState.diceRolledThisTurn}
            rolling={rolling}
            onRoll={handleRoll}
          />

          {isLudo && isMyTurn && gameState.diceRolledThisTurn && ludoLegalMoves.length > 0 && (
            <View style={styles.tokenRow}>
              <Text style={styles.tokenHint}>Choose a token to move:</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {ludoLegalMoves.map((m) => (
                  <Pressable
                    key={m.tokenIndex}
                    style={[
                      styles.tokenBtn,
                      { borderColor: PLAYER_COLORS[currentPlayer!.colorIndex % PLAYER_COLORS.length] },
                    ]}
                    onPress={() => handleMoveToken(m.tokenIndex)}
                  >
                    <Text style={styles.tokenBtnText}>{m.tokenIndex + 1}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <ScrollView style={styles.log} nestedScrollEnabled>
        {gameState.log
          .slice(-8)
          .reverse()
          .map((line, i) => (
            <Text key={i} style={styles.logLine}>
              {line}
            </Text>
          ))}
      </ScrollView>
    </ScrollView>

      <Pressable style={styles.chatFab} onPress={() => setChatOpen(true)}>
        <Text style={styles.chatFabText}>💬</Text>
        {unreadCount > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          </View>
        )}
      </Pressable>

      {chatOpen && (
        <ChatPanel
          messages={messages}
          myUid={user.uid}
          onSend={handleSendMessage}
          onClose={() => setChatOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.bg, padding: 20, paddingTop: 56, gap: 16, alignItems: "center", flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg },
  header: { flexDirection: "row", justifyContent: "space-between", width: "100%", alignItems: "center" },
  title: { color: theme.text, fontSize: 20, fontWeight: "800" },
  leave: { color: theme.danger, fontWeight: "600" },
  playersRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
  boardWrap: { alignItems: "center", justifyContent: "center" },
  controls: { alignItems: "center", gap: 10 },
  turnText: { color: theme.accent, fontWeight: "700" },
  tokenRow: { alignItems: "center", gap: 8 },
  tokenHint: { color: theme.textMuted, fontSize: 12 },
  tokenBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
  },
  tokenBtnText: { color: theme.text, fontWeight: "700" },
  winnerBanner: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  winnerText: { color: "#0F1220", fontWeight: "800" },
  log: { width: "100%", maxHeight: 120, backgroundColor: theme.surface, borderRadius: 12, padding: 10 },
  logLine: { color: theme.textMuted, fontSize: 11, marginBottom: 2 },
  chatFab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  chatFabText: { fontSize: 24 },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.bg,
  },
  chatBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
