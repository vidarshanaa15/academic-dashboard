import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface GradePieChartProps {
    data: Array<{
        name: string;   // e.g. "O", "A+", "A", "B+", "B", "C"
        value: number;  // count of subjects with that grade
    }>;
    title?: string;
}

// Maps grade label → the same CSS variable used by grade badges in the table
const GRADE_COLOR: Record<string, string> = {
    O: 'var(--grade-o)',
    'A+': 'var(--grade-a-plus)',
    A: 'var(--grade-a)',
    'B+': 'var(--grade-b-plus)',
    B: 'var(--grade-b)',
    C: 'var(--grade-c)',
};

export function GradePieChart({ data, title }: GradePieChartProps) {
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
                        {payload[0].value} subject{payload[0].value !== 1 ? 's' : ''} ({percentage}%)
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
                            <Cell
                                key={`cell-${index}`}
                                fill={GRADE_COLOR[entry.name] ?? 'var(--muted)'}
                            />
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