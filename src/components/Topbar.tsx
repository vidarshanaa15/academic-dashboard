import { Moon, Sun, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export function Topbar({ theme, onThemeToggle }: TopbarProps) {
  return (
    <header
      className="h-16 sticky top-0 z-10 flex items-center justify-between px-6 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--muted)'
      }}
    >
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onThemeToggle}
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--bg)',
            color: 'var(--text-primary)'
          }}
          aria-label="Toggle theme"
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </motion.div>
        </motion.button>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    </header>
  );
}
