/// <reference types="vite/client" />
import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Trash2, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal';
import { gradeMapping, type Semester } from '../data/sampleData';
import { saveSemester } from '../lib/dataService';

interface UploadMarksheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (semester: Semester) => void;
}

interface ExtractedSubject {
    name: string;
    credits: string;
    grade: string;
    tag: string;
}

const TAGS = ['Core', 'BS', 'ES', 'PE', 'OE', 'Humanities', 'Lab'];
const GRADES = Object.keys(gradeMapping);
const TERMS = ['Odd', 'Even'] as const;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

type Stage = 'upload' | 'extracting' | 'review';

export function UploadMarksheetModal({ isOpen, onClose, onAdd }: UploadMarksheetModalProps) {
    const [stage, setStage] = useState<Stage>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [extractError, setExtractError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Review-stage editable fields
    const [semesterName, setSemesterName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [term, setTerm] = useState<'Odd' | 'Even'>('Odd');
    const [subjects, setSubjects] = useState<ExtractedSubject[]>([]);

    const reset = () => {
        setStage('upload'); setFile(null); setExtractError(null); setSaveError(null);
        setSaving(false); setSemesterName(''); setYear(new Date().getFullYear().toString());
        setTerm('Odd'); setSubjects([]);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleFileSelect = (f: File) => {
        if (f.type !== 'application/pdf') {
            setExtractError('Please upload a PDF file.');
            return;
        }
        setFile(f);
        setExtractError(null);
    };

    const handleExtract = async () => {
        if (!file) return;
        setStage('extracting');
        setExtractError(null);

        try {
            const formData = new FormData();
            formData.append('marksheet', file);

            const res = await fetch(`${BACKEND_URL}/extract-marksheet`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Extraction failed');
            }

            const extractedSubjects: ExtractedSubject[] = data.subjects.map((s: any) => ({
                name: s.name ?? '',
                credits: String(s.credits ?? ''),
                grade: s.grade ?? 'O',
                tag: TAGS.includes(s.tag) ? s.tag : 'Core',
            }));

            setSubjects(extractedSubjects);
            setSemesterName(data.semesterNumber ? `Semester ${data.semesterNumber}` : '');
            setStage('review');
        } catch (err: any) {
            console.error('Extraction error:', err);
            setExtractError(err.message || 'Something went wrong extracting your marksheet.');
            setStage('upload');
        }
    };

    const updateSubject = (i: number, field: keyof ExtractedSubject, val: string) => {
        setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    };

    const removeSubject = (i: number) => setSubjects(prev => prev.filter((_, idx) => idx !== i));

    const validateReview = () => {
        if (!semesterName.trim()) return 'Semester name is required';
        if (!year || isNaN(+year)) return 'Enter a valid year';
        if (subjects.length === 0) return 'At least one subject is required';
        for (const s of subjects) {
            if (!s.name.trim()) return 'Every subject needs a name';
            if (!s.credits || isNaN(parseFloat(s.credits)) || parseFloat(s.credits) <= 0) return 'Every subject needs valid credits';
        }
        return null;
    };

    const handleConfirmSave = async () => {
        const validationError = validateReview();
        if (validationError) {
            setSaveError(validationError);
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const semId = `sem_${Date.now()}`;
            const subs = subjects.map((s, idx) => ({
                id: `sub_${Date.now()}_${idx}`,
                name: s.name.trim(),
                credits: parseFloat(s.credits),
                grade: s.grade,
                tag: s.tag,
            }));
            const saved = await saveSemester(
                { id: semId, name: semesterName.trim(), year: parseInt(year), term, status: 'completed' },
                subs
            );
            onAdd(saved);
            handleClose();
        } catch (err) {
            console.error('Failed to save uploaded semester:', err);
            setSaveError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const previewCredits = subjects.reduce((s, sub) => s + (parseFloat(sub.credits) || 0), 0);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Marksheet" size="lg">
            <AnimatePresence mode="wait">

                {/* ── UPLOAD STAGE ─────────────────────────────── */}
                {stage === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
                    >
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Upload your semester marksheet PDF (with subject names, credits, and grades) and we'll extract everything automatically. You'll be able to review and edit before saving.
                        </p>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                            }}
                            style={{
                                border: `1.5px dashed ${file ? 'rgba(124,58,237,0.5)' : 'var(--glass-border)'}`,
                                borderRadius: 14, padding: '2rem 1.5rem', textAlign: 'center',
                                cursor: 'pointer', background: file ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <input
                                ref={fileInputRef} type="file" accept="application/pdf" hidden
                                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />
                            {file ? (
                                <>
                                    <FileText size={28} style={{ color: 'var(--accent)', marginBottom: 10 }} />
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{file.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {(file.size / 1024).toFixed(0)} KB · Click to change
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        Click to upload or drag and drop
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>PDF only</p>
                                </>
                            )}
                        </div>

                        {extractError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', margin: 0 }}>{extractError}</p>
                            </div>
                        )}

                        <motion.button
                            whileHover={{ scale: file ? 1.02 : 1 }} whileTap={{ scale: file ? 0.98 : 1 }}
                            onClick={handleExtract}
                            disabled={!file}
                            style={{
                                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                                cursor: file ? 'pointer' : 'not-allowed',
                                background: file ? 'linear-gradient(135deg, var(--accent), #5b21b6)' : 'rgba(255,255,255,0.06)',
                                color: file ? '#fff' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
                                boxShadow: file ? '0 6px 20px -4px rgba(124,58,237,0.5)' : 'none',
                            }}
                        >
                            Extract Subjects
                        </motion.button>
                    </motion.div>
                )}

                {/* ── EXTRACTING STAGE ─────────────────────────── */}
                {stage === 'extracting' && (
                    <motion.div
                        key="extracting"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '3rem 1rem' }}
                    >
                        <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            Reading your marksheet and extracting subjects…
                        </p>
                    </motion.div>
                )}

                {/* ── REVIEW STAGE ─────────────────────────────── */}
                {stage === 'review' && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                            <CheckCircle2 size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--success)', margin: 0 }}>
                                Extracted {subjects.length} subject{subjects.length !== 1 ? 's' : ''} — review before saving. Predicted tags may need adjusting.
                            </p>
                        </div>

                        {/* Semester meta */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Semester Name</label>
                                <input type="text" value={semesterName} onChange={e => setSemesterName(e.target.value)} placeholder="e.g. Semester 6" style={{ fontSize: '0.8125rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Year</label>
                                <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ fontSize: '0.8125rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Term</label>
                                <select value={term} onChange={e => setTerm(e.target.value as 'Odd' | 'Even')} style={{ fontSize: '0.8125rem' }}>
                                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Subject rows */}
                        <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
                            {subjects.map((subject, idx) => (
                                <div key={idx} className="glass-inner" style={{ padding: '0.9rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Subject {idx + 1}</span>
                                        <button
                                            onClick={() => removeSubject(idx)}
                                            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                                        </button>
                                    </div>

                                    <input
                                        type="text" value={subject.name}
                                        onChange={e => updateSubject(idx, 'name', e.target.value)}
                                        style={{ width: '100%', marginBottom: 8, fontSize: '0.8125rem' }}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                        <input
                                            type="number" value={subject.credits} min="0.5" step="0.5"
                                            onChange={e => updateSubject(idx, 'credits', e.target.value)}
                                            style={{ fontSize: '0.8125rem' }}
                                        />
                                        <select value={subject.grade} onChange={e => updateSubject(idx, 'grade', e.target.value)} style={{ fontSize: '0.8125rem' }}>
                                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <select value={subject.tag} onChange={e => updateSubject(idx, 'tag', e.target.value)} style={{ fontSize: '0.8125rem' }}>
                                            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{subjects.length}</span> subjects
                            &nbsp;·&nbsp;
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{previewCredits}</span> credits
                        </div>

                        {saveError && <FieldErrorText msg={saveError} />}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => { setStage('upload'); setFile(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}
                            >
                                <ChevronLeft size={15} /> Back
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmSave} disabled={saving}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                    background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent), #5b21b6)',
                                    color: '#fff', fontWeight: 600, fontSize: '0.9rem', opacity: saving ? 0.65 : 1,
                                    boxShadow: saving ? 'none' : '0 6px 20px -4px rgba(124,58,237,0.5)',
                                }}
                            >
                                {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Semester'}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Modal>
    );
}

function FieldErrorText({ msg }: { msg: string }) {
    return <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', textAlign: 'center' }}>{msg}</p>;
}