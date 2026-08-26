import React from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import {
  ARM_LENGTH,
  HOME_STRETCH_LENGTH,
  LudoPlayer,
  LudoState,
  startSquare,
  isSafeSquare,
} from "../game-engine/ludo";
import { PLAYER_COLORS } from "../theme/colors";

interface Props {
  state: LudoState;
  size?: number;
}

export default function LudoBoard({ state, size = 340 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const trackRadius = size / 2 - 30;
  const homeHubRadius = 26;
  const yardRadius = size / 2 - 6;

  const trackPoint = (pos: number) => {
    const theta = (pos / state.trackLength) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + trackRadius * Math.cos(theta), y: cy + trackRadius * Math.sin(theta) };
  };

  const homeStretchPoint = (colorIndex: number, homePos: number) => {
    // Radial line from this player's start point toward the center.
    const start = startSquare(state, colorIndex);
    const theta = (start / state.trackLength) * Math.PI * 2 - Math.PI / 2;
    const t = (homePos + 1) / (HOME_STRETCH_LENGTH + 1); // 0..1 fraction toward center
    const r = trackRadius - t * (trackRadius - homeHubRadius);
    return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  };

  const yardPoint = (colorIndex: number, tokenIdx: number) => {
    const theta = (startSquare(state, colorIndex) / state.trackLength) * Math.PI * 2 - Math.PI / 2;
    const spread = 0.22;
    const t2 = theta + (tokenIdx - 1.5) * (spread / 3);
    return { x: cx + yardRadius * Math.cos(t2), y: cy + yardRadius * Math.sin(t2) };
  };

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track squares */}
        {Array.from({ length: state.trackLength }, (_, i) => i).map((i) => {
          const p = trackPoint(i);
          const safe = isSafeSquare(state, i);
          return (
            <Circle
              key={`t-${i}`}
              cx={p.x}
              cy={p.y}
              r={safe ? 7 : 5}
              fill={safe ? "#31385C" : "#20264A"}
              stroke="#4A527D"
              strokeWidth={1}
            />
          );
        })}

        {/* Home stretches */}
        {state.players.map((player) =>
          Array.from({ length: HOME_STRETCH_LENGTH }, (_, h) => h).map((h) => {
            const p = homeStretchPoint(player.colorIndex, h);
            return (
              <Circle
                key={`h-${player.uid}-${h}`}
                cx={p.x}
                cy={p.y}
                r={5}
                fill={PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length]}
                opacity={0.25}
              />
            );
          })
        )}

        {/* Center hub */}
        <Circle cx={cx} cy={cy} r={homeHubRadius} fill="#FFC93C" opacity={0.9} />
        <SvgText x={cx} y={cy + 4} fontSize={10} fill="#0F1220" textAnchor="middle" fontWeight="bold">
          HOME
        </SvgText>

        {/* Start markers */}
        {state.players.map((player) => {
          const p = trackPoint(startSquare(state, player.colorIndex));
          return (
            <Circle
              key={`start-${player.uid}`}
              cx={p.x}
              cy={p.y}
              r={9}
              fill="none"
              stroke={PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length]}
              strokeWidth={2}
            />
          );
        })}

        {/* Tokens */}
        {state.players.map((player) =>
          player.tokens.map((token, idx) => {
            const color = PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length];
            let pt;
            if (token.state === "yard") {
              pt = yardPoint(player.colorIndex, idx);
            } else if (token.state === "home") {
              pt = homeStretchPoint(player.colorIndex, HOME_STRETCH_LENGTH - 1);
            } else if (token.trackPos === -1) {
              pt = homeStretchPoint(player.colorIndex, token.homePos);
            } else {
              pt = trackPoint(token.trackPos);
            }
            return (
              <Circle
                key={`tok-${player.uid}-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={7}
                fill={color}
                stroke="#0F1220"
                strokeWidth={1.5}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}
