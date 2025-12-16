import { useState, useEffect } from 'react';
import { Calendar, Receipt, CreditCard } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';

const formatCurrency = (amount: number) => {
  return `Rs ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Check if date is valid before calling toISOString
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return '';
  }
  return date.toISOString().split('T')[0];
};

interface CardUpcomingProps {
  icon: string;
  title: string;
  amount: string;
  date: string;
  frequency: string;
}

const CardUpcoming = ({ icon, title, amount, date, frequency }: CardUpcomingProps) => (
  <div className="min-w-64 p-4 bg-card rounded-lg shadow-md flex-shrink-0 border border-border">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>Amount: <span className="text-card-foreground font-medium">{amount}</span></p>
      <p>Date: <span className="text-card-foreground font-medium">{date}</span></p>
      <p>Frequency: <span className="text-card-foreground font-medium">{frequency}</span></p>
    </div>
  </div>
);

interface CardBillsProps {
  icon: string;
  title: string;
  total: string;
  paid: string;
  status: string;
}

const CardBills = ({ icon, title, total, paid, status }: CardBillsProps) => (
  <div className="min-w-64 p-4 bg-card rounded-lg shadow-md flex-shrink-0 border border-border">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>Total: <span className="text-card-foreground font-medium">{total}</span></p>
      <p>Paid: <span className="text-card-foreground font-medium">{paid}</span></p>
      <p>Status: <span className={status === 'Paid' ? 'text-success font-medium' : 'text-warning font-medium'}>{status}</span></p>
    </div>
  </div>
);

interface CardLoansProps {
  icon: string;
  title: string;
  remaining: string;
  due: string;
  status: string;
}

const CardLoans = ({ icon, title, remaining, due, status }: CardLoansProps) => (
  <div className="min-w-64 p-4 bg-card rounded-lg shadow-md flex-shrink-0 border border-border">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold text-card-foreground">{title}</h3>
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>Remaining: <span className="text-card-foreground font-medium">{remaining}</span></p>
      <p>Due: <span className="text-card-foreground font-medium">{due}</span></p>
      <p>Status: <span className="text-primary font-medium">{status}</span></p>
    </div>
  </div>
);

const LowerCards = () => {
  const [upcomingTransactions, setUpcomingTransactions] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactions, bills, loans] = await Promise.all([
          dashboardApi.getUpcomingTransactions(),
          dashboardApi.getRecentBills(),
          dashboardApi.getActiveLoans(),
        ]);

        setUpcomingTransactions(Array.isArray(transactions) ? transactions : transactions.data || []);
        setRecentBills(Array.isArray(bills) ? bills : []);
        setActiveLoans(Array.isArray(loans) ? loans : loans.loans || []);
      } catch (error) {
        console.error('Error fetching lower cards data:', error);
        setUpcomingTransactions([]);
        setRecentBills([]);
        setActiveLoans([]);
      }
    };
    fetchData();
  }, []);

  // Format upcoming transactions
  const formattedTransactions = upcomingTransactions.map((item: any) => ({
    icon: item.icon || '📅',
    title: item.title || item.name || 'Transaction',
    amount: formatCurrency(item.amount || 0),
    date: formatDate(item.nextDate || item.date || item.dueDate),
    frequency: item.frequency || item.recurrenceType || 'One-time',
  }));

  // Format recent bills
  const formattedBills = recentBills.map((bill: any) => {
    const totalParticipants = bill.participants?.length || 1;
    const paidParticipants = bill.participants?.filter((p: any) => p.paid).length || (bill.status === 'PAID' ? 1 : 0);
    return {
      icon: '🍽️',
      title: bill.description || bill.title || 'Bill',
      total: formatCurrency(bill.totalAmount || bill.amount || 0),
      paid: `${paidParticipants}/${totalParticipants}`,
      status: bill.status === 'PAID' ? 'Paid' : 'Pending',
    };
  });

  // Format active loans
  const formattedLoans = activeLoans.map((loan: any) => ({
    icon: '💰',
    title: loan.title || loan.name || loan.description || 'Loan',
    remaining: formatCurrency(loan.remainingAmount || loan.remainingBalance || 0),
    due: formatDate(loan.dueDate || loan.endDate),
    status: 'Active',
  }));

  return (
    <div className="space-y-6">
      {/* Upcoming Transactions */}
      {formattedTransactions.length > 0 && (
        <div className="bg-card p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Upcoming Transactions</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {formattedTransactions.map((item, index) => (
              <CardUpcoming key={index} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Bills */}
      {formattedBills.length > 0 && (
        <div className="bg-card p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Recent Bills</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {formattedBills.map((item, index) => (
              <CardBills key={index} {...item} />
            ))}
          </div>
        </div>
      )}

      {/* Active Loans */}
      {formattedLoans.length > 0 && (
        <div className="bg-card p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Active Loans</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {formattedLoans.map((item, index) => (
              <CardLoans key={index} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LowerCards;