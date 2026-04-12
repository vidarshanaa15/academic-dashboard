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
  return { tempId: `new_${Date.now()}_${Math.random()}`, name: '', credits: '3', grade: '', tag: 'Core' };
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
    deletedIds.size > 0 || newRows.length > 0 ||
    semester.subjects.some(s => gradeDraft[s.id] !== (s.grade ?? ''));

  const confirmSubjectToDelete = semester.subjects.find(s => s.id === confirmDeleteSubjectId);

  const addNewRow = () => setNewRows(p => [...p, makeNewRow()]);
  const removeNewRow = (id: string) => setNewRows(p => p.filter(r => r.tempId !== id));
  const updateNewRow = (id: string, field: keyof NewSubjectRow, val: string) =>
    setNewRows(p => p.map(r => r.tempId === id ? { ...r, [field]: val, [`${field}Error`]: undefined } : r));

  const isNewRowsValid = () =>
    newRows.every(r => r.name.trim() && r.credits && !isNaN(parseFloat(r.credits)) && parseFloat(r.credits) > 0);

  const showNewRowErrors = () =>
    setNewRows(p => p.map(r => ({
      ...r,
      nameError: r.name.trim() ? undefined : 'Required',
      creditsError: r.credits && !isNaN(parseFloat(r.credits)) && parseFloat(r.credits) > 0 ? undefined : 'Invalid',
    })));

  const handleConfirmDeleteSubject = () => {
    if (!confirmDeleteSubjectId) return;
    setDeletedIds(p => new Set([...p, confirmDeleteSubjectId]));
    setConfirmDeleteSubjectId(null);
  };

  const handleSave = async () => {
    if (!isNewRowsValid()) { showNewRowErrors(); return; }
    setSaving(true); setError('');
    try {
      await Promise.all([...deletedIds].map(id => deleteSubjectFromDb(id)));
      const gradeUpdates = semester.subjects
        .filter(s => !deletedIds.has(s.id) && gradeDraft[s.id] !== (s.grade ?? ''))
        .map(s => updateSubjectGrade(s.id, gradeDraft[s.id]));
      await Promise.all(gradeUpdates);
      if (newRows.length > 0) {
        const { error: insertError } = await supabase.from('subjects').insert(
          newRows.map((r, idx) => ({
            id: `sub_${Date.now()}_${idx}`, semester_id: semester.id,
            name: r.name.trim(), credits: parseFloat(r.credits),
            grade: r.grade || null, tag: r.tag,
          }))
        );
        if (insertError) throw insertError;
      }
      if (allGradesFilled && semester.status === 'planned')
        await updateSemesterStatus(semester.id, 'completed');
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

  /* ── subject delete confirmation portal ─────────────────── */
  const confirmationPortal = createPortal(
    <AnimatePresence>
      {confirmDeleteSubjectId && confirmSubjectToDelete && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            style={{ width: '100%', maxWidth: 380, padding: '1.5rem', background: 'rgba(15,10,40,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 18, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.875rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={17} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '0.9375rem' }}>Delete Subject</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>This cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.1rem' }}>
              Delete <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{confirmSubjectToDelete.name}</span>? This will also recompute your GPA.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDeleteSubjectId(null)} style={{ flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.2s ease' }}>Cancel</button>
              <button onClick={handleConfirmDeleteSubject} style={{ flex: 1, padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', boxShadow: '0 4px 14px -4px rgba(239,68,68,0.5)', transition: 'all 0.2s ease' }}>Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Edit — ${semester.name}`} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
              background: semester.status === 'completed' ? 'var(--success-muted)' : 'var(--warning-muted)',
              color: semester.status === 'completed' ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${semester.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              {semester.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
            </span>
            {semester.status === 'planned' && (
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fill all grades to mark complete
              </span>
            )}
          </div>

          {/* Subject table */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Subject', 'Credits', 'Tag', 'Grade', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Existing subjects */}
                <AnimatePresence>
                  {visibleSubjects.map((subject, i) => {
                    const currentGrade = gradeDraft[subject.id];
                    const changed = currentGrade !== (subject.grade ?? '');
                    return (
                      <motion.tr
                        key={subject.id}
                        initial={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{ borderTop: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                      >
                        <td style={{ padding: '11px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          <span>{subject.name}</span>
                          {changed && (
                            <span style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: 'rgba(124,58,237,0.15)', color: 'var(--accent)', border: '1px solid rgba(124,58,237,0.25)' }}>
                              edited
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '11px 12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{subject.credits}</td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(124,58,237,0.1)', color: 'var(--accent)', border: '1px solid rgba(124,58,237,0.2)' }}>
                            {subject.tag}
                          </span>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <select
                            value={currentGrade}
                            onChange={e => setGradeDraft(p => ({ ...p, [subject.id]: e.target.value }))}
                            style={{
                              fontSize: '0.8125rem', minWidth: '7.5rem',
                              borderColor: currentGrade === '' ? 'rgba(245,158,11,0.5)' : changed ? 'rgba(124,58,237,0.5)' : undefined,
                            }}
                          >
                            <option value="">— Pending —</option>
                            {GRADES.map(g => <option key={g} value={g}>{g} ({gradeMapping[g]})</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <button
                            onClick={() => setConfirmDeleteSubjectId(subject.id)}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }}
                            title="Delete subject"
                          >
                            <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {/* New subject rows */}
                <AnimatePresence>
                  {newRows.map(row => (
                    <motion.tr
                      key={row.tempId}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      style={{ borderTop: '1px solid rgba(124,58,237,0.25)', background: 'rgba(124,58,237,0.06)' }}
                    >
                      <td style={{ padding: '8px 10px' }}>
                        <input type="text" placeholder="Subject name" value={row.name} onChange={e => updateNewRow(row.tempId, 'name', e.target.value)}
                          style={{ fontSize: '0.8125rem', minWidth: '8rem', borderColor: row.nameError ? 'rgba(239,68,68,0.7)' : 'rgba(124,58,237,0.4)' }} />
                        {row.nameError && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 3 }}>{row.nameError}</p>}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input type="number" placeholder="Cr." value={row.credits} min="0.5" step="0.5" onChange={e => updateNewRow(row.tempId, 'credits', e.target.value)}
                          style={{ fontSize: '0.8125rem', width: 64, borderColor: row.creditsError ? 'rgba(239,68,68,0.7)' : 'rgba(124,58,237,0.4)' }} />
                        {row.creditsError && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 3 }}>{row.creditsError}</p>}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select value={row.tag} onChange={e => updateNewRow(row.tempId, 'tag', e.target.value)} style={{ fontSize: '0.8125rem', borderColor: 'rgba(124,58,237,0.4)' }}>
                          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select value={row.grade} onChange={e => updateNewRow(row.tempId, 'grade', e.target.value)} style={{ fontSize: '0.8125rem', minWidth: '7.5rem', borderColor: 'rgba(124,58,237,0.4)' }}>
                          <option value="">— Pending —</option>
                          {GRADES.map(g => <option key={g} value={g}>{g} ({gradeMapping[g]})</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <button onClick={() => removeNewRow(row.tempId)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }}>
                          <X size={14} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {visibleSubjects.length === 0 && newRows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      All subjects removed. Save to confirm deletions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add subject */}
          <button
            onClick={addNewRow}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            style={{ width: '100%', padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1.5px dashed rgba(124,58,237,0.35)', color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600, transition: 'background 0.2s ease' }}
          >
            <Plus size={14} /> Add Subject
          </button>

          {/* Auto-complete hint */}
          {allGradesFilled && (visibleSubjects.length > 0 || newRows.length > 0) && semester.status === 'planned' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--success-muted)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--success)' }}>
                All grades filled — semester will be marked Completed on save.
              </span>
            </motion.div>
          )}

          {/* Pending deletions notice */}
          {deletedIds.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--danger-muted)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>
                {deletedIds.size} subject{deletedIds.size > 1 ? 's' : ''} will be permanently deleted on save.
              </span>
            </motion.div>
          )}

          {error && <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}

          {/* Save button */}
          <motion.button
            whileHover={{ scale: saving || saved || !hasChanges ? 1 : 1.02 }}
            whileTap={{ scale: saving || saved || !hasChanges ? 1 : 0.98 }}
            onClick={handleSave}
            disabled={saving || saved || !hasChanges}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: !hasChanges ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              fontWeight: 600, fontSize: '0.9rem', color: '#fff',
              background: saved
                ? 'linear-gradient(135deg, var(--success), #059669)'
                : hasChanges
                  ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                  : 'rgba(255,255,255,0.06)',
              opacity: saving || !hasChanges ? 0.6 : 1,
              boxShadow: saved
                ? '0 6px 20px -4px rgba(16,185,129,0.5)'
                : hasChanges
                  ? '0 6px 20px -4px rgba(124,58,237,0.5)'
                  : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : saved
                ? <><CheckCircle2 size={15} /> Saved!</>
                : <><Save size={15} /> Save Changes</>
            }
          </motion.button>
        </div>
      </Modal>

      {confirmationPortal}
    </>
  );
}