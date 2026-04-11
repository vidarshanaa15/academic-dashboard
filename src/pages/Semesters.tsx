import { useState, useEffect, useRef } from 'react';
import { Plus, Download, ChevronRight, Edit2, Loader2, Clock, Trash2, AlertTriangle, Search, BookOpen, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/Modal';
import { CreditPieChart } from '../components/CreditPieChart';
import { GradePieChart } from '../components/GradePieChart';
import { AddSemesterModal } from '../components/AddSemesterModal';
import { EditSemesterModal } from '../components/EditSemesterModal';
import { type Semester, gradeMapping } from '../data/sampleData';
import { EmptyState } from '../components/EmptyState';
import { fetchAcademicData, deleteSemesterFromDb } from '../lib/dataService';
import { SemesterPDFPreview } from '../components/SemesterPDFPreview';
import { exportSemesterPDF } from '../lib/exportSemesterPDF';

/* ── grade color maps (charts + badges only) ─────────────────── */
const GRADE_COLORS: Record<string, string> = {
  O: 'var(--chart-o)', 'A+': 'var(--chart-ap)', A: 'var(--chart-a)',
  'B+': 'var(--chart-bp)', B: 'var(--chart-b)', C: 'var(--chart-c)',
};
const GRADE_BG: Record<string, string> = {
  O: 'var(--grade-o-bg)', 'A+': 'var(--grade-ap-bg)', A: 'var(--grade-a-bg)',
  'B+': 'var(--grade-bp-bg)', B: 'var(--grade-b-bg)', C: 'var(--grade-c-bg)',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
      <div style={{ width: 3, height: 16, borderRadius: 99, background: 'linear-gradient(180deg, var(--accent), var(--accent-2))' }} />
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{children}</h3>
    </div>
  );
}

