import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
          <p className="mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)}
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
          className="flex items-center gap-2 px-3 py-1 rounded-lg transition-opacity"
          style={{ opacity: hiddenSeries.has('gpa') ? 0.4 : 1 }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-1)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Semester GPA</span>
        </button>
        <button
          onClick={() => toggleSeries('cgpa')}
          className="flex items-center gap-2 px-3 py-1 rounded-lg transition-opacity"
          style={{ opacity: hiddenSeries.has('cgpa') ? 0.4 : 1 }}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }} />
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Cumulative CGPA</span>
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" opacity={0.3} />
          <XAxis 
            dataKey="semester" 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 10]} 
            stroke="var(--text-secondary)"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {!hiddenSeries.has('gpa') && (
            <Line 
              type="monotone" 
              dataKey="gpa" 
              stroke="var(--chart-1)" 
              strokeWidth={2}
              dot={{ fill: 'var(--chart-1)', r: 4 }}
              activeDot={{ r: 6 }}
              name="Semester GPA"
            />
          )}
          {!hiddenSeries.has('cgpa') && (
            <Line 
              type="monotone" 
              dataKey="cgpa" 
              stroke="var(--chart-2)" 
              strokeWidth={2}
              dot={{ fill: 'var(--chart-2)', r: 4 }}
              activeDot={{ r: 6 }}
              name="Cumulative CGPA"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
