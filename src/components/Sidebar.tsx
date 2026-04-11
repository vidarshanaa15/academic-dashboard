import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, BookOpen, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/goals', icon: Target, label: 'My Goals' },
  { path: '/semesters', icon: BookOpen, label: 'Semesters' },
  { path: '/calculator', icon: Calculator, label: 'GPA Calculator' },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 68 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        /* glass sidebar */
        background: 'rgba(8, 13, 26, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        zIndex: 40,
      }}
    >
      {/* ── Logo area ─────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? '0' : '0 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        gap: 12,
      }}>
        {/* icon mark */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px -4px rgba(124,58,237,0.6)',
          fontSize: 16,
        }}>
          📚
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                AcadTrack
              </p>
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Academic Dashboard
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ─────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 10px' }}>
        {/* section label */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                padding: '0 10px', marginBottom: 8,
              }}
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: isCollapsed ? '10px 0' : '10px 12px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: 12,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      /* active vs inactive */
                      background: isActive
                        ? 'rgba(124,58,237,0.2)'
                        : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        style={{
                          position: 'absolute',
                          left: 0, top: '20%', bottom: '20%',
                          width: 3, borderRadius: 99,
                          background: 'linear-gradient(180deg, var(--accent), var(--accent-2))',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* icon */}
                    <Icon
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'color 0.2s ease',
                      }}
                    />

                    {/* label */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Collapse toggle ───────────────────────────────── */}
      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: 8, padding: '9px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', transition: 'background 0.2s ease',
            color: 'var(--text-muted)', fontFamily: 'inherit',
          }}
        >
          {!isCollapsed && (
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Collapse</span>
          )}
          {isCollapsed
            ? <ChevronRight size={15} />
            : <ChevronLeft size={15} />
          }
        </button>
      </div>
    </motion.aside>
  );
}