import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  id: string;
  title: string;
  description: string;
  element?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AcadTrack! 🎓',
    description: 'Your comprehensive academic performance dashboard. Let\'s take a quick tour of the key features.',
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description: 'Access Overview, Goals, Semesters, and GPA Calculator from the sidebar. Click the collapse button to save space.',
  },
  {
    id: 'calculator',
    title: 'GPA Calculator',
    description: 'Calculate your semester GPA by adding subjects with credits and grades. Watch the circular progress update in real-time!',
  },
  {
    id: 'export',
    title: 'Export & Share',
    description: 'Export semester reports as PDF to share with advisors or keep for your records.',
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-xl shadow-2xl"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--accent)',
              borderWidth: '2px',
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 style={{ color: 'var(--text-primary)' }} className="mb-2">
                  {step.title}
                </h4>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  {step.description}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg ml-2"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 mb-4">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className="h-1 rounded-full flex-1 transition-colors"
                  style={{
                    backgroundColor: index <= currentStep ? 'var(--accent)' : 'var(--muted)',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg border text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--muted)',
                  color: 'var(--text-primary)',
                }}
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                }}
              >
                {currentStep < tourSteps.length - 1 ? (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
