import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const getVariantColor = () => {
    switch (variant) {
      case 'accent': return 'var(--accent)';
      case 'success': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl border"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--muted)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <h2
            className="mb-1"
            style={{ color: getVariantColor() }}
          >
            {value}
          </h2>
          {subtitle && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            <Icon className="w-6 h-6" style={{ color: getVariantColor() }} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={`text-sm ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            {trend === 'up' ? ' Improving' : trend === 'down' ? ' Declining' : ' Stable'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
