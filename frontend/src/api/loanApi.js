import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache loans for 5 minutes (data changes frequently)
const LOAN_CACHE_TTL = 5 * 60 * 1000;

const getAllLoans = async (includeClosed = false, filter = null, startDate = null, endDate = null) => {
    const params = { includeClosed };
    
    // Custom date range takes priority
    // Check if startDate and endDate are valid strings (not null, not empty)
    const hasValidDates = startDate && 
                         endDate && 
                         typeof startDate === 'string' && 
                         typeof endDate === 'string' &&
                         startDate.trim() !== '' && 
                         endDate.trim() !== '' &&
                         startDate.trim().toLowerCase() !== 'null' &&
                         endDate.trim().toLowerCase() !== 'null';
    
    if (hasValidDates) {
      // Handle both YYYY-MM-DD format and ISO datetime format
      params.startDate = startDate.includes('T') ? startDate.split('T')[0] : startDate;
      params.endDate = endDate.includes('T') ? endDate.split('T')[0] : endDate;
    } else if (filter && typeof filter === 'string' && filter.trim() !== '' && filter.trim().toLowerCase() !== 'null') {
      // Use filter parameter for preset filters (lastweek, lastmonth, lastyear)
      // Only add filter to params if it's a valid non-null string
      params.filter = filter.trim();
    }
    try {
      const response = await axiosClient.get("/loans", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
};

export const loanApi = {
  getAll: withCache(
    getAllLoans,
    (includeClosed, filter, startDate, endDate) => {
      const params = { includeClosed, filter, startDate, endDate };
      return `loans_all_${JSON.stringify(params)}`;
    },
    LOAN_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/loans/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/loans", data);
    apiCache.invalidate('loans'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/loans/${id}`, data);
    apiCache.invalidate('loans'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/loans/${id}`);
    apiCache.invalidate('loans'); // Invalidate cache on delete
    return response.data;
  },

  addInstallment: async (loanId, data) => {
    const response = await axiosClient.post(`/loans/${loanId}/installments`, data);
    apiCache.invalidate('loans'); // Invalidate cache on installment add
    return response.data;
  },

  deleteInstallment: async (loanId, installmentId) => {
    const response = await axiosClient.delete(`/loans/${loanId}/installments/${installmentId}`);
    apiCache.invalidate('loans'); // Invalidate cache on installment delete
    return response.data;
  },

  closeLoan: async (loanId) => {
    const response = await axiosClient.put(`/loans/${loanId}/close`);
    apiCache.invalidate('loans'); // Invalidate cache on close
    return response.data;
  },

  getAnalytics: withCache(
    async () => {
      const response = await axiosClient.get("/loans/analytics");
      return response.data;
    },
    () => 'loans_analytics',
    LOAN_CACHE_TTL
  ),

  // Get total remaining loan amount
  getRemainingLoan: async () => {
    try {
      const loans = await loanApi.getAll(false);
        const loansArray = Array.isArray(loans) ? loans : loans.loans || [];
        return loansArray.reduce((sum, loan) => {
          const remaining = Number(loan.remainingAmount) || Number(loan.remainingBalance) || 0;
          return sum + remaining;
        }, 0);
      } catch (err) {
        console.error("Error calculating remaining loan:", err);
        return 0;
    }
  },
};

