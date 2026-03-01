import { Search, Moon, Sun, User } from 'lucide-react';
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
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search courses, semesters..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition-all focus:ring-2"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--muted)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent)',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Theme toggle */}
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

        {/* User avatar */}
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
