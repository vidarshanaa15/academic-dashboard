import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GradeBarChartProps {
  data: Array<{
    grade: string;
    count: number;
    gradePoint: number;
  }>;
}

const GRADE_COLORS: Record<number, string> = {
  10: 'var(--grade-o)',
  9: 'var(--grade-a-plus)',
  8: 'var(--grade-a)',
  7: 'var(--grade-b-plus)',
  6: 'var(--grade-b)',
  5: 'var(--grade-c)',
};

export function GradeBarChart({ data }: GradeBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.count / total) * 100).toFixed(1);
      return (
        <div 
          className="p-3 rounded-lg border shadow-lg"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--muted)',
          }}
        >
          <p className="mb-1" style={{ color: 'var(--text-primary)' }}>
            Grade: <strong>{item.grade}</strong> ({item.gradePoint} points)
          </p>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Count: {item.count} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" opacity={0.3} />
        <XAxis 
          dataKey="grade" 
          stroke="var(--text-secondary)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
        />
        <YAxis 
          stroke="var(--text-secondary)"
          tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.gradePoint] || 'var(--chart-1)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
