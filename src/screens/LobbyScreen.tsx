import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../auth/AuthContext";
import PlayerBadge from "../components/PlayerBadge";
import { theme } from "../theme/colors";
import {
  Room,
  createRoom,
  gameLimits,
  joinRoom,
  leaveRoom,
  startGame,
  subscribeRoom,
} from "../services/rooms";

type Props = NativeStackScreenProps<RootStackParamList, "Lobby">;

export default function LobbyScreen({ route, navigation }: Props) {
  const { game, roomCode: initialCode } = route.params;
  const { user } = useAuth();
  const { minPlayers, maxPlayers } = gameLimits(game);

  const [mode, setMode] = useState<"choose" | "in-room">(initialCode ? "in-room" : "choose");
  const [roomCode, setRoomCode] = useState(initialCode ?? "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "in-room" || !roomCode) return;
    const unsub = subscribeRoom(roomCode, setRoom);
    return unsub;
  }, [mode, roomCode]);

  useEffect(() => {
    if (room?.status === "active") {
      navigation.replace("Game", { roomCode });
    }
  }, [room?.status]);

  if (!user) return null;

  const handleCreate = async () => {
    setBusy(true);
    try {
      const code = await createRoom(game, {
        uid: user.uid,
        name: user.displayName ?? "Player",
        photoURL: user.photoURL,
      });
      setRoomCode(code);
      setMode("in-room");
    } catch (e: any) {
      Alert.alert("Couldn't create room", e?.message ?? "Try again");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCodeInput.trim()) return;
    setBusy(true);
    try {
      await joinRoom(joinCodeInput.trim(), {
        uid: user.uid,
        name: user.displayName ?? "Player",
        photoURL: user.photoURL,
      });
      setRoomCode(joinCodeInput.trim().toUpperCase());
      setMode("in-room");
    } catch (e: any) {
      Alert.alert("Couldn't join room", e?.message ?? "Check the code and try again");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      await startGame(roomCode);
    } catch (e: any) {
      Alert.alert("Can't start yet", e?.message ?? "Try again");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (roomCode) await leaveRoom(roomCode, user.uid);
    navigation.goBack();
  };

  if (mode === "choose") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{game === "ludo" ? "Ludo" : "Snakes & Ladders"}</Text>
        <Text style={styles.subtitle}>
          {minPlayers}–{maxPlayers} players · online rooms
        </Text>

        <Pressable style={styles.primaryBtn} onPress={handleCreate} disabled={busy}>
          {busy ? <ActivityIndicator color="#0F1220" /> : <Text style={styles.primaryBtnText}>Create a room</Text>}
        </Pressable>

        <Text style={styles.orText}>or join with a code</Text>
        <TextInput
          value={joinCodeInput}
          onChangeText={(t) => setJoinCodeInput(t.toUpperCase())}
          placeholder="ROOM CODE"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="characters"
          maxLength={5}
          style={styles.input}
        />
        <Pressable style={styles.secondaryBtn} onPress={handleJoin} disabled={busy}>
          <Text style={styles.secondaryBtnText}>Join room</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{game === "ludo" ? "Ludo" : "Snakes & Ladders"}</Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Room code</Text>
        <Text style={styles.code}>{roomCode}</Text>
        <Text style={styles.codeHint}>Share this code with friends</Text>
      </View>

      <Text style={styles.subtitle}>
        {room?.players.length ?? 0} / {maxPlayers} players
      </Text>
      <View style={{ gap: 8, width: "100%" }}>
        {room?.players.map((p) => (
          <PlayerBadge
            key={p.uid}
            name={p.name}
            photoURL={p.photoURL}
            colorIndex={p.colorIndex}
            subtitle={p.uid === room.hostUid ? "Host" : undefined}
          />
        ))}
      </View>

      {room?.hostUid === user.uid ? (
        <Pressable
          style={[styles.primaryBtn, (room?.players.length ?? 0) < minPlayers && styles.disabledBtn]}
          onPress={handleStart}
          disabled={busy || (room?.players.length ?? 0) < minPlayers}
        >
          {busy ? (
            <ActivityIndicator color="#0F1220" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {(room?.players.length ?? 0) < minPlayers ? `Need ${minPlayers}+ players` : "Start game"}
            </Text>
          )}
        </Pressable>
      ) : (
        <Text style={styles.waiting}>Waiting for host to start…</Text>
      )}

      <Pressable onPress={handleLeave} style={{ marginTop: 16 }}>
        <Text style={styles.back}>‹ Leave room</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 24, paddingTop: 60, gap: 16, alignItems: "center" },
  title: { color: theme.text, fontSize: 24, fontWeight: "800" },
  subtitle: { color: theme.textMuted, fontSize: 13 },
  primaryBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  disabledBtn: { opacity: 0.4 },
  primaryBtnText: { color: "#0F1220", fontWeight: "800" },
  orText: { color: theme.textMuted },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: theme.text,
    width: "100%",
    textAlign: "center",
    letterSpacing: 4,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  secondaryBtnText: { color: theme.accent, fontWeight: "700" },
  back: { color: theme.textMuted, textDecorationLine: "underline" },
  codeBox: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  codeLabel: { color: theme.textMuted, fontSize: 12 },
  code: { color: theme.accent, fontSize: 36, fontWeight: "900", letterSpacing: 6 },
  codeHint: { color: theme.textMuted, fontSize: 11 },
  waiting: { color: theme.textMuted, fontStyle: "italic" },
});
