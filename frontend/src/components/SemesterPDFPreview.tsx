import { forwardRef } from 'react';
import { type Semester, gradeMapping } from '../data/sampleData';

// hardcoded colors, as css vars dont work in dom-to-image-more) 
const COURSE_TYPE_COLORS: Record<string, string> = {
    Core: '#e11d48', BS: '#0284c7', ES: '#65a30d',
    PE: '#4f46e5', OE: '#db2777', Humanities: '#0d9488', Lab: '#9333ea',
};
const GRADE_COLORS: Record<string, string> = {
    O: '#a855f7', 'A+': '#06b6d4', A: '#10b981',
    'B+': '#f59e0b', B: '#f97316', C: '#ef4444',
};
const FALLBACK_COLORS = ['#e11d48', '#0284c7', '#65a30d', '#4f46e5', '#db2777', '#0d9488'];

interface Props { semester: Semester; }

function getCreditBreakdown(semester: Semester) {
    const breakdown: Record<string, number> = {
        Core: 0, BS: 0, ES: 0, PE: 0, OE: 0, Humanities: 0, Lab: 0,
    };
    semester.subjects.forEach(s => {
        if (breakdown[s.tag] !== undefined) breakdown[s.tag] += s.credits;
    });
    return Object.entries(breakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));
}

function getGradeBreakdown(semester: Semester) {
    const counts: Record<string, number> = {};
    semester.subjects.forEach(s => {
        if (s.grade) counts[s.grade] = (counts[s.grade] ?? 0) + 1;
    });
    return ['O', 'A+', 'A', 'B+', 'B', 'C']
        .filter(g => counts[g])
        .map(g => ({ name: g, value: counts[g] }));
}

