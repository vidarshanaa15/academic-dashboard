import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

const VARIANT_META = {
  accent: { color: 'var(--accent)', bg: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.3)', glow: 'linear-gradient(90deg, var(--accent), var(--accent-2))' },
  success: { color: 'var(--success)', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.28)', glow: 'linear-gradient(90deg, var(--success), #34d399)' },
  warning: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.28)', glow: 'linear-gradient(90deg, var(--warning), #fcd34d)' },
  default: { color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', glow: 'linear-gradient(90deg, rgba(255,255,255,0.2), transparent)' },
} as const;

const TREND_META = {
  up: { icon: TrendingUp, color: 'var(--success)', label: 'Improving' },
  down: { icon: TrendingDown, color: 'var(--danger)', label: 'Declining' },
  neutral: { icon: Minus, color: 'var(--text-muted)', label: 'Stable' },
} as const;

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const meta = VARIANT_META[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card"
      style={{ padding: '1.3rem 1.4rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: meta.glow,
        borderRadius: '18px 18px 0 0',
      }} />

      {/* ambient glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${meta.bg} 0%, transparent 70%)`,
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* label */}
          <p style={{
            fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8,
          }}>
            {title}
          </p>

          {/* value */}
          <div style={{
            fontSize: typeof value === 'string' && value.length > 7 ? '1.5rem' : '2rem',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            color: meta.color,
            /* gradient text for accent/success variants */
            ...(variant !== 'default' ? {
              background: meta.glow,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : {}),
          }}>
            {value}
          </div>

          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              {subtitle}
            </p>
          )}

          {trend && (() => {
            const tm = TREND_META[trend];
            const TIcon = tm.icon;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
                <TIcon size={13} style={{ color: tm.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: tm.color }}>
                  {tm.label}
                </span>
              </div>
            );
          })()}
        </div>

        {Icon && (
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: meta.bg, border: `1px solid ${meta.border}`,
          }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}