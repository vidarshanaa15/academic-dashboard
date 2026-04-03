import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CreditPieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
}

// Course-type colors — warm/neutral palette, zero overlap with grade colors
// Grade colors use: purple, cyan, emerald, amber, orange, red
// These use: rose, sky, lime, indigo, pink, teal — clearly distinct
const COURSE_TYPE_COLORS: Record<string, string> = {
  Core: '#e11d48', // rose-600
  BS: '#0284c7', // sky-600
  ES: '#65a30d', // lime-600
  PE: '#4f46e5', // indigo-600
  OE: '#db2777', // pink-600
  Humanities: '#0d9488', // teal-600
  Lab: '#9333ea', // purple-500 — distinct enough from grade-o (#a855f7) by saturation
};

const FALLBACK_COLORS = [
  '#e11d48', '#0284c7', '#65a30d', '#4f46e5', '#db2777', '#0d9488', '#9333ea',
];

export function CreditPieChart({ data, title }: CreditPieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div
          className="p-3 rounded-lg border shadow-lg"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--muted)' }}
        >
          <p className="mb-1" style={{ color: 'var(--text-primary)' }}>{payload[0].name}</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {payload[0].value} credits ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return `${((entry.value / total) * 100).toFixed(0)}%`;
  };

  const getColor = (name: string, index: number) =>
    COURSE_TYPE_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  return (
    <div className="flex flex-col items-center w-full h-full">
      {title && (
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={85}
            innerRadius={50}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}