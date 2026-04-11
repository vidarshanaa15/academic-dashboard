import { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { gradeMapping, type Semester } from '../data/sampleData';
import { saveSemester } from '../lib/dataService';

interface SubjectInput {
  name: string;
  credits: string;
  grade: string | null;
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
  name: '', credits: '3', grade: isPlanned ? null : 'O', tag: 'Core',
});

/* ── small helpers ───────────────────────────────────────────── */
function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 7 }}>
      {children}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 4 }}>{msg}</p>;
}

/* ── main component ──────────────────────────────────────────── */
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
    setStep(1); setSemesterName(''); setYear(new Date().getFullYear().toString());
    setTerm('Odd'); setStatus(null); setSubjects([]); setErrors({}); setSaving(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const clearErr = (key: string) =>
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!semesterName.trim()) e.name = 'Semester name is required';
    if (!year || isNaN(+year) || +year < 2000) e.year = 'Enter a valid year';
    if (!status) e.status = 'Please select a semester type';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    subjects.forEach((s, i) => {
      if (!s.name.trim()) e[`s${i}_name`] = 'Required';
      if (!s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) <= 0) e[`s${i}_credits`] = 'Invalid';
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleStatusSelect = (s: 'planned' | 'completed') => {
    setStatus(s);
    setSubjects([makeDefaultSubject(s === 'planned')]);
    clearErr('status');
  };

  const addSubject = () => setSubjects(p => [...p, makeDefaultSubject(isPlanned)]);
  const removeSubject = (i: number) => setSubjects(p => p.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, field: keyof SubjectInput, val: string | null) => {
    setSubjects(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    clearErr(`s${i}_${field}`);
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async () => {
    if (!validateStep2() || !status) return;
    setSaving(true);
    try {
      const semId = `sem_${Date.now()}`;
      const subs = subjects.map((s, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        name: s.name.trim(),
        credits: parseFloat(s.credits),
        grade: isPlanned ? null : s.grade,
        tag: s.tag,
      }));
      const saved = await saveSemester(
        { id: semId, name: semesterName.trim(), year: parseInt(year), term, status },
        subs
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

  const previewCredits = subjects.reduce((s, sub) => s + (parseFloat(sub.credits) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Semester" size="lg">

      {/* ── Step indicator ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        {([1, 2] as const).map(s => {
          const done = step > s;
          const active = step === s;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8125rem', fontWeight: 700,
                background: active
                  ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
                  : done
                    ? 'var(--success-muted)'
                    : 'rgba(255,255,255,0.07)',
                color: active ? '#fff' : done ? 'var(--success)' : 'var(--text-muted)',
                border: active ? 'none' : done ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: active ? '0 0 16px -4px rgba(124,58,237,0.6)' : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done ? '✓' : s}
              </div>
              {s < 2 && (
                <div style={{
                  height: 2, width: 40, borderRadius: 99,
                  background: step > s
                    ? 'linear-gradient(90deg, var(--accent), var(--accent-2))'
                    : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          );
        })}
        <span style={{ marginLeft: 4, fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {step === 1 ? 'Semester Details' : 'Add Subjects'}
        </span>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1 ─────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          >
            {/* Name */}
            <div>
              <FormLabel required>Semester Name</FormLabel>
              <input
                type="text" placeholder="e.g. Semester 3" value={semesterName}
                onChange={e => { setSemesterName(e.target.value); clearErr('name'); }}
                style={{ borderColor: errors.name ? 'rgba(239,68,68,0.7)' : undefined }}
              />
              <FieldError msg={errors.name} />
            </div>

            {/* Year + Term */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FormLabel required>Year</FormLabel>
                <input
                  type="number" placeholder="2024" value={year}
                  onChange={e => { setYear(e.target.value); clearErr('year'); }}
                  style={{ borderColor: errors.year ? 'rgba(239,68,68,0.7)' : undefined }}
                />
                <FieldError msg={errors.year} />
              </div>
              <div>
                <FormLabel>Term</FormLabel>
                <select value={term} onChange={e => setTerm(e.target.value as 'Odd' | 'Even')}>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Status picker */}
            <div>
              <FormLabel required>Semester Type</FormLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {([
                  { val: 'completed', icon: CheckCircle2, title: 'Past Semester', sub: 'I have all my grades', accentColor: 'var(--success)', accentBg: 'rgba(16,185,129,0.12)', accentBorder: 'rgba(16,185,129,0.35)' },
                  { val: 'planned', icon: Clock, title: 'Current / Upcoming', sub: 'Grades not received yet', accentColor: 'var(--accent)', accentBg: 'rgba(124,58,237,0.12)', accentBorder: 'rgba(124,58,237,0.35)' },
                ] as const).map(opt => {
                  const active = status === opt.val;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.val}
                      onClick={() => handleStatusSelect(opt.val)}
                      style={{
                        padding: '1rem', borderRadius: 14, textAlign: 'left',
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? opt.accentBg : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${active ? opt.accentBorder : 'rgba(255,255,255,0.1)'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, marginBottom: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? opt.accentBg : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${active ? opt.accentBorder : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        <Icon size={16} style={{ color: active ? opt.accentColor : 'var(--text-muted)' }} />
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: active ? opt.accentColor : 'var(--text-primary)', margin: '0 0 3px' }}>
                        {opt.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        {opt.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.status} />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, var(--accent), #5b21b6)',
                color: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
                boxShadow: '0 6px 20px -4px rgba(124,58,237,0.5)',
              }}
            >
              Next: Add Subjects <ChevronRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {/* ── STEP 2 ─────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Summary banner */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
              flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{subjects.length}</span> subject{subjects.length !== 1 ? 's' : ''}
                &nbsp;·&nbsp;
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{previewCredits}</span> credits
              </span>
              {isPlanned
                ? <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: 'var(--warning-muted)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.25)' }}>Grades added later</span>
                : <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)' }}>GPA calculated on save</span>
              }
            </div>

            {/* Subject rows */}
            <div
              className="custom-scrollbar"
              style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}
            >
              {subjects.map((subject, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="glass-inner"
                  style={{ padding: '0.9rem 1rem' }}
                >
                  {/* row header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)' }}>
                      Subject {idx + 1}
                    </span>
                    {subjects.length > 1 && (
                      <button
                        onClick={() => removeSubject(idx)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.09)')}
                        style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      >
                        <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                      </button>
                    )}
                  </div>

                  {/* name */}
                  <input
                    type="text" placeholder="Subject name" value={subject.name}
                    onChange={e => updateSubject(idx, 'name', e.target.value)}
                    style={{
                      width: '100%', marginBottom: 8, fontSize: '0.8125rem',
                      borderColor: errors[`s${idx}_name`] ? 'rgba(239,68,68,0.7)' : undefined,
                    }}
                  />
                  <FieldError msg={errors[`s${idx}_name`]} />

                  {/* credits / grade / tag */}
                  <div style={{ display: 'grid', gridTemplateColumns: isPlanned ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
                    <input
                      type="number" placeholder="Credits" value={subject.credits}
                      min="0.5" step="0.5"
                      onChange={e => updateSubject(idx, 'credits', e.target.value)}
                      style={{
                        fontSize: '0.8125rem',
                        borderColor: errors[`s${idx}_credits`] ? 'rgba(239,68,68,0.7)' : undefined,
                      }}
                    />

                    {!isPlanned && (
                      <select
                        value={subject.grade ?? 'O'}
                        onChange={e => updateSubject(idx, 'grade', e.target.value)}
                        style={{ fontSize: '0.8125rem' }}
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g} ({gradeMapping[g]})</option>)}
                      </select>
                    )}

                    <select
                      value={subject.tag}
                      onChange={e => updateSubject(idx, 'tag', e.target.value)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {errors[`s${idx}_credits`] && <FieldError msg={errors[`s${idx}_credits`]} />}
                </motion.div>
              ))}
            </div>

            {/* Add subject button */}
            <button
              onClick={addSubject}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'transparent', border: '1.5px dashed rgba(124,58,237,0.35)',
                color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600,
                transition: 'background 0.2s ease',
              }}
            >
              <Plus size={14} /> Add Subject
            </button>

            {errors.submit && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', textAlign: 'center' }}>{errors.submit}</p>
            )}

            {/* footer buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '11px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronLeft size={15} /> Back
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={saving}
                style={{
                  flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  background: saving
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, var(--accent), #5b21b6)',
                  color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                  opacity: saving ? 0.65 : 1,
                  boxShadow: saving ? 'none' : '0 6px 20px -4px rgba(124,58,237,0.5)',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                  : 'Save Semester'
                }
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}