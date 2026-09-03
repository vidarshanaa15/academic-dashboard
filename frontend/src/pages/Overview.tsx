import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, BookOpen, GraduationCap, Loader2, Sparkles, ChevronUp, Target, Plus, Flame, Minus, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import { GPALineChart } from '../components/GPALineChart';
import { GradeBarChart } from '../components/GradeBarChart';
import { CreditPieChart } from '../components/CreditPieChart';
import { motion } from 'framer-motion';
import { fetchAcademicData } from '../lib/dataService';
import { getTotalCredits, getGradeDistribution, getCreditBreakdown, getSubjectAreaPerformance, type Goal, type Semester } from '../data/sampleData';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
});

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

const GRADE_BG: Record<string, string> = {
  O: 'var(--grade-o-bg)', 'A+': 'var(--grade-ap-bg)', A: 'var(--grade-a-bg)',
  'B+': 'var(--grade-bp-bg)', B: 'var(--grade-b-bg)', C: 'var(--grade-c-bg)',
};

const CARD_HEIGHT = 440;

const PRIORITY_META = {
  High: { icon: Flame, color: 'var(--danger)', bg: 'var(--danger-muted)', border: 'rgba(239,68,68,0.25)' },
  Medium: { icon: ChevronUp, color: 'var(--warning)', bg: 'var(--warning-muted)', border: 'rgba(245,158,11,0.25)' },
  Low: { icon: Minus, color: 'var(--success)', bg: 'var(--success-muted)', border: 'rgba(16,185,129,0.25)' },
} as const;

function StatCard({
  title, value, subtitle, icon: Icon, accent = false, success = false, showTopLine = true,
}: {
  title: string; value: string | number; subtitle: string;
  icon: any; accent?: boolean; success?: boolean; showTopLine?: boolean;
}) {
  return (
    <div className="glass-card" style={{ padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: '100%' }}>
      {showTopLine && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: accent
            ? 'linear-gradient(90deg, var(--accent), var(--accent-2))'
            : success
              ? 'linear-gradient(90deg, var(--success), #34d399)'
              : 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)',
          borderRadius: '18px 18px 0 0',
        }} />
      )}

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
        width: '100%', textAlign: 'left', cursor: 'pointer',
        fontFamily: 'inherit', display: 'block',
      }}
    >
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

