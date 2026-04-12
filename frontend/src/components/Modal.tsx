import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MAX_WIDTHS = { sm: 420, md: 580, lg: 760, xl: 960 };

// Modal = reusable popup/dialog container
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* modal container */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: MAX_WIDTHS[size],
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                /* glass modal */
                background: 'rgba(12,8,32,0.92)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                boxShadow: '0 32px 80px -16px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset',
                overflow: 'hidden',
              }}
            >
              {/* header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s ease', flexShrink: 0,
                  }}
                >
                  <X size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              {/* scrollable body */}
              <div
                className="custom-scrollbar"
                style={{ padding: '24px', overflowY: 'auto', flex: 1 }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}