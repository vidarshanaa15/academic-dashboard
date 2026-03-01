import { useState, useEffect } from 'react';
import { Plus, Download, ChevronRight, Edit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/Modal';
import { CreditPieChart } from '../components/CreditPieChart';
import { type Semester, gradeMapping } from '../data/sampleData';
import { EmptyState } from '../components/EmptyState';
import { fetchAcademicData } from '../lib/dataService';

export function Semesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAcademicData();
        setSemesters(data.semesters);
      } catch (err) {
        console.error("Error loading semesters:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportPDF = (semester: Semester) => {
    setExportingPDF(true);
    setTimeout(() => {
      setExportingPDF(false);
      alert(`PDF for ${semester.name} downloaded!`);
    }, 2000);
  };

  const viewSemesterDetails = (semester: Semester) => {
    setSelectedSemester(semester);
    setShowDetailModal(true);
  };

  const getCreditBreakdownForSemester = (semester: Semester) => {
    const breakdown: Record<string, number> = {
      'Core': 0,
      'BS': 0,
      'ES': 0,
      'PE': 0,
      'OE': 0,
      'Humanities': 0,
      'Lab': 0,
    };

    semester.subjects?.forEach(sub => {
      if (breakdown[sub.tag] !== undefined) {
        breakdown[sub.tag] += sub.credits;
      }
    });

    return Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };

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
          action={{
            label: 'Add First Semester',
            onClick: () => setShowAddModal(true),
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2" style={{ color: 'var(--text-primary)' }}>
            Semesters
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            View and manage your semester-wise academic records
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <Plus className="w-5 h-5" />
          Add Semester
        </motion.button>
      </div>

      {/* Semesters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {semesters.map((semester, index) => (
          <motion.div
            key={semester.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--muted)',
            }}
            onClick={() => viewSemesterDetails(semester)}
          >
            {/* Semester Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 style={{ color: 'var(--text-primary)' }}>
                  {semester.name}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {semester.term} {semester.year}
                </p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Semester GPA
                </p>
                <p className="text-2xl" style={{ color: 'var(--accent)' }}>
                  {semester.gpa.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  CGPA
                </p>
                <p className="text-2xl" style={{ color: 'var(--accent-2)' }}>
                  {semester.cgpa.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Subjects count and credits */}
            <div className="flex items-center justify-between text-sm pt-4 border-t" style={{ borderColor: 'var(--muted)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {semester.subjects.length} subjects
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {semester.subjects.reduce((sum, sub) => sum + sub.credits, 0)} credits
              </span>
            </div>

            {/* Sparkline visualization */}
            <div className="mt-4 flex gap-1">
              {semester.subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    backgroundColor: `var(--grade-${subject.grade.toLowerCase().replace('+', '-plus')})`,
                    opacity: 0.8,
                  }}
                  title={`${subject.name}: ${subject.grade}`}
                />
              ))}
            </div>
          </motion.div>
        ))}
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
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Semester GPA
                </p>
                <h3 style={{ color: 'var(--accent)' }}>
                  {selectedSemester.gpa.toFixed(2)}
                </h3>
              </div>
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Cumulative CGPA
                </p>
                <h3 style={{ color: 'var(--accent-2)' }}>
                  {selectedSemester.cgpa.toFixed(2)}
                </h3>
              </div>
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Total Credits
                </p>
                <h3 style={{ color: 'var(--text-primary)' }}>
                  {selectedSemester.subjects.reduce((sum, sub) => sum + sub.credits, 0)}
                </h3>
              </div>
            </div>

            {/* Subjects Table */}
            <div>
              <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                Subjects
              </h5>
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--muted)' }}>
                <table className="w-full">
                  <thead
                    className="text-left text-sm"
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <tr>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Subject</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Credits</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Grade</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Points</th>
                      <th className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSemester.subjects.map((subject, idx) => (
                      <tr
                        key={subject.id}
                        className="border-t"
                        style={{ borderColor: 'var(--muted)' }}
                      >
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          {subject.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          {subject.credits}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-sm"
                            style={{
                              backgroundColor: `var(--grade-${subject.grade.toLowerCase().replace('+', '-plus')})`,
                              color: '#fff',
                            }}
                          >
                            {subject.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                          {gradeMapping[subject.grade]}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: 'var(--muted)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {subject.tag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade Composition Chart */}
            <div>
              <h5 className="mb-3" style={{ color: 'var(--text-primary)' }}>
                Credit Distribution
              </h5>
              <div className="h-64">
                <CreditPieChart data={getCreditBreakdownForSemester(selectedSemester)} />
              </div>
            </div>

            {/* Export Button */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExportPDF(selectedSemester)}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-6 py-3 rounded-lg transition-colors flex-1 justify-center"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  opacity: exportingPDF ? 0.6 : 1,
                }}
              >
                <Download className="w-5 h-5" />
                {exportingPDF ? 'Preparing PDF...' : 'Export to PDF'}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Semester Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Semester"
        size="md"
      >
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>
            Add semester form would go here. In the full implementation, this would include fields for semester name, year, term, and subject entry.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(false)}
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Close
          </motion.button>
        </div>
      </Modal>

      {/* PDF Export Loading */}
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
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)' }} />
                <p style={{ color: 'var(--text-primary)' }}>Generating PDF...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
