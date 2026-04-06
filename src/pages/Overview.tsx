import { useState, useEffect, useMemo } from 'react';
import { Award, TrendingUp, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { GPALineChart } from '../components/GPALineChart';
import { GradeBarChart } from '../components/GradeBarChart';
import { CreditPieChart } from '../components/CreditPieChart';
import { motion } from 'framer-motion';
import { fetchAcademicData } from '../lib/dataService';
import { getTotalCredits, getGradeDistribution, getCreditBreakdown, getSubjectAreaPerformance } from '../data/sampleData';

export function Overview() {
  const [academicData, setAcademicData] = useState<{ semesters: any[], goals: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await fetchAcademicData();
        setAcademicData(data);
      } catch (error) {
        console.error("Error fetching academic data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const semesters = academicData?.semesters || [];

  const gpaChartData = useMemo(() => {
    if (!semesters || semesters.length === 0) return [];

    return [...semesters]
      .sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;

        if (numA !== numB) {
          return numA - numB;
        }
        return 0;
      })
      .map(sem => ({
        semester: sem.name,
        gpa: sem.gpa || 0,
        cgpa: sem.cgpa || 0,
      }));
  }, [semesters]);

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your academic records...</p>
      </div>
    );
  }

  const currentCGPA = semesters.length > 0 ? semesters[semesters.length - 1].cgpa : 0;
  const totalCredits = getTotalCredits(semesters);
  const creditsRemaining = 200 - totalCredits;
  const semestersCompleted = semesters.length;

  const highestSemester = semesters.length > 0
    ? semesters.reduce((max, sem) => sem.gpa > max.gpa ? sem : max, semesters[0])
    : { name: 'N/A', gpa: 0 };

  const gradeDistribution = getGradeDistribution(semesters);
  const mostCommonGrade = gradeDistribution.length > 0
    ? gradeDistribution.reduce((max, item) => item.count > max.count ? item : max, gradeDistribution[0])
    : { grade: 'N/A', count: 0 };

  const creditBreakdown = getCreditBreakdown(semesters);
  const subjectAreaPerformance = getSubjectAreaPerformance(semesters);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2" style={{ color: 'var(--text-primary)' }}>
          Academic Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your comprehensive academic performance dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current CGPA"
          value={currentCGPA.toFixed(2)}
          subtitle="Out of 10.0"
          icon={GraduationCap}
          variant="accent"
        />
        <StatCard
          title="Credits Completed"
          value={totalCredits}
          subtitle={`${creditsRemaining} remaining`}
          icon={BookOpen}
        />
        <StatCard
          title="Semesters Completed"
          value={semestersCompleted}
          subtitle="5 remaining"
          icon={TrendingUp}
        />
        <StatCard
          title="Overall Performance"
          value={currentCGPA >= 9 ? 'Excellent' : currentCGPA >= 8 ? 'Very Good' : 'Good'}
          subtitle={`Top ${currentCGPA >= 9 ? '10' : currentCGPA >= 8 ? '25' : '40'}%`}
          icon={Award}
          variant="success"
        />
      </div>

      <div>
        <h3 className="mb-4" style={{ color: 'var(--text-primary)' }}>
          Key Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Highest GPA Semester
                </p>
                <h4 style={{ color: 'var(--text-primary)' }}>
                  {highestSemester.name}
                </h4>
                <p className="text-xl mt-1" style={{ color: 'var(--accent)' }}>
                  {highestSemester.gpa.toFixed(2)} GPA
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg text-2xl"
                style={{ backgroundColor: 'var(--accent-2)', color: '#fff' }}
              >
                🏆
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Most Common Grade
                </p>
                <h4 style={{ color: 'var(--text-primary)' }}>
                  Grade {mostCommonGrade.grade}
                </h4>
                <p className="text-xl mt-1" style={{ color: 'var(--accent-2)' }}>
                  {mostCommonGrade.count} subjects
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--muted)',
        }}
      >
        <h4 className="mb-4" style={{ color: 'var(--text-primary)' }}>
          GPA & CGPA Trend
        </h4>
        <GPALineChart data={gpaChartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--muted)',
          }}
        >
          <h4 className="mb-4" style={{ color: 'var(--text-primary)' }}>
            Grade Distribution
          </h4>
          <GradeBarChart data={gradeDistribution} />
        </div>

        <div
          className="p-6 rounded-xl border"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--muted)',
          }}
        >
          <h4 className="mb-4" style={{ color: 'var(--text-primary)' }}>
            Credit Breakdown
          </h4>
          <CreditPieChart data={creditBreakdown} />
        </div>
      </div>

      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--muted)',
        }}
      >
        <h4 className="mb-4" style={{ color: 'var(--text-primary)' }}>
          Performance Insights by Subject Area
        </h4>
        <div className="space-y-3">
          {subjectAreaPerformance.map((area, index) => (
            <div key={area.area} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: index === 0 ? 'var(--success)' : index === subjectAreaPerformance.length - 1 ? 'var(--warning)' : 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  #{index + 1}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{area.area}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--text-primary)' }} className="font-semibold">
                  {area.average.toFixed(2)}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {index === 0 ? '✨ Strength' : index === subjectAreaPerformance.length - 1 ? '📈 Opportunity' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
