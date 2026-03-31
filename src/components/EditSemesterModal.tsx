import { useState } from 'react';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { gradeMapping, type Semester, type Subject } from '../data/sampleData';
import { updateSubjectGrade, updateSemesterStatus, refetchSemester } from '../lib/dataService';

interface EditSemesterModalProps {
  semester: Semester;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Semester) => void;
}

const GRADES = Object.keys(gradeMapping);

export function EditSemesterModal({ semester, isOpen, onClose, onUpdated }: EditSemesterModalProps) {
  // Local draft of grades — keyed by subject id
  const [gradeDraft, setGradeDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(semester.subjects.map(s => [s.id, s.grade ?? '']))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Whether every subject now has a grade filled in
  const allGradesFilled = semester.subjects.every(s => gradeDraft[s.id] !== '');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // 1. Update each subject grade that changed
      const updates = semester.subjects
        .filter(s => gradeDraft[s.id] !== (s.grade ?? ''))
        .map(s =>
          updateSubjectGrade(s.id, gradeDraft[s.id])
        );
      await Promise.all(updates);

      // 2. If all grades are now filled, mark semester as completed
      if (allGradesFilled && semester.status === 'planned') {
        await updateSemesterStatus(semester.id, 'completed');
      }

      // 3. Re-fetch to get trigger-computed GPA/CGPA
      const updated = await refetchSemester(semester.id);
      onUpdated(updated);

      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch (err) {
      console.error(err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Grades — ${semester.name}`}
      size="lg"
    >
      <div className="space-y-4">

        {/* Status badge */}
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: semester.status === 'completed' ? '#22c55e20' : '#f59e0b20',
              color: semester.status === 'completed' ? '#22c55e' : '#f59e0b',
            }}
          >
            {semester.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
          </span>
          {semester.status === 'planned' && (
            <span className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>
              Fill all grades to mark complete
            </span>
          )}
        </div>

        {/* Subject table */}
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--muted)' }}>
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg)' }}>
              <tr className="text-left text-sm">
                <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Subject</th>
                <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Tag</th>
                <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {semester.subjects.map((subject, idx) => {
                const currentGrade = gradeDraft[subject.id];
                const changed = currentGrade !== (subject.grade ?? '');

                return (
                  <tr key={subject.id} className="border-t" style={{ borderColor: 'var(--muted)' }}>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {subject.name}
                      {changed && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--accent)20', color: 'var(--accent)' }}>
                          edited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {subject.credits}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--text-primary)' }}>
                        {subject.tag}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={currentGrade}
                        onChange={e => setGradeDraft(prev => ({ ...prev, [subject.id]: e.target.value }))}
                        className="px-3 py-1.5 rounded border text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderColor: currentGrade === '' ? '#f59e0b' : changed ? 'var(--accent)' : 'var(--muted)',
                          color: 'var(--text-primary)',
                          minWidth: '7rem',
                        }}
                      >
                        <option value="">— Pending —</option>
                        {GRADES.map(g => (
                          <option key={g} value={g}>{g} ({gradeMapping[g]})</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Auto-complete hint */}
        {allGradesFilled && semester.status === 'planned' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg text-sm"
            style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            All grades filled — semester will be marked as Completed on save.
          </motion.div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Save */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium"
          style={{ backgroundColor: saved ? '#22c55e' : 'var(--accent)', color: '#fff', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </div>
    </Modal>
  );
}