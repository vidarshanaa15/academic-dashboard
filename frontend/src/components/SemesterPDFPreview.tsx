import { forwardRef } from 'react';
import { type Semester, gradeMapping } from '../data/sampleData';

const COURSE_TYPE_COLORS: Record<string, string> = {
    Core: '#e11d48', BS: '#0284c7', ES: '#65a30d',
    PE: '#4f46e5', OE: '#db2777', Humanities: '#0d9488', Lab: '#9333ea',
};
const GRADE_COLORS: Record<string, string> = {
    O: '#a855f7', 'A+': '#06b6d4', A: '#10b981',
    'B+': '#f59e0b', B: '#f97316', C: '#ef4444',
};
const FALLBACK_COLORS = ['#e11d48', '#0284c7', '#65a30d', '#4f46e5', '#db2777', '#0d9488'];

const noBorder: React.CSSProperties = {
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
};

const LIGHT = {
    background: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',
    textFooter: '#9ca3af',
    border: '#e5e7eb',
    rowDivider: '#f3f4f6',
    statValueDefault: '#111827',
    inProgressBg: '#fef3c7',
    inProgressText: '#92400e',
};

const DARK = {
    background: '#0f172a',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    textFooter: '#64748b',
    border: '#334155',
    rowDivider: '#1e293b',
    statValueDefault: '#f1f5f9',
    inProgressBg: 'rgba(245, 158, 11, 0.15)',
    inProgressText: '#f59e0b',
};

function getStatColors(isDark: boolean) {
    return {
        gpa: isDark ? '#06b6d4' : '#6366f1',
        cgpa: isDark ? '#10b981' : '#10b981',
    };
}

interface Props {
    semester: Semester;
    isDarkMode?: boolean;
}

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

