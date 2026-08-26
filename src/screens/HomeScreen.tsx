import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme/colors";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const GAMES: { key: "ludo" | "snakes-ladders"; title: string; blurb: string; emoji: string }[] = [
  { key: "ludo", title: "Ludo", blurb: "2 to 6 players", emoji: "🔴" },
  { key: "snakes-ladders", title: "Snakes & Ladders", blurb: "2 to 4 players", emoji: "🐍" },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Bet on It</Text>
          <Text style={styles.greeting}>Hi, {user?.displayName?.split(" ")[0] ?? "there"}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.profileWrap}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={{ color: "#fff" }}>{user?.displayName?.charAt(0) ?? "?"}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Choose a game</Text>
      <View style={styles.cardRow}>
        {GAMES.map((g) => (
          <Pressable
            key={g.key}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => navigation.navigate("Lobby", { game: g.key })}
          >
            <Text style={styles.cardEmoji}>{g.emoji}</Text>
            <Text style={styles.cardTitle}>{g.title}</Text>
            <Text style={styles.cardBlurb}>{g.blurb}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={signOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20, paddingTop: 60, gap: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: theme.accent, fontWeight: "800", fontSize: 22 },
  greeting: { color: theme.textMuted, fontSize: 13 },
  profileWrap: {},
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "700" },
  cardRow: { flexDirection: "row", gap: 14 },
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardEmoji: { fontSize: 34 },
  cardTitle: { color: theme.text, fontWeight: "700", fontSize: 16 },
  cardBlurb: { color: theme.textMuted, fontSize: 12 },
  signOut: { alignSelf: "center", marginTop: "auto", marginBottom: 20 },
  signOutText: { color: theme.textMuted, textDecorationLine: "underline" },
});
