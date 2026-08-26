import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
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
import FadeOverlay from "../components/FadeOverlay";
import { theme } from "../theme/colors";
import { images } from "../theme/images";
import {
  Room,
  createRoom,
  gameLimits,
  joinRoom,
  leaveRoom,
  LUDO_PLAYER_OPTIONS,
  startGame,
  subscribeRoom,
} from "../services/rooms";

type Props = NativeStackScreenProps<RootStackParamList, "Lobby">;

const BANNER_IMAGE: Record<"ludo" | "snakes-ladders", string> = {
  ludo: images.ludoBoard(600),
  "snakes-ladders": images.snakesAndLadders(600),
};

export default function LobbyScreen({ route, navigation }: Props) {
  const { game, roomCode: initialCode } = route.params;
  const { user } = useAuth();
  const { minPlayers, maxPlayers } = gameLimits(game);

  const [mode, setMode] = useState<"choose" | "in-room">(initialCode ? "in-room" : "choose");
  const [roomCode, setRoomCode] = useState(initialCode ?? "");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);

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
      const code = await createRoom(
        game,
        { uid: user.uid, name: user.displayName ?? "Player", photoURL: user.photoURL },
        game === "ludo" ? { playerCount } : undefined
      );
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

  const gameTitle = game === "ludo" ? "Ludo" : "Snakes & Ladders";
  const effectiveMax = room?.maxPlayers ?? maxPlayers;
  const effectiveMin = room?.minPlayers ?? minPlayers;

  if (mode === "choose") {
    return (
      <View style={styles.container}>
        <ImageBackground source={{ uri: BANNER_IMAGE[game] }} style={styles.banner} imageStyle={styles.bannerImg}>
          <FadeOverlay color={theme.bg} bands={32} curve={1.3} />
          <Pressable onPress={() => navigation.goBack()} style={styles.backChip}>
            <Text style={styles.backChipText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>{gameTitle}</Text>
        </ImageBackground>

        <View style={styles.body}>
          {game === "ludo" ? (
            <>
              <Text style={styles.pickerLabel}>How many players?</Text>
              <View style={styles.pickerRow}>
                {LUDO_PLAYER_OPTIONS.map((n) => {
                  const selected = playerCount === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setPlayerCount(n)}
                      style={[styles.pickerBtn, selected && styles.pickerBtnSelected]}
                    >
                      <Text style={[styles.pickerBtnText, selected && styles.pickerBtnTextSelected]}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.pickerHint}>
                The room will start once exactly {playerCount} {playerCount === 1 ? "player" : "players"} have joined.
              </Text>
            </>
          ) : (
            <Text style={styles.subtitle}>
              {minPlayers}–{maxPlayers} players · online rooms
            </Text>
          )}

          <Pressable style={styles.primaryBtn} onPress={handleCreate} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#0F1220" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {game === "ludo" ? `Create room for ${playerCount} players` : "Create a room"}
              </Text>
            )}
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
        </View>
      </View>
    );
  }

  const filledSlots = room?.players.length ?? 0;
  const emptySlots = Math.max(0, effectiveMax - filledSlots);

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: BANNER_IMAGE[game] }} style={styles.banner} imageStyle={styles.bannerImg}>
        <FadeOverlay color={theme.bg} bands={32} curve={1.3} />
        <Text style={styles.title}>{gameTitle}</Text>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Room code</Text>
          <Text style={styles.code}>{roomCode}</Text>
          <Text style={styles.codeHint}>Share this code with friends</Text>
        </View>

        <Text style={styles.subtitle}>
          {filledSlots} / {effectiveMax} players
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
          {Array.from({ length: emptySlots }, (_, i) => (
            <View key={`empty-${i}`} style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>Waiting for player…</Text>
            </View>
          ))}
        </View>

        {room?.hostUid === user.uid ? (
          <Pressable
            style={[styles.primaryBtn, filledSlots < effectiveMin && styles.disabledBtn]}
            onPress={handleStart}
            disabled={busy || filledSlots < effectiveMin}
          >
            {busy ? (
              <ActivityIndicator color="#0F1220" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {filledSlots < effectiveMin ? `Need ${effectiveMin - filledSlots} more player${effectiveMin - filledSlots === 1 ? "" : "s"}` : "Start game"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  banner: { height: 140, justifyContent: "flex-end", padding: 20, paddingTop: 50 },
  bannerImg: { opacity: 0.9 },
  backChip: { position: "absolute", top: 50, left: 20 },
  backChipText: { color: theme.text, fontWeight: "600" },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  body: { flex: 1, padding: 24, gap: 14, alignItems: "center" },
  subtitle: { color: theme.textMuted, fontSize: 13 },
  pickerLabel: { color: theme.text, fontSize: 15, fontWeight: "700", marginTop: 4 },
  pickerRow: { flexDirection: "row", gap: 12 },
  pickerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBtnSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  pickerBtnText: { color: theme.text, fontWeight: "800", fontSize: 20 },
  pickerBtnTextSelected: { color: "#0F1220" },
  pickerHint: { color: theme.textMuted, fontSize: 12, textAlign: "center", paddingHorizontal: 12 },
  primaryBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
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
    borderWidth: 1,
    borderColor: theme.border,
  },
  codeLabel: { color: theme.textMuted, fontSize: 12 },
  code: { color: theme.accent, fontSize: 36, fontWeight: "900", letterSpacing: 6 },
  codeHint: { color: theme.textMuted, fontSize: 11 },
  waiting: { color: theme.textMuted, fontStyle: "italic" },
  emptySlot: {
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  emptySlotText: { color: theme.textMuted, fontSize: 12, fontStyle: "italic" },
});
