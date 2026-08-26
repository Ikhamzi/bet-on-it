import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText, Line, Circle, Defs, Marker, Path } from "react-native-svg";
import { LADDERS, SNAKES, SLPlayer } from "../game-engine/snakesAndLadders";
import { PLAYER_COLORS } from "../theme/colors";

const GRID = 10;

function squareCenter(n: number, cell: number) {
  const idx = n - 1;
  const row = Math.floor(idx / GRID); // 0 = bottom row
  const posInRow = idx % GRID;
  const col = row % 2 === 0 ? posInRow : GRID - 1 - posInRow;
  const screenRow = GRID - 1 - row; // 0 = top
  return {
    x: col * cell + cell / 2,
    y: screenRow * cell + cell / 2,
    col,
    screenRow,
  };
}

interface Props {
  players: SLPlayer[];
  size?: number;
}

export default function SnakesLaddersBoard({ players, size = 340 }: Props) {
  const cell = size / GRID;

  const squares = Array.from({ length: 100 }, (_, i) => i + 1);

  const tokensBySquare: Record<number, SLPlayer[]> = {};
  players.forEach((p) => {
    const sq = p.position > 0 ? p.position : 1;
    if (!tokensBySquare[sq]) tokensBySquare[sq] = [];
    if (p.position > 0) tokensBySquare[sq].push(p);
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {squares.map((n) => {
          const { x, y, col, screenRow } = squareCenter(n, cell);
          const isLadderStart = LADDERS[n] !== undefined;
          const isSnakeStart = SNAKES[n] !== undefined;
          const fill =
            (col + screenRow) % 2 === 0 ? "#1A1E33" : "#20264A";
          return (
            <React.Fragment key={n}>
              <Rect
                x={col * cell}
                y={screenRow * cell}
                width={cell}
                height={cell}
                fill={fill}
                stroke="#31385C"
                strokeWidth={1}
              />
              <SvgText
                x={x}
                y={screenRow * cell + 12}
                fontSize={8}
                fill={isLadderStart ? "#7CE38B" : isSnakeStart ? "#FF8A8A" : "#6B7099"}
                textAnchor="middle"
              >
                {n}
              </SvgText>
            </React.Fragment>
          );
        })}

        {Object.entries(LADDERS).map(([from, to]) => {
          const a = squareCenter(Number(from), cell);
          const b = squareCenter(to, cell);
          return (
            <Line
              key={`l-${from}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#4CD964"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.8}
            />
          );
        })}

        {Object.entries(SNAKES).map(([from, to]) => {
          const a = squareCenter(Number(from), cell);
          const b = squareCenter(to, cell);
          return (
            <Line
              key={`s-${from}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#FF5C5C"
              strokeWidth={3}
              strokeDasharray="2,3"
              strokeLinecap="round"
              opacity={0.8}
            />
          );
        })}

        {Object.entries(tokensBySquare).map(([sq, ps]) =>
          ps.map((p, i) => {
            const { x, y } = squareCenter(Number(sq), cell);
            const offsetX = (i % 2) * 8 - 4;
            const offsetY = Math.floor(i / 2) * 8 - 4;
            return (
              <Circle
                key={p.uid}
                cx={x + offsetX}
                cy={y + offsetY}
                r={5.5}
                fill={PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length]}
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
