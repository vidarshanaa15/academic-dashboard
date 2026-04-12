import { Moon, Sun, User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

export function Topbar({ theme, onThemeToggle }: TopbarProps) {
  return (
    <header
      style={{
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        /* glass navbar */
        background: 'rgba(8, 13, 26, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      {/* ── Left: breadcrumb placeholder ──────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Right: actions ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          style={{
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', transition: 'background 0.2s ease',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 0 : 180, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {theme === 'dark'
              ? <Moon size={16} style={{ color: 'var(--accent-2)' }} />
              : <Sun size={16} style={{ color: 'var(--warning)' }} />
            }
          </motion.div>
        </motion.button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.1)' }} />

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px rgba(124,58,237,0.35)',
            flexShrink: 0,
          }}
        >
          <User size={16} color="#fff" />
        </motion.div>
      </div>
    </header>
  );
}