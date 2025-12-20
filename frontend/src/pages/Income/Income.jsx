import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { incomeApi } from '../../api/incomeApi';
import { categoryApi } from '../../api/categoryApi';

// Category Icons & Colors Mapping (same as Categories and Expenses modules)
const CATEGORY_ICONS = {
  Food: { icon: "🍔", color: "#FF7043" },
  Groceries: { icon: "🛒", color: "#66BB6A" },
  Transport: { icon: "🚗", color: "#42A5F5" },
  Fuel: { icon: "⛽", color: "#FFA726" },
  Salary: { icon: "💰", color: "#8E24AA" },
  Entertainment: { icon: "🎬", color: "#FFCA28" },
  Shopping: { icon: "🛍️", color: "#AB47BC" },
  Education: { icon: "📚", color: "#29B6F6" },
  Health: { icon: "💊", color: "#FF5252" },
  Utilities: { icon: "💡", color: "#4CAF50" },
  Rent: { icon: "🏠", color: "#795548" },
  Insurance: { icon: "🛡️", color: "#607D8B" },
  Savings: { icon: "🏦", color: "#009688" },
  Investment: { icon: "📈", color: "#3F51B5" },
  'Loan Payments': { icon: "💳", color: "#E91E63" },
  'Loan Repayments': { icon: "💵", color: "#4CAF50" },
  'Recurring Payments': { icon: "🔄", color: "#FF9800" },
  Online: { icon: "🌐", color: "#2196F3" },
  'Video Gaming': { icon: "🎮", color: "#9C27B0" },
  Gaming: { icon: "🎮", color: "#9C27B0" },
  Freelance: { icon: "🧾", color: "#2196F3" },
  Gift: { icon: "🎁", color: "#FF7043" },
  Bonus: { icon: "✨", color: "#009688" },
  'Monthly Income': { icon: "📅", color: "#4CAF50" },
  'Monthly inome': { icon: "📅", color: "#4CAF50" }, // Common misspelling - should be "Monthly Income"
  'Monthy Income': { icon: "📅", color: "#4CAF50" }, // Common misspelling
  'Montly Income': { icon: "📅", color: "#4CAF50" }, // Common misspelling
  Default: { icon: "📂", color: "#BDBDBD" }
};

// Helper to get category style (case-insensitive)
const getCategoryStyle = (name) => {
  if (!name) return CATEGORY_ICONS.Default;
  
  // Try exact match first
  if (CATEGORY_ICONS[name]) {
    return CATEGORY_ICONS[name];
  }
  
  // Try case-insensitive match
  const normalizedName = name.trim();
  const matchingKey = Object.keys(CATEGORY_ICONS).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  if (matchingKey) {
    return CATEGORY_ICONS[matchingKey];
  }
  
  return CATEGORY_ICONS.Default;
};

