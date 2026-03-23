import { useState, useEffect } from 'react';
import { Target, Plus, Check, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '../components/Modal';
import { fetchAcademicData, toggleGoalStatus, deleteGoalFromDb, addGoalToDb } from '../lib/dataService';
import { getTotalCredits, type Goal, type Semester, gradeMapping } from '../data/sampleData';

export function Goals() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetGPA, setTargetGPA] = useState<string>('9.0');
  const [remainingCredits, setRemainingCredits] = useState<string>('40');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target_semester: 'Semester 7', priority: 'Medium' as 'High' | 'Medium' | 'Low' });

  useEffect(() => {
    async function loadData() {
      try {
        const { semesters, goals } = await fetchAcademicData();
        setSemesters(semesters);
        setGoals(goals);
      } catch (err) {
        console.error("Error loading goals:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCreditsCompleted = getTotalCredits(semesters);
  const totalPoints = semesters.reduce((sum, sem) => {
    const semPoints = sem.subjects?.reduce((subSum, sub) => {
      const pointValue = gradeMapping[sub.grade] || 0;
      return subSum + (sub.credits * pointValue);
    }, 0) || 0;
    return sum + semPoints;
  }, 0);

  // Calculate required average GPA
  const calculateRequiredGPA = () => {
    const target = parseFloat(targetGPA) || 0;
    const remaining = parseFloat(remainingCredits) || 0;
    const totalCredits = totalCreditsCompleted + remaining;
    if (remaining === 0) return 0;
    return (target * totalCredits - totalPoints) / remaining;
  };

  const requiredGPA = calculateRequiredGPA();
  const isAchievable = requiredGPA <= 10 && requiredGPA >= 0;
  const difficulty = requiredGPA > 9 ? 'high' : requiredGPA > 7 ? 'medium' : 'low';

  const toggleGoal = async (id: string, currentStatus: boolean) => {
    try {
      await toggleGoalStatus(id, !currentStatus);
      setGoals(goals.map(g => g.id === id ? { ...g, completed: !currentStatus } : g));
    } catch (err) { alert("Failed to update goal"); }
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await deleteGoalFromDb(id);
      setGoals(goals.filter(goal => goal.id !== id));
    } catch (err) { alert("Failed to delete goal"); }
  };

  const addGoal = async () => {
    if (!newGoal.title) return;

    try {
      // get current max goal id and increment it for new id
      const maxIdNumber = goals.reduce((max, goal) => {
        const num = parseInt(goal.id.replace(/\D/g, '')) || 0;
        return Math.max(max, num);
      }, 0);

      const nextId = `goal${maxIdNumber + 1}`;

      const goalObj: Goal = {
        id: nextId,
        title: newGoal.title,
        target_semester: newGoal.target_semester,
        priority: newGoal.priority,
        completed: false
      };

      // addGoalToDb is defined in dataService.ts
      const savedGoal = await addGoalToDb(goalObj);
      setGoals([...goals, savedGoal]);
      setNewGoal({ title: '', target_semester: 'Semester 7', priority: 'Medium' });
      setShowGoalModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add goal");
    }
  };

  if (loading) return (
    <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-accent" />
      <p style={{ color: 'var(--text-secondary)' }}>Syncing with cloud...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2" style={{ color: 'var(--text-primary)' }}>
            My Goals
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Set targets and track your academic aspirations
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </motion.button>
      </div>

      {/* Target GPA Calculator */}
      <div
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--muted)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 style={{ color: 'var(--text-primary)' }}>
            Target CGPA Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Target Cumulative GPA (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={targetGPA}
              onChange={(e) => setTargetGPA(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Remaining Credits
            </label>
            <input
              type="number"
              min="0"
              value={remainingCredits}
              onChange={(e) => setRemainingCredits(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Result Card */}
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: isAchievable
              ? difficulty === 'high' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
          }}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isAchievable ? 'bg-opacity-20' : ''}`}>
              {isAchievable ? (
                <Check className="w-6 h-6" style={{ color: difficulty === 'high' ? 'var(--warning)' : 'var(--success)' }} />
              ) : (
                <AlertCircle className="w-6 h-6" style={{ color: 'var(--danger)' }} />
              )}
            </div>
            <div className="flex-1">
              <h4 style={{ color: 'var(--text-primary)' }} className="mb-2">
                {isAchievable ? 'Target is Achievable!' : 'Target Not Achievable'}
              </h4>
              <p style={{ color: 'var(--text-primary)' }} className="text-xl mb-2">
                Required Average GPA: <strong>{requiredGPA.toFixed(2)}</strong>
              </p>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                {isAchievable
                  ? `You need to maintain an average GPA of ${requiredGPA.toFixed(2)} across the remaining ${remainingCredits} credits to reach your target of ${targetGPA}.`
                  : 'The target CGPA cannot be achieved with the remaining credits. Consider adjusting your target or retaking some courses.'}
              </p>
              {isAchievable && (
                <div
                  className="inline-block px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: difficulty === 'high' ? 'var(--warning)' : difficulty === 'medium' ? 'var(--accent)' : 'var(--success)',
                    color: '#fff',
                  }}
                >
                  {difficulty === 'high' ? '⚠️ Challenging' : difficulty === 'medium' ? '📊 Moderate' : '✅ Easily Achievable'}
                </div>
              )}
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--muted)' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              <strong>Formula:</strong> Required Avg = (Target CGPA × Total Credits - Current Points) / Remaining Credits
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ({targetGPA} × {totalCreditsCompleted + parseFloat(remainingCredits)} - {totalPoints.toFixed(2)}) / {remainingCredits} = {requiredGPA.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div>
        <h3 className="mb-4" style={{ color: 'var(--text-primary)' }}>
          Your Goals
        </h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--muted)',
                opacity: goal.completed ? 0.6 : 1,
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: goal.completed ? 'var(--success)' : 'var(--muted)',
                    backgroundColor: goal.completed ? 'var(--success)' : 'transparent',
                  }}
                >
                  {goal.completed && <Check className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1">
                  <h5
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: goal.completed ? 'line-through' : 'none',
                    }}
                  >
                    {goal.title}
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Target: {goal.target_semester}
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: goal.priority === 'High' ? 'var(--danger)' : goal.priority === 'Medium' ? 'var(--warning)' : 'var(--muted)',
                    color: '#fff',
                  }}
                >
                  {goal.priority}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <Edit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Add New Goal"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Goal Title
            </label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="e.g., Achieve 9.0 GPA in next semester"
              className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Target Semester
            </label>
            <select
              value={newGoal.target_semester}
              onChange={(e) => setNewGoal({ ...newGoal, target_semester: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
              }}
            >
              <option>Semester 7</option>
              <option>Semester 8</option>
              <option>End of Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Priority
            </label>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setNewGoal({ ...newGoal, priority })}
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: newGoal.priority === priority ? 'var(--accent)' : 'var(--bg)',
                    borderColor: newGoal.priority === priority ? 'var(--accent)' : 'var(--muted)',
                    color: newGoal.priority === priority ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowGoalModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={addGoal}
              disabled={!newGoal.title}
              className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
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
