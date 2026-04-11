import { useState, useEffect } from 'react';
import { Target, Plus, Check, Trash2, AlertCircle, Loader2, Sparkles, ChevronUp, Flame, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/Modal';
import { fetchAcademicData, toggleGoalStatus, deleteGoalFromDb, addGoalToDb } from '../lib/dataService';
import { getTotalCredits, type Goal, type Semester, gradeMapping } from '../data/sampleData';

/* ── animation helpers ──────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] },
});

/* ── priority config ────────────────────────────────────────── */
const PRIORITY_META = {
  High: { icon: Flame, color: 'var(--danger)', bg: 'var(--danger-muted)', border: 'rgba(239,68,68,0.25)' },
  Medium: { icon: ChevronUp, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245,158,11,0.25)' },
  Low: { icon: Minus, color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16,185,129,0.25)' },
} as const;

/* ── small reusables ────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{children}</h3>
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

/* ── main component ─────────────────────────────────────────── */
export function Goals() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetGPA, setTargetGPA] = useState<string>('9.0');
  const [remainingCredits, setRemainingCredits] = useState<string>('40');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_semester: 'Semester 7',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { semesters, goals } = await fetchAcademicData();
        setSemesters(semesters);
        setGoals(goals);
      } catch (err) {
        console.error('Error loading goals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCreditsCompleted = getTotalCredits(semesters);
  const totalPoints = semesters.reduce((sum, sem) => {
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
    return (target * total - totalPoints) / remaining;
  };

  const requiredGPA = calculateRequiredGPA();
  const isAchievable = requiredGPA <= 10 && requiredGPA >= 0;
  const difficulty = requiredGPA > 9 ? 'high' : requiredGPA > 7 ? 'medium' : 'low';

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleGoal = async (id: string, currentStatus: boolean) => {
    try {
      await toggleGoalStatus(id, !currentStatus);
      setGoals(goals.map(g => g.id === id ? { ...g, completed: !currentStatus } : g));
    } catch { alert('Failed to update goal'); }
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await deleteGoalFromDb(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch { alert('Failed to delete goal'); }
  };

  const addGoal = async () => {
    if (!newGoal.title) return;
    try {
      const maxIdNumber = goals.reduce(
        (max, goal) => Math.max(max, parseInt(goal.id.replace(/\D/g, '')) || 0), 0
      );
      const goalObj: Goal = {
        id: `goal${maxIdNumber + 1}`,
        title: newGoal.title,
        target_semester: newGoal.target_semester,
        priority: newGoal.priority,
        completed: false,
      };
      const savedGoal = await addGoalToDb(goalObj);
      setGoals([...goals, savedGoal]);
      setNewGoal({ title: '', target_semester: 'Semester 7', priority: 'Medium' });
      setShowGoalModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add goal');
    }
  };

  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Syncing with cloud...</p>
    </div>
  );

  /* result card colors */
  const resultColor = isAchievable ? (difficulty === 'high' ? 'var(--warning)' : 'var(--success)') : 'var(--danger)';
  const resultBorder = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)') : 'rgba(239,68,68,0.25)';
  const resultBg = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.07)') : 'rgba(239,68,68,0.07)';
  const resultIconBg = isAchievable ? (difficulty === 'high' ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.18)') : 'rgba(239,68,68,0.18)';

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Goals
            </p>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              My Goals
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
              Set targets and track your academic aspirations
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowGoalModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
              color: '#fff', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit',
              boxShadow: '0 4px 16px -4px rgba(124,58,237,0.5)',
            }}
          >
            <Plus size={16} />
            Add Goal
          </motion.button>
        </div>
      </motion.div>

      {/* ── Goals progress strip ─────────────────────────────── */}
      {totalCount > 0 && (
        <motion.div {...fadeUp(0.07)}>
          <div className="glass-card" style={{ padding: '1.1rem 1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Goal Progress</span>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{completedCount}</span> / {totalCount} completed
                &nbsp;·&nbsp;
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{completionPct}%</span>
              </span>
            </div>
            <div className="progress-track">
              <div style={{
                height: '100%', width: `${completionPct}%`, borderRadius: 99,
                background: 'linear-gradient(90deg, var(--success), #34d399)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Target CGPA Calculator ───────────────────────────── */}
      <motion.div {...fadeUp(0.12)}>
        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          {/* decorative blob */}
          <div style={{
            position: 'absolute', top: -50, right: -50, width: 180, height: 180,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Target CGPA Calculator
            </h3>
          </div>

          {/* inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <FormLabel>Target Cumulative GPA (1–10)</FormLabel>
              <input type="number" min="1" max="10" step="0.1" value={targetGPA} onChange={e => setTargetGPA(e.target.value)} />
            </div>
            <div>
              <FormLabel>Remaining Credits</FormLabel>
              <input type="number" min="0" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)} />
            </div>
          </div>

          {/* result card */}
          <div style={{ borderRadius: 14, padding: '1.25rem 1.4rem', border: `1px solid ${resultBorder}`, background: resultBg }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: resultIconBg,
              }}>
                {isAchievable
                  ? <Check size={18} style={{ color: resultColor }} />
                  : <AlertCircle size={18} style={{ color: resultColor }} />
                }
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, color: resultColor }}>
                  {isAchievable ? 'Target is achievable' : 'Target not achievable'}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: resultColor }}>
                    {requiredGPA.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>required avg GPA</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: isAchievable ? 12 : 0 }}>
                  {isAchievable
                    ? `Maintain a ${requiredGPA.toFixed(2)} average across the remaining ${remainingCredits} credits to hit your target of ${targetGPA}.`
                    : 'This target cannot be reached with the remaining credits. Try adjusting your target or consider retaking courses.'}
                </p>
                {isAchievable && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                    background: difficulty === 'high' ? 'rgba(245,158,11,0.18)' : difficulty === 'medium' ? 'rgba(124,58,237,0.18)' : 'rgba(16,185,129,0.18)',
                    color: difficulty === 'high' ? 'var(--warning)' : difficulty === 'medium' ? 'var(--accent)' : 'var(--success)',
                  }}>
                    {difficulty === 'high' ? '⚠ Challenging' : difficulty === 'medium' ? '◎ Moderate' : '✓ Easily Achievable'}
                  </span>
                )}
              </div>
            </div>

            {/* formula breakdown */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${resultBorder}` }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
                Formula — Required Avg = (Target × Total Credits − Current Points) ÷ Remaining
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                ({targetGPA} × {totalCreditsCompleted + parseFloat(remainingCredits || '0')} − {totalPoints.toFixed(2)}) ÷ {remainingCredits}{' '}
                = <strong style={{ color: 'var(--text-primary)' }}>{requiredGPA.toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Goals list ───────────────────────────────────────── */}
      <motion.div {...fadeUp(0.18)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
          <SectionHeading>Your Goals</SectionHeading>
          {totalCount > 0 && (
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
            }}>
              {totalCount} total
            </span>
          )}
        </div>

        {goals.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>No goals yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Add your first goal to start tracking your progress</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {goals.map((goal, index) => {
                const pm = PRIORITY_META[goal.priority];
                const PIcon = pm.icon;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, duration: 0.35 } }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                    style={{ opacity: goal.completed ? 0.55 : 1 }}
                  >
                    <div
                      className="glass-card"
                      style={{
                        padding: '1rem 1.25rem',
                        display: 'flex', alignItems: 'center', gap: 14,
                        borderColor: goal.completed ? 'rgba(16,185,129,0.2)' : 'var(--glass-border)',
                        transition: 'opacity 0.3s ease, border-color 0.3s ease',
                      }}
                    >
                      {/* checkbox */}
                      <button
                        onClick={() => toggleGoal(goal.id, goal.completed)}
                        style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${goal.completed ? 'var(--success)' : 'rgba(255,255,255,0.2)'}`,
                          background: goal.completed ? 'var(--success)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                        }}
                      >
                        {goal.completed && <Check size={12} color="#fff" />}
                      </button>

                      {/* text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0,
                          textDecoration: goal.completed ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {goal.title}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          Target: {goal.target_semester}
                        </p>
                      </div>

                      {/* priority badge */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        padding: '4px 10px', borderRadius: 999,
                        background: pm.bg, border: `1px solid ${pm.border}`,
                        fontSize: '0.6875rem', fontWeight: 700, color: pm.color,
                      }}>
                        <PIcon size={11} />
                        {goal.priority}
                      </div>

                      {/* delete */}
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                        style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.2s ease',
                        }}
                      >
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Add Goal Modal ───────────────────────────────────── */}
      <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="Add New Goal" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          <div>
            <FormLabel>Goal Title</FormLabel>
            <input
              type="text"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="e.g., Achieve 9.0 GPA in next semester"
            />
          </div>

          <div>
            <FormLabel>Target Semester</FormLabel>
            <select
              value={newGoal.target_semester}
              onChange={e => setNewGoal({ ...newGoal, target_semester: e.target.value })}
            >
              <option>Semester 7</option>
              <option>Semester 8</option>
              <option>End of Year</option>
            </select>
          </div>

          <div>
            <FormLabel>Priority</FormLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['High', 'Medium', 'Low'] as const).map(priority => {
                const pm = PRIORITY_META[priority];
                const active = newGoal.priority === priority;
                return (
                  <button
                    key={priority}
                    onClick={() => setNewGoal({ ...newGoal, priority })}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 600,
                      transition: 'all 0.2s ease',
                      background: active ? pm.bg : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? pm.border : 'var(--glass-border)'}`,
                      color: active ? pm.color : 'var(--text-secondary)',
                    }}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button
              onClick={() => setShowGoalModal(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)', transition: 'all 0.2s ease',
              }}
            >
              Cancel
            </button>
            <button
              onClick={addGoal}
              disabled={!newGoal.title}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                cursor: newGoal.title ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600,
                background: newGoal.title ? 'linear-gradient(135deg, var(--accent), #5b21b6)' : 'rgba(255,255,255,0.06)',
                border: 'none', color: '#fff',
                opacity: newGoal.title ? 1 : 0.45, transition: 'all 0.2s ease',
                boxShadow: newGoal.title ? '0 4px 14px -4px rgba(124,58,237,0.5)' : 'none',
              }}
            >
              Add Goal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}