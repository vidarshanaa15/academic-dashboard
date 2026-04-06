import { useState } from 'react';
import { Plus, Trash2, Calculator as CalcIcon } from 'lucide-react';
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

export function Calculator() {
  const [subjects, setSubjects] = useState<CalculatorSubject[]>([
    { id: '1', name: 'Sample Subject 1', credits: 4, grade: 'A+', gradePoint: 9 },
    { id: '2', name: 'Sample Subject 2', credits: 3, grade: 'O', gradePoint: 10 },
  ]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [calculatedGPA, setCalculatedGPA] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [personalTarget, setPersonalTarget] = useState(8.5);

  const addSubject = () => {
    if (newSubjectName.trim()) {
      const newSubject: CalculatorSubject = {
        id: Date.now().toString(),
        name: newSubjectName,
        credits: 3,
        grade: 'A',
        gradePoint: 8,
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
    }
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(sub => sub.id !== id));
  };

  const updateSubject = (id: string, field: keyof CalculatorSubject, value: any) => {
    setSubjects(subjects.map(sub => {
      if (sub.id === id) {
        if (field === 'grade') {
          return { ...sub, grade: value, gradePoint: gradeMapping[value] };
        }
        return { ...sub, [field]: value };
      }
      return sub;
    }));
  };

  const calculateGPA = () => {
    if (subjects.length === 0) return;

    const totalPoints = subjects.reduce((sum, sub) => sum + (sub.credits * sub.gradePoint), 0);
    const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    setCalculatedGPA(gpa);

    // confetti!!! if GPA >= target
    if (gpa >= personalTarget) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const currentGPA = () => {
    if (subjects.length === 0) return 0;
    const totalPoints = subjects.reduce((sum, sub) => sum + (sub.credits * sub.gradePoint), 0);
    const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-2" style={{ color: 'var(--text-primary)' }}>
          GPA Calculator
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Calculate your GPA by adding subjects with credits and grades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <h4 className="mb-4" style={{ color: 'var(--text-primary)' }}>
              Add Subjects
            </h4>
            <div className="flex gap-3">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                placeholder="Enter subject name..."
                className="flex-1 px-4 py-2 rounded-lg border outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--muted)',
                  color: 'var(--text-primary)',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addSubject}
                disabled={!newSubjectName.trim()}
                className="px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                }}
              >
                <Plus className="w-5 h-5" />
                Add
              </motion.button>
            </div>
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 style={{ color: 'var(--text-primary)' }}>
                Subjects ({subjects.length})
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total Credits: {subjects.reduce((sum, sub) => sum + sub.credits, 0)}
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--muted)',
                    }}
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--muted)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={subject.credits}
                          onChange={(e) => updateSubject(subject.id, 'credits', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--muted)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>

                      <div className="col-span-2">
                        <select
                          value={subject.grade}
                          onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderColor: 'var(--muted)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {gradeLabels.map(grade => (
                            <option key={grade} value={grade}>
                              {grade} ({gradeMapping[grade]})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 text-center">
                        <span
                          className="px-3 py-2 rounded-lg text-sm inline-block"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: '#fff',
                          }}
                        >
                          {subject.gradePoint}
                        </span>
                      </div>

                      <div className="col-span-1">
                        <button
                          onClick={() => removeSubject(subject.id)}
                          className="p-2 rounded-lg transition-colors w-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--surface)' }}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <input
                        type="range"
                        min="5"
                        max="10"
                        step="1"
                        value={subject.gradePoint}
                        onChange={(e) => {
                          const point = parseInt(e.target.value);
                          const grade = Object.keys(gradeMapping).find(k => gradeMapping[k] === point) || 'C';
                          updateSubject(subject.id, 'grade', grade);
                        }}
                        className="w-full"
                        style={{
                          accentColor: 'var(--accent)',
                        }}
                      />
                      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>C (5)</span>
                        <span>B (6)</span>
                        <span>B+ (7)</span>
                        <span>A (8)</span>
                        <span>A+ (9)</span>
                        <span>O (10)</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {subjects.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                  <p>No subjects added yet. Add your first subject above!</p>
                </div>
              )}
            </div>
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
              Formula & Sample Calculation
            </h5>
            <div
              className="p-4 rounded-lg mb-3"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <code className="text-sm" style={{ color: 'var(--accent)' }}>
                GPA = Σ(Credits × Grade Points) / Σ(Credits)
              </code>
            </div>
            {subjects.length > 0 && (
              <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  Total Points: {subjects.reduce((sum, sub) => sum + (sub.credits * sub.gradePoint), 0).toFixed(2)}
                </p>
                <p>
                  Total Credits: {subjects.reduce((sum, sub) => sum + sub.credits, 0)}
                </p>
                <p>
                  Current GPA: <strong style={{ color: 'var(--accent)' }}>{currentGPA().toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="p-6 rounded-xl border flex flex-col items-center"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <h4 className="mb-6" style={{ color: 'var(--text-primary)' }}>
              Calculated GPA
            </h4>

            <CircularProgress
              value={calculatedGPA || currentGPA()}
              max={10}
              size={220}
              strokeWidth={20}
              animated={true}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={calculateGPA}
              disabled={subjects.length === 0}
              className="mt-6 px-8 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 w-full justify-center"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
              }}
            >
              <CalcIcon className="w-5 h-5" />
              Calculate GPA
            </motion.button>
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <h5 className="mb-4" style={{ color: 'var(--text-primary)' }}>
              Personal Target
            </h5>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={personalTarget}
                onChange={(e) => setPersonalTarget(parseFloat(e.target.value) || 0)}
                className="flex-1 px-4 py-2 rounded-lg border outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--muted)',
                  color: 'var(--text-primary)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>/ 10</span>
            </div>
            <div
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: currentGPA() >= personalTarget
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {currentGPA() >= personalTarget
                  ? '🎉 Target Achieved!'
                  : `${(personalTarget - currentGPA()).toFixed(2)} points to go`}
              </p>
            </div>
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
          >
            <h5 className="mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Actions
            </h5>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2 rounded-lg border text-sm transition-colors text-left"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--muted)',
                  color: 'var(--text-primary)',
                }}
              >
                💾 Save to Semester
              </button>
              <button
                className="w-full px-4 py-2 rounded-lg border text-sm transition-colors text-left"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--muted)',
                  color: 'var(--text-primary)',
                }}
                onClick={() => setSubjects([])}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5 }}
              className="text-8xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}