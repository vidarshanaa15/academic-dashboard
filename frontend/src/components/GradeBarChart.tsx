import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GradeBarChartProps {
  data: Array<{
    grade: string;
    count: number;
    gradePoint: number;
  }>;
}

const GRADE_COLORS: Record<number, string> = {
  10: 'var(--chart-o)',
  9: 'var(--chart-ap)',
  8: 'var(--chart-a)',
  7: 'var(--chart-bp)',
  6: 'var(--chart-b)',
  5: 'var(--chart-c)',
};
const GRADE_BG: Record<number, string> = {
  10: 'var(--grade-o-bg)',
  9: 'var(--grade-ap-bg)',
  8: 'var(--grade-a-bg)',
  7: 'var(--grade-bp-bg)',
  6: 'var(--grade-b-bg)',
  5: 'var(--grade-c-bg)',
};

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const pct = ((item.count / total) * 100).toFixed(1);
  const color = GRADE_COLORS[item.gradePoint] || 'var(--accent)';
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12, minWidth: 150,
      background: 'rgba(15,10,40,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Grade {item.grade}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {item.gradePoint} pts
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Count</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{item.count}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Share</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{pct}%</span>
      </div>
    </div>
  );
}

export function GradeBarChart({ data }: GradeBarChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 4 }} barCategoryGap="30%">
        <defs>
          {data.map(d => {
            const color = GRADE_COLORS[d.gradePoint] || 'var(--accent)';
            return (
              <linearGradient key={d.grade} id={`bar-grad-${d.grade}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            );
          })}
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.06)"
          vertical={false}
        />

        <XAxis
          dataKey="grade"
          tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
        />

        <YAxis
          allowDecimals={false}
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'inherit' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />

        <Tooltip
          content={<CustomTooltip total={total} />}
          cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }}
        />

        <Bar dataKey="count" radius={[8, 8, 3, 3]} maxBarSize={52}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={`url(#bar-grad-${entry.grade})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}