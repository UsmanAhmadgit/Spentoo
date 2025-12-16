import axiosClient from "./axiosClient";
import { incomeApi } from "./incomeApi";
import { expenseApi } from "./expenseApi";
import { loanApi } from "./loanApi";
import { billApi } from "./billApi";
import { categoryApi } from "./categoryApi";

export const dashboardApi = {
  // Get dashboard summary (if backend has a dedicated endpoint)
  getSummary: async () => {
    try {
      const response = await axiosClient.get("/dashboard/summary");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, calculate from income and expenses
      return dashboardApi.calculateSummary();
    }
  },

  // Calculate summary from income and expense data
  calculateSummary: async () => {
    try {
      const [incomes, expenses] = await Promise.all([
        incomeApi.getAll(),
        expenseApi.getAll(),
      ]);

      const incomeArray = Array.isArray(incomes) ? incomes : incomes.incomes || [];
      const expenseArray = Array.isArray(expenses) ? expenses : expenses.expenses || [];

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Helper function to parse date safely
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      // Calculate totals for current month
      const totalIncome = incomeArray
        .filter(inc => {
          const date = parseDate(inc.transactionDate || inc.date || inc.incomeDate);
          if (!date) return false;
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

      const totalExpenses = expenseArray
        .filter(exp => {
          const date = parseDate(exp.transactionDate || exp.date || exp.expenseDate);
          if (!date) return false;
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      const totalSavings = totalIncome - totalExpenses;

      // Fetch remaining loan amount
      let remainingLoan = 0;
      try {
        remainingLoan = await loanApi.getRemainingLoan();
      } catch (error) {
        console.error("Error fetching remaining loan:", error);
        // Keep remainingLoan as 0 if loan API fails
      }

      return {
        totalIncome,
        totalExpenses,
        totalSavings,
        remainingLoan,
      };
    } catch (error) {
      console.error("Error calculating summary:", error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        remainingLoan: 0,
      };
    }
  },

  // Get monthly income vs expenses data for bar chart
  getMonthlyData: async () => {
    try {
      const response = await axiosClient.get("/dashboard/monthly");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, calculate from income and expenses
      return dashboardApi.calculateMonthlyData();
    }
  },

  calculateMonthlyData: async () => {
    try {
      const [incomes, expenses] = await Promise.all([
        incomeApi.getAll(),
        expenseApi.getAll(),
      ]);

      const incomeArray = Array.isArray(incomes) ? incomes : incomes.incomes || [];
      const expenseArray = Array.isArray(expenses) ? expenses : expenses.expenses || [];

      // Helper function to parse date safely
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      // Get last 6 months
      const months = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        const monthIncome = incomeArray
          .filter(inc => {
            const incDate = parseDate(inc.transactionDate || inc.date || inc.incomeDate);
            if (!incDate) return false;
            return incDate.getMonth() === monthIndex && incDate.getFullYear() === year;
          })
          .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

        const monthExpense = expenseArray
          .filter(exp => {
            const expDate = parseDate(exp.transactionDate || exp.date || exp.expenseDate);
            if (!expDate) return false;
            return expDate.getMonth() === monthIndex && expDate.getFullYear() === year;
          })
          .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

        months.push({
          month: monthNames[monthIndex],
          income: monthIncome,
          expense: monthExpense,
        });
      }

      return months;
    } catch (error) {
      console.error("Error calculating monthly data:", error);
      return [];
    }
  },

  // Get category breakdown for pie chart
  getCategoryBreakdown: async () => {
    try {
      const response = await axiosClient.get("/dashboard/category-breakdown");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, calculate from expenses
      return dashboardApi.calculateCategoryBreakdown();
    }
  },

  calculateCategoryBreakdown: async () => {
    try {
      const [expenses, categories] = await Promise.all([
        expenseApi.getAll(),
        categoryApi.getAll(),
      ]);

      const expenseArray = Array.isArray(expenses) ? expenses : expenses.expenses || [];
      const categoryArray = Array.isArray(categories) ? categories : categories.categories || [];

      // Get current month expenses
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Helper function to parse date safely
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      const currentMonthExpenses = expenseArray.filter(exp => {
        const expDate = parseDate(exp.transactionDate || exp.date || exp.expenseDate);
        if (!expDate) return false;
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      });

      // Group by category
      const categoryMap = new Map();
      const colors = [
        'hsl(0, 84%, 60%)', 'hsl(122, 39%, 49%)', 'hsl(217, 91%, 60%)',
        'hsl(25, 95%, 53%)', 'hsl(291, 47%, 51%)', 'hsl(187, 71%, 50%)',
        'hsl(122, 39%, 57%)', 'hsl(14, 100%, 63%)', 'hsl(0, 0%, 62%)'
      ];

      currentMonthExpenses.forEach(exp => {
        const categoryId = exp.categoryId || exp.category?.id;
        const category = categoryArray.find(c => (c.id || c.categoryId) === categoryId);
        const categoryName = category?.name || 'Unknown';
        const amount = Number(exp.amount) || 0;

        if (categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, categoryMap.get(categoryName) + amount);
        } else {
          categoryMap.set(categoryName, amount);
        }
      });

      // Convert to array format
      let colorIndex = 0;
      const breakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        color: colors[colorIndex++ % colors.length],
      }));

      return breakdown;
    } catch (error) {
      console.error("Error calculating category breakdown:", error);
      return [];
    }
  },

  // Get upcoming transactions (recurring)
  getUpcomingTransactions: async () => {
    try {
      const response = await axiosClient.get("/recurring-transactions/upcoming");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, try to get all and filter
      try {
        const recurring = await axiosClient.get("/recurring-transactions");
        const recurringArray = Array.isArray(recurring.data) ? recurring.data : [];
        // Filter for upcoming transactions (you may need to adjust this logic)
        return recurringArray.filter(t => t.isActive !== false).slice(0, 5);
      } catch (err) {
        return [];
      }
    }
  },

  // Get recent bills
  getRecentBills: async () => {
    try {
      const bills = await billApi.getAll();
      const billsArray = Array.isArray(bills) ? bills : bills.bills || [];
      // Get last 3 bills, sorted by date
      return billsArray
        .sort((a, b) => new Date(b.billDate || b.date) - new Date(a.billDate || a.date))
        .slice(0, 3);
    } catch (error) {
      return [];
    }
  },

  // Get active loans
  getActiveLoans: async () => {
    try {
      const loans = await loanApi.getAll();
      const loansArray = Array.isArray(loans) ? loans : loans.loans || [];
      // Filter active loans and get first 3
      return loansArray
        .filter(loan => {
          const remaining = Number(loan.remainingAmount) || Number(loan.remainingBalance) || 0;
          return remaining > 0;
        })
        .slice(0, 3);
    } catch (error) {
      return [];
    }
  },
};

