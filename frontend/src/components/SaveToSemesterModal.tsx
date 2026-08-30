import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { saveSemester } from '../lib/dataService';
import { type Semester } from '../data/sampleData';

interface CalculatorSubject {
    id: string;
    name: string;
    credits: number;
    grade: string;
    gradePoint: number;
}

interface SaveToSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: CalculatorSubject[];
    onSaved: (semester: Semester) => void;
}

const TAGS = ['Core', 'BS', 'ES', 'PE', 'OE', 'Humanities', 'Lab'];
const TERMS = ['Odd', 'Even'] as const;

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

export function SaveToSemesterModal({ isOpen, onClose, subjects, onSaved }: SaveToSemesterModalProps) {
    const [semesterName, setSemesterName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [term, setTerm] = useState<'Odd' | 'Even'>('Odd');
    const [tags, setTags] = useState<Record<string, string>>(() =>
        Object.fromEntries(subjects.map(s => [s.id, 'Core']))
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setSemesterName('');
        setYear(new Date().getFullYear().toString());
        setTerm('Odd');
        setTags(Object.fromEntries(subjects.map(s => [s.id, 'Core'])));
        setErrors({});
        setSaving(false);
    };

    const handleClose = () => { resetForm(); onClose(); };

    const clearErr = (key: string) =>
        setErrors(p => { const n = { ...p }; delete n[key]; return n; });

    const updateTag = (id: string, tag: string) =>
        setTags(p => ({ ...p, [id]: tag }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!semesterName.trim()) e.name = 'Semester name is required';
        if (!year || isNaN(+year) || +year < 2000) e.year = 'Enter a valid year';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const totalCredits = subjects.reduce((s, sub) => s + sub.credits, 0);

    const handleSubmit = async () => {
        if (!validate() || subjects.length === 0) return;
        setSaving(true);
        try {
            const semId = `sem_${Date.now()}`;
            const subs = subjects.map((s, idx) => ({
                id: `sub_${Date.now()}_${idx}`,
                name: s.name.trim() || `Subject ${idx + 1}`,
                credits: s.credits,
                grade: s.grade,
                tag: tags[s.id] || 'Core',
            }));
            const saved = await saveSemester(
                { id: semId, name: semesterName.trim(), year: parseInt(year), term, status: 'completed' },
                subs
            );
            onSaved(saved);
            handleClose();
        } catch (err) {
            console.error('Failed to save semester:', err);
            setErrors({ submit: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Save to Semester" size="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

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
                            onWheel={e => e.currentTarget.blur()}
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

                {/* Summary banner */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    flexWrap: 'wrap', gap: 8,
                }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{subjects.length}</span> subject{subjects.length !== 1 ? 's' : ''}
                        &nbsp;·&nbsp;
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalCredits}</span> credits
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)' }}>Grades carried over as-is</span>
                </div>

                {/* Subjects — grades/credits read-only, only tag is editable */}
                <div>
                    <FormLabel>Assign a course type to each subject</FormLabel>
                    <div
                        className="custom-scrollbar"
                        style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}
                    >
                        {subjects.map((s, idx) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="glass-inner"
                                style={{
                                    padding: '0.65rem 0.85rem', display: 'grid',
                                    gridTemplateColumns: '1fr 60px 50px 120px', gap: 10, alignItems: 'center',
                                }}
                            >
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {s.name || `Subject ${idx + 1}`}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.credits} cr</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{s.grade}</span>
                                <select
                                    value={tags[s.id] || 'Core'}
                                    onChange={e => updateTag(s.id, e.target.value)}
                                    style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                                >
                                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {errors.submit && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', textAlign: 'center' }}>{errors.submit}</p>
                )}

                {/* footer buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={handleClose}
                        style={{
                            flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Cancel
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit} disabled={saving || subjects.length === 0}
                        style={{
                            flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            background: saving
                                ? 'var(--glass-bg)'
                                : 'linear-gradient(135deg, var(--accent), #5b21b6)',
                            color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                            opacity: saving ? 0.65 : 1,
                            boxShadow: saving ? 'none' : '0 6px 20px -4px var(--accent-glow)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {saving
                            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                            : 'Save Semester'
                        }
                    </motion.button>
                </div>
            </div>
        </Modal>
    );
}