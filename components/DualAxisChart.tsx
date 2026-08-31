import dayjs from 'dayjs';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Goals, TrendPoint } from '@/lib/types';

type Props = {
  points: TrendPoint[];
  goals: Goals;
  height?: number;
};

const WEIGHT_COLOR = '#E1611F';
const CALORIE_COLOR = '#4E6B4C';
const GOAL_WEIGHT_COLOR = '#C24B10';
const GOAL_CALORIE_COLOR = '#33502F';
const AXIS_COLOR = '#B9B6A6';
const LABEL_COLOR = '#6C7263';

const PADDING = { top: 24, bottom: 32, left: 44, right: 44 };

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function buildPath(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
}

export default function DualAxisChart({ points, goals, height = 260 }: Props) {
  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const width = 340;
    const plotWidth = width - PADDING.left - PADDING.right;
    const plotHeight = height - PADDING.top - PADDING.bottom;

    const weights = points.map((p) => p.weightKg);
    const calories = points.map((p) => p.calories);

    const weightMin = Math.min(...weights, goals.targetWeightKg) - 0.5;
    const weightMax = Math.max(...weights, goals.targetWeightKg) + 0.5;
    const calorieMin = Math.min(...calories, goals.targetCalories) * 0.9;
    const calorieMax = Math.max(...calories, goals.targetCalories) * 1.1;

    const xs = points.map((_, i) =>
      scale(i, 0, points.length - 1, PADDING.left, PADDING.left + plotWidth)
    );
    const weightYs = points.map((p) =>
      scale(p.weightKg, weightMin, weightMax, PADDING.top + plotHeight, PADDING.top)
    );
    const calorieYs = points.map((p) =>
      scale(p.calories, calorieMin, calorieMax, PADDING.top + plotHeight, PADDING.top)
    );

    const goalWeightY = scale(
      goals.targetWeightKg,
      weightMin,
      weightMax,
      PADDING.top + plotHeight,
      PADDING.top
    );
    const goalCalorieY = scale(
      goals.targetCalories,
      calorieMin,
      calorieMax,
      PADDING.top + plotHeight,
      PADDING.top
    );

    const labelIdxs = [0, Math.floor((points.length - 1) / 2), points.length - 1];

    return {
      width,
      plotWidth,
      plotHeight,
      xs,
      weightYs,
      calorieYs,
      goalWeightY,
      goalCalorieY,
      labelIdxs,
      weightMin,
      weightMax,
      calorieMin,
      calorieMax,
    };
  }, [points, goals, height]);

  if (!chart) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: LABEL_COLOR }}>표시할 데이터가 없습니다</Text>
      </View>
    );
  }

  const { width, xs, weightYs, calorieYs, goalWeightY, goalCalorieY, labelIdxs } = chart;

  return (
    <View>
      <Svg width="100%" viewBox={`0 0 ${width} ${height}`} height={height}>
        {/* 축 */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={height - PADDING.bottom}
          stroke={AXIS_COLOR}
        />
        <Line
          x1={width - PADDING.right}
          y1={PADDING.top}
          x2={width - PADDING.right}
          y2={height - PADDING.bottom}
          stroke={AXIS_COLOR}
        />
        <Line
          x1={PADDING.left}
          y1={height - PADDING.bottom}
          x2={width - PADDING.right}
          y2={height - PADDING.bottom}
          stroke={AXIS_COLOR}
        />

        {/* 목표선 */}
        <Line
          x1={PADDING.left}
          y1={goalWeightY}
          x2={width - PADDING.right}
          y2={goalWeightY}
          stroke={GOAL_WEIGHT_COLOR}
          strokeDasharray="4,4"
          strokeWidth={1.5}
        />
        <Line
          x1={PADDING.left}
          y1={goalCalorieY}
          x2={width - PADDING.right}
          y2={goalCalorieY}
          stroke={GOAL_CALORIE_COLOR}
          strokeDasharray="4,4"
          strokeWidth={1.5}
        />

        {/* 칼로리 라인 (오른쪽 축) */}
        <Path d={buildPath(xs, calorieYs)} stroke={CALORIE_COLOR} strokeWidth={2} fill="none" />

        {/* 몸무게 라인 (왼쪽 축) */}
        <Path d={buildPath(xs, weightYs)} stroke={WEIGHT_COLOR} strokeWidth={2.5} fill="none" />
        {xs.length <= 31 &&
          xs.map((x, i) => (
            <Circle key={i} cx={x} cy={weightYs[i]} r={2.5} fill={WEIGHT_COLOR} />
          ))}

        {/* 축 라벨 */}
        <SvgText x={PADDING.left - 8} y={PADDING.top + 4} fontSize={10} fill={WEIGHT_COLOR} textAnchor="end">
          kg
        </SvgText>
        <SvgText
          x={width - PADDING.right + 8}
          y={PADDING.top + 4}
          fontSize={10}
          fill={CALORIE_COLOR}
          textAnchor="start">
          kcal
        </SvgText>

        {labelIdxs.map((idx) => (
          <SvgText
            key={idx}
            x={xs[idx]}
            y={height - PADDING.bottom + 16}
            fontSize={10}
            fill={LABEL_COLOR}
            textAnchor="middle">
            {dayjs(points[idx].dateKey).format('M/D')}
          </SvgText>
        ))}
      </Svg>

      <View style={styles.legendRow}>
        <LegendDot color={WEIGHT_COLOR} label="몸무게" />
        <LegendDot color={CALORIE_COLOR} label="섭취 칼로리" />
        <LegendDot color={GOAL_WEIGHT_COLOR} label="목표 체중" dashed />
        <LegendDot color={GOAL_CALORIE_COLOR} label="목표 칼로리" dashed />
      </View>
    </View>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: dashed ? 'transparent' : color, borderColor: color },
          dashed && styles.legendSwatchDashed,
        ]}
      />
      <Text style={{ fontSize: 11, color: LABEL_COLOR }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
  },
  legendSwatchDashed: {
    borderStyle: 'dashed',
  },
});
