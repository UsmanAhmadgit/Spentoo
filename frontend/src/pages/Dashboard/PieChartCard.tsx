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
  payload?: { amount?: number; percent?: number };
}

const CustomLegend = ({ payload }: { payload?: LegendPayload[] }) => {
  if (!payload) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4 px-2 max-w-full overflow-hidden">
      {payload.map((entry, index) => {
        const amount = entry?.payload?.amount ?? 0;
        const percent = entry?.payload?.percent ?? 0;
        return (
          <div key={`legend-${index}`} className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <div className="text-sm text-muted-foreground min-w-0">
              <div className="font-medium truncate">{entry.value}</div>
              <div className="text-xs text-gray-500 whitespace-nowrap">{formatCurrency(amount)} • {Number(percent).toFixed(0)}%</div>
            </div>
          </div>
        );
      })}
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
        // Normalize response formats: could be an array or an object with different property names
        let arr: CategoryData[] = [];
        if (Array.isArray(breakdown)) {
          arr = breakdown;
        } else if (breakdown) {
          arr = breakdown.data || breakdown.breakdown || breakdown.categories || breakdown.items || [];
          arr = Array.isArray(arr) ? arr : [];
        }
        
        // Filter out system-generated categories
        // Primary: Use isSystemGenerated flag
        // Fallback: Only filter exact match of known system-generated category name
        const filteredData = arr.filter((item: any) => {
          // Primary filter: Check isSystemGenerated flag
          if (item.isSystemGenerated === true) {
            return false;
          }
          // Fallback: Only filter exact match of "Recurring Payments" (the known system-generated category)
          // Use exact match to avoid filtering legitimate user categories
          const categoryName = (item.category || item.name || '').trim().toLowerCase();
          const exactSystemGeneratedName = 'recurring payments';
          return categoryName !== exactSystemGeneratedName;
        });
        setData(filteredData);
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
    percent: total > 0 ? (item.amount / total) * 100 : 0,
  }));

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
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
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={dataWithPercent}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="40%"
                outerRadius={80}
                label={(entry) => `${entry.percent.toFixed(0)}%`}
                labelLine={false}
              >
                {dataWithPercent.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} verticalAlign="bottom" height={120} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PieChartCard;