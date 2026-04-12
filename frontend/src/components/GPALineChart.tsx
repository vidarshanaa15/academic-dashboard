import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useState } from 'react';

interface GPALineChartProps {
  data: Array<{
    semester: string;
    gpa: number;
    cgpa: number;
  }>;
}

const SERIES = [
  { key: 'gpa', label: 'Semester GPA', color: 'var(--accent)' },
  { key: 'cgpa', label: 'Cumulative CGPA', color: 'var(--accent-2)' },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(15,10,40,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
      minWidth: 140,
    }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>{entry.name}</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: entry.color }}>
            {entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function GPALineChart({ data }: GPALineChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div>
      {/* interactive legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SERIES.map(s => {
          const off = hidden.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${off ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)'}`,
                background: off ? 'transparent' : 'rgba(255,255,255,0.05)',
                opacity: off ? 0.45 : 1,
                transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 24, height: 3, borderRadius: 99,
                background: off ? 'rgba(255,255,255,0.2)' : s.color,
                transition: 'background 0.2s ease',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: off ? 'var(--text-muted)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
          <defs>
            {SERIES.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />

          <XAxis
            dataKey="semester"
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            padding={{ left: 16, right: 16 }}
          />

          <YAxis
            domain={[(d: number) => Math.max(0, Math.floor(d - 0.5)), 10]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />

          {SERIES.map(s => !hidden.has(s.key) && (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ fill: s.color, r: 4, strokeWidth: 2, stroke: 'rgba(8,13,26,0.9)' }}
              activeDot={{ r: 6, stroke: s.color, strokeWidth: 2, fill: 'rgba(8,13,26,0.9)' }}
              name={s.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}