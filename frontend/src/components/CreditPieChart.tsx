import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CreditPieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
}

/* Course-type palette — distinct from grade colors (purple/cyan/green/amber/orange/red) */
const COURSE_COLORS: Record<string, string> = {
  Core: '#e11d48', // rose
  BS: '#0284c7', // sky
  ES: '#65a30d', // lime
  PE: '#4f46e5', // indigo
  OE: '#db2777', // pink
  Humanities: '#0d9488', // teal
  Lab: '#7c3aed', // violet (distinct from grade-o's #a855f7 by lightness)
};
const FALLBACK = ['#e11d48', '#0284c7', '#65a30d', '#4f46e5', '#db2777', '#0d9488', '#7c3aed'];

const getColor = (name: string, i: number) =>
  COURSE_COLORS[name] ?? FALLBACK[i % FALLBACK.length];

function CustomTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const pct = ((payload[0].value / total) * 100).toFixed(1);
  const color = payload[0].payload.fill;
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
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {payload[0].name}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credits</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{payload[0].value}</span>
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
      {payload?.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: `${entry.color}18`, border: `1px solid ${entry.color}33` }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: entry.color, whiteSpace: 'nowrap' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CreditPieChart({ data, title }: CreditPieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);

  /* percentage label rendered directly on slice */
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const pct = Math.round((value / total) * 100);
    if (pct < 8) return null; // skip tiny slices
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
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            outerRadius={90} innerRadius={52}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
            strokeWidth={2}
            stroke="rgba(8,13,26,0.6)"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.name, i)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}