import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Save, CheckCircle2, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { gradeMapping, type Semester } from '../data/sampleData';
import {
  updateSubjectGrade,
  updateSemesterStatus,
  refetchSemester,
  deleteSubjectFromDb,
} from '../lib/dataService';
import { supabase } from '../lib/supabase';

interface EditSemesterModalProps {
  semester: Semester;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Semester) => void;
}

interface NewSubjectRow {
  tempId: string;
  name: string;
  credits: string;
  grade: string;
  tag: string;
  nameError?: string;
  creditsError?: string;
}

const GRADES = Object.keys(gradeMapping);
const TAGS = ['Core', 'BS', 'ES', 'PE', 'OE', 'Humanities', 'Lab'];

function makeNewRow(): NewSubjectRow {
  return {
    tempId: `new_${Date.now()}_${Math.random()}`,
    name: '',
    credits: '3',
    grade: '',
    tag: 'Core',
  };
}

export function EditSemesterModal({ semester, isOpen, onClose, onUpdated }: EditSemesterModalProps) {
  const [gradeDraft, setGradeDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(semester.subjects.map(s => [s.id, s.grade ?? '']))
  );
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteSubjectId, setConfirmDeleteSubjectId] = useState<string | null>(null);
  const [newRows, setNewRows] = useState<NewSubjectRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const visibleSubjects = semester.subjects.filter(s => !deletedIds.has(s.id));
  const allGradesFilled =
    visibleSubjects.every(s => gradeDraft[s.id] !== '') &&
    newRows.every(r => r.grade !== '');
  const hasChanges =
    deletedIds.size > 0 ||
    newRows.length > 0 ||
    semester.subjects.some(s => gradeDraft[s.id] !== (s.grade ?? ''));

  const confirmSubjectToDelete = semester.subjects.find(s => s.id === confirmDeleteSubjectId);

  // ── New row helpers ──
  const addNewRow = () => setNewRows(prev => [...prev, makeNewRow()]);

  const removeNewRow = (tempId: string) =>
    setNewRows(prev => prev.filter(r => r.tempId !== tempId));

  const updateNewRow = (tempId: string, field: keyof NewSubjectRow, value: string) => {
    setNewRows(prev => prev.map(r =>
      r.tempId === tempId
        ? { ...r, [field]: value, [`${field}Error`]: undefined }
        : r
    ));
  };

  // Pure check — no state side effects, safe to call synchronously before any await
  const isNewRowsValid = (): boolean => {
    return newRows.every(r =>
      r.name.trim() !== '' &&
      r.credits !== '' &&
      !isNaN(parseFloat(r.credits)) &&
      parseFloat(r.credits) > 0
    );
  };

  // Only called to paint error UI — never relied on for control flow
  const showNewRowErrors = () => {
    setNewRows(prev => prev.map(r => ({
      ...r,
      nameError: r.name.trim() ? undefined : 'Required',
      creditsError:
        r.credits && !isNaN(parseFloat(r.credits)) && parseFloat(r.credits) > 0
          ? undefined
          : 'Invalid',
    })));
  };

  // ── Existing subject delete ──
  const handleConfirmDeleteSubject = () => {
    if (!confirmDeleteSubjectId) return;
    setDeletedIds(prev => new Set([...prev, confirmDeleteSubjectId]));
    setConfirmDeleteSubjectId(null);
  };

  // ── Save ──
  const handleSave = async () => {
    // isNewRowsValid is a pure boolean check with zero state mutations,
    // so React batching cannot interfere — return fires before setSaving
    if (!isNewRowsValid()) {
      showNewRowErrors();
      return;
    }

    setSaving(true);
    setError('');
    try {
      // 1. Delete removed subjects
      await Promise.all([...deletedIds].map(id => deleteSubjectFromDb(id)));

      // 2. Update changed grades on existing subjects
      const gradeUpdates = semester.subjects
        .filter(s => !deletedIds.has(s.id) && gradeDraft[s.id] !== (s.grade ?? ''))
        .map(s => updateSubjectGrade(s.id, gradeDraft[s.id]));
      await Promise.all(gradeUpdates);

      // 3. Insert new subjects
      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from('subjects').insert(
          newRows.map((r, idx) => ({
            id: `sub_${Date.now()}_${idx}`,
            semester_id: semester.id,
            name: r.name.trim(),
            credits: parseFloat(r.credits),
            grade: r.grade || null,
            tag: r.tag,
          }))
        );
        if (insertError) throw insertError;
      }

      // 4. Auto-complete if all grades filled
      if (allGradesFilled && semester.status === 'planned') {
        await updateSemesterStatus(semester.id, 'completed');
      }

      // 5. Re-fetch with trigger-computed GPA/CGPA
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

  // ── Subject delete confirmation portal ──
  const confirmationPortal = createPortal(
    <AnimatePresence>
      {confirmDeleteSubjectId && confirmSubjectToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="p-6 rounded-xl w-full max-w-sm space-y-4"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#ef444420' }}>
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Delete Subject</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {confirmSubjectToDelete.name}
              </span>
              ? This will also recompute your GPA for this semester.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteSubjectId(null)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--muted)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSubject}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Edit — ${semester.name}`}
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
                  <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {/* ── Existing subjects ── */}
                <AnimatePresence>
                  {visibleSubjects.map(subject => {
                    const currentGrade = gradeDraft[subject.id];
                    const changed = currentGrade !== (subject.grade ?? '');
                    return (
                      <motion.tr
                        key={subject.id}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="border-t"
                        style={{ borderColor: 'var(--muted)' }}
                      >
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {subject.name}
                          {changed && (
                            <span
                              className="ml-2 text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--accent)20', color: 'var(--accent)' }}
                            >
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
                            onChange={e =>
                              setGradeDraft(prev => ({ ...prev, [subject.id]: e.target.value }))
                            }
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
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setConfirmDeleteSubjectId(subject.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                            title="Delete subject"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {/* ── New subject rows ── */}
                <AnimatePresence>
                  {newRows.map(row => (
                    <motion.tr
                      key={row.tempId}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="border-t"
                      style={{ borderColor: 'var(--accent)', backgroundColor: 'var(--accent)08' }}
                    >
                      {/* Name */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Subject name"
                          value={row.name}
                          onChange={e => updateNewRow(row.tempId, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border text-sm outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            borderColor: row.nameError ? '#ef4444' : 'var(--accent)',
                            color: 'var(--text-primary)',
                            minWidth: '8rem',
                          }}
                        />
                        {row.nameError && (
                          <p className="text-xs text-red-500 mt-0.5">{row.nameError}</p>
                        )}
                      </td>

                      {/* Credits */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          placeholder="Cr."
                          value={row.credits}
                          min="0.5"
                          step="0.5"
                          onChange={e => updateNewRow(row.tempId, 'credits', e.target.value)}
                          className="w-16 px-2 py-1.5 rounded border text-sm outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            borderColor: row.creditsError ? '#ef4444' : 'var(--accent)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {row.creditsError && (
                          <p className="text-xs text-red-500 mt-0.5">{row.creditsError}</p>
                        )}
                      </td>

                      {/* Tag */}
                      <td className="px-3 py-2">
                        <select
                          value={row.tag}
                          onChange={e => updateNewRow(row.tempId, 'tag', e.target.value)}
                          className="px-2 py-1.5 rounded border text-sm outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--accent)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-2">
                        <select
                          value={row.grade}
                          onChange={e => updateNewRow(row.tempId, 'grade', e.target.value)}
                          className="px-2 py-1.5 rounded border text-sm outline-none"
                          style={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--accent)',
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

                      {/* Remove new row */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeNewRow(row.tempId)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {visibleSubjects.length === 0 && newRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm"
                      style={{ color: 'var(--text-secondary)' }}>
                      All subjects removed. Save to confirm deletions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add subject button */}
          <button
            onClick={addNewRow}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>

          {/* Auto-complete hint */}
          {allGradesFilled && (visibleSubjects.length > 0 || newRows.length > 0) && semester.status === 'planned' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#22c55e15', color: '#22c55e' }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              All grades filled — semester will be marked as Completed on save.
            </motion.div>
          )}

          {/* Pending deletions notice */}
          {deletedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#ef444415', color: '#ef4444' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {deletedIds.size} subject{deletedIds.size > 1 ? 's' : ''} will be permanently deleted on save.
            </motion.div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {/* Save */}
          <motion.button
            whileHover={{ scale: saving || saved ? 1 : 1.02 }}
            whileTap={{ scale: saving || saved ? 1 : 0.98 }}
            onClick={handleSave}
            disabled={saving || saved || !hasChanges}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: saved ? '#22c55e' : 'var(--accent)',
              color: '#fff',
              opacity: saving || !hasChanges ? 0.6 : 1,
              cursor: !hasChanges ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : saved
                ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                : <><Save className="w-4 h-4" /> Save Changes</>
            }
          </motion.button>
        </div>
      </Modal>

      {confirmationPortal}
    </>
  );
}