function ThisSemesterCard({
  semester, onClick,
}: {
  semester: Semester | null; onClick: () => void;
}) {
  if (!semester) {
    return (
      <button
        onClick={onClick}
        className="glass-card"
        style={{
          padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: CARD_HEIGHT,
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
          Add a Semester
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
          Start tracking your current term
        </p>
      </button>
    );
  }

  const isPlanned = semester.status === 'planned';
  const credits = semester.subjects.reduce((s, sub) => s + sub.credits, 0);

  return (
    <button
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '1.4rem 1.5rem', position: 'relative', overflow: 'hidden', height: CARD_HEIGHT, maxHeight: CARD_HEIGHT,
        width: '100%', textAlign: 'left', cursor: 'pointer',
        fontFamily: 'inherit', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: isPlanned
          ? 'linear-gradient(90deg, var(--warning), #fcd34d)'
          : 'linear-gradient(90deg, var(--accent), var(--accent-2))',
        borderRadius: '18px 18px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <div>
          <p className="stat-label" style={{ marginBottom: 3 }}>This Semester</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{semester.name}</h4>
            {isPlanned && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
                fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <Clock size={10} /> In Progress
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 4 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: '1rem' }}>
        <div className="glass-inner" style={{ padding: '0.6rem', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>GPA</p>
          {semester.gpa != null
            ? <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)', margin: 0, letterSpacing: '-0.02em' }}>{semester.gpa.toFixed(2)}</p>
            : <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--warning)', margin: 0 }}>Pending</p>}
        </div>
        <div className="glass-inner" style={{ padding: '0.6rem', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>Subjects</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{semester.subjects.length}</p>
        </div>
        <div className="glass-inner" style={{ padding: '0.6rem', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 3 }}>Credits</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{credits}</p>
        </div>
      </div>

      {/* mini subject/grade list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', paddingRight: 4, flex: 1, minHeight: 0 }}>
        {semester.subjects.map(sub => (
          <div
            key={sub.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
            }}
          >
            <span style={{
              fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {sub.name}
            </span>
            {sub.grade
              ? (
                <span style={{
                  flexShrink: 0, display: 'inline-flex', padding: '2px 8px', borderRadius: 999,
                  fontSize: '0.6875rem', fontWeight: 700,
                  background: GRADE_BG[sub.grade] || 'rgba(255,255,255,0.08)',
                  color: GRADE_CHART_COLORS[sub.grade] || 'var(--text-primary)',
                }}>
                  {sub.grade}
                </span>
              )
              : <span style={{ flexShrink: 0, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Pending</span>}
          </div>
        ))}
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

  const semesterRank = (s: string) => {
    const n = parseInt(s.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? Infinity : n;
  };

  const gpaChartData = useMemo(() => {
    if (!semesters.length) return [];
    return [...semesters]
      // exclude semesters that don't have computed values yet
      .filter(sem => sem.gpa != null && sem.cgpa != null)
      .sort((a, b) => semesterRank(a.name) - semesterRank(b.name))
      .map(sem => ({ semester: sem.name, gpa: sem.gpa, cgpa: sem.cgpa }));
  }, [semesters]);

  const upcomingGoal = useMemo(() => {
    const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    const incomplete = goals.filter(g => !g.completed);
    if (!incomplete.length) return null;
    return [...incomplete].sort((a, b) => {
      const semDiff = semesterRank(a.target_semester) - semesterRank(b.target_semester);
      if (semDiff !== 0) return semDiff;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];
  }, [goals]);

  const currentSemester = useMemo(() => {
    if (!semesters.length) return null;
    const ongoing = semesters.find(sem => sem.status === 'planned');
    if (ongoing) return ongoing;
    return [...semesters].sort((a, b) => semesterRank(b.name) - semesterRank(a.name))[0] ?? null;
  }, [semesters]);

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {[
          { title: 'Current CGPA', value: currentCGPA.toFixed(2), subtitle: 'Out of 10.0', icon: GraduationCap, accent: true, showTopLine: false },
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

      <motion.div {...fadeUp(0.2)}>
        <SectionHeading>Key Achievements</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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

      <motion.div {...fadeUp(0.25)}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <SectionHeading>GPA &amp; CGPA Trend</SectionHeading>
          <GPALineChart data={gpaChartData} />
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <motion.div {...fadeUp(0.3)}>
          <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
            <SectionHeading>Grade Distribution</SectionHeading>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
        <motion.div {...fadeUp(0.4)}>
          <div className="glass-card" style={{ padding: '1.5rem', height: CARD_HEIGHT, maxHeight: CARD_HEIGHT, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SectionHeading>Performance Insights by Subject Area</SectionHeading>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
              {subjectAreaPerformance.map((area, index) => {
                const isTop = index === 0;
                const isBottom = index === subjectAreaPerformance.length - 1;
                const fillPct = (area.average / maxAreaAvg) * 100;
                const isLast = index === subjectAreaPerformance.length - 1;

                return (
                  <div
                    key={area.area}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 2px',
                      borderBottom: isLast ? 'none' : '1px solid var(--glass-border)',
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%', fontSize: '0.625rem', fontWeight: 700,
                      background: isTop ? 'var(--success-muted)' : isBottom ? 'var(--warning-muted)' : 'rgba(255,255,255,0.07)',
                      color: isTop ? 'var(--success)' : isBottom ? 'var(--warning)' : 'var(--text-secondary)',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>

                    {/* area name */}
                    <span style={{
                      fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)',
                      flex: '0 0 88px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={area.area}>
                      {area.area}
                    </span>

                    {/* inline progress bar */}
                    <div className="progress-track" style={{ height: 6, flex: 1 }}>
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

                    {/* score */}
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0, width: 34, textAlign: 'right' }}>
                      {area.average.toFixed(2)}
                    </span>

                    {/* strength/opportunity indicator */}
                    <span style={{ width: 14, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {isTop && (
                        <span title="Strength: your best-performing subject area" style={{ display: 'flex', cursor: 'help' }}>
                          <ChevronUp size={13} style={{ color: 'var(--success)' }} />
                        </span>
                      )}
                      {isBottom && (
                        <span title="Improvement opportunity: your lowest-performing subject area" style={{ display: 'flex', cursor: 'help' }}>
                          <Target size={12} style={{ color: 'var(--warning)' }} />
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* legend */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              paddingTop: 10, marginTop: 6, borderTop: '1px solid var(--glass-border)', flexShrink: 0,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                <ChevronUp size={12} style={{ color: 'var(--success)' }} /> Strength
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                <Target size={11} style={{ color: 'var(--warning)' }} /> Improvement opportunity
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.45)}>
          <ThisSemesterCard
            semester={currentSemester}
            onClick={() => {
              if (!currentSemester) {
                navigate('/semesters');
                return;
              }
              navigate('/semesters', { state: { openSemesterId: currentSemester.id } });
            }}
          />
        </motion.div>
      </div>

    </div>
  );
}