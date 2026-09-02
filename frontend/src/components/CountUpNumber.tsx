import React, { useEffect, useState } from 'react';

interface CountUpNumberProps {
  /** The numeric value to count up to */
  value: number;
  /** Optional prefix string, e.g., '$' */
  prefix?: string;
  /** Optional suffix string, e.g., '%' */
  suffix?: string;
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** Number of decimal places to display */
  decimals?: number;
  /** Additional className for styling */
  className?: string;
}

/**
 * Simple count‑up component using requestAnimationFrame.
 * It animates from 0 to the target value over the given duration.
 */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  decimals = 0,
  className = '',
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const progressRatio = Math.min(progress / duration, 1);
      const current = Number((value * progressRatio).toFixed(decimals));
      setDisplay(current);
      if (progressRatio < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
    // Reset when value changes
    return () => {
      setDisplay(0);
    };
  }, [value, duration, decimals]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
};
