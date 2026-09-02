import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

/**
 * GradientAreaChart – displays revenue and forecast with a smooth gradient fill.
 * Props:
 *   data: array of { month: string, revenue: number, forecast: number }
 *   dark?: boolean – toggles tooltip/grid colors for dark mode.
 */
export const GradientAreaChart: React.FC<{
  data: { month: string; revenue: number; forecast: number }[];
  dark?: boolean;
}> = ({ data, dark = false }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#23233a" : "#e2e8f0"} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? "#71717a" : "#64748b" }} />
          <YAxis tick={{ fontSize: 11, fill: dark ? "#71717a" : "#64748b" }} />
          <Tooltip
            contentStyle={{
              background: dark ? "#14141f" : "#fff",
              borderRadius: 12,
              fontSize: 12,
              border: `1px solid ${dark ? "#23233a" : "#e2e8f0"}`,
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.2}
            strokeWidth={2}
            animationBegin={200}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#06b6d4"
            strokeDasharray="6 6"
            fill="transparent"
            strokeWidth={2}
            animationBegin={200}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
