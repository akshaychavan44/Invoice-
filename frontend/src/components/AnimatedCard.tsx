import { motion, Variants } from "framer-motion";
import React, { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  delayIndex?: number; // used for staggered entrance
  className?: string;
}

const container: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, delayIndex = 0, className }) => (
  <motion.div
    custom={delayIndex}
    variants={container}
    initial="hidden"
    animate="visible"
    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
    className={className}
  >
    {children}
  </motion.div>
);
