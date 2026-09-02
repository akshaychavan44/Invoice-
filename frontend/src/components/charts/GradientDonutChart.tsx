import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

/**
 * GradientDonutChart – displays categorical data as a donut with animated segment drawing.
 * Props:
 *   data: array of { name: string, value: number, color: string }
 *   innerRadius?: number – inner radius of the donut.
 *   outerRadius?: number – outer radius of the donut.
 *   dark?: boolean – tooltip colors.
 */
export const GradientDonutChart: React.FC<{
  data: { name: string; value: number; color: string }[];
  innerRadius?: number;
  outerRadius?: number;
  dark?: boolean;
}> = ({ data, innerRadius = 50, outerRadius = 80, dark = false }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            animationBegin={200}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: dark ? "#14141f" : "#fff",
              borderRadius: 12,
              fontSize: 12,
              border: `1px solid ${dark ? "#23233a" : "#e2e8f0"}`,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
