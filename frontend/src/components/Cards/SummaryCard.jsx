import React, { useState, useEffect } from 'react';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';

// Mock data - will be replaced with real API data later
const mockSummary = {
  totalIncome: 52000,
  totalExpenses: 31000,
  totalSavings: 15000,
  remainingLoan: 20000, // If 0 → hide the card
};

// Custom hook for animated counter
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
};

// Format number with commas and 2 decimal places
const formatCurrency = (num) => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-Rs ${formatted}` : `Rs ${formatted}`;
};

// Individual Card Component
const SummaryCard = ({ icon: Icon, title, amount, gradientFrom, gradientTo, iconColor }) => {
  const animatedAmount = useCountUp(amount, 2000);
  const isNegative = amount < 0;

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
      }}
    >
      {/* Icon and Title Row */}
      <div className="flex items-center gap-2 mb-4">
        <Icon 
          fontSize="large" 
          style={{ color: iconColor }}
        />
        <h3 className="text-sm font-medium text-gray-700">
          {title}
        </h3>
      </div>

      {/* Big Animated Number */}
      <div 
        className={`text-3xl md:text-4xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}
      >
        {formatCurrency(animatedAmount)}
      </div>
    </div>
  );
};

// Main SummaryCards Component
const SummaryCards = () => {
  const { totalIncome, totalExpenses, totalSavings, remainingLoan } = mockSummary;
  const showLoanCard = remainingLoan > 0;

  // Calculate number of columns based on loan visibility
  const gridCols = showLoanCard 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="pt-4 px-4">
      <div className={`grid ${gridCols} gap-6`}>
        {/* Income Card */}
        <SummaryCard
          icon={TrendingUpRoundedIcon}
          title="Total Income"
          amount={totalIncome}
          gradientFrom="rgba(67, 160, 71, 0.1)"
          gradientTo="rgba(67, 160, 71, 0.05)"
          iconColor="#43A047"
        />

        {/* Expenses Card */}
        <SummaryCard
          icon={TrendingDownRoundedIcon}
          title="Total Expenses"
          amount={totalExpenses}
          gradientFrom="rgba(239, 83, 80, 0.1)"
          gradientTo="rgba(239, 83, 80, 0.05)"
          iconColor="#EF5350"
        />

        {/* Savings Card */}
        <SummaryCard
          icon={SavingsRoundedIcon}
          title="Total Savings"
          amount={totalSavings}
          gradientFrom="rgba(38, 198, 218, 0.1)"
          gradientTo="rgba(38, 198, 218, 0.05)"
          iconColor="#26C6DA"
        />

        {/* Remaining Loan Card - Conditional */}
        {showLoanCard && (
          <SummaryCard
            icon={AccountBalanceWalletRoundedIcon}
            title="Remaining Loan"
            amount={remainingLoan}
            gradientFrom="rgba(25, 118, 210, 0.1)"
            gradientTo="rgba(25, 118, 210, 0.05)"
            iconColor="#1976D2"
          />
        )}
      </div>
    </div>
  );
};

export default SummaryCards;