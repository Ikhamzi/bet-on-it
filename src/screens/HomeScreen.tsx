import React from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme/colors";
import { images } from "../theme/images";
import FadeOverlay from "../components/FadeOverlay";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const GAMES: {
  key: "ludo" | "snakes-ladders";
  title: string;
  blurb: string;
  emoji: string;
  image: string;
  tint: string;
}[] = [
  {
    key: "ludo",
    title: "Ludo",
    blurb: "2 to 5 players · pick your room size",
    emoji: "🔴",
    image: images.ludoBoard(),
    tint: "#E63946",
  },
  {
    key: "snakes-ladders",
    title: "Snakes & Ladders",
    blurb: "2 to 4 players",
    emoji: "🐍",
    image: images.snakesAndLadders(),
    tint: "#2A9D8F",
  },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>🎲 Bet on It</Text>
          <Text style={styles.greeting}>Hi, {user?.displayName?.split(" ")[0] ?? "there"} — ready to play?</Text>
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
      <View style={styles.cardStack}>
        {GAMES.map((g) => (
          <Pressable
            key={g.key}
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}
            onPress={() => navigation.navigate("Lobby", { game: g.key })}
          >
            <ImageBackground source={{ uri: g.image }} style={styles.cardImage} imageStyle={styles.cardImageInner}>
              <FadeOverlay color="#05060C" bands={32} curve={1.3} />
              <View style={[styles.cardBadge, { backgroundColor: g.tint }]}>
                <Text style={styles.cardBadgeEmoji}>{g.emoji}</Text>
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>{g.title}</Text>
                <Text style={styles.cardBlurb}>{g.blurb}</Text>
              </View>
              <View style={styles.playChip}>
                <Text style={styles.playChipText}>Play ›</Text>
              </View>
            </ImageBackground>
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
  greeting: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  profileWrap: {},
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: theme.accent },
  avatarFallback: { backgroundColor: theme.surfaceAlt, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "700" },
  cardStack: { gap: 16 },
  card: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  cardImage: { height: 168, justifyContent: "flex-end" },
  cardImageInner: { opacity: 0.95 },
  cardBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cardBadgeEmoji: { fontSize: 18 },
  cardTextWrap: { padding: 16 },
  cardTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardBlurb: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  playChip: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  playChipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  signOut: { alignSelf: "center", marginTop: "auto", marginBottom: 20 },
  signOutText: { color: theme.textMuted, textDecorationLine: "underline" },
});
