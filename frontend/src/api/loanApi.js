import axiosClient from "./axiosClient";

export const loanApi = {
  getAll: async (includeClosed = false) => {
    const response = await axiosClient.get(`/loans?includeClosed=${includeClosed}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/loans/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/loans", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/loans/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/loans/${id}`);
    return response.data;
  },

  addInstallment: async (loanId, data) => {
    const response = await axiosClient.post(`/loans/${loanId}/installments`, data);
    return response.data;
  },

  closeLoan: async (loanId) => {
    const response = await axiosClient.put(`/loans/${loanId}/close`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await axiosClient.get("/loans/analytics");
    return response.data;
  },

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

