import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

/**
 * GradientBarChart – a professional looking vertical bar chart with animated bars and a gradient fill.
 * Props
 *   data: array of objects with `{ name: string, value: number }`
 *   barColor?: string – tailwind color (e.g. "#6366f1")
 *   dark?: boolean – switches grid / tooltip colors for dark mode.
 */
export const GradientBarChart: React.FC<{
  data: { name: string; value: number }[];
  barColor?: string;
  dark?: boolean;
}> = ({ data, barColor = "#6366f1", dark = false }) => {
  const gradientId = "gradientBar";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.8} />
              <stop offset="100%" stopColor={barColor} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#23233a" : "#e2e8f0"} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: dark ? "#71717a" : "#64748b" }} />
          <YAxis
            dataKey="name"
            type="category"
            width={80}
            tick={{ fontSize: 11, fill: dark ? "#a1a1aa" : "#475569" }}
          />
          <Tooltip
            contentStyle={{
              background: dark ? "#14141f" : "#fff",
              borderRadius: 12,
              fontSize: 12,
              border: `1px solid ${dark ? "#23233a" : "#e2e8f0"}`,
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            fill={`url(#${gradientId})`}
            animationBegin={200}
            animationDuration={800}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
