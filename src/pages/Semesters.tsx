import { useState, useEffect, useRef } from 'react';
import { Plus, Download, ChevronRight, Edit2, Loader2, Clock, Trash2, AlertTriangle, Search } from 'lucide-react';
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

  const handleAddSemester = (newSemester: Semester) => {
    setSemesters(prev => [...prev, newSemester]);
  };

  const handleSemesterUpdated = async (updated: Semester) => {
    try {
      const data = await fetchAcademicData();
      setSemesters(data.semesters);
      if (selectedSemester?.id === updated.id) {
        const refreshed = data.semesters.find(s => s.id === updated.id);
        if (refreshed) setSelectedSemester(refreshed);
      }
    } catch (err) {
      console.error('Failed to refresh semesters:', err);
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
    setPdfSemester(semester);          // mount the hidden preview

    // Give React one tick to render the hidden div, then capture
    await new Promise(r => setTimeout(r, 300));

    try {
      await exportSemesterPDF('semester-pdf-preview', semester);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPDF(false);
      setPdfSemester(null);            // unmount after export
    }
  };

  const viewSemesterDetails = (semester: Semester) => {
    setSelectedSemester(semester);
    setShowDetailModal(true);
  };

  const getCreditBreakdownForSemester = (semester: Semester) => {
    const breakdown: Record<string, number> = {
      'Core': 0, 'BS': 0, 'ES': 0, 'PE': 0, 'OE': 0, 'Humanities': 0, 'Lab': 0,
    };
    semester.subjects?.forEach(sub => {
      if (breakdown[sub.tag] !== undefined) breakdown[sub.tag] += sub.credits;
    });
    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

  // returns grade distribution (only subjects that have a grade)
  const getGradeBreakdownForSemester = (semester: Semester) => {
    const counts: Record<string, number> = {};
    semester.subjects?.forEach(sub => {
      if (sub.grade) {
        counts[sub.grade] = (counts[sub.grade] ?? 0) + 1;
      }
    });
    const ORDER = ['O', 'A+', 'A', 'B+', 'B', 'C'];
    return ORDER
      .filter(g => counts[g])
      .map(g => ({ name: g, value: counts[g] }));
  };

  const filteredSemesters = semesters.filter(semester =>
    semester.subjects.some(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || semester.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your records...</p>
      </div>
    );
  }

  if (semesters.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Semesters Yet"
          description="Start tracking your academic journey by adding your first semester"
          action={{ label: 'Add First Semester', onClick: () => setShowAddModal(true) }}
        />
        <AddSemesterModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSemester}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2" style={{ color: 'var(--text-primary)' }}>Semesters</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            View and manage your semester-wise academic records
          </p>
        </div>

        {/* search bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search courses, semesters..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition-all focus:ring-2"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--muted)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--accent)',
              } as React.CSSProperties}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-5 h-5" />
          Add Semester
        </motion.button>
      </div>

      {/* Semesters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSemesters.map((semester, index) => (
            <motion.div
              key={semester.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--muted)' }}
              onClick={() => viewSemesterDetails(semester)}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 style={{ color: 'var(--text-primary)' }}>{semester.name}</h4>
                    {semester.status === 'planned' && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                      >
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {semester.term} {semester.year}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingSemester(semester); }}
                    className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Edit grades"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteSemester(semester); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Delete semester"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </div>
              </div>

              {/* GPA / CGPA Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Semester GPA</p>
                  {semester.gpa != null ? (
                    <p className="text-2xl" style={{ color: 'var(--accent)' }}>
                      {semester.gpa.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-sm flex items-center gap-1 mt-1" style={{ color: '#f59e0b' }}>
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>CGPA</p>
                  {semester.cgpa != null ? (
                    <p className="text-2xl" style={{ color: 'var(--accent-2)' }}>
                      {semester.cgpa.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>—</p>
                  )}
                </div>
              </div>

              {/* Subject count + credits */}
              <div
                className="flex items-center justify-between text-sm pt-4 border-t"
                style={{ borderColor: 'var(--muted)' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  {semester.subjects.length} subjects
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {semester.subjects.reduce((sum, sub) => sum + sub.credits, 0)} credits
                </span>
              </div>

              <div className="mt-4 flex gap-1">
                {semester.subjects.map((subject, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-2 rounded-full"
                    style={{
                      backgroundColor: subject.grade
                        ? `var(--grade-${subject.grade.toLowerCase().replace('+', '-plus')})`
                        : 'var(--muted)',
                      opacity: 0.8,
                    }}
                    title={subject.grade
                      ? `${subject.name}: ${subject.grade}`
                      : `${subject.name}: Grade pending`}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Semester Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedSemester?.name || ''}
        size="xl"
      >
        {selectedSemester && (
          <div className="space-y-6">

            {/* In-progress banner */}
            {selectedSemester.status === 'planned' && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#f59e0b15', color: '#f59e0b' }}
              >
                <Clock className="w-4 h-4 shrink-0" />
                This semester is in progress. Grades are pending — GPA will be calculated once all grades are entered.
                <button
                  onClick={() => { setShowDetailModal(false); setEditingSemester(selectedSemester); }}
                  className="ml-auto underline text-xs whitespace-nowrap"
                >
                  Enter grades
                </button>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Semester GPA</p>
                {selectedSemester.gpa != null ? (
                  <h3 style={{ color: 'var(--accent)' }}>{selectedSemester.gpa.toFixed(2)}</h3>
                ) : (
                  <p className="flex items-center justify-center gap-1 mt-1 text-sm" style={{ color: '#f59e0b' }}>
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Cumulative CGPA</p>
                {selectedSemester.cgpa != null ? (
                  <h3 style={{ color: 'var(--accent-2)' }}>{selectedSemester.cgpa.toFixed(2)}</h3>
                ) : (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>—</p>
                )}
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg)' }}>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Credits</p>
                <h3 style={{ color: 'var(--text-primary)' }}>
                  {selectedSemester.subjects.reduce((sum, sub) => sum + sub.credits, 0)}
                </h3>
              </div>
            </div>

            {/* Subjects Table */}
            <div>
              <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>Subjects</h5>
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--muted)' }}>
                <table className="w-full">
                  <thead className="text-left text-sm" style={{ backgroundColor: 'var(--bg)' }}>
                    <tr>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Subject</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Grade</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Points</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSemester.subjects.map(subject => (
                      <tr key={subject.id} className="border-t" style={{ borderColor: 'var(--muted)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{subject.name}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{subject.credits}</td>
                        <td className="px-4 py-3">
                          {subject.grade ? (
                            <span
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                backgroundColor: `var(--grade-${subject.grade.toLowerCase().replace('+', '-plus')})`,
                                color: '#fff',
                              }}
                            >
                              {subject.grade}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs"
                              style={{ backgroundColor: 'var(--muted)', color: 'var(--text-secondary)' }}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          {subject.grade ? gradeMapping[subject.grade] : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: 'var(--muted)', color: 'var(--text-primary)' }}>
                            {subject.tag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* pie charts */}
            {(() => {
              const creditData = getCreditBreakdownForSemester(selectedSemester);
              const gradeData = getGradeBreakdownForSemester(selectedSemester);
              const showCredits = creditData.length > 0;
              const showGrades = gradeData.length > 0;

              if (!showCredits && !showGrades) return null;

              return (
                <div>
                  <h5 className="mb-4" style={{ color: 'var(--text-primary)' }}>Distribution</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* course type */}
                    {showCredits && (
                      <div
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--muted)' }}
                      >
                        <p className="text-sm font-medium text-center mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Course Type
                        </p>
                        <CreditPieChart data={creditData} />
                      </div>
                    )}

                    {/* grade distribution */}
                    {showGrades && (
                      <div
                        className="p-4 rounded-xl border"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--muted)' }}
                      >
                        <p className="text-sm font-medium text-center mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Grade Distribution
                        </p>
                        <GradePieChart data={gradeData} />
                      </div>
                    )}

                    {showCredits && !showGrades && (
                      <div
                        className="p-4 rounded-xl border flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--muted)' }}
                      >
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          No grades entered yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Footer actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowDetailModal(false); setEditingSemester(selectedSemester); }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border flex-1 justify-center"
                style={{ borderColor: 'var(--muted)', color: 'var(--text-primary)' }}
              >
                <Edit2 className="w-4 h-4" /> Edit Grades
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setShowDetailModal(false); setConfirmDeleteSemester(selectedSemester); }}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border flex-1 justify-center"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                <Trash2 className="w-4 h-4" /> Delete Semester
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleExportPDF(selectedSemester)}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-6 py-3 rounded-lg flex-1 justify-center"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: exportingPDF ? 0.6 : 1 }}
              >
                <Download className="w-4 h-4" />
                {exportingPDF ? 'Preparing...' : 'Export PDF'}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Semester Modal */}
      <AddSemesterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSemester}
      />

      {/* Edit Grades Modal */}
      {editingSemester && (
        <EditSemesterModal
          semester={editingSemester}
          isOpen={!!editingSemester}
          onClose={() => setEditingSemester(null)}
          onUpdated={handleSemesterUpdated}
        />
      )}

      {/* Delete Semester Confirmation */}
      <AnimatePresence>
        {confirmDeleteSemester && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Delete Semester</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This cannot be undone</p>
                </div>
              </div>

              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to delete{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {confirmDeleteSemester.name}
                </span>
                ? All {confirmDeleteSemester.subjects.length} subjects will also be permanently deleted, and CGPA will be recalculated.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteSemester(null)}
                  disabled={deletingSemester}
                  className="flex-1 px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--muted)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSemester}
                  disabled={deletingSemester}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {deletingSemester
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                    : 'Delete Semester'
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Export Overlay */}
      <AnimatePresence>
        {exportingPDF && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="p-8 rounded-xl"
              style={{ backgroundColor: 'var(--card)' }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)' }} />
                <p style={{ color: 'var(--text-primary)' }}>Generating PDF...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hidden PDF render target , i.e,  "only mount this component when pdfSemester has a val, so the PDF library has a real DOM node (hidden) to capture via pdfPreviewRef"*/}
      {pdfSemester && (
        <SemesterPDFPreview ref={pdfPreviewRef} semester={pdfSemester} />
      )}
    </div>
  );
}