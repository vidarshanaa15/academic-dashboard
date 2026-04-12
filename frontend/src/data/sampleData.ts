export interface Subject {
  id: string;
  name: string;
  credits: number;
  grade: string | null;
  tag: string;
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
  gpa: number | null;
  cgpa: number | null;
  year: number;
  term: 'Odd' | 'Even';
  status: 'planned' | 'completed';
}

export interface Goal {
  id: string;
  title: string;
  target_semester: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

// Grade mapping
export const gradeMapping: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
};

export const gradeLabels = ['O', 'A+', 'A', 'B+', 'B', 'C'];

// Helper functions
export function calculateGPA(subjects: Subject[]): number {
  const graded = subjects.filter(sub => sub.grade !== null);
  if (!graded.length) return 0;
  const totalPoints = graded.reduce((sum, sub) => {
    return sum + (sub.credits * (gradeMapping[sub.grade!] ?? 0));
  }, 0);
  const totalCredits = graded.reduce((sum, sub) => sum + sub.credits, 0);
  return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
}

export function calculateCGPA(semesters: Semester[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  semesters.forEach(sem => {
    // Only include completed semesters in CGPA
    if (sem.status !== 'completed') return;
    sem.subjects.forEach(sub => {
      if (!sub.grade) return;
      totalPoints += sub.credits * (gradeMapping[sub.grade] ?? 0);
      totalCredits += sub.credits;
    });
  });
  return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
}

export function getTotalCredits(semesters: Semester[]): number {
  return semesters.reduce((sum, sem) =>
    sum + sem.subjects.reduce((subSum, sub) => subSum + sub.credits, 0), 0
  );
}

export function getGradeDistribution(semesters: Semester[]) {
  const distribution: Record<string, number> = {
    'O': 0,
    'A+': 0,
    'A': 0,
    'B+': 0,
    'B': 0,
    'C': 0,
  };
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      if (sub.grade && distribution[sub.grade] !== undefined) {
        distribution[sub.grade]++;
      }
    });
  });
  return Object.entries(distribution).map(([grade, count]) => ({
    grade,
    count,
    gradePoint: gradeMapping[grade],
  }));
}

export function getCreditBreakdown(semesters: Semester[]) {
  const breakdown: Record<string, number> = {
    'Core': 0,
    'BS': 0,
    'ES': 0,
    'PE': 0,
    'OE': 0,
    'Humanities': 0,
    'Lab': 0,
  };
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      if (breakdown[sub.tag] !== undefined) {
        breakdown[sub.tag] += sub.credits;
      }
    });
  });
  return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
}

export function getSubjectAreaPerformance(semesters: Semester[]) {
  const areaMap: Record<string, { total: number; count: number }> = {};
  semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      if (!sub.grade) return;
      const area = sub.tag;
      if (!areaMap[area]) areaMap[area] = { total: 0, count: 0 };
      areaMap[area].total += (gradeMapping[sub.grade] ?? 0);
      areaMap[area].count++;
    });
  });
  return Object.entries(areaMap).map(([area, data]) => ({
    area,
    average: Number((data.total / data.count).toFixed(2)),
  })).sort((a, b) => b.average - a.average);
}