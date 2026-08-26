import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { PLAYER_COLORS, theme } from "../theme/colors";

interface Props {
  name: string;
  photoURL?: string | null;
  colorIndex: number;
  active?: boolean;
  subtitle?: string;
}

export default function PlayerBadge({ name, photoURL, colorIndex, active, subtitle }: Props) {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  return (
    <View style={[styles.wrap, active && { borderColor: color, borderWidth: 2 }]}>
      <View style={[styles.avatarRing, { borderColor: color }]}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: color }]}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {active ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarRing: { borderWidth: 2, borderRadius: 20, padding: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontWeight: "700" },
  name: { color: theme.text, fontWeight: "600", fontSize: 13 },
  subtitle: { color: theme.textMuted, fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
