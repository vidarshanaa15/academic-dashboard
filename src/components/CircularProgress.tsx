import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number; // 0-10 for GPA
  max?: number;
  min?: number; // Added to scale the visual progress
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function CircularProgress({
  value,
  max = 10,
  min = 5, // We start the "visual fill" from 5.0 GPA
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

  // --- SCALING LOGIC ---
  // If GPA is below min, show 0%. Otherwise, calculate progress between min and max.
  const effectiveValue = Math.max(min, displayValue);
  const percentage = ((effectiveValue - min) / (max - min)) * 100;

  // Ensure we don't exceed 100% or go below 0%
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;

  // Color based on GPA value (keeping your exact styling)
  const getColor = () => {
    if (value >= 9) return 'var(--grade-o)';
    if (value >= 8) return 'var(--accent)';
    if (value >= 6) return 'var(--success)';
    return 'var(--warning)';
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
            {/* We show the REAL value, not the scaled percentage */}
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