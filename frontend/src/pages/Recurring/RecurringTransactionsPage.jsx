import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { recurringApi } from '../../api/recurringApi';

/**
 * README: Recurring Transactions Management Application
 *
 * This file implements the entire Recurring Transactions frontend page.
 * It uses recurringApi for all API interactions.
 *
 * Sorting: Transactions are sorted by nextRunDate ascending (upcoming first).
 */

// --- Utility Functions & Constants ---
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return '—';
  }
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rs 0.00';
  return `Rs ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().substring(0, 10);
  } catch (e) {
    return '';
  }
};

const getTodayDate = () => {
  const d = new Date();
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const computeMonthlyTotal = (amount, frequency) => {
  let totalMonthly;
  let approximate = false;
  const amountNum = Number(amount);
  
  switch (frequency) {
    case 'MONTHLY':
      totalMonthly = amountNum;
      break;
    case 'WEEKLY':
      totalMonthly = amountNum * 4; // Approx 4 weeks
      approximate = true;
      break;
    case 'DAILY':
      totalMonthly = amountNum * 30; // Approx 30 days
      approximate = true;
      break;
    case 'YEARLY':
      totalMonthly = amountNum / 12;
      break;
    default:
      return { totalMonthly: 0, approximate: false };
  }
  
  return { totalMonthly: totalMonthly.toFixed(2), approximate };
};

// --- Toast Component ---
const Toast = ({ message, type }) => (
  <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50 ${
    type === 'success' ? 'bg-[#43A047]' : 'bg-[#E53935]'
  }`}>
    {message}
  </div>
);

