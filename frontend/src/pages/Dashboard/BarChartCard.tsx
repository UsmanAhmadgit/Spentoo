import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';

const formatCurrency = (value: number) => `Rs ${value.toLocaleString('en-US')}`;

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  payload: { month: string };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
        <p className="text-sm font-semibold text-card-foreground mb-2">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'income' ? 'Income' : 'Expense'}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BarChartCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const monthlyData = await dashboardApi.getMonthlyData();
        setData(Array.isArray(monthlyData) ? monthlyData : monthlyData.data || []);
      } catch (error) {
        console.error('Error fetching monthly data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasData = data.length > 0 && data.some(item => (item.income || 0) > 0 || (item.expense || 0) > 0);

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Income vs Expenses (Monthly)
      </h2>
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No data to display</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
            <XAxis
              dataKey="month"
              className="text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              domain={[0, 200000]}
              ticks={[0, 50000, 100000, 150000, 200000]}
              tickFormatter={(value) => formatCurrency(value)}
              className="text-muted-foreground"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '14px' }}
              formatter={(value) => (value === 'income' ? 'Income' : 'Expense')}
            />
            <Bar dataKey="income" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} maxBarSize={60} name="income" />
            <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={60} name="expense" />
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BarChartCard;