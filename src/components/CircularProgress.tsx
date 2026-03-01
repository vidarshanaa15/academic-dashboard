import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number; // 0-10 for GPA
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function CircularProgress({
  value,
  max = 10,
  size = 200,
  strokeWidth = 16,
  showLabel = true,
  animated = true,
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (displayValue / max) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on GPA value
  const getColor = () => {
    if (value >= 9) return 'var(--grade-o)'; // Purple for excellent
    if (value >= 8) return 'var(--accent)'; // Cyan for good
    if (value >= 6) return 'var(--success)'; // Green for average
    return 'var(--warning)'; // Amber for needs improvement
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          opacity={0.2}
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {showLabel && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.span
            className="font-bold"
            style={{
              fontSize: size / 4,
              color: getColor(),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {displayValue.toFixed(2)}
          </motion.span>
          <span className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            GPA
          </span>
        </motion.div>
      )}
    </div>
  );
}
