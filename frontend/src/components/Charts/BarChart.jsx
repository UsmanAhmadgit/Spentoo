import React from 'react';
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

// Mock data - will be replaced with real API data later
const data = [
  { month: 'Jan', income: 5000, expense: 3200 },
  { month: 'Feb', income: 6500, expense: 4100 },
  { month: 'Mar', income: 7000, expense: 4500 },
  { month: 'Apr', income: 6800, expense: 4900 },
  { month: 'May', income: 7200, expense: 4600 },
  { month: 'Jun', income: 6800, expense: 5200 },
];

// Format currency with commas (no decimals for chart)
const formatCurrency = (value) => {
  if (value < 0) {
    return `-Rs ${Math.abs(value).toLocaleString('en-US')}`;
  }
  return `Rs ${value.toLocaleString('en-US')}`;
};

// Format Y-axis tick values
const formatYAxis = (value) => {
  return formatCurrency(value);
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
        style={{
          fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
        }}
      >
        <p className="text-sm font-semibold text-gray-800 mb-2">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name === 'income' ? 'Income' : 'Expense'}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Main BarChart Component
const BarChart = () => {
  return (
    <div className="mt-6 px-4">
      <div 
        className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        style={{
          fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
        }}
      >
        {/* Chart Title */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Income vs Expenses (Monthly)
        </h2>

        {/* Responsive Chart Container */}
        <ResponsiveContainer width="100%" height={320}>
          <RechartsBarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {/* Grid with both horizontal and vertical lines */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E0E0E0"
              opacity={0.5}
            />

            {/* X-Axis (Months) */}
            <XAxis
              dataKey="month"
              tick={{ fill: '#424242', fontSize: 14 }}
              tickLine={{ stroke: '#BDBDBD' }}
              axisLine={{ stroke: '#BDBDBD' }}
              style={{
                fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
              }}
            />

            {/* Y-Axis (Amount) */}
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#424242', fontSize: 14 }}
              tickLine={{ stroke: '#BDBDBD' }}
              axisLine={{ stroke: '#BDBDBD' }}
              style={{
                fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
              }}
            />

            {/* Custom Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />

            {/* Legend - Top Right */}
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: '10px',
                fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
                fontSize: '14px'
              }}
              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />

            {/* Income Bar - Green */}
            <Bar
              dataKey="income"
              fill="#43A047"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              name="income"
            />

            {/* Expense Bar - Red */}
            <Bar
              dataKey="expense"
              fill="#E53935"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              name="expense"
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;