// --- Badge Component ---
const Badge = ({ children, type, className = '' }) => {
  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  
  if (type === 'EXPENSE') {
    colorClasses = 'bg-red-50 text-[#E53935] border-red-100';
  } else if (type === 'INCOME') {
    colorClasses = 'bg-green-50 text-[#43A047] border-green-100';
  } else if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(type)) {
    colorClasses = 'bg-blue-50 text-[#1E88E5] border-blue-100';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-semibold border ${colorClasses} ${className}`}>
      {children}
    </span>
  );
};

// --- RecurringRow Component ---
const RecurringRow = ({ recurring, onEdit, onDelete, onPauseResume }) => {
  // Normalize ID: backend uses recurringId, frontend may expect id
  const transactionId = recurring.recurringId || recurring.id;
  
  // Check if paused: use autoPay status (if autoPay is false, it's effectively paused)
  const isPaused = !recurring.autoPay;
  
  const { totalMonthly, approximate } = computeMonthlyTotal(recurring.amount, recurring.frequency);
  
  // Check if next run date is in the past (only relevant if autoPay=false)
  const nextRunDate = new Date(recurring.nextRunDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = !recurring.autoPay && nextRunDate < today;
  
  return (
    <div className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-transform duration-200 transform hover:-translate-y-1">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title, Description, Type, Frequency */}
        <div className="flex flex-col gap-1 w-full lg:w-4/12">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-gray-800 truncate">{recurring.title}</span>
            <Badge type={recurring.type}>{recurring.type}</Badge>
            <Badge type={recurring.frequency}>{recurring.frequency}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{recurring.description || 'No description'}</p>
        </div>
        
        {/* Center: Amount, Monthly Total, Status */}
        <div className="flex items-center justify-between w-full lg:w-5/12 gap-4 border-t lg:border-t-0 pt-3 lg:pt-0">
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-gray-500 uppercase">Amount</span>
            <span className={`text-lg font-extrabold ${recurring.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(recurring.amount)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Monthly Est.</span>
            <span className="text-md font-bold text-[#7E57C2]">
              {approximate ? `≈ ${formatCurrency(totalMonthly)}` : formatCurrency(totalMonthly)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
              isPaused ? 'bg-yellow-50 text-yellow-800' : 'bg-[#43A047]/10 text-[#43A047]'
            }`}>
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
        
        {/* Right: Dates and Actions */}
        <div className="w-full lg:w-3/12 flex flex-col sm:flex-row lg:flex-col items-end gap-3 lg:gap-2 pt-3 lg:pt-0 border-t lg:border-t-0">
          {/* Calendar Preview */}
          <div className="flex justify-between w-full text-xs text-gray-500">
            <div className="text-left">
              <span className="font-medium text-gray-700">Next Run:</span>
              <span className={`block ${isOverdue ? 'text-[#E53935] font-semibold' : 'text-[#7E57C2] font-semibold'}`}>
                {formatDisplayDate(recurring.nextRunDate)}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-2 w-full mt-2">
            {/* Edit */}
            <button
              onClick={() => onEdit(recurring)}
              className="text-xs font-medium border border-[#7E57C2] text-[#7E57C2] hover:bg-purple-50 px-3 py-1 rounded-md transition"
              aria-label="Edit Recurring Transaction"
            >
              Edit
            </button>
            
            {/* Pause / Resume */}
            <button
              onClick={() => onPauseResume(transactionId, isPaused ? 'resume' : 'pause')}
              className={`text-xs font-medium px-3 py-1 rounded-md transition ${
                isPaused
                  ? 'bg-green-50 text-[#43A047] hover:bg-green-100' // Resume
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' // Pause
              }`}
              aria-label={isPaused ? "Resume Automatic Payment" : "Pause Automatic Payment"}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            
            {/* Delete */}
            <button
              onClick={() => onDelete(recurring)}
              className="text-xs font-medium text-[#E53935] hover:text-red-800 px-2 py-1 transition"
              aria-label="Delete Recurring Transaction"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- RecurringFormModal Component ---
const RecurringFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const isEditMode = !!initialData;
  const initialFocusRef = useRef(null);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    type: initialData?.type || 'EXPENSE',
    frequency: initialData?.frequency || 'MONTHLY',
    nextRunDate: formatForInput(initialData?.nextRunDate) || getTomorrowDate(),
    autoPay: initialData?.autoPay !== undefined ? initialData.autoPay : true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Effect to handle state reset and modal controls
  useEffect(() => {
    if (isOpen) {
      setApiError('');
      setFormErrors({});
      
      // Reset form data when opening
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          amount: initialData.amount?.toString() || '',
          type: initialData.type || 'EXPENSE',
          frequency: initialData.frequency || 'MONTHLY',
          nextRunDate: formatForInput(initialData.nextRunDate) || getTomorrowDate(),
          autoPay: initialData.autoPay !== undefined ? initialData.autoPay : true,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          amount: '',
          type: 'EXPENSE',
          frequency: 'MONTHLY',
          nextRunDate: getTomorrowDate(),
          autoPay: true,
        });
      }
      
      // Set initial focus
      setTimeout(() => initialFocusRef.current?.focus(), 50);
      
      // Close on ESC key press
      const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: undefined }));
    setApiError('');
  };

  const validate = () => {
    const errors = {};
    let isValid = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required.';
      isValid = false;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0.01) {
      errors.amount = 'Amount must be greater than 0.';
      isValid = false;
    }
    
    if (!formData.frequency) {
      errors.frequency = 'Frequency is required.';
      isValid = false;
    }
    
    // Next Run Date validation: must be today or future (matching backend @FutureOrPresent)
    if (!formData.nextRunDate) {
      errors.nextRunDate = 'Next run date is required.';
      isValid = false;
    } else {
      const nextRunDate = new Date(formData.nextRunDate);
      if (nextRunDate < today) {
        errors.nextRunDate = 'Next run date cannot be in the past.';
        isValid = false;
      }
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    
    setIsSaving(true);
    
    // Prepare payload matching backend DTO structure
    const payload = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      amount: Number(formData.amount),
      type: formData.type, // "EXPENSE" or "INCOME"
      frequency: formData.frequency, // "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
      nextRunDate: formData.nextRunDate, // YYYY-MM-DD format string
      autoPay: formData.autoPay || false,
    };

    try {
      let result;
      if (isEditMode) {
        const id = initialData.recurringId || initialData.id;
        result = await recurringApi.update(id, payload);
      } else {
        result = await recurringApi.create(payload);
      }
      
      onSave(result); // Trigger list refresh
      onClose();
    } catch (error) {
      const message = error?.response?.data?.message || 
                     error?.response?.data?.error || 
                     error?.message || 
                     'Unknown network error.';
      setApiError(`Failed to save: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
      role="dialog" 
      aria-modal="true" 
      aria-label={isEditMode ? "Edit Recurring Transaction" : "Create Recurring Transaction"}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl transition-all duration-200 transform scale-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#7E57C2]">
              {isEditMode ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="p-3 mb-4 text-[#E53935] bg-red-100 rounded-lg border border-red-300 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Netflix"
                  ref={initialFocusRef}
                  className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.title && <p className="text-red-600 text-xs mt-1">{formErrors.title}</p>}
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs) *</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${
                    formErrors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.amount && <p className="text-red-600 text-xs mt-1">{formErrors.amount}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full border border-gray-300 rounded-md p-2 focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] outline-none transition"
                maxLength={300}
                placeholder="Optional description..."
              />
            </div>

            {/* Type, Frequency, Next Run Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type - Fixed to EXPENSE only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <div className="flex rounded-lg bg-gray-100 p-1 border border-gray-300">
                  <button
                    type="button"
                    className="flex-1 px-3 py-1.5 text-sm font-medium rounded-md bg-[#7E57C2] text-white shadow cursor-default"
                    disabled
                  >
                    EXPENSE
                  </button>
                </div>
              </div>
              
              {/* Frequency */}
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${
                    formErrors.frequency ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
                {formErrors.frequency && <p className="text-red-600 text-xs mt-1">{formErrors.frequency}</p>}
              </div>
              
              {/* Next Run Date */}
              <div>
                <label htmlFor="nextRunDate" className="block text-sm font-medium text-gray-700 mb-1">Next Run Date *</label>
                <input
                  id="nextRunDate"
                  name="nextRunDate"
                  type="date"
                  value={formData.nextRunDate}
                  onChange={handleChange}
                  min={getTodayDate()}
                  className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${
                    formErrors.nextRunDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.nextRunDate && <p className="text-red-600 text-xs mt-1">{formErrors.nextRunDate}</p>}
              </div>
            </div>
            
            {/* AutoPay Checkbox */}
            <div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="autoPay"
                    name="autoPay"
                    type="checkbox"
                    checked={formData.autoPay}
                    onChange={handleChange}
                    className="focus:ring-[#7E57C2] h-4 w-4 text-[#7E57C2] border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="autoPay" className="font-medium text-gray-700">Automatic Payment/Debit</label>
                  <p className="text-gray-500">If checked, this transaction will run automatically on the next run date.</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-700 border border-gray-300 rounded-full px-4 py-2 font-medium hover:bg-gray-50 transition"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform ${
                  isSaving
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isSaving ? 'Saving...' : (isEditMode ? 'Save changes' : 'Create Recurring')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- RecurringPage Component (Default Export) ---
const RecurringTransactionsPage = () => {
  const [recurrings, setRecurrings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { recurringId: number, description: string }
  const [pageError, setPageError] = useState(null);

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

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Sorted and processed list (sorted by nextRunDate ascending)
  // Normalize IDs: backend uses recurringId, frontend may expect id
  const sortedRecurrings = useMemo(() => {
    return recurrings.map(r => ({
      ...r,
      id: r.recurringId || r.id, // Normalize ID field
    })).sort((a, b) => {
      if (a.nextRunDate && b.nextRunDate) {
        return new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime();
      }
      return 0;
    });
  }, [recurrings]);

  const fetchRecurrings = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await recurringApi.getAll();
      setRecurrings(Array.isArray(data) ? data : []);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Network Error';
      const statusCode = error?.response?.status || 'Unknown';
      setPageError(`Failed to load recurring transactions (Status: ${statusCode}). ${errorMessage}`);
      setRecurrings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurrings();
  }, [fetchRecurrings]);

  // --- CRUD Handlers ---
  const handleSave = useCallback(async (savedItem) => {
    // Refetch list to ensure nextRunDate updates are captured from server
    await fetchRecurrings();
    showToast(editItem ? 'Transaction updated.' : 'Transaction created.', 'success');
    setEditItem(null);
  }, [fetchRecurrings, showToast, editItem]);

  // Handle delete click - show confirmation modal
  const handleDeleteClick = useCallback((recurring) => {
    const description = recurring.description || recurring.categoryName || 'this transaction';
    setDeleteConfirm({
      recurringId: recurring.recurringId || recurring.id,
      description: description
    });
  }, []);

  // Handle confirmed delete
  const handleDelete = useCallback(async (recurringId) => {
    // Optimistic delete
    const originalRecurrings = recurrings;
    setRecurrings(prev => prev.filter(r => (r.recurringId !== recurringId && r.id !== recurringId)));
    setDeleteConfirm(null); // Close confirmation dialog
    
    try {
      await recurringApi.delete(recurringId);
      showToast('Transaction deleted successfully.', 'success');
    } catch (error) {
      setRecurrings(originalRecurrings); // Rollback
      const errorMessage = error?.response?.data?.message || error?.message || 'Error';
      showToast(`Failed to delete transaction: ${errorMessage}`, 'error');
    }
  }, [recurrings, showToast]);

  // Cancel delete confirmation
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handlePauseResume = useCallback(async (id, action) => {
    try {
      if (action === 'pause') {
        await recurringApi.pause(id);
        await fetchRecurrings();
        showToast('Transaction paused successfully.', 'success');
      } else {
        // Resume also triggers the transaction immediately
        await recurringApi.resume(id);
        await fetchRecurrings();
        showToast('Transaction resumed and run successfully!', 'success');
      }
    } catch (error) {
      showToast(`Failed to ${action}: ${error?.response?.data?.message || error?.message || 'Error'}`, 'error');
    }
  }, [fetchRecurrings, showToast]);


  // --- Render Logic ---
  let content;
  
  if (loading) {
    content = (
      <div className="space-y-4 mt-6 max-w-5xl mx-auto">
        <div className="h-24 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
        <div className="h-24 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
      </div>
    );
  } else if (pageError) {
    content = (
      <div className="mt-6 p-6 text-center bg-red-50 border border-red-300 rounded-xl text-red-700 max-w-5xl mx-auto">
        <p className="font-semibold">Error Loading Data</p>
        <p className="text-sm mt-2">{pageError}</p>
        <button 
          onClick={fetchRecurrings} 
          className="mt-4 px-4 py-1.5 bg-[#7E57C2] text-white rounded-full text-sm hover:bg-purple-700 transition"
        >
          Retry Load
        </button>
      </div>
    );
  } else if (recurrings.length === 0) {
    content = (
      <div className="mt-12 p-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 max-w-2xl mx-auto">
        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-3 text-lg font-medium text-gray-700">You have no recurring transactions yet.</p>
        <p className="text-sm">Keep track of your subscriptions and automated payments here.</p>
        <button
          onClick={() => { setEditItem(null); setModalOpen(true); }}
          className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
        >
          Add Recurring
        </button>
      </div>
    );
  } else {
    content = (
      <div className="space-y-4 mt-6 max-w-5xl mx-auto">
        <p className="text-sm text-gray-500">Note: All recurring transactions use the system 'Recurring Payments' category.</p>
        {sortedRecurrings.map(r => (
          <RecurringRow
            key={r.id || r.recurringId} 
            recurring={r} 
            onEdit={(item) => { setEditItem(item); setModalOpen(true); }}
            onDelete={handleDeleteClick}
            onPauseResume={handlePauseResume}
          />
        ))}
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
        <div className="min-h-screen bg-white p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold text-[#7E57C2]">Your Recurring Transactions</h1>
                <p className="text-sm text-gray-500 mt-1">Manage automated incomes & expenses</p>
              </div>
              
              <button
                onClick={() => { setEditItem(null); setModalOpen(true); }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
                aria-label="Add Recurring Transaction"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Recurring
              </button>
            </div>

            {/* Main Content Area */}
            {content}
          </div>
          
          {/* Toast Notification */}
          {toast && <Toast message={toast.message} type={toast.type} />}

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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.description}"</span>? 
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
                    onClick={() => handleDelete(deleteConfirm.recurringId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal */}
          <RecurringFormModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setEditItem(null); }}
            onSave={handleSave}
            initialData={editItem}
          />
        </div>
      </main>
    </div>
  );
};

// Export the component
export default RecurringTransactionsPage;
