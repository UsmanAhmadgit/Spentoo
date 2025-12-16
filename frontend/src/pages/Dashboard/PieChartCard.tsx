import { useState, useEffect } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';

const formatCurrency = (value: number) => `Rs ${value.toLocaleString('en-US')}`;

interface CategoryData {
  category: string;
  amount: number;
  color: string;
}

// Process data to group small slices
const processData = (data: CategoryData[]) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const threshold = 0.05;

  const mainItems: CategoryData[] = [];
  let othersAmount = 0;

  data.forEach((item) => {
    const percentage = item.amount / total;
    if (percentage >= threshold) {
      mainItems.push(item);
    } else {
      othersAmount += item.amount;
    }
  });

  if (othersAmount > 0) {
    mainItems.push({
      category: 'Others',
      amount: othersAmount,
      color: 'hsl(0, 0%, 62%)',
    });
  }

  return mainItems;
};

interface TooltipPayload {
  name: string;
  value: number;
  payload: { color: string; percent: number };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const percent = Number(data.payload?.percent);
    const displayPercent = isNaN(percent) ? 0 : percent;

    return (
      <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
        <p className="text-sm font-semibold" style={{ color: data.payload.color }}>
          {data.name}: {formatCurrency(data.value)} ({displayPercent.toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};

interface LegendPayload {
  value: string;
  color: string;
}

const CustomLegend = ({ payload }: { payload?: LegendPayload[] }) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieChartCard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const breakdown = await dashboardApi.getCategoryBreakdown();
        setData(Array.isArray(breakdown) ? breakdown : breakdown.data || []);
      } catch (error) {
        console.error('Error fetching category breakdown:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedData = processData(data);
  const total = processedData.reduce((sum, item) => sum + item.amount, 0);
  const hasData = total > 0;

  const dataWithPercent = processedData.map((item) => ({
    ...item,
    percent: (item.amount / total) * 100,
  }));

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Category Breakdown
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
          <RechartsPieChart>
            <Pie
              data={dataWithPercent}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="45%"
              outerRadius={90}
              label={(entry) => `${entry.percent.toFixed(0)}%`}
              labelLine={true}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} verticalAlign="bottom" height={60} />
          </RechartsPieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PieChartCard;