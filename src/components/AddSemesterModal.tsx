import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { gradeMapping, type Semester } from '../data/sampleData';
import { saveSemester } from '../lib/dataService';

interface SubjectInput {
  name: string;
  credits: string;
  grade: string | null; // null for planned semesters
  tag: string;
}

interface AddSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (semester: Semester) => void;
}

const TAGS = ['Core', 'BS', 'ES', 'PE', 'OE', 'Humanities', 'Lab'];
const GRADES = Object.keys(gradeMapping);
const TERMS = ['Odd', 'Even'] as const;

const makeDefaultSubject = (isPlanned: boolean): SubjectInput => ({
  name: '',
  credits: '3',
  grade: isPlanned ? null : 'O',
  tag: 'Core',
});

export function AddSemesterModal({ isOpen, onClose, onAdd }: AddSemesterModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [semesterName, setSemesterName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [term, setTerm] = useState<'Odd' | 'Even'>('Odd');
  const [status, setStatus] = useState<'planned' | 'completed' | null>(null);
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isPlanned = status === 'planned';

  const resetForm = () => {
    setStep(1);
    setSemesterName('');
    setYear(new Date().getFullYear().toString());
    setTerm('Odd');
    setStatus(null);
    setSubjects([]);
    setErrors({});
    setSaving(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!semesterName.trim()) errs.name = 'Semester name is required';
    if (!year || isNaN(Number(year)) || Number(year) < 2000) errs.year = 'Enter a valid year';
    if (!status) errs.status = 'Please select semester type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    subjects.forEach((s, i) => {
      if (!s.name.trim()) errs[`s${i}_name`] = 'Required';
      if (!s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) <= 0)
        errs[`s${i}_credits`] = 'Invalid';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStatusSelect = (s: 'planned' | 'completed') => {
    setStatus(s);
    setSubjects([makeDefaultSubject(s === 'planned')]);
    setErrors(p => { const n = { ...p }; delete n.status; return n; });
  };

  const addSubject = () =>
    setSubjects(prev => [...prev, makeDefaultSubject(isPlanned)]);

  const removeSubject = (idx: number) =>
    setSubjects(prev => prev.filter((_, i) => i !== idx));

  const updateSubject = (idx: number, field: keyof SubjectInput, value: string | null) => {
    setSubjects(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    setErrors(prev => { const n = { ...prev }; delete n[`s${idx}_${field}`]; return n; });
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!validateStep2() || !status) return;
    setSaving(true);
    try {
      const semId = `sem_${Date.now()}`;
      const subjectsForDb = subjects.map((s, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        name: s.name.trim(),
        credits: parseFloat(s.credits),
        grade: isPlanned ? null : s.grade,
        tag: s.tag,
      }));

      const saved = await saveSemester(
        { id: semId, name: semesterName.trim(), year: parseInt(year), term, status },
        subjectsForDb
      );

      onAdd(saved);
      handleClose();
    } catch (err) {
      console.error('Failed to save semester:', err);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const previewCredits = subjects.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Semester" size="lg">
      {/* Step dots */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
              style={{
                backgroundColor: step >= s ? 'var(--accent)' : 'var(--muted)',
                color: step >= s ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {s}
            </div>
            {s < 2 && (
              <div className="h-0.5 w-12 transition-colors"
                style={{ backgroundColor: step > s ? 'var(--accent)' : 'var(--muted)' }} />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {step === 1 ? 'Semester Details' : 'Add Subjects'}
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Name */}
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Semester Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Semester 3"
                value={semesterName}
                onChange={e => { setSemesterName(e.target.value); setErrors(p => { const n = { ...p }; delete n.name; return n; }); }}
                className="w-full px-4 py-2 rounded-lg border outline-none"
                style={{ backgroundColor: 'var(--bg)', borderColor: errors.name ? '#ef4444' : 'var(--muted)', color: 'var(--text-primary)' }}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Year + Term */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Year *</label>
                <input
                  type="number" placeholder="2024" value={year}
                  onChange={e => { setYear(e.target.value); setErrors(p => { const n = { ...p }; delete n.year; return n; }); }}
                  className="w-full px-4 py-2 rounded-lg border outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: errors.year ? '#ef4444' : 'var(--muted)', color: 'var(--text-primary)' }}
                />
                {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Term *</label>
                <select value={term} onChange={e => setTerm(e.target.value as 'Odd' | 'Even')}
                  className="w-full px-4 py-2 rounded-lg border outline-none"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--muted)', color: 'var(--text-primary)' }}>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Status picker — the key UX fork */}
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                What type of semester is this? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Completed */}
                <button
                  onClick={() => handleStatusSelect('completed')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: status === 'completed' ? 'var(--accent)' : 'var(--muted)',
                    backgroundColor: status === 'completed' ? 'var(--accent)10' : 'var(--bg)',
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: status === 'completed' ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Past Semester</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>I have all my grades</p>
                </button>

                {/* Planned */}
                <button
                  onClick={() => handleStatusSelect('planned')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: status === 'planned' ? 'var(--accent)' : 'var(--muted)',
                    backgroundColor: status === 'planned' ? 'var(--accent)10' : 'var(--bg)',
                  }}
                >
                  <Clock className="w-5 h-5 mb-2" style={{ color: status === 'planned' ? 'var(--accent)' : 'var(--text-secondary)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Current / Upcoming</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Grades not received yet</p>
                </button>
              </div>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
              Next: Add Subjects <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {subjects.length} subject(s) · {previewCredits} credits
              </span>
              {isPlanned
                ? <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--muted)', color: 'var(--text-secondary)' }}>⏳ Grades added later</span>
                : <span style={{ color: 'var(--accent)' }}>GPA calculated on save</span>
              }
            </div>

            {/* Subject rows */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {subjects.map((subject, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border space-y-2"
                  style={{ borderColor: 'var(--muted)', backgroundColor: 'var(--bg)' }}>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Subject {idx + 1}</span>
                    {subjects.length > 1 && (
                      <button onClick={() => removeSubject(idx)} className="text-red-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <input
                    type="text" placeholder="Subject name" value={subject.name}
                    onChange={e => updateSubject(idx, 'name', e.target.value)}
                    className="w-full px-3 py-1.5 rounded border text-sm outline-none"
                    style={{ backgroundColor: 'var(--card)', borderColor: errors[`s${idx}_name`] ? '#ef4444' : 'var(--muted)', color: 'var(--text-primary)' }}
                  />
                  {errors[`s${idx}_name`] && <p className="text-xs text-red-500">{errors[`s${idx}_name`]}</p>}

                  {/* Credits / Grade / Tag */}
                  <div className={`grid gap-2 ${isPlanned ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    <input
                      type="number" placeholder="Credits" value={subject.credits}
                      min="0.5" step="0.5"
                      onChange={e => updateSubject(idx, 'credits', e.target.value)}
                      className="w-full px-3 py-1.5 rounded border text-sm outline-none"
                      style={{ backgroundColor: 'var(--card)', borderColor: errors[`s${idx}_credits`] ? '#ef4444' : 'var(--muted)', color: 'var(--text-primary)' }}
                    />

                    {/* Grade — only shown for completed semesters */}
                    {!isPlanned && (
                      <select
                        value={subject.grade ?? 'O'}
                        onChange={e => updateSubject(idx, 'grade', e.target.value)}
                        className="px-3 py-1.5 rounded border text-sm outline-none"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--muted)', color: 'var(--text-primary)' }}>
                        {GRADES.map(g => <option key={g} value={g}>{g} ({gradeMapping[g]})</option>)}
                      </select>
                    )}

                    <select
                      value={subject.tag}
                      onChange={e => updateSubject(idx, 'tag', e.target.value)}
                      className="px-3 py-1.5 rounded border text-sm outline-none"
                      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--muted)', color: 'var(--text-primary)' }}>
                      {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>

            <button onClick={addSubject}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              <Plus className="w-4 h-4" /> Add Subject
            </button>

            {errors.submit && <p className="text-sm text-red-500 text-center">{errors.submit}</p>}

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border"
                style={{ borderColor: 'var(--muted)', color: 'var(--text-secondary)' }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={saving}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-opacity"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Semester'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}