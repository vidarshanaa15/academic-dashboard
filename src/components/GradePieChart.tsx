import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface GradePieChartProps {
    data: Array<{ name: string; value: number }>;
    title?: string;
}

const GRADE_COLORS: Record<string, string> = {
    O: 'var(--chart-o)',
    'A+': 'var(--chart-ap)',
    A: 'var(--chart-a)',
    'B+': 'var(--chart-bp)',
    B: 'var(--chart-b)',
    C: 'var(--chart-c)',
};
const GRADE_BG: Record<string, string> = {
    O: 'var(--grade-o-bg)',
    'A+': 'var(--grade-ap-bg)',
    A: 'var(--grade-a-bg)',
    'B+': 'var(--grade-bp-bg)',
    B: 'var(--grade-b-bg)',
    C: 'var(--grade-c-bg)',
};

function CustomTooltip({ active, payload, total }: any) {
    if (!active || !payload?.length) return null;
    const pct = ((payload[0].value / total) * 100).toFixed(1);
    const color = GRADE_COLORS[payload[0].name] || 'var(--accent)';
    return (
        <div style={{
            padding: '10px 14px', borderRadius: 12, minWidth: 140,
            background: 'rgba(15,10,40,0.92)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Grade {payload[0].name}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subjects</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
                    {payload[0].value}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Share</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{pct}%</span>
            </div>
        </div>
    );
}

function CustomLegend({ payload }: any) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {payload?.map((entry: any, i: number) => {
                const color = GRADE_COLORS[entry.value] || entry.color;
                const bg = GRADE_BG[entry.value] || `${color}22`;
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: bg, border: `1px solid ${color}44` }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                            {entry.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export function GradePieChart({ data, title }: GradePieChartProps) {
    const total = data.reduce((s, d) => s + d.value, 0);

    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
        const pct = Math.round((value / total) * 100);
        if (pct < 8) return null;
        const RADIAN = Math.PI / 180;
        const r = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
                {pct}%
            </text>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {title && (
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {title}
                </p>
            )}
            <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%" cy="50%"
                        outerRadius={88} innerRadius={50}
                        dataKey="value"
                        labelLine={false}
                        label={renderLabel}
                        strokeWidth={2}
                        stroke="rgba(8,13,26,0.6)"
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={GRADE_COLORS[entry.name] ?? 'var(--text-muted)'} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip total={total} />} />
                    <Legend content={<CustomLegend />} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}