// pure SVG donut chart (zero recharts, renders synchronously) 
function SVGDonutChart({
    data,
    colors,
    title,
}: {
    data: { name: string; value: number }[];
    colors: Record<string, string>;
    title: string;
}) {
    const SIZE = 210;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const OUTER_R = 75;
    const INNER_R = 44;
    const LABEL_R = OUTER_R + 18;

    const total = data.reduce((s, d) => s + d.value, 0);

    type Slice = {
        path: string;
        color: string;
        name: string;
        value: number;
        pct: number;
        labelX: number;
        labelY: number;
    };

    const slices: Slice[] = [];
    let startAngle = -Math.PI / 2;

    data.forEach((d, i) => {
        const pct = d.value / total;
        const sweep = pct * 2 * Math.PI;
        const endAngle = startAngle + sweep;
        const mid = startAngle + sweep / 2;
        const large = sweep > Math.PI ? 1 : 0;

        const ox1 = cx + OUTER_R * Math.cos(startAngle);
        const oy1 = cy + OUTER_R * Math.sin(startAngle);
        const ox2 = cx + OUTER_R * Math.cos(endAngle);
        const oy2 = cy + OUTER_R * Math.sin(endAngle);

        const ix1 = cx + INNER_R * Math.cos(endAngle);
        const iy1 = cy + INNER_R * Math.sin(endAngle);
        const ix2 = cx + INNER_R * Math.cos(startAngle);
        const iy2 = cy + INNER_R * Math.sin(startAngle);

        const path = [
            `M ${ox1} ${oy1}`,
            `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${ox2} ${oy2}`,
            `L ${ix1} ${iy1}`,
            `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ix2} ${iy2}`,
            'Z',
        ].join(' ');

        slices.push({
            path,
            color: colors[d.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            name: d.name,
            value: d.value,
            pct,
            labelX: cx + LABEL_R * Math.cos(mid),
            labelY: cy + LABEL_R * Math.sin(mid),
        });

        startAngle = endAngle;
    });

    const LEGEND_ROW_H = 18;
    const legendRows = Math.ceil(slices.length / 2);
    const legendStartY = SIZE + 8;
    const totalSVGH = legendStartY + legendRows * LEGEND_ROW_H + 4;

    return (
        <div style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #e5e7eb',
        }}>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                {title}
            </p>
            <svg
                width="100%"
                viewBox={`0 0 ${SIZE} ${totalSVGH}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block' }}
            >
                {slices.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} stroke="#ffffff" strokeWidth={2} />
                ))}

                {/* percentage labels (only if its big enough) */}
                {slices.map((s, i) =>
                    s.pct >= 0.06 ? (
                        <text
                            key={i}
                            x={s.labelX}
                            y={s.labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={10}
                            fontWeight="700"
                            fill="#374151"
                        >
                            {Math.round(s.pct * 100)}%
                        </text>
                    ) : null
                )}

                {/* ── Legend ── */}
                {slices.map((s, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const lx = col === 0 ? 8 : SIZE / 2 + 8;
                    const ly = legendStartY + row * LEGEND_ROW_H;
                    return (
                        <g key={i}>
                            <rect x={lx} y={ly + 1} width={10} height={10} rx={2} fill={s.color} />
                            <text x={lx + 14} y={ly + 10} fontSize={10} fill="#374151">
                                {s.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export const SemesterPDFPreview = forwardRef<HTMLDivElement, Props>(
    ({ semester }, ref) => {
        const totalCredits = semester.subjects.reduce((s, sub) => s + sub.credits, 0);
        const creditData = getCreditBreakdown(semester);
        const gradeData = getGradeBreakdown(semester);

        return (
            <div
                ref={ref}
                id="semester-pdf-preview"
                style={{
                    width: 794,
                    padding: '40px 48px',
                    backgroundColor: '#ffffff',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: '#111827',
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    zIndex: -1,
                    ['--tw-bg-opacity' as any]: '1',
                }}
            >
                <div style={{ marginBottom: 28, borderBottom: '2px solid #e5e7eb', paddingBottom: 16 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>
                        {semester.name}
                    </h1>
                    <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                        {semester.term} {semester.year}
                        {semester.status === 'planned' && (
                            <span style={{
                                marginLeft: 10, fontSize: 12, backgroundColor: '#fef3c7',
                                color: '#92400e', borderRadius: 4, padding: '2px 8px',
                            }}>
                                In Progress
                            </span>
                        )}
                    </p>
                </div>

                {/* ── Stats Row ────────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Semester GPA', value: semester.gpa?.toFixed(2) ?? 'Pending', color: '#6366f1' },
                        { label: 'Cumulative CGPA', value: semester.cgpa?.toFixed(2) ?? '—', color: '#10b981' },
                        { label: 'Total Credits', value: String(totalCredits), color: '#111827' },
                        { label: 'Subjects', value: String(semester.subjects.length), color: '#111827' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            flex: 1, backgroundColor: '#f9fafb', borderRadius: 10,
                            padding: '14px 16px', textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{stat.label}</p>
                            <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* subj table */}
                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Subjects</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 28 }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6' }}>
                            {['Subject', 'Credits', 'Grade', 'Points', 'Type'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 14px', textAlign: 'left',
                                    color: '#374151', fontWeight: 600, borderBottom: '1px solid #e5e7eb',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {semester.subjects.map((subject, i) => (
                            <tr key={subject.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                <td style={{ padding: '9px 14px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>
                                    {subject.name}
                                </td>
                                <td style={{ padding: '9px 14px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                                    {subject.credits}
                                </td>
                                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6' }}>
                                    {subject.grade ? (
                                        <span style={{
                                            backgroundColor: GRADE_COLORS[subject.grade] ?? '#6b7280',
                                            color: '#fff', borderRadius: 4,
                                            padding: '2px 10px', fontSize: 12, fontWeight: 600,
                                        }}>
                                            {subject.grade}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontSize: 12 }}>Pending</span>
                                    )}
                                </td>
                                <td style={{ padding: '9px 14px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                                    {subject.grade ? gradeMapping[subject.grade] : '—'}
                                </td>
                                <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{
                                        backgroundColor: '#e5e7eb', color: '#374151',
                                        borderRadius: 12, padding: '2px 10px', fontSize: 12,
                                    }}>
                                        {subject.tag}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* pie charts as pure svg to render them properly (removed usage of recharts) */}
                {(creditData.length > 0 || gradeData.length > 0) && (
                    <>
                        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Distribution</h2>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {creditData.length > 0 && (
                                <SVGDonutChart
                                    data={creditData}
                                    colors={COURSE_TYPE_COLORS}
                                    title="Course Type"
                                />
                            )}
                            {gradeData.length > 0 && (
                                <SVGDonutChart
                                    data={gradeData}
                                    colors={GRADE_COLORS}
                                    title="Grade Distribution"
                                />
                            )}
                        </div>
                    </>
                )}

                <div style={{
                    marginTop: 32, borderTop: '1px solid #e5e7eb',
                    paddingTop: 12, display: 'flex', justifyContent: 'space-between',
                    fontSize: 11, color: '#9ca3af',
                }}>
                    <span>Generated by GPA Tracker</span>
                    <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
        );
    }
);

SemesterPDFPreview.displayName = 'SemesterPDFPreview';