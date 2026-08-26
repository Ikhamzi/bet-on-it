import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  color?: string;
  bands?: number;
  curve?: number;
  minOpacity?: number;
}

/**
 * Simulates a smooth linear-gradient fade using stacked flex bands, since the
 * project has no gradient library dependency. Works identically on native
 * and web — pure View/style, no platform-specific CSS.
 */
export default function FadeOverlay({ color = "#0F1220", bands = 32, curve = 1.6, minOpacity = 0.2 }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: bands }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
            opacity: minOpacity + (1 - minOpacity) * Math.pow((i + 1) / bands, curve),
          }}
        />
      ))}
    </View>
  );
}