function SVGDonutChart({
    data,
    colors,
    title,
    theme,
}: {
    data: { name: string; value: number }[];
    colors: Record<string, string>;
    title: string;
    theme: typeof LIGHT;
}) {
    const SIZE = 190;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const OUTER_R = 66;
    const INNER_R = 39;
    const LABEL_R = OUTER_R + 16;

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

    const LEGEND_ROW_H = 16;
    const legendRows = Math.ceil(slices.length / 3);
    const legendStartY = SIZE + 6;
    const totalSVGH = legendStartY + legendRows * LEGEND_ROW_H + 2;
    const sliceStroke = theme.background;

    return (
        <div style={{ ...noBorder, flex: 1, textAlign: 'center', padding: '16px 12px' }}>
            <p style={{ ...noBorder, fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {title}
            </p>
            <svg
                width="100%"
                viewBox={`0 0 ${SIZE} ${totalSVGH}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', margin: '0 auto', border: 'none', outline: 'none' }}
            >
                {slices.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} stroke={sliceStroke} strokeWidth={2} />
                ))}

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
                            fill={theme.textSecondary}
                        >
                            {Math.round(s.pct * 100)}%
                        </text>
                    ) : null
                )}

                {slices.map((s, i) => {
                    const col = i % 3;
                    const row = Math.floor(i / 3);
                    const colW = SIZE / 3;
                    const lx = col * colW + 10;
                    const ly = legendStartY + row * LEGEND_ROW_H;
                    return (
                        <g key={i}>
                            <rect x={lx} y={ly + 1} width={9} height={9} rx={2} fill={s.color} />
                            <text x={lx + 13} y={ly + 9} fontSize={9} fill={theme.textSecondary}>
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
    ({ semester, isDarkMode = false }, ref) => {
        const theme = isDarkMode ? DARK : LIGHT;
        const statColors = getStatColors(isDarkMode);

        const totalCredits = semester.subjects.reduce((s, sub) => s + sub.credits, 0);
        const creditData = getCreditBreakdown(semester);
        const gradeData = getGradeBreakdown(semester);

        const stats = [
            { label: 'Semester GPA', value: semester.gpa?.toFixed(2) ?? 'Pending', color: statColors.gpa },
            { label: 'Cumulative CGPA', value: semester.cgpa?.toFixed(2) ?? '-', color: statColors.cgpa },
            { label: 'Total Credits', value: String(totalCredits), color: theme.statValueDefault },
            { label: 'Subjects', value: String(semester.subjects.length), color: theme.statValueDefault },
        ];

        return (
            <div
                ref={ref}
                id="semester-pdf-preview"
                style={{
                    width: 794,
                    padding: '32px 44px',
                    backgroundColor: theme.background,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: theme.textPrimary,
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    zIndex: -1,
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    ['--tw-bg-opacity' as any]: '1',
                }}
            >
                <div style={{ ...noBorder, marginBottom: 20 }}>
                    <h1 style={{ ...noBorder, fontSize: 24, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                        {semester.name}
                    </h1>
                    <p style={{ ...noBorder, fontSize: 13, color: theme.textMuted, marginTop: 3 }}>
                        {semester.term} {semester.year}
                        {semester.status === 'planned' && (
                            <span style={{
                                marginLeft: 10, fontSize: 11, backgroundColor: theme.inProgressBg,
                                color: theme.inProgressText, borderRadius: 4, padding: '2px 8px',
                                border: 'none', outline: 'none',
                            }}>
                                In Progress
                            </span>
                        )}
                    </p>
                </div>

                <div style={{ ...noBorder, display: 'flex', gap: 12, marginBottom: 26 }}>
                    {stats.map(stat => (
                        <div key={stat.label} style={{
                            flex: 1, textAlign: 'center',
                            border: `1px solid ${theme.border}`, borderRadius: 8,
                            outline: 'none', boxShadow: 'none',
                            padding: '12px 8px',
                        }}>
                            <p style={{ ...noBorder, fontSize: 11, color: theme.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
                            <p style={{ ...noBorder, fontSize: 20, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <h2 style={{ ...noBorder, fontSize: 14, fontWeight: 600, marginBottom: 8, color: theme.textSecondary }}>Subjects</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 26, border: 'none' }}>
                    <thead>
                        <tr>
                            {['Subject', 'Credits', 'Grade', 'Points', 'Type'].map(h => (
                                <th key={h} style={{
                                    padding: '7px 12px', textAlign: 'left',
                                    color: theme.textMuted, fontWeight: 600, borderBottom: `1.5px solid ${theme.border}`,
                                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {semester.subjects.map((subject) => (
                            <tr key={subject.id}>
                                <td style={{ padding: '7px 12px', color: theme.textPrimary, borderBottom: `1px solid ${theme.rowDivider}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                    {subject.name}
                                </td>
                                <td style={{ padding: '7px 12px', color: theme.textSecondary, borderBottom: `1px solid ${theme.rowDivider}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                    {subject.credits}
                                </td>
                                <td style={{ padding: '7px 12px', borderBottom: `1px solid ${theme.rowDivider}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                    {subject.grade ? (
                                        <span style={{
                                            backgroundColor: GRADE_COLORS[subject.grade] ?? '#6b7280',
                                            color: '#fff', borderRadius: 4,
                                            padding: '2px 9px', fontSize: 11, fontWeight: 600,
                                            border: 'none', outline: 'none',
                                        }}>
                                            {subject.grade}
                                        </span>
                                    ) : (
                                        <span style={{ ...noBorder, color: theme.textMuted, fontSize: 11 }}>Pending</span>
                                    )}
                                </td>
                                <td style={{ padding: '7px 12px', color: theme.textSecondary, borderBottom: `1px solid ${theme.rowDivider}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                    {subject.grade ? gradeMapping[subject.grade] : '-'}
                                </td>
                                <td style={{ padding: '7px 12px', color: theme.textSecondary, fontSize: 12, borderBottom: `1px solid ${theme.rowDivider}`, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                                    {subject.tag}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {(creditData.length > 0 || gradeData.length > 0) && (
                    <>
                        <h2 style={{ ...noBorder, fontSize: 14, fontWeight: 600, marginBottom: 8, color: theme.textSecondary }}>Distribution</h2>
                        <div style={{ ...noBorder, display: 'flex', gap: 16 }}>
                            {creditData.length > 0 && (
                                <div style={{ flex: 1, border: `1px solid ${theme.border}`, borderRadius: 8, outline: 'none', boxShadow: 'none' }}>
                                    <SVGDonutChart
                                        data={creditData}
                                        colors={COURSE_TYPE_COLORS}
                                        title="Course Type"
                                        theme={theme}
                                    />
                                </div>
                            )}
                            {gradeData.length > 0 && (
                                <div style={{ flex: 1, border: `1px solid ${theme.border}`, borderRadius: 8, outline: 'none', boxShadow: 'none' }}>
                                    <SVGDonutChart
                                        data={gradeData}
                                        colors={GRADE_COLORS}
                                        title="Grade Distribution"
                                        theme={theme}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div style={{
                    ...noBorder,
                    marginTop: 24, borderTop: `1px solid ${theme.border}`,
                    paddingTop: 10, display: 'flex', justifyContent: 'space-between',
                    fontSize: 10.5, color: theme.textFooter,
                }}>
                    <span style={{ ...noBorder, whiteSpace: 'nowrap' }}>Generated by GPA Tracker</span>
                    <span style={{ ...noBorder, whiteSpace: 'nowrap' }}>
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>
        );
    }
);

SemesterPDFPreview.displayName = 'SemesterPDFPreview';