export function Semesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [confirmDeleteSemester, setConfirmDeleteSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const [pdfSemester, setPdfSemester] = useState<Semester | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAcademicData();
        setSemesters(data.semesters);
      } catch (err) {
        console.error('Error loading semesters:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddSemester = (s: Semester) => setSemesters(prev => [...prev, s]);

  const handleSemesterUpdated = async (updated: Semester) => {
    try {
      const data = await fetchAcademicData();
      setSemesters(data.semesters);
      if (selectedSemester?.id === updated.id) {
        const refreshed = data.semesters.find(s => s.id === updated.id);
        if (refreshed) setSelectedSemester(refreshed);
      }
    } catch {
      setSemesters(prev => prev.map(s => s.id === updated.id ? updated : s));
    }
  };

  const handleDeleteSemester = async () => {
    if (!confirmDeleteSemester) return;
    setDeletingSemester(true);
    try {
      await deleteSemesterFromDb(confirmDeleteSemester.id);
      setSemesters(prev => prev.filter(s => s.id !== confirmDeleteSemester.id));
      setConfirmDeleteSemester(null);
      if (selectedSemester?.id === confirmDeleteSemester.id) {
        setShowDetailModal(false);
        setSelectedSemester(null);
      }
    } catch (err) {
      console.error('Failed to delete semester:', err);
    } finally {
      setDeletingSemester(false);
    }
  };

  const handleExportPDF = async (semester: Semester) => {
    setExportingPDF(true);
    setPdfSemester(semester);
    await new Promise(r => setTimeout(r, 300));
    try {
      await exportSemesterPDF('semester-pdf-preview', semester);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPDF(false);
      setPdfSemester(null);
    }
  };

  const getCreditBreakdown = (sem: Semester) => {
    const b: Record<string, number> = { Core: 0, BS: 0, ES: 0, PE: 0, OE: 0, Humanities: 0, Lab: 0 };
    sem.subjects?.forEach(s => { if (b[s.tag] !== undefined) b[s.tag] += s.credits; });
    return Object.entries(b).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  };

  const getGradeBreakdown = (sem: Semester) => {
    const c: Record<string, number> = {};
    sem.subjects?.forEach(s => { if (s.grade) c[s.grade] = (c[s.grade] ?? 0) + 1; });
    return ['O', 'A+', 'A', 'B+', 'B', 'C'].filter(g => c[g]).map(g => ({ name: g, value: c[g] }));
  };

  const filtered = semesters.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subjects.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading your records...</p>
    </div>
  );

  /* ── Empty ───────────────────────────────────────────────── */
  if (semesters.length === 0) return (
    <div style={{ padding: '1.75rem' }}>
      <EmptyState title="No Semesters Yet" description="Start tracking your academic journey by adding your first semester" action={{ label: 'Add First Semester', onClick: () => setShowAddModal(true) }} />
      <AddSemesterModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddSemester} />
    </div>
  );

  return (
    <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Records</p>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Semesters</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>View and manage your semester-wise academic records</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search semesters or courses…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 36, paddingRight: 16, width: 240 }} />
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent), #5b21b6)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', boxShadow: '0 4px 16px -4px rgba(124,58,237,0.5)', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Semester
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Cards grid ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.1rem' }}>
        <AnimatePresence>
          {filtered.map((semester, index) => {
            const semCredits = semester.subjects.reduce((s, sub) => s + sub.credits, 0);
            const isPlanned = semester.status === 'planned';
            return (
              <motion.div
                key={semester.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { setSelectedSemester(semester); setShowDetailModal(true); }}
                className="glass-card"
                style={{ padding: '1.4rem', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--glass-border-hover)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
              >
                {/* accent top line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: isPlanned ? 'linear-gradient(90deg, var(--warning), #fcd34d)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: '18px 18px 0 0' }} />

                {/* card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{semester.name}</h4>
                      {isPlanned && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.25)' }}>
                          <Clock size={10} /> In Progress
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{semester.term} {semester.year}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button onClick={e => { e.stopPropagation(); setEditingSemester(semester); }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }} title="Edit grades">
                      <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDeleteSemester(semester); }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s ease' }} title="Delete">
                      <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
                  </div>
                </div>

                {/* GPA stat tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
                  <div className="glass-inner" style={{ padding: '0.75rem', borderRadius: 10 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Sem GPA</p>
                    {semester.gpa != null
                      ? <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{semester.gpa.toFixed(2)}</p>
                      : <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--warning)', margin: 0 }}><Clock size={11} /> Pending</p>
                    }
                  </div>
                  <div className="glass-inner" style={{ padding: '0.75rem', borderRadius: 10 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>CGPA</p>
                    {semester.cgpa != null
                      ? <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-2)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{semester.cgpa.toFixed(2)}</p>
                      : <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>—</p>
                    }
                  </div>
                </div>

                {/* footer row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid var(--glass-border)', marginBottom: '0.875rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}><BookOpen size={12} /> {semester.subjects.length} subjects</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}><TrendingUp size={12} /> {semCredits} credits</span>
                </div>

                {/* grade strip */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {semester.subjects.map((sub, idx) => (
                    <div key={idx} title={sub.grade ? `${sub.name}: ${sub.grade}` : `${sub.name}: Pending`} style={{ flex: 1, height: 5, borderRadius: 99, background: sub.grade ? (GRADE_COLORS[sub.grade] || 'var(--text-muted)') : 'rgba(255,255,255,0.1)', opacity: sub.grade ? 0.85 : 0.4 }} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────── */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedSemester?.name || ''} size="xl">
        {selectedSemester && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {selectedSemester.status === 'planned' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Clock size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--warning)', margin: 0, flex: 1 }}>Semester in progress — GPA will be calculated once all grades are entered.</p>
                <button onClick={() => { setShowDetailModal(false); setEditingSemester(selectedSemester); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', color: 'var(--warning)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Enter grades</button>
              </div>
            )}

            {/* stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Semester GPA', val: selectedSemester.gpa?.toFixed(2), pend: selectedSemester.gpa == null, color: 'var(--accent)' },
                { label: 'Cumulative CGPA', val: selectedSemester.cgpa?.toFixed(2), pend: selectedSemester.cgpa == null, color: 'var(--accent-2)' },
                { label: 'Total Credits', val: String(selectedSemester.subjects.reduce((s, sub) => s + sub.credits, 0)), pend: false, color: 'var(--text-primary)' },
              ].map(t => (
                <div key={t.label} className="glass-inner" style={{ padding: '1rem', textAlign: 'center', borderRadius: 12 }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{t.label}</p>
                  {t.pend
                    ? <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--warning)', margin: 0 }}><Clock size={12} /> Pending</p>
                    : <p style={{ fontSize: '1.5rem', fontWeight: 800, color: t.color, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{t.val}</p>
                  }
                </div>
              ))}
            </div>

            {/* subjects table */}
            <div>
              <SectionHeading>Subjects</SectionHeading>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {['Subject', 'Credits', 'Grade', 'Points', 'Type'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSemester.subjects.map((sub, i) => (
                      <tr key={sub.id} style={{ borderTop: '1px solid var(--glass-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                        <td style={{ padding: '11px 14px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{sub.name}</td>
                        <td style={{ padding: '11px 14px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{sub.credits}</td>
                        <td style={{ padding: '11px 14px' }}>
                          {sub.grade
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: GRADE_BG[sub.grade] || 'rgba(255,255,255,0.08)', color: GRADE_COLORS[sub.grade] || 'var(--text-primary)', minWidth: 36 }}>{sub.grade}</span>
                            : <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>Pending</span>
                          }
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{sub.grade ? gradeMapping[sub.grade] : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(124,58,237,0.12)', color: 'var(--accent)', border: '1px solid rgba(124,58,237,0.2)' }}>{sub.tag}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* distribution charts */}
            {(() => {
              const cd = getCreditBreakdown(selectedSemester);
              const gd = getGradeBreakdown(selectedSemester);
              if (!cd.length && !gd.length) return null;
              return (
                <div>
                  <SectionHeading>Distribution</SectionHeading>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {cd.length > 0 && (
                      <div className="glass-inner" style={{ padding: '1rem', borderRadius: 12 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Type</p>
                        <CreditPieChart data={cd} />
                      </div>
                    )}
                    {gd.length > 0
                      ? <div className="glass-inner" style={{ padding: '1rem', borderRadius: 12 }}><p style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade Distribution</p><GradePieChart data={gd} /></div>
                      : <div className="glass-inner" style={{ padding: '1rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No grades entered yet</p></div>
                    }
                  </div>
                </div>
              );
            })()}

            {/* footer actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Edit Grades', icon: Edit2, onClick: () => { setShowDetailModal(false); setEditingSemester(selectedSemester); }, style: { background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' } },
                { label: 'Delete', icon: Trash2, onClick: () => { setShowDetailModal(false); setConfirmDeleteSemester(selectedSemester); }, style: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)' } },
              ].map(btn => {
                const Icon = btn.icon;
                return (
                  <button key={btn.label} onClick={btn.onClick} style={{ flex: 1, padding: '11px', borderRadius: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', transition: 'background 0.2s ease', ...btn.style }}>
                    <Icon size={15} /> {btn.label}
                  </button>
                );
              })}
              <button onClick={() => handleExportPDF(selectedSemester)} disabled={exportingPDF} style={{ flex: 1, padding: '11px', borderRadius: 11, cursor: exportingPDF ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: exportingPDF ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent), #5b21b6)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit', opacity: exportingPDF ? 0.6 : 1, boxShadow: exportingPDF ? 'none' : '0 4px 16px -4px rgba(124,58,237,0.5)', transition: 'all 0.2s ease' }}>
                <Download size={15} /> {exportingPDF ? 'Preparing…' : 'Export PDF'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <AddSemesterModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddSemester} />

      {editingSemester && (
        <EditSemesterModal semester={editingSemester} isOpen={!!editingSemester} onClose={() => setEditingSemester(null)} onUpdated={handleSemesterUpdated} />
      )}

      {/* ── Delete confirmation ───────────────────────────────── */}
      <AnimatePresence>
        {confirmDeleteSemester && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ width: '100%', maxWidth: 400, padding: '1.5rem', background: 'rgba(15,10,40,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 18, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '0.9375rem' }}>Delete Semester</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>This cannot be undone</p>
                </div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Are you sure you want to delete <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{confirmDeleteSemester.name}</span>? All {confirmDeleteSemester.subjects.length} subjects will be permanently deleted and CGPA recalculated.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDeleteSemester(null)} disabled={deletingSemester} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.2s ease' }}>Cancel</button>
                <button onClick={handleDeleteSemester} disabled={deletingSemester} style={{ flex: 1, padding: '10px', borderRadius: 10, cursor: deletingSemester ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px -4px rgba(239,68,68,0.5)', opacity: deletingSemester ? 0.7 : 1 }}>
                  {deletingSemester ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</> : 'Delete Semester'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PDF export overlay ────────────────────────────────── */}
      <AnimatePresence>
        {exportingPDF && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ padding: '2rem 2.5rem', borderRadius: 18, textAlign: 'center', background: 'rgba(15,10,40,0.95)', backdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', boxShadow: '0 24px 60px -12px rgba(0,0,0,0.7)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px', border: '3px solid transparent', borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent-2)', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px' }}>Generating PDF…</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>This may take a moment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pdfSemester && <SemesterPDFPreview ref={pdfPreviewRef} semester={pdfSemester} />}
    </div>
  );
}