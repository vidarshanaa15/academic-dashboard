import { useState, useEffect } from 'react';
import { X, ArrowRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    emoji: '🎓',
    title: 'Welcome to AcadTrack',
    description: "Your comprehensive academic performance dashboard. Let's take a quick tour of the key features.",
  },
  {
    id: 'sidebar',
    emoji: '🧭',
    title: 'Navigation Sidebar',
    description: 'Access Overview, Goals, Semesters, and GPA Calculator from the sidebar. Collapse it to save space.',
  },
  {
    id: 'calculator',
    emoji: '📊',
    title: 'GPA Calculator',
    description: 'Calculate your semester GPA by adding subjects with credits and grades. The ring updates in real-time!',
  },
  {
    id: 'export',
    emoji: '📄',
    title: 'Export & Share',
    description: 'Export semester reports as PDF to share with advisors or keep for your records.',
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('hasSeenTour')) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) setCurrentStep(s => s + 1);
    else handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />

          {/* card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50, width: '100%', maxWidth: 420,
              /* glass card */
              background: 'rgba(12,8,32,0.92)',
              backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 20,
              boxShadow: '0 32px 80px -16px rgba(0,0,0,0.8), 0 0 60px -20px rgba(124,58,237,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* accent top line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />

            <div style={{ padding: '1.5rem' }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* emoji badge */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {step.emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                      Step {currentStep + 1} of {tourSteps.length}
                    </p>
                    <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                      {step.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s ease' }}
                  aria-label="Close tour"
                >
                  <X size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                {step.description}
              </p>

              {/* progress bar segments */}
              <div style={{ display: 'flex', gap: 5, marginBottom: '1.25rem' }}>
                {tourSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: i <= currentStep
                        ? 'linear-gradient(90deg, var(--accent), var(--accent-2))'
                        : 'rgba(255,255,255,0.1)',
                    }}
                    animate={{ opacity: i <= currentStep ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleClose}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', transition: 'background 0.15s ease' }}
                >
                  Skip Tour
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
                    border: 'none', color: '#fff',
                    background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 4px 14px -4px rgba(124,58,237,0.5)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  {currentStep < tourSteps.length - 1
                    ? <> Next <ArrowRight size={14} /> </>
                    : 'Get Started'
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}