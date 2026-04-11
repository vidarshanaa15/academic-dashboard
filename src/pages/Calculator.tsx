import { useState } from 'react';
import { Plus, Trash2, Calculator as CalcIcon, Sparkles, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '../components/CircularProgress';
import { gradeLabels, gradeMapping } from '../data/sampleData';

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

export function Calculator() {
  const [subjects, setSubjects] = useState<CalculatorSubject[]>([
    { id: '1', name: 'Sample Subject 1', credits: 4, grade: 'A+', gradePoint: 9 },
    { id: '2', name: 'Sample Subject 2', credits: 3, grade: 'O', gradePoint: 10 },
  ]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [calculatedGPA, setCalculatedGPA] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [personalTarget, setPersonalTarget] = useState(8.5);

  const liveGPA = () => {
    if (!subjects.length) return 0;
    const pts = subjects.reduce((s, sub) => s + sub.credits * sub.gradePoint, 0);
    const cred = subjects.reduce((s, sub) => s + sub.credits, 0);
    return cred > 0 ? pts / cred : 0;
  };

  const displayGPA = calculatedGPA ?? liveGPA();
  const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);
  const totalPoints = subjects.reduce((s, sub) => s + sub.credits * sub.gradePoint, 0);
  const gap = personalTarget - liveGPA();
  const hitTarget = liveGPA() >= personalTarget;

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

  const calculateGPA = () => {
    if (!subjects.length) return;
    const gpa = liveGPA();
    setCalculatedGPA(gpa);
    if (gpa >= personalTarget) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Tools
        </p>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          GPA Calculator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
          Add subjects, set grades, and predict your semester GPA instantly
        </p>
      </motion.div>

      {/* ── Main two-column grid ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── LEFT column ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Add subject */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.4 }}>
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.4 }}>
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
            </div>
          </motion.div>

          {/* Formula breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
              <SectionHeading>Formula &amp; Breakdown</SectionHeading>
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
              }}>
                <code style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                  GPA = Σ(Credits × Grade Points) / Σ(Credits)
                </code>
              </div>
              {subjects.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Total Points', value: totalPoints.toFixed(2), color: 'var(--accent)' },
                    { label: 'Total Credits', value: String(totalCredits), color: 'var(--accent-2)' },
                    { label: 'Live GPA', value: liveGPA().toFixed(2), color: 'var(--success)' },
                  ].map(item => (
                    <div key={item.label} className="glass-inner" style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <p style={{
                        fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4,
                        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                      }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, margin: 0 }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT column ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* GPA ring */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <div
              className="glass-card accent-top"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
            >
              {/* ambient glow */}
              <div style={{
                position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 180, height: 180, borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
              }} />

              <SectionHeading>Calculated GPA</SectionHeading>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <CircularProgress value={displayGPA} max={10} size={200} strokeWidth={18} animated />
              </div>

              {calculatedGPA !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 14, padding: '6px 16px', borderRadius: 999,
                    background: displayGPA >= personalTarget ? 'var(--success-muted)' : 'rgba(124,58,237,0.15)',
                    border: `1px solid ${displayGPA >= personalTarget ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Sparkles size={12} style={{ color: displayGPA >= personalTarget ? 'var(--success)' : 'var(--accent)' }} />
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: displayGPA >= personalTarget ? 'var(--success)' : 'var(--accent)',
                  }}>
                    {displayGPA >= personalTarget ? 'Target hit!' : 'Keep going!'}
                  </span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={calculateGPA}
                disabled={subjects.length === 0}
                style={{
                  marginTop: 16, width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: subjects.length
                    ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                    : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
                  cursor: subjects.length ? 'pointer' : 'not-allowed',
                  opacity: subjects.length ? 1 : 0.45,
                  boxShadow: subjects.length ? '0 6px 20px -4px rgba(124,58,237,0.5)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <CalcIcon size={16} />
                Calculate GPA
              </motion.button>
            </div>
          </motion.div>

          {/* Personal target */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.3rem 1.4rem' }}>
              <SectionHeading>Personal Target</SectionHeading>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input
                  type="number" min="0" max="10" step="0.1"
                  value={personalTarget}
                  onChange={e => setPersonalTarget(parseFloat(e.target.value) || 0)}
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}>
            <div className="glass-card" style={{ padding: '1.3rem 1.4rem' }}>
              <SectionHeading>Quick Actions</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                    color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'background 0.2s ease',
                  }}
                >
                  <Zap size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  Save to Semester
                </button>
                <button
                  onClick={() => { setSubjects([]); setCalculatedGPA(null); }}
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
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 65%)',
            }} />
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              style={{
                background: 'var(--glass-bg)', backdropFilter: 'blur(24px)',
                border: '1px solid rgba(16,185,129,0.4)', borderRadius: 24,
                padding: '2rem 3rem', textAlign: 'center', position: 'relative', zIndex: 1,
                boxShadow: '0 0 60px -12px rgba(16,185,129,0.4)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Target Achieved!
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                GPA {displayGPA.toFixed(2)} ≥ target {personalTarget.toFixed(1)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}