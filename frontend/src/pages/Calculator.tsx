import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Sparkles, Zap, BookOpen, Target, Check, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '../components/CircularProgress';
import { SaveToSemesterModal } from '../components/SaveToSemesterModal';
import { fetchAcademicData } from '../lib/dataService';
import { gradeLabels, gradeMapping, getTotalCredits, type Semester } from '../data/sampleData';

interface CalculatorSubject {
  id: string;
  name: string;
  credits: number;
  grade: string;
  gradePoint: number;
}

const GRADE_COLORS: Record<string, string> = {
  O: 'var(--chart-o)', 'A+': 'var(--chart-ap)', A: 'var(--chart-a)',
  'B+': 'var(--chart-bp)', B: 'var(--chart-b)', C: 'var(--chart-c)',
};
const GRADE_BG: Record<string, string> = {
  O: 'var(--grade-o-bg)', 'A+': 'var(--grade-ap-bg)', A: 'var(--grade-a-bg)',
  'B+': 'var(--grade-bp-bg)', B: 'var(--grade-b-bg)', C: 'var(--grade-c-bg)',
};

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
      <div style={{ width: 3, height: 16, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {children}
      </h3>
    </div>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
      color: 'var(--text-muted)', marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

/** Small hover-triggered info bubble. No separate box needed — sits inline next to a heading. */
function InfoTooltip({ text }: { text: string }) {
  return (
    <span
      className="info-tooltip-wrap"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
    >
      <Info size={14} style={{ color: 'var(--text-muted)' }} />
      <span
        className="info-tooltip-bubble"
        style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
          background: '#15151f', border: '1px solid var(--glass-border)', borderRadius: 8,
          padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)', zIndex: 20,
          opacity: 0, visibility: 'hidden', pointerEvents: 'none',
          transition: 'opacity 0.15s ease, visibility 0.15s ease',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {text}
      </span>
    </span>
  );
}

export function Calculator() {
  const [subjects, setSubjects] = useState<CalculatorSubject[]>([
    { id: '1', name: 'Sample Subject 1', credits: 4, grade: 'A+', gradePoint: 9 },
    { id: '2', name: 'Sample Subject 2', credits: 3, grade: 'O', gradePoint: 10 },
  ]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [personalTarget, setPersonalTarget] = useState(8.5);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  /* ── data for Target CGPA Calculator (moved from Goals page) ── */
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [targetGPA, setTargetGPA] = useState<string>('9.0');
  const [remainingCredits, setRemainingCredits] = useState<string>('40');

  useEffect(() => {
    async function loadSemesters() {
      try {
        const { semesters } = await fetchAcademicData();
        setSemesters(semesters);
      } catch (err) {
        console.error('Error loading academic data:', err);
      }
    }
    loadSemesters();
  }, []);

  const totalCreditsCompleted = getTotalCredits(semesters);
  const totalCumulativePoints = semesters.reduce((sum, sem) => {
    const semPoints = sem.subjects?.reduce((subSum, sub) => {
      const pointValue = gradeMapping[sub.grade ?? ''] ?? 0;
      return subSum + sub.credits * pointValue;
    }, 0) || 0;
    return sum + semPoints;
  }, 0);

  const calculateRequiredGPA = () => {
    const target = parseFloat(targetGPA) || 0;
    const remaining = parseFloat(remainingCredits) || 0;
    const total = totalCreditsCompleted + remaining;
    if (remaining === 0) return 0;
    return (target * total - totalCumulativePoints) / remaining;
  };

  const requiredGPA = calculateRequiredGPA();
  const isAchievable = requiredGPA <= 10 && requiredGPA >= 0;
  const difficulty = requiredGPA > 9 ? 'high' : requiredGPA > 7 ? 'medium' : 'low';

  const resultColor = isAchievable ? (difficulty === 'high' ? 'var(--warning)' : 'var(--success)') : 'var(--danger)';
  const resultBorder = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)') : 'rgba(239,68,68,0.25)';
  const resultBg = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.07)') : 'rgba(239,68,68,0.07)';
  const resultIconBg = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.18)') : 'rgba(239,68,68,0.18)';

  /* ── existing calculator logic — fully real-time ── */
  const liveGPA = () => {
    if (!subjects.length) return 0;
    const pts = subjects.reduce((s, sub) => s + sub.credits * sub.gradePoint, 0);
    const cred = subjects.reduce((s, sub) => s + sub.credits, 0);
    return cred > 0 ? pts / cred : 0;
  };

  const displayGPA = liveGPA();
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);
  const totalPoints = subjects.reduce((s, sub) => s + sub.credits * sub.gradePoint, 0);
  const gap = personalTarget - liveGPA();
  const hitTarget = subjects.length > 0 && liveGPA() >= personalTarget;

  /* fire confetti once, at the moment the live GPA crosses the target */
  const prevHitRef = useRef(hitTarget);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevHitRef.current = hitTarget;
      return;
    }
    if (hitTarget && !prevHitRef.current) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      prevHitRef.current = hitTarget;
      return () => clearTimeout(timer);
    }
    prevHitRef.current = hitTarget;
  }, [hitTarget]);

  const addSubject = () => {
    if (!newSubjectName.trim()) return;
    setSubjects([...subjects, {
      id: Date.now().toString(), name: newSubjectName,
      credits: 3, grade: 'A', gradePoint: 8,
    }]);
    setNewSubjectName('');
  };

  const removeSubject = (id: string) =>
    setSubjects(subjects.filter(s => s.id !== id));

  const updateSubject = (id: string, field: keyof CalculatorSubject, value: any) =>
    setSubjects(subjects.map(sub => {
      if (sub.id !== id) return sub;
      if (field === 'grade') return { ...sub, grade: value, gradePoint: gradeMapping[value] };
      return { ...sub, [field]: value };
    }));

  const handleSemesterSaved = (saved: Semester) => {
    setSavedBanner(`Saved as "${saved.name}"`);
    setTimeout(() => setSavedBanner(null), 4000);
  };

  return (
    <div className="calculator-page" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* global fixes: hide number-input spinners, style the info tooltip hover */}
      <style>{`
        .calculator-page input[type="number"]::-webkit-outer-spin-button,
        .calculator-page input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .calculator-page input[type="number"] {
          -moz-appearance: textfield;
        }
        .info-tooltip-wrap:hover .info-tooltip-bubble {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Tools
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            GPA Calculator
          </h1>
          <InfoTooltip text="GPA = Σ(Credits × Grade Points) / Σ(Credits)" />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
          Add subjects, set grades, and watch your semester GPA update live
        </p>
      </motion.div>

      {/* ── Saved confirmation banner ─────────────────────── */}
      <AnimatePresence>
        {savedBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--success-muted)', border: '1px solid rgba(16,185,129,0.3)',
            }}>
              <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>{savedBanner}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Target CGPA Calculator (compact — inputs left, verdict right) ── */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}>
        <div className="glass-card" style={{ padding: '1.1rem 1.3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Target CGPA Calculator
            </h3>
            <InfoTooltip text="Required Avg = (Target × Total Credits − Current Points) ÷ Remaining" />
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, flexWrap: 'wrap' }}>
            {/* inputs — left */}
            <div style={{ display: 'flex', gap: 10, flex: '1 1 240px' }}>
              <div style={{ flex: 1 }}>
                <FormLabel>Target GPA</FormLabel>
                <input
                  type="number" min={1} max={10} step={0.1}
                  value={targetGPA}
                  onChange={e => setTargetGPA(e.target.value)}
                  onBlur={e => {
                    const n = parseFloat(e.target.value);
                    setTargetGPA(isNaN(n) ? '1' : String(clamp(n, 1, 10)));
                  }}
                  onWheel={e => e.currentTarget.blur()}
                />
              </div>
              <div style={{ flex: 1 }}>
                <FormLabel>Remaining Credits</FormLabel>
                <input
                  type="number" min={0}
                  value={remainingCredits}
                  onChange={e => setRemainingCredits(e.target.value)}
                  onBlur={e => {
                    const n = parseFloat(e.target.value);
                    setRemainingCredits(isNaN(n) ? '0' : String(Math.max(n, 0)));
                  }}
                  onWheel={e => e.currentTarget.blur()}
                />
              </div>
            </div>

            {/* verdict — right */}
            <div style={{
              flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              border: `1px solid ${resultBorder}`, background: resultBg,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: resultIconBg,
              }}>
                {isAchievable
                  ? <Check size={15} style={{ color: resultColor }} />
                  : <AlertCircle size={15} style={{ color: resultColor }} />
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: resultColor }}>
                    {requiredGPA.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>req. GPA</span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', fontWeight: 600, color: resultColor }}>
                  {isAchievable
                    ? (difficulty === 'high' ? '⚠ Challenging' : difficulty === 'medium' ? '◎ Moderate' : '✓ Easily achievable')
                    : 'Not achievable'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main two-column grid ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── LEFT column ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Add subject */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
              <SectionHeading>Add Subject</SectionHeading>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSubject()}
                  placeholder="Enter subject name…"
                  style={{ flex: 1 }}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={addSubject}
                  disabled={!newSubjectName.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 10, border: 'none',
                    cursor: newSubjectName.trim() ? 'pointer' : 'not-allowed',
                    background: newSubjectName.trim()
                      ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                      : 'rgba(255,255,255,0.06)',
                    color: '#fff', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
                    opacity: newSubjectName.trim() ? 1 : 0.45,
                    boxShadow: newSubjectName.trim() ? '0 4px 14px -4px rgba(124,58,237,0.5)' : 'none',
                    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={15} />
                  Add
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Subjects list */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Subjects
                  </h3>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(124,58,237,0.15)', color: 'var(--accent)',
                    border: '1px solid rgba(124,58,237,0.25)',
                  }}>
                    {subjects.length}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {totalCredits} credits total
                </span>
              </div>

              {/* Column headers */}
              {subjects.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 100px 54px 36px',
                  gap: 10, padding: '0 4px 8px',
                  borderBottom: '1px solid var(--glass-border)', marginBottom: 10,
                }}>
                  {['Subject', 'Credits', 'Grade', 'Pts', ''].map(h => (
                    <span key={h} style={{
                      fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="custom-scrollbar"
                style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}
              >
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <div className="glass-inner" style={{ padding: '0.85rem 1rem' }}>
                        <div style={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 100px 54px 36px',
                          gap: 10, alignItems: 'center',
                        }}>
                          <input
                            type="text"
                            value={subject.name}
                            onChange={e => updateSubject(subject.id, 'name', e.target.value)}
                            style={{ fontSize: '0.8125rem', padding: '7px 10px' }}
                          />
                          <input
                            type="number" min="0" max="10" step="0.5"
                            value={subject.credits}
                            onChange={e => updateSubject(subject.id, 'credits', parseFloat(e.target.value) || 0)}
                            onWheel={e => e.currentTarget.blur()}
                            style={{ fontSize: '0.8125rem', padding: '7px 10px' }}
                          />
                          <select
                            value={subject.grade}
                            onChange={e => updateSubject(subject.id, 'grade', e.target.value)}
                            style={{ fontSize: '0.8125rem', padding: '7px 10px' }}
                          >
                            {gradeLabels.map(g => (
                              <option key={g} value={g}>{g} ({gradeMapping[g]})</option>
                            ))}
                          </select>

                          {/* grade point pill */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 38, height: 28, borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                              background: GRADE_BG[subject.grade] || 'rgba(255,255,255,0.07)',
                              color: GRADE_COLORS[subject.grade] || 'var(--text-primary)',
                            }}>
                              {subject.gradePoint}
                            </span>
                          </div>

                          {/* delete */}
                          <button
                            onClick={() => removeSubject(subject.id)}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.09)')}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              border: '1px solid rgba(239,68,68,0.2)',
                              background: 'rgba(239,68,68,0.09)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'background 0.2s ease',
                            }}
                          >
                            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>

                        {/* grade slider */}
                        <div style={{ marginTop: 10 }}>
                          <input
                            type="range" min="5" max="10" step="1"
                            value={subject.gradePoint}
                            onChange={e => {
                              const pt = parseInt(e.target.value);
                              const grade = Object.keys(gradeMapping).find(k => gradeMapping[k] === pt) || 'C';
                              updateSubject(subject.id, 'grade', grade);
                            }}
                            style={{ width: '100%', accentColor: GRADE_COLORS[subject.grade] || 'var(--accent)' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            {['C·5', 'B·6', 'B+·7', 'A·8', 'A+·9', 'O·10'].map(l => (
                              <span key={l} style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{l}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {subjects.length === 0 && (
                  <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                      background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No subjects yet — add one above
                    </p>
                  </div>
                )}
              </div>

              {/* Total points / total credits row — right under the added subjects */}
              {subjects.length > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 100px 54px 36px',
                  gap: 10, alignItems: 'center',
                  padding: '10px 4px 0', marginTop: 8, borderTop: '1px solid var(--glass-border)',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Total
                  </span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {totalCredits}
                  </span>
                  <span />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', textAlign: 'center' }}>
                    {totalPoints.toFixed(1)}
                  </span>
                  <span />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT column ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* GPA ring — live, no calculate button */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.4 }}>
            <div
              className="glass-card accent-top"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
            >

              <SectionHeading>Your GPA</SectionHeading>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <CircularProgress value={displayGPA} max={10} size={200} strokeWidth={18} animated />
              </div>

              {subjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 14, padding: '6px 16px', borderRadius: 999,
                    background: hitTarget ? 'var(--success-muted)' : 'rgba(124,58,237,0.15)',
                    border: `1px solid ${hitTarget ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Sparkles size={12} style={{ color: hitTarget ? 'var(--success)' : 'var(--accent)' }} />
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: hitTarget ? 'var(--success)' : 'var(--accent)',
                  }}>
                    {hitTarget ? 'Target hit!' : 'Keep going!'}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Personal target */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.3rem 1.4rem' }}>
              <SectionHeading>Personal Target</SectionHeading>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input
                  type="number" min={0} max={10} step={0.1}
                  value={personalTarget}
                  onChange={e => setPersonalTarget(parseFloat(e.target.value) || 0)}
                  onBlur={() => setPersonalTarget(prev => clamp(prev, 0, 10))}
                  onWheel={e => e.currentTarget.blur()}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>/ 10</span>
              </div>

              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: hitTarget ? 'var(--success-muted)' : 'var(--warning-muted)',
                border: `1px solid ${hitTarget ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
              }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: hitTarget ? 'var(--success)' : 'var(--warning)', margin: 0 }}>
                  {hitTarget ? '🎉 Target achieved!' : `${gap.toFixed(2)} points to go`}
                </p>
                {!hitTarget && subjects.length > 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Currently at {liveGPA().toFixed(2)} · target {personalTarget.toFixed(1)}
                  </p>
                )}
              </div>

              {subjects.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="progress-track">
                    <div style={{
                      height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
                      width: `${Math.min((liveGPA() / personalTarget) * 100, 100)}%`,
                      background: hitTarget
                        ? 'linear-gradient(90deg, var(--success), #34d399)'
                        : 'linear-gradient(90deg, var(--warning), #fcd34d)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>0</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{personalTarget}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.3rem 1.4rem' }}>
              <SectionHeading>Quick Actions</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={subjects.length === 0}
                  onMouseEnter={e => { if (subjects.length) e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                    color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 500,
                    fontFamily: 'inherit', cursor: subjects.length ? 'pointer' : 'not-allowed',
                    opacity: subjects.length ? 1 : 0.5, transition: 'background 0.2s ease',
                  }}
                >
                  <Zap size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  Save to Semester
                </button>
                <button
                  onClick={() => setSubjects([])}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.16)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.2s ease',
                  }}
                >
                  <Trash2 size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Save to Semester modal ────────────────────────── */}
      <SaveToSemesterModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        subjects={subjects}
        onSaved={handleSemesterSaved}
      />

      {/* ── Confetti overlay ─────────────────────────────── */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{
                background: '#15151f',
                border: '1px solid rgba(16,185,129,0.35)', borderRadius: 16,
                padding: '1.5rem 2.25rem', textAlign: 'center', position: 'relative', zIndex: 1,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎉</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                Target Achieved!
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                GPA {displayGPA.toFixed(2)} ≥ target {personalTarget.toFixed(1)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}