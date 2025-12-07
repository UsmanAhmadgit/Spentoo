import React from "react";
import SummaryCards from "../../components/Cards/SummaryCard";
import BarChart from "../../components/Charts/BarChart";
import PieChart from "../../components/Charts/PieChart";

// Inline Card Components
const CardUpcoming = ({ icon, title, amount, date, frequency }) => (
  <div className="w-64 p-4 bg-white rounded-lg shadow-md flex-shrink-0">
    <div className="flex items-center gap-2 mb-2">
      <span>{icon}</span>
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    <p className="text-gray-700">Amount: {amount}</p>
    <p className="text-gray-700">Date: {date}</p>
    <p className="text-gray-700">Frequency: {frequency}</p>
  </div>
);

const CardBills = ({ icon, title, total, paid, status }) => (
  <div className="w-64 p-4 bg-white rounded-lg shadow-md flex-shrink-0">
    <div className="flex items-center gap-2 mb-2">
      <span>{icon}</span>
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    <p className="text-gray-700">Total: {total}</p>
    <p className="text-gray-700">Paid: {paid}</p>
    <p className="text-gray-700">Status: {status}</p>
  </div>
);

const CardLoans = ({ icon, title, remaining, due, status }) => (
  <div className="w-64 p-4 bg-white rounded-lg shadow-md flex-shrink-0">
    <div className="flex items-center gap-2 mb-2">
      <span>{icon}</span>
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    <p className="text-gray-700">Remaining: {remaining}</p>
    <p className="text-gray-700">Due: {due}</p>
    <p className="text-gray-700">Status: {status}</p>
  </div>
);

function Dashboard() {
  // Mock Data
  const upcomingTransactions = [
    { icon: "🍔", title: "Food Subscription", amount: "$50", date: "2025-12-05", frequency: "Monthly" },
    { icon: "☕", title: "Coffee Plan", amount: "$30", date: "2025-12-07", frequency: "Weekly" },
  ];

  const recentBills = [
    { icon: "🍽️", title: "Dinner with Friends", total: "$120", paid: "2/4", status: "Pending" },
    { icon: "🏠", title: "Electricity Bill", total: "$75", paid: "1/1", status: "Paid" },
  ];

  const activeLoans = [
    { icon: "💰", title: "Borrowed from Ali", remaining: "$500", due: "2025-12-10", status: "Active" },
    { icon: "🏦", title: "Bank Loan", remaining: "$2000", due: "2026-01-05", status: "Active" },
  ];

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCards />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChart />
        <PieChart />
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4">
          {upcomingTransactions.map((item, index) => (
            <CardUpcoming key={index} {...item} />
          ))}
          {recentBills.map((item, index) => (
            <CardBills key={index} {...item} />
          ))}
          {activeLoans.map((item, index) => (
            <CardLoans key={index} {...item} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
