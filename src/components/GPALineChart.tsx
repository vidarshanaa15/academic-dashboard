import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface GPALineChartProps {
  data: Array<{
    semester: string;
    gpa: number;
    cgpa: number;
  }>;
}

export function GPALineChart({ data }: GPALineChartProps) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg border shadow-lg"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--muted)',
          }}
        >
          <p className="mb-2 font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(3)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Legend with toggles */}
      <div className="flex gap-4 mb-4 justify-center">
        <button
          onClick={() => toggleSeries('gpa')}
          className="flex items-center gap-2 px-3 py-1 rounded-lg transition-opacity hover:bg-muted/20"
          style={{ opacity: hiddenSeries.has('gpa') ? 0.4 : 1 }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-1)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Semester GPA</span>
        </button>
        <button
          onClick={() => toggleSeries('cgpa')}
          className="flex items-center gap-2 px-3 py-1 rounded-lg transition-opacity hover:bg-muted/20"
          style={{ opacity: hiddenSeries.has('cgpa') ? 0.4 : 1 }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Cumulative CGPA</span>
        </button>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {/* Sorting removed: data is used directly as passed from parent */}
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="semester"
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            // Dynamic scale: focuses on the relevant range (e.g., 7.5 to 10)
            domain={[
              (dataMin: number) => Math.max(0, Math.floor(dataMin - 0.5)),
              10
            ]}
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            label={{
              value: 'GPA',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--text-secondary)', fontSize: 12 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {!hiddenSeries.has('gpa') && (
            <Line
              type="monotone"
              dataKey="gpa"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-1)', r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
              activeDot={{ r: 7 }}
              name="Semester GPA"
            />
          )}

          {!hiddenSeries.has('cgpa') && (
            <Line
              type="monotone"
              dataKey="cgpa"
              stroke="var(--chart-2)"
              strokeWidth={3}
              dot={{ fill: 'var(--chart-2)', r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
              activeDot={{ r: 7 }}
              name="Cumulative CGPA"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}