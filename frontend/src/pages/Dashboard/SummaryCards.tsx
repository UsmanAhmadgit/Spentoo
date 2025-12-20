import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import { dashboardApi } from '../../api/dashboardApi';

// Custom hook for animated counter
const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
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

// Format currency
const formatCurrency = (num: number) => {
  return `Rs ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

interface SummaryCardProps {
  icon: React.ElementType;
  title: string;
  amount: number;
  gradientClass: string;
  iconColorClass: string;
}

const SummaryCard = ({ icon: Icon, title, amount, gradientClass, iconColorClass }: SummaryCardProps) => {
  const animatedAmount = useCountUp(amount, 2000);

  return (
    <div
      className={cn(
        "rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 hover:-translate-y-1",
        gradientClass
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("h-8 w-8", iconColorClass)} />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground">
        {formatCurrency(animatedAmount)}
      </div>
    </div>
  );
};

const SummaryCards = () => {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    remainingLoan: 0,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await dashboardApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    fetchSummary();
  }, []);

  const { totalIncome, totalExpenses, totalSavings, remainingLoan } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        icon={TrendingUp}
        title="Total Income"
        amount={totalIncome}
        gradientClass="bg-gradient-to-br from-success/10 to-success/5"
        iconColorClass="text-success"
      />
      <SummaryCard
        icon={TrendingDown}
        title="Total Expenses"
        amount={totalExpenses}
        gradientClass="bg-gradient-to-br from-destructive/10 to-destructive/5"
        iconColorClass="text-destructive"
      />
      <SummaryCard
        icon={PiggyBank}
        title="Total Savings"
        amount={Math.max(0, totalSavings)}
        gradientClass="bg-gradient-to-br from-info/10 to-info/5"
        iconColorClass="text-info"
      />
      <SummaryCard
        icon={Wallet}
        title="Remaining Loan"
        amount={remainingLoan}
        gradientClass="bg-gradient-to-br from-primary/10 to-primary/5"
        iconColorClass="text-primary"
      />
    </div>
  );
};

export default SummaryCards;