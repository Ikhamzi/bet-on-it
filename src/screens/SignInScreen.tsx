import React from "react";
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, View, Pressable } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme/colors";
import { images } from "../theme/images";
import FadeOverlay from "../components/FadeOverlay";

export default function SignInScreen() {
  const { signInWithGoogle, signingIn, error } = useAuth();

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: images.diceHero() }} style={styles.bg} resizeMode="cover">
        <FadeOverlay color={theme.bg} bands={32} curve={1.4} />

        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.diceBadge}>
              <Text style={styles.diceEmoji}>🎲</Text>
            </View>
            <Text style={styles.title}>Bet on It</Text>
            <Text style={styles.subtitle}>Ludo & Snakes and Ladders, online with friends</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.85 }]}
            onPress={signInWithGoogle}
            disabled={signingIn}
          >
            {signingIn ? (
              <ActivityIndicator color="#1A1E33" />
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.footer}>No real-money betting — just games with friends.</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  bg: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  hero: { alignItems: "center", gap: 10 },
  diceBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,201,60,0.15)",
    borderWidth: 2,
    borderColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  diceEmoji: { fontSize: 44 },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    minWidth: 260,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  googleIcon: { width: 20, height: 20 },
  googleText: { color: "#1A1E33", fontWeight: "700", fontSize: 15 },
  error: { color: theme.danger, textAlign: "center" },
  footer: { color: theme.textMuted, fontSize: 12, position: "absolute", bottom: 24 },
});
