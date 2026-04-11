// import { motion } from 'framer-motion';
// import { useEffect, useState } from 'react';

// interface CircularProgressProps {
//   value: number; // 0-10 for GPA
//   max?: number;
//   min?: number; // Added to scale the visual progress
//   size?: number;
//   strokeWidth?: number;
//   showLabel?: boolean;
//   animated?: boolean;
// }

// export function CircularProgress({
//   value,
//   max = 10,
//   min = 5, // We start the "visual fill" from 5.0 GPA
//   size = 200,
//   strokeWidth = 16,
//   showLabel = true,
//   animated = true,
// }: CircularProgressProps) {
//   const [displayValue, setDisplayValue] = useState(0);

//   useEffect(() => {
//     if (animated) {
//       const timer = setTimeout(() => setDisplayValue(value), 100);
//       return () => clearTimeout(timer);
//     } else {
//       setDisplayValue(value);
//     }
//   }, [value, animated]);

//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;

//   // --- SCALING LOGIC ---
//   // If GPA is below min, show 0%. Otherwise, calculate progress between min and max.
//   const effectiveValue = Math.max(min, displayValue);
//   const percentage = ((effectiveValue - min) / (max - min)) * 100;

//   // Ensure we don't exceed 100% or go below 0%
//   const clampedPercentage = Math.min(100, Math.max(0, percentage));
//   const offset = circumference - (clampedPercentage / 100) * circumference;

//   // Color based on GPA value (keeping your exact styling)
//   const getColor = () => {
//     if (value >= 9) return 'var(--grade-o)';
//     if (value >= 8) return 'var(--accent)';
//     if (value >= 6) return 'var(--success)';
//     return 'var(--warning)';
//   };

//   return (
//     <div className="relative inline-flex items-center justify-center">
//       <svg width={size} height={size} className="transform -rotate-90">
//         {/* Background circle */}
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           fill="none"
//           stroke="var(--muted)"
//           strokeWidth={strokeWidth}
//           opacity={0.2}
//         />

//         {/* Progress circle */}
//         <motion.circle
//           cx={size / 2}
//           cy={size / 2}
//           r={radius}
//           fill="none"
//           stroke={getColor()}
//           strokeWidth={strokeWidth}
//           strokeDasharray={circumference}
//           strokeDashoffset={offset}
//           strokeLinecap="round"
//           initial={{ strokeDashoffset: circumference }}
//           animate={{ strokeDashoffset: offset }}
//           transition={{ duration: 1, ease: 'easeOut' }}
//         />
//       </svg>

//       {showLabel && (
//         <motion.div
//           className="absolute inset-0 flex flex-col items-center justify-center"
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//         >
//           <motion.span
//             className="font-bold"
//             style={{
//               fontSize: size / 4,
//               color: getColor(),
//             }}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.5 }}
//           >
//             {/* We show the REAL value, not the scaled percentage */}
//             {displayValue.toFixed(2)}
//           </motion.span>
//           <span className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
//             GPA
//           </span>
//         </motion.div>
//       )}
//     </div>
//   );
// }

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  max?: number;
  min?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function CircularProgress({
  value,
  max = 10,
  min = 5,
  size = 200,
  strokeWidth = 16,
  showLabel = true,
  animated = true,
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animated) {
      const t = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(t);
    }
    setDisplayValue(value);
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const effectiveValue = Math.max(min, displayValue);
  const percentage = ((effectiveValue - min) / (max - min)) * 100;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;

  /* color ramp matching grade system */
  const getColor = () => {
    if (value >= 9) return 'var(--chart-o)';   // purple
    if (value >= 8) return 'var(--accent)';    // violet
    if (value >= 6) return 'var(--success)';   // green
    return 'var(--warning)';                   // amber
  };

  const getGradeLabel = () => {
    if (value >= 9) return 'Outstanding';
    if (value >= 8) return 'Very Good';
    if (value >= 6) return 'Good';
    return 'Average';
  };

  const color = getColor();
  const gradientId = `ring-grad-${size}`;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>

        {/* track ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />

        {/* subtle glow ring (slightly wider, very transparent) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.08}
        />

        {/* main progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>

      {showLabel && (
        <motion.div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.span
            style={{
              fontSize: size / 4.2,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color,
              /* gradient text */
              background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.8))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {displayValue.toFixed(2)}
          </motion.span>
          <span style={{ fontSize: size / 14, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            GPA
          </span>
          {size >= 160 && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{
                marginTop: 6, fontSize: size / 18,
                padding: '2px 8px', borderRadius: 999,
                background: `${color}22`,
                color, fontWeight: 600,
                border: `1px solid ${color}44`,
              }}
            >
              {getGradeLabel()}
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
}