import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/colors";

const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

interface DiceProps {
  value: number | null;
  disabled?: boolean;
  rolling?: boolean;
  onRoll?: () => void;
}

export default function Dice({ value, disabled, rolling, onRoll }: DiceProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rolling) {
      spin.setValue(0);
      Animated.timing(spin, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [rolling]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const pips = value ? PIP_LAYOUT[value] : [];

  return (
    <Pressable
      onPress={onRoll}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Animated.View style={[styles.die, { transform: [{ rotate }] }]}>
        {value ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((r) => (
              <View key={r} style={styles.row}>
                {[0, 1, 2].map((c) => {
                  const active = pips.some(([pr, pc]) => pr === r && pc === c);
                  return (
                    <View key={c} style={styles.cell}>
                      {active ? <View style={styles.pip} /> : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.tapText}>Tap</Text>
        )}
      </Animated.View>
      <Text style={styles.label}>{disabled ? "Wait..." : "Roll dice"}</Text>
    </Pressable>
  );
}

const SIZE = 72;

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 6 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  die: {
    width: SIZE,
    height: SIZE,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  grid: { width: SIZE - 16, height: SIZE - 16, justifyContent: "space-between" },
  row: { flexDirection: "row", justifyContent: "space-between", flex: 1 },
  cell: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  pip: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1A1E33" },
  tapText: { color: "#1A1E33", fontWeight: "700" },
  label: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },
});