// Formatting Helpers
const formatAmount = (num) => {
  if (num === undefined || num === null) return 'Rs 0.00';
  return `Rs ${Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return '';
  }
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

// Helper to extract error message from API error (filters out localhost URLs)
const getErrorMessage = (error) => {
    let message = '';
    
    if (error?.response?.data) {
        if (typeof error.response.data === 'object') {
            message = error.response.data.message || 
                     error.response.data.error || 
                     (Array.isArray(Object.values(error.response.data)[0]) 
                        ? Object.values(error.response.data)[0][0] 
                        : Object.values(error.response.data)[0]) || 
                     'An error occurred';
        } else if (typeof error.response.data === 'string') {
            message = error.response.data;
        }
    } else if (error?.message) {
        message = error.message;
    } else {
        message = 'An unexpected error occurred';
    }
    
    // Remove localhost URLs, IP addresses, and clean up the message
    message = message
        .replace(/https?:\/\/[^\s]+/g, '') // Remove full URLs
        .replace(/localhost[^\s]*/gi, '') // Remove localhost references
        .replace(/127\.0\.0\.1[^\s]*/gi, '') // Remove 127.0.0.1 references
        .replace(/:\d+[^\s]*/g, '') // Remove port numbers
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    
    // If message is empty after cleaning, provide a default
    if (!message || message.length === 0) {
        message = 'An error occurred. Please try again.';
    }
    
    return message;
};

const Income = () => {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : false;
  });
  const toggleSidebar = useCallback(() => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  }, [sidebarOpen]);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  }, []);

  // State Management
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  
  // Toast notification state
  const [toast, setToast] = useState(null); // { message: string, type: 'success'|'error' }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { incomeId: number, incomeDescription: string }
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState(() => {
    const saved = localStorage.getItem('income_date_filter') || 'all';
    return saved === 'custom' ? 'all' : saved;
  });
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    source: '',
    description: '',
    transactionDate: getTodayDate(),
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to show toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch all incomes - memoized
  const fetchIncomes = useCallback(async (filter = null, startDate = null, endDate = null) => {
    try {
      const response = await incomeApi.getAll(filter, startDate, endDate);
      const incomesData = Array.isArray(response) ? response : response.incomes || [];
      
      // Process incomes: normalize field names and add category icon/color
      const processedIncomes = incomesData.map(inc => {
        const categoryObj = inc.category || {};
        const categoryId = categoryObj.categoryId || categoryObj.id || inc.categoryId;
        const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown';
        
        // Get category style from mapping as fallback
        const mappedStyle = getCategoryStyle(categoryName);
        
        // Check if category name matches a predefined category (not Default)
        const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
          key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
        );
        
        // For predefined categories, always use mapped icon to ensure correct icon
        // For custom categories, use database icon if valid, otherwise use mapped icon
        let finalIcon;
        if (isPredefinedCategory) {
          // Always use mapped icon for predefined categories (Salary, Freelance, etc.)
          finalIcon = mappedStyle.icon;
        } else {
          // For custom categories, use database icon if valid, otherwise use mapped icon
          const dbIcon = (categoryObj.icon && categoryObj.icon.trim() !== '' && categoryObj.icon.trim() !== '??') 
            ? categoryObj.icon.trim() 
            : null;
          finalIcon = dbIcon || mappedStyle.icon;
        }
        
        const dbColor = (categoryObj.color && categoryObj.color.trim() !== '') ? categoryObj.color.trim() : null;
        const finalColor = dbColor || mappedStyle.color;
        
        const incomeId = inc.incomeId || inc.id;
        const incomeDate = inc.transactionDate;
        
        return {
          id: incomeId,
          incomeId: incomeId,
          categoryId: categoryId,
          amount: inc.amount,
          source: inc.source || '',
          description: inc.description || '',
          transactionDate: incomeDate,
          categoryName: categoryName,
          categoryIcon: finalIcon,
          categoryColor: finalColor,
        };
      })
      // Sort by date descending
      .sort((a, b) => {
        const dateA = new Date(a.transactionDate || 0);
        const dateB = new Date(b.transactionDate || 0);
        return dateB - dateA;
      });
      
      setIncomes(processedIncomes);
    } catch (error) {
      setIncomes([]);
      const errorMessage = getErrorMessage(error);
      showToast(`Failed to load incomes: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch categories - memoized
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryApi.getAll();
      const categoriesData = Array.isArray(response) ? response : response.categories || [];
      
      // Normalize categories and filter for INCOME type
      const normalizedCategories = categoriesData
        .filter(c => c.type === 'INCOME' || c.type === 'Income')
        .map(c => ({
          id: c.categoryId || c.id,
          categoryId: c.categoryId || c.id,
          name: c.categoryName || c.name,
          categoryName: c.categoryName || c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
        }));
      
      setCategories(normalizedCategories);
    } catch (error) {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (dateFilter !== 'custom') {
      const filterValue = dateFilter === 'all' ? null : dateFilter;
      fetchIncomes(filterValue);
    }
  }, [fetchIncomes, dateFilter]);

  // Handler to change date filter
  const handleFilterChange = useCallback((filter) => {
    setDateFilter(filter);
    localStorage.setItem('income_date_filter', filter);
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateRange(false);
  }, []);

  // Handler for custom date range
  const handleCustomDateRange = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      showToast('Please select both start and end dates.', 'error');
      return;
    }
    
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    if (start > end) {
      showToast('Start date cannot be after end date.', 'error');
      return;
    }
    
    setDateFilter('custom');
    localStorage.setItem('income_date_filter', 'custom');
    fetchIncomes(null, customStartDate, customEndDate);
  }, [customStartDate, customEndDate, fetchIncomes, showToast]);

  // Handler to clear custom date range
  const handleClearCustomDateRange = useCallback(() => {
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDateRange(false);
    setDateFilter('all');
    localStorage.setItem('income_date_filter', 'all');
  }, []);

  // Summary Calculations - memoized
  const summaryData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalIncomeThisMonth = incomes
      .filter(inc => {
        if (!inc.transactionDate) return false;
        try {
          const date = new Date(inc.transactionDate);
          if (isNaN(date.getTime())) return false;
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

    const categoryTotals = incomes.reduce((acc, inc) => {
      const catName = inc.categoryName || 'Other';
      acc[catName] = (acc[catName] || 0) + Number(inc.amount || 0);
      return acc;
    }, {});

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const totalTransactions = incomes.length;

    return {
      totalIncomeThisMonth,
      highestCategory: highestCategory ? highestCategory[0] : 'N/A',
      totalTransactions,
    };
  }, [incomes]);

  // Open add modal - memoized
  const handleAddIncome = useCallback(() => {
    setEditingIncome(null);
    setFormData({
      categoryId: '',
      amount: '',
      source: '',
      description: '',
      transactionDate: getTodayDate(),
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  }, []);

  // Open edit modal - memoized
  const handleEditIncome = useCallback((income) => {
    setEditingIncome(income);
    const incomeDate = income.transactionDate;
    let dateStr = getTodayDate();
    if (incomeDate) {
      try {
        const dateObj = new Date(incomeDate);
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toISOString().substring(0, 10);
        }
      } catch (e) {
        // Invalid date format - skip
      }
    }
    
    setFormData({
      categoryId: income.categoryId || '',
      amount: income.amount || '',
      source: income.source || '',
      description: income.description || '',
      transactionDate: dateStr,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  }, []);

  // Handle form change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  // Form Validation
  const validate = useCallback(() => {
    const errors = {};
    if (!formData.categoryId) {
      errors.categoryId = 'Please select an income category.';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Amount is required and must be greater than 0.';
    }
    if (!formData.transactionDate) {
      errors.transactionDate = 'Please provide a valid date.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle save (create or update) - memoized
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    const isEditMode = !!editingIncome;

    try {
      // Prepare payload
      const payload = {
        categoryId: Number(formData.categoryId),
        amount: Number(formData.amount),
      };

      // Include optional fields
      if (formData.source && formData.source.trim()) {
        payload.source = formData.source.trim();
      }
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      // Include transactionDate - send as YYYY-MM-DD string
      if (formData.transactionDate) {
        payload.transactionDate = formData.transactionDate; // Already in YYYY-MM-DD format
      }

      // For edit mode, include categoryId and date if changed
      if (isEditMode) {
        const expenseId = editingIncome.id || editingIncome.incomeId;
        const result = await incomeApi.update(expenseId, payload);
        
        // Update local state
        setIncomes(prevIncomes => {
          const categoryObj = result.category || {};
          const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown';
          const mappedStyle = getCategoryStyle(categoryName);
          
          // Check if category name matches a predefined category (not Default)
          const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
            key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
          );
          
          // For predefined categories, always use mapped icon to ensure correct icon
          // For custom categories, use database icon if valid, otherwise use mapped icon
          let finalIcon;
          if (isPredefinedCategory) {
            // Always use mapped icon for predefined categories
            finalIcon = mappedStyle.icon;
          } else {
            // For custom categories, use database icon if valid, otherwise use mapped icon
            const dbIcon = (categoryObj.icon && categoryObj.icon.trim() !== '' && categoryObj.icon.trim() !== '??') 
              ? categoryObj.icon.trim() 
              : null;
            finalIcon = dbIcon || mappedStyle.icon;
          }
          
          const dbColor = (categoryObj.color && categoryObj.color.trim() !== '') ? categoryObj.color.trim() : null;
          
          return prevIncomes.map(inc => {
            const currentId = inc.id || inc.incomeId;
            const resultId = result.incomeId || result.id;
            if (currentId === resultId) {
              return {
                ...inc,
                categoryId: categoryObj.categoryId || categoryObj.id || result.categoryId,
                amount: result.amount,
                source: result.source || '',
                description: result.description || '',
                transactionDate: result.transactionDate,
                categoryName: categoryName,
                categoryIcon: finalIcon,
                categoryColor: dbColor || mappedStyle.color,
              };
            }
            return inc;
          }).sort((a, b) => {
            const dateA = new Date(a.transactionDate || 0);
            const dateB = new Date(b.transactionDate || 0);
            return dateB - dateA;
          });
        });
        
        showToast('Income updated successfully!', 'success');
      } else {
        // Create mode
        const result = await incomeApi.create(payload);
        
        // Add to local state
        const categoryObj = result.category || {};
        const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown';
        const mappedStyle = getCategoryStyle(categoryName);
        
        // Check if category name matches a predefined category (not Default)
        const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
          key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
        );
        
        // For predefined categories, always use mapped icon to ensure correct icon
        // For custom categories, use database icon if valid, otherwise use mapped icon
        let finalIcon;
        if (isPredefinedCategory) {
          // Always use mapped icon for predefined categories
          finalIcon = mappedStyle.icon;
        } else {
          // For custom categories, use database icon if valid, otherwise use mapped icon
          const dbIcon = (categoryObj.icon && categoryObj.icon.trim() !== '' && categoryObj.icon.trim() !== '??') 
            ? categoryObj.icon.trim() 
            : null;
          finalIcon = dbIcon || mappedStyle.icon;
        }
        
        const dbColor = (categoryObj.color && categoryObj.color.trim() !== '') ? categoryObj.color.trim() : null;
        
        const newIncome = {
          id: result.incomeId || result.id,
          incomeId: result.incomeId || result.id,
          categoryId: categoryObj.categoryId || categoryObj.id || result.categoryId,
          amount: result.amount,
          source: result.source || '',
          description: result.description || '',
          transactionDate: result.transactionDate,
          categoryName: categoryName,
          categoryIcon: finalIcon,
          categoryColor: dbColor || mappedStyle.color,
        };
        
        setIncomes(prevIncomes => [newIncome, ...prevIncomes].sort((a, b) => {
          const dateA = new Date(a.transactionDate || 0);
          const dateB = new Date(b.transactionDate || 0);
          return dateB - dateA;
        }));
        
        showToast('Income added successfully!', 'success');
      }

      // Close modal and reset form
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setEditingIncome(null);
      setFormData({
        categoryId: '',
        amount: '',
        source: '',
        description: '',
        transactionDate: getTodayDate(),
      });
      setFormErrors({});
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(`Failed to save income: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingIncome, validate, showToast]);

  // Handle delete click - show confirmation modal
  const handleDeleteClick = useCallback((income) => {
    const description = income.description || income.source || income.categoryName || 'this income record';
    setDeleteConfirm({
      incomeId: income.id || income.incomeId,
      incomeDescription: description
    });
  }, []);

  // Handle confirmed delete
  const handleDeleteIncome = useCallback(async (incomeId) => {
    const originalIncomes = incomes;
    setIncomes(prevIncomes => prevIncomes.filter(inc => (inc.id || inc.incomeId) !== incomeId));
    setDeleteConfirm(null); // Close confirmation dialog

    try {
      await incomeApi.delete(incomeId);
      showToast('Income deleted successfully.', 'success');
    } catch (error) {
      setIncomes(originalIncomes); // Rollback
      const errorMessage = getErrorMessage(error);
      showToast(`Failed to delete income: ${errorMessage}`, 'error');
    }
  }, [incomes, showToast]);

  // Cancel delete confirmation
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onMenuClick={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className={cn("pt-16 transition-all duration-300", sidebarOpen ? "lg:pl-56" : "lg:pl-0")}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "lg:pl-56" : "lg:pl-0"
        )}
      >
        <div style={styles.container}>
          {/* Page Title */}
          <div style={styles.titleContainer}>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] bg-clip-text text-transparent">
              Your Income
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage your income sources and track earnings</p>
          </div>

          {/* Summary Cards */}
          <div style={styles.summaryContainer}>
            <div style={styles.summaryCard}>
              <div style={styles.cardEmoji}>💰</div>
              <div style={styles.cardValue}>{formatAmount(summaryData.totalIncomeThisMonth)}</div>
              <div style={styles.cardLabel}>Total Income This Month</div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.cardEmoji}>📊</div>
              <div style={styles.cardValue}>{summaryData.highestCategory}</div>
              <div style={styles.cardLabel}>Highest Income Category</div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.cardEmoji}>🔢</div>
              <div style={styles.cardValue}>{summaryData.totalTransactions}</div>
              <div style={styles.cardLabel}>Total Transactions</div>
            </div>
          </div>

          {/* Date Filter Buttons */}
          <div className="mt-6 mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      dateFilter === 'all' && !showCustomDateRange
                        ? 'bg-[#7E57C2] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterChange('lastweek')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      dateFilter === 'lastweek'
                        ? 'bg-[#7E57C2] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Last Week
                  </button>
                  <button
                    onClick={() => handleFilterChange('lastmonth')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      dateFilter === 'lastmonth'
                        ? 'bg-[#7E57C2] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => handleFilterChange('lastyear')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      dateFilter === 'lastyear'
                        ? 'bg-[#7E57C2] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Last Year
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomDateRange(!showCustomDateRange);
                      if (!showCustomDateRange) {
                        setDateFilter('custom');
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      showCustomDateRange || dateFilter === 'custom'
                        ? 'bg-[#7E57C2] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>
              
              {/* Custom Date Range Picker */}
              {showCustomDateRange && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="incomeStartDate" className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      id="incomeStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="incomeEndDate" className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      id="incomeEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      max={getTodayDate()}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomDateRange}
                      className="px-4 py-2 bg-[#7E57C2] text-white rounded-md text-sm font-semibold hover:bg-[#6d47b3] transition"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleClearCustomDateRange}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Income Button */}
          <div style={styles.addButtonContainer}>
            <button onClick={handleAddIncome} style={styles.addButton}>
              Add Income
            </button>
          </div>

          {/* Income Table */}
          <div style={styles.tableContainer}>
            {incomes.length === 0 ? (
              <div style={styles.emptyState}>No income records found</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Amount</th>
                    <th style={styles.tableHeaderCell}>Source</th>
                    <th style={styles.tableHeaderCell}>Description</th>
                    <th style={styles.tableHeaderCell}>Date</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => {
                    return (
                      <tr key={income.id || income.incomeId} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <div style={styles.categoryCell}>
                            <span
                              style={{
                                ...styles.colorDot,
                                backgroundColor: income.categoryColor || CATEGORY_ICONS.Default.color,
                              }}
                            />
                            <span style={{ ...styles.categoryIcon, fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Android Emoji' }}>
                              {income.categoryIcon || CATEGORY_ICONS.Default.icon}
                            </span>
                            <span>{income.categoryName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>{formatAmount(income.amount)}</td>
                        <td style={styles.tableCell}>{income.source || '—'}</td>
                        <td style={styles.tableCell}>{income.description || '—'}</td>
                        <td style={styles.tableCell}>{formatDate(income.transactionDate)}</td>
                        <td style={styles.tableCell}>
                          <button
                            onClick={() => handleEditIncome(income)}
                            style={styles.editButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(income)}
                            style={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Add/Edit Modal */}
          {(isAddModalOpen || isEditModalOpen) && (
            <div style={styles.modalBackdrop} onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setEditingIncome(null);
            }}>
              <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2 style={styles.modalTitle}>
                  {editingIncome ? 'Edit Income' : 'Add Income'}
                </h2>

                <div style={styles.formWrapper}>
                  {/* Category Dropdown */}
                  <div style={styles.inputContainer}>
                    <label htmlFor="categoryId" style={styles.label}>
                      Category <span style={{ color: '#E53935' }}>*</span>
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      style={{
                        ...styles.select,
                        borderBottomColor: formErrors.categoryId ? '#E53935' : '#1E88E5'
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => {
                        const mappedStyle = getCategoryStyle(cat.name || cat.categoryName);
                        return (
                          <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
                            {mappedStyle.icon} {cat.name || cat.categoryName}
                          </option>
                        );
                      })}
                    </select>
                    {formErrors.categoryId && <span style={styles.error}>{formErrors.categoryId}</span>}
                  </div>

                  {/* Amount Input */}
                  <div style={styles.inputContainer}>
                    <label htmlFor="amount" style={styles.label}>
                      Amount (Rs) <span style={{ color: '#E53935' }}>*</span>
                    </label>
                    <div style={styles.amountInputWrapper}>
                      <span style={styles.currencySymbol}>Rs</span>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        inputMode="decimal"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        style={{
                          ...styles.input,
                          borderBottomColor: formErrors.amount ? '#E53935' : '#1E88E5',
                          paddingLeft: '30px'
                        }}
                        step="0.01"
                        required
                      />
                    </div>
                    {formErrors.amount && <span style={styles.error}>{formErrors.amount}</span>}
                  </div>

                  {/* Source Input */}
                  <div style={styles.inputContainer}>
                    <label htmlFor="source" style={styles.label}>
                      Source (Optional)
                    </label>
                    <input
                      id="source"
                      name="source"
                      type="text"
                      value={formData.source}
                      onChange={handleChange}
                      placeholder="e.g., Employer Name, Client Name"
                      style={styles.input}
                    />
                  </div>

                  {/* Description Input */}
                  <div style={styles.inputContainer}>
                    <label htmlFor="description" style={styles.label}>
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add any additional details"
                      rows={3}
                      style={styles.textarea}
                    />
                  </div>

                  {/* Transaction Date Input */}
                  <div style={styles.inputContainer}>
                    <label htmlFor="transactionDate" style={styles.label}>
                      Date <span style={{ color: '#E53935' }}>*</span>
                    </label>
                    <input
                      id="transactionDate"
                      name="transactionDate"
                      type="date"
                      value={formData.transactionDate}
                      onChange={handleChange}
                      style={{
                        ...styles.input,
                        borderBottomColor: formErrors.transactionDate ? '#E53935' : '#1E88E5'
                      }}
                      required
                    />
                    {formErrors.transactionDate && <span style={styles.error}>{formErrors.transactionDate}</span>}
                  </div>
                </div>

                {/* Modal Actions */}
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setEditingIncome(null);
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      ...styles.submitButton,
                      opacity: isSaving ? 0.6 : 1,
                      cursor: isSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSaving ? 'Saving...' : (editingIncome ? 'Update' : 'Add')} Income
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Toast Notification */}
          {toast && (
            <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50 ${
              toast.type === 'success' ? 'bg-[#43A047]' : 'bg-[#E53935]'
            }`}>
              {toast.message}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                 role="dialog" aria-modal="true" aria-label="Confirm Delete"
                 onClick={handleCancelDelete}
            >
              <div className="bg-white rounded-2xl w-full max-w-md p-6 z-50 shadow-2xl"
                   onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Income</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.incomeDescription}"</span>? 
                  This action cannot be undone.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteIncome(deleteConfirm.incomeId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
  },
  titleContainer: {
    marginBottom: '30px',
  },
  summaryContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  summaryCard: {
    flex: '1 1 300px',
    minWidth: '250px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  },
  cardEmoji: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  cardValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: '5px',
  },
  cardLabel: {
    fontSize: '14px',
    color: '#757575',
  },
  addButtonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  addButton: {
    background: 'linear-gradient(135deg, #7E57C2 0%, #8E24AA 100%)',
    color: 'white',
    padding: '10px 25px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    backgroundColor: '#F5F5F5',
  },
  tableHeaderCell: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#424242',
    padding: '16px',
    textAlign: 'left',
    borderBottom: '2px solid #E0E0E0',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#F3E5F5',
    },
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#212121',
    borderBottom: '1px solid #F0F0F0',
  },
  categoryCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  categoryIcon: {
    fontSize: '18px',
  },
  editButton: {
    textTransform: 'none',
    color: '#7E57C2',
    marginRight: '8px',
    padding: '6px 12px',
    border: '1px solid #7E57C2',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteButton: {
    textTransform: 'none',
    color: '#E53935',
    padding: '6px 12px',
    border: '1px solid #E53935',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    fontSize: '16px',
    color: '#757575',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#212121',
    marginBottom: '20px',
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputContainer: {
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#424242',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 0 8px 0',
    fontSize: '16px',
    border: 'none',
    borderBottom: '2px solid #1E88E5',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  amountInputWrapper: {
    position: 'relative',
  },
  currencySymbol: {
    position: 'absolute',
    left: 0,
    top: '12px',
    color: '#757575',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #E0E0E0',
    borderRadius: '8px',
    backgroundColor: '#FAFAFA',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
  },
  select: {
    width: '100%',
    padding: '12px 0 8px 0',
    fontSize: '16px',
    border: 'none',
    borderBottom: '2px solid #1E88E5',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  error: {
    display: 'block',
    color: '#E53935',
    fontSize: '12px',
    marginTop: '4px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#E0E0E0',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #7E57C2 0%, #8E24AA 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default Income;
