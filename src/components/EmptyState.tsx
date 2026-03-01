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
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <BookOpen className="w-12 h-12" style={{ color: 'var(--accent)' }} />
      </div>

      <h3 className="mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <p className="mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-3 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
