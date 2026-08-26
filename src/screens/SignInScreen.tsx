import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View, Pressable } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme/colors";

export default function SignInScreen() {
  const { signInWithGoogle, signingIn, error } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.diceEmoji}>🎲</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  hero: { alignItems: "center", gap: 8 },
  diceEmoji: { fontSize: 56 },
  title: { fontSize: 36, fontWeight: "800", color: theme.text },
  subtitle: { fontSize: 14, color: theme.textMuted, textAlign: "center" },
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
  },
  googleIcon: { width: 20, height: 20 },
  googleText: { color: "#1A1E33", fontWeight: "700", fontSize: 15 },
  error: { color: theme.danger, textAlign: "center" },
  footer: { color: theme.textMuted, fontSize: 12, position: "absolute", bottom: 24 },
});
