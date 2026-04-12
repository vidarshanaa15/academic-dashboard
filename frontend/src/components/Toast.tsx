import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const TOAST_META = {
  success: {
    icon: CheckCircle2,
    color: 'var(--success)',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.25)',
  },
  error: {
    icon: XCircle,
    color: 'var(--danger)',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.25)',
  },
  info: {
    icon: AlertCircle,
    color: 'var(--accent)',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.3)',
    glow: 'rgba(124,58,237,0.25)',
  },
} as const;

export function Toast({ message, type = 'info', duration = 3000, onClose, isVisible }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [isVisible, duration, onClose]);

  const meta = TOAST_META[type];
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          style={{
            position: 'fixed', top: 24, left: '50%', zIndex: 60,
            minWidth: 320, maxWidth: 480,
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14,
            /* glass toast */
            background: 'rgba(12,8,32,0.88)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${meta.border}`,
            boxShadow: `0 16px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 24px -8px ${meta.glow}`,
          }}
        >
          {/* colored left bar */}
          <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, borderRadius: '0 3px 3px 0', background: meta.color }} />

          {/* icon */}
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} style={{ color: meta.color }} />
          </div>

          {/* message */}
          <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>

          {/* close */}
          <button
            onClick={onClose}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s ease' }}
            aria-label="Dismiss"
          >
            <X size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── useToast hook (unchanged API) ──────────────────────────── */
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '', type: 'info', isVisible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') =>
    setToast({ message, type, isVisible: true });

  const hideToast = () =>
    setToast(p => ({ ...p, isVisible: false }));

  return { toast, showToast, hideToast };
}