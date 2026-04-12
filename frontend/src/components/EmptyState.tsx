import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '5rem 1.5rem', textAlign: 'center',
      }}
    >
      {/* icon ring */}
      <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
        {/* outer glow ring */}
        <div style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* inner accent ring */}
          <div style={{
            position: 'absolute', inset: 8, borderRadius: '50%',
            border: '1px solid rgba(124,58,237,0.2)',
          }} />
          <BookOpen size={32} style={{ color: 'var(--accent)', position: 'relative', zIndex: 1 }} />
        </div>
      </div>

      <h3 style={{
        fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)',
        letterSpacing: '-0.02em', marginBottom: 10,
      }}>
        {title}
      </h3>

      <p style={{
        fontSize: '0.875rem', color: 'var(--text-secondary)',
        maxWidth: 380, lineHeight: 1.65, marginBottom: action ? '1.75rem' : 0,
      }}>
        {description}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={action.onClick}
          style={{
            padding: '11px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
            color: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
            boxShadow: '0 6px 20px -4px rgba(124,58,237,0.5)',
            transition: 'all 0.2s ease',
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}