import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, BookOpen, GraduationCap, Loader2, Sparkles, ChevronUp, Target, Plus, Flame, Minus, ArrowRight } from 'lucide-react';
import { GPALineChart } from '../components/GPALineChart';
import { GradeBarChart } from '../components/GradeBarChart';
import { CreditPieChart } from '../components/CreditPieChart';
import { motion } from 'framer-motion';
import { fetchAcademicData } from '../lib/dataService';
import { getTotalCredits, getGradeDistribution, getCreditBreakdown, getSubjectAreaPerformance, type Goal } from '../data/sampleData';

/* ── animation variants ─────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
});

/* ── grade color map ────────────────────────────────────────── */
const GRADE_META: Record<string, { label: string; cls: string }> = {
  O: { label: 'O', cls: 'grade-o' },
  'A+': { label: 'A+', cls: 'grade-ap' },
  A: { label: 'A', cls: 'grade-a' },
  'B+': { label: 'B+', cls: 'grade-bp' },
  B: { label: 'B', cls: 'grade-b' },
  C: { label: 'C', cls: 'grade-c' },
};

const GRADE_CHART_COLORS: Record<string, string> = {
  O: 'var(--chart-o)', 'A+': 'var(--chart-ap)', A: 'var(--chart-a)',
  'B+': 'var(--chart-bp)', B: 'var(--chart-b)', C: 'var(--chart-c)',
};

/* ── priority config (mirrors Goals page) ─────────────────────── */
const PRIORITY_META = {
  High: { icon: Flame, color: 'var(--danger)', bg: 'var(--danger-muted)', border: 'rgba(239,68,68,0.25)' },
  Medium: { icon: ChevronUp, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245,158,11,0.25)' },
  Low: { icon: Minus, color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16,185,129,0.25)' },
} as const;

/* ── subcomponents ──────────────────────────────────────────── */

function StatCard({
  title, value, subtitle, icon: Icon, accent = false, success = false,
}: {
  title: string; value: string | number; subtitle: string;
  icon: any; accent?: boolean; success?: boolean;
}) {
  return (
    <div className="glass-card" style={{ padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%' }}>
      {/* top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: accent
          ? 'linear-gradient(90deg, var(--accent), var(--accent-2))'
          : success
            ? 'linear-gradient(90deg, var(--success), #34d399)'
            : 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)',
        borderRadius: '18px 18px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p className="stat-label">{title}</p>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: accent
            ? 'rgba(124,58,237,0.2)'
            : success
              ? 'rgba(16,185,129,0.2)'
              : 'rgba(255,255,255,0.07)',
        }}>
          <Icon size={16} style={{
            color: accent ? 'var(--accent)' : success ? 'var(--success)' : 'var(--text-secondary)',
          }} />
        </div>
      </div>

      <div className="stat-value" style={{ fontSize: typeof value === 'string' && value.length > 7 ? '1.6rem' : '2.25rem' }}>
        {value}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{subtitle}</p>
    </div>
  );
}

/* Upcoming-goal tile: shows the highest-priority incomplete goal, or an
   "Add Goal" prompt that routes the user to the Goals page. */
function UpcomingGoalCard({
  goal, onClick,
}: {
  goal: Goal | null; onClick: () => void;
}) {
  if (!goal) {
    return (
      <button
        onClick={onClick}
        className="glass-card"
        style={{
          padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%',
          width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px dashed var(--glass-border)',
          background: 'rgba(124,58,237,0.05)', fontFamily: 'inherit',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
        }}>
          <Plus size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textAlign: 'center' }}>
          Add a Goal
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          Set a target to track here
        </p>
      </button>
    );
  }

  const pm = PRIORITY_META[goal.priority];
  const PIcon = pm.icon;

  return (
    <button
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%',
        width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'transparent',
        fontFamily: 'inherit', display: 'block',
      }}
    >
      {/* top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
        borderRadius: '18px 18px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <p className="stat-label">Upcoming Goal</p>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: 'rgba(124,58,237,0.2)',
        }}>
          <Target size={16} style={{ color: 'var(--accent)' }} />
        </div>
      </div>

      <p style={{
        fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
        margin: 0, lineHeight: 1.35, display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {goal.title}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 999,
          background: pm.bg, border: `1px solid ${pm.border}`,
          fontSize: '0.6875rem', fontWeight: 700, color: pm.color,
        }}>
          <PIcon size={10} />
          {goal.priority}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {goal.target_semester}
          <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{children}</h3>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────── */
export function Overview() {
  const navigate = useNavigate();
  const [academicData, setAcademicData] = useState<{ semesters: any[]; goals: Goal[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await fetchAcademicData();
        setAcademicData(data);
      } catch (error) {
        console.error('Error fetching academic data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const semesters = academicData?.semesters || [];
  const goals = academicData?.goals || [];

  const gpaChartData = useMemo(() => {
    if (!semesters.length) return [];
    return [...semesters]
      .sort((a, b) => (parseInt(a.name.replace(/\D/g, '')) || 0) - (parseInt(b.name.replace(/\D/g, '')) || 0))
      .map(sem => ({ semester: sem.name, gpa: sem.gpa || 0, cgpa: sem.cgpa || 0 }));
  }, [semesters]);

  const upcomingGoal = useMemo(() => {
    const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    // "Semester N" sorts numerically; anything without a number (e.g. "End of Year")
    // is treated as farthest out so real semesters take priority.
    const semesterRank = (s: string) => {
      const n = parseInt(s.replace(/\D/g, ''), 10);
      return Number.isNaN(n) ? Infinity : n;
    };
    const incomplete = goals.filter(g => !g.completed);
    if (!incomplete.length) return null;
    return [...incomplete].sort((a, b) => {
      const semDiff = semesterRank(a.target_semester) - semesterRank(b.target_semester);
      if (semDiff !== 0) return semDiff;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];
  }, [goals]);

  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
        }}>
          <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading your academic records...</p>
      </div>
    );
  }

  const currentCGPA = semesters.length > 0 ? semesters[semesters.length - 1].cgpa : 0;
  const totalCredits = getTotalCredits(semesters);
  const creditsRemaining = 200 - totalCredits;
  const semestersCompleted = semesters.length;
  const creditPct = Math.round((totalCredits / 200) * 100);

  const highestSemester = semesters.length > 0
    ? semesters.reduce((max, sem) => sem.gpa > max.gpa ? sem : max, semesters[0])
    : { name: 'N/A', gpa: 0 };

  const gradeDistribution = getGradeDistribution(semesters);
  const mostCommonGrade = gradeDistribution.length > 0
    ? gradeDistribution.reduce((max, item) => item.count > max.count ? item : max, gradeDistribution[0])
    : { grade: 'N/A', count: 0 };
  const creditBreakdown = getCreditBreakdown(semesters);
  const subjectAreaPerformance = getSubjectAreaPerformance(semesters);
  const maxAreaAvg = Math.max(...subjectAreaPerformance.map(a => a.average), 1);

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <motion.div {...fadeUp(0)}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              Dashboard
            </p>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Academic Overview
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
              Your comprehensive academic performance at a glance
            </p>
          </div>
          {/* CGPA pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 999,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>
              CGPA {currentCGPA.toFixed(2)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      {/* First 3 tiles use a smaller flex-basis so they sit slightly
          narrower; the goal tile gets extra grow/basis to comfortably
          fit a user-authored goal title. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {[
          { title: 'Current CGPA', value: currentCGPA.toFixed(2), subtitle: 'Out of 10.0', icon: GraduationCap, accent: true },
          { title: 'Credits Completed', value: totalCredits, subtitle: `${creditsRemaining} remaining`, icon: BookOpen },
          { title: 'Semesters Completed', value: semestersCompleted, subtitle: '5 remaining', icon: TrendingUp },
        ].map((card, i) => (
          <motion.div key={card.title} {...fadeUp(i * 0.07)} style={{ flex: '1 1 170px', minWidth: 170 }}>
            <StatCard {...card} />
          </motion.div>
        ))}

        <motion.div {...fadeUp(0.21)} style={{ flex: '1.4 1 240px', minWidth: 240 }}>
          <UpcomingGoalCard goal={upcomingGoal} onClick={() => navigate('/goals')} />
        </motion.div>
      </div>

      {/* ── Credits progress banner ─────────────────────────── */}
      <motion.div {...fadeUp(0.15)}>
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={14} style={{ color: 'var(--accent-2)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Credit Progress</span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalCredits}</span> / 200 credits
              &nbsp;·&nbsp;
              <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>{creditPct}% complete</span>
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${creditPct}%` }} />
          </div>
        </div>
      </motion.div>

      {/* ── Key achievements ────────────────────────────────── */}
      <motion.div {...fadeUp(0.2)}>
        <SectionHeading>Key Achievements</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

          {/* Highest GPA */}
          <div className="glass-card" style={{ padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Award size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Highest GPA Semester
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {highestSemester.name}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {highestSemester.gpa.toFixed(2)}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>GPA</span>
                </p>
              </div>
            </div>
          </div>

          {/* Most common grade */}
          <div className="glass-card" style={{ padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                🏆
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Most Common Grade
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  Grade {mostCommonGrade.grade}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-2)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {mostCommonGrade.count}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>subjects</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── GPA / CGPA trend ────────────────────────────────── */}
      <motion.div {...fadeUp(0.25)}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <SectionHeading>GPA &amp; CGPA Trend</SectionHeading>
          <GPALineChart data={gpaChartData} />
        </div>
      </motion.div>

      {/* ── Grade distribution + Credit breakdown ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <motion.div {...fadeUp(0.3)}>
          <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
            <SectionHeading>Grade Distribution</SectionHeading>
            {/* grade legend row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {Object.entries(GRADE_META).map(([g, meta]) => (
                <span key={g} className={`grade-badge ${meta.cls}`}>{meta.label}</span>
              ))}
            </div>
            <GradeBarChart data={gradeDistribution} />
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.35)}>
          <div className="glass-card" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SectionHeading>Credit Breakdown</SectionHeading>
            <CreditPieChart data={creditBreakdown} />
          </div>
        </motion.div>
      </div>

      {/* ── Subject area performance ─────────────────────────── */}
      <motion.div {...fadeUp(0.4)}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <SectionHeading>Performance Insights by Subject Area</SectionHeading>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjectAreaPerformance.map((area, index) => {
              const isTop = index === 0;
              const isBottom = index === subjectAreaPerformance.length - 1;
              const fillPct = (area.average / maxAreaAvg) * 100;

              return (
                <div
                  key={area.area}
                  className="glass-inner"
                  style={{ padding: '0.9rem 1.1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* rank pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, height: 26, borderRadius: '50%', fontSize: '0.6875rem', fontWeight: 700,
                        background: isTop ? 'var(--success-muted)' : isBottom ? 'var(--warning-muted)' : 'rgba(255,255,255,0.07)',
                        color: isTop ? 'var(--success)' : isBottom ? 'var(--warning)' : 'var(--text-secondary)',
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {area.area}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isTop && (
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px',
                          borderRadius: 999, background: 'var(--success-muted)', color: 'var(--success)',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <ChevronUp size={11} /> Strength
                        </span>
                      )}
                      {isBottom && (
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px',
                          borderRadius: 999, background: 'var(--warning-muted)', color: 'var(--warning)',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <Target size={11} /> Opportunity
                        </span>
                      )}
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {area.average.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 10</span>
                    </div>
                  </div>

                  {/* mini progress bar */}
                  <div className="progress-track" style={{ height: 7 }}>
                    <div
                      style={{
                        height: '100%', width: `${fillPct}%`,
                        borderRadius: 99, transition: 'width 0.6s ease',
                        background: isTop
                          ? 'linear-gradient(90deg, var(--success), #34d399)'
                          : isBottom
                            ? 'linear-gradient(90deg, var(--warning), #fcd34d)'
                            : 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

    </div>
  );
}