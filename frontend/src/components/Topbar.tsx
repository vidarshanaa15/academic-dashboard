import { Moon, Sun, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onMobileMenuToggle?: () => void;
}

export function Topbar({ theme, onThemeToggle, onMobileMenuToggle }: TopbarProps) {
  const isDark = theme === 'dark';

  const bg = isDark ? 'rgba(8, 13, 26, 0.72)' : 'rgba(255,255,255,0.92)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(200,195,255,0.4)';
  const btnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.07)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,195,255,0.5)';
  const btnHoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.13)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,195,255,0.45)';

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
        background: bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
        boxShadow: isDark
          ? 'none'
          : '0 1px 12px rgba(100,80,200,0.07)',
      }}
    >
      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* theme toggle */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          onMouseEnter={e => (e.currentTarget.style.background = btnHoverBg)}
          onMouseLeave={e => (e.currentTarget.style.background = btnBg)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: btnBg,
            border: `1px solid ${btnBorder}`,
            cursor: 'pointer', transition: 'background 0.2s ease',
          }}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 0 : 180 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {isDark
              ? <Moon size={16} style={{ color: 'var(--accent-2)' }} />
              : <Sun size={16} style={{ color: 'var(--warning)' }} />
            }
          </motion.div>
        </motion.button>

        <div style={{ width: 1, height: 22, background: dividerColor }} />

        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDark
              ? '0 0 0 2px rgba(124,58,237,0.35)'
              : '0 0 0 2px rgba(124,58,237,0.2), 0 2px 8px rgba(124,58,237,0.2)',
            flexShrink: 0,
          }}
        >
          <User size={16} color="#fff" />
        </motion.div>
      </div>
    </header>
  );
}