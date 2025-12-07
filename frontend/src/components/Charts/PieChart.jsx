import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data - will be replaced with real API data later
const mockData = [
  { category: 'Rent', amount: 1200, color: '#EF5350' },
  { category: 'Food', amount: 450, color: '#43A047' },
  { category: 'Transport', amount: 150, color: '#1E88E5' },
  { category: 'Entertainment', amount: 100, color: '#FFA726' },
  { category: 'Utilities', amount: 80, color: '#AB47BC' },
  { category: 'Shopping', amount: 60, color: '#26C6DA' },
  { category: 'Healthcare', amount: 40, color: '#66BB6A' },
  { category: 'Education', amount: 20, color: '#FF7043' },
];

// Format currency
const formatCurrency = (value) => {
  return `Rs ${value.toLocaleString('en-US')}`;
};

// Process data to group small slices as "Others"
const processData = (data) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const threshold = 0.05; // 5%
  
  const mainItems = [];
  let othersAmount = 0;
  
  data.forEach((item) => {
    const percentage = (item.amount / total) * 100;
    if (percentage >= threshold * 100) {
      mainItems.push(item);
    } else {
      othersAmount += item.amount;
    }
  });
  
  if (othersAmount > 0) {
    mainItems.push({
      category: 'Others',
      amount: othersAmount,
      color: '#9E9E9E',
    });
  }
  
  return mainItems;
};

// Custom label to show percentage
const renderLabel = (entry) => {
  return `${entry.percent}%`;
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];

    // Safely parse percent
    const percent = Number(data.payload?.percent);
    const displayPercent = isNaN(percent) ? 0 : percent;

    return (
      <div
        className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
        style={{
          fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
        }}
      >
        <p className="text-sm font-semibold" style={{ color: data.payload.color }}>
          {data.name}: {formatCurrency(data.value)} ({displayPercent.toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};


// Custom Legend
const CustomLegend = ({ payload }) => {
  return (
    <div 
      className="flex flex-wrap justify-center gap-4 mt-4"
      style={{
        fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
      }}
    >
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <span className="text-sm text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Main PieChart Component
const PieChart = () => {
  // Process data to group small items
  const processedData = processData(mockData);
  
  // Calculate total for percentage
  const total = processedData.reduce((sum, item) => sum + item.amount, 0);
  
  // Add percentage to each item
  const dataWithPercent = processedData.map(item => ({
    ...item,
    percent: ((item.amount / total) * 100).toFixed(1),
  }));

  return (
    <div 
      className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      style={{
        fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
      }}
    >
      {/* Chart Title */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Category Breakdown
      </h2>

      {/* Check if data is empty */}
      {processedData.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: '320px' }}>
          <div className="text-center">
            <div 
              className="mx-auto mb-4" 
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: '4px solid #E0E0E0',
              }}
            />
            <p className="text-gray-500 text-sm">No expenses to display</p>
          </div>
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
              label={(entry) => `${entry.percent}%`}
              labelLine={true}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={<CustomLegend />}
              verticalAlign="bottom"
              height={60}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PieChart;