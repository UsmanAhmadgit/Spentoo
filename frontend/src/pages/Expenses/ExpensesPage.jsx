import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { expenseApi } from '../../api/expenseApi';
import { categoryApi } from '../../api/categoryApi';
import { paymentMethodApi } from '../../api/paymentMethodApi';

/**
 * README: Expense Management Application (Single File Implementation)
 *
 * This file implements the entire Expense Management frontend page using React
 * functional components, hooks, and Tailwind CSS for styling.
 *
 * Endpoints Used:
 * - GET /expenses: Retrieves all expenses.
 * - POST /expenses: Creates a new expense.
 * - PUT /expenses/:id: Updates an existing expense.
 * - DELETE /expenses/:id: Deletes an expense.
 * - GET /categories?type=EXPENSE: Retrieves only expense-type categories.
 * - GET /payment-methods: Retrieves all available payment methods.
 * - POST /payment-methods: Creates a new payment method.
 *
 * Data Shapes:
 * - Expense: { id, categoryName, paymentMethodName, amount, description, date, ... }
 * - Category: { id, name, type, ... }
 * - PaymentMethod: { id, name, provider, accountNumberMasked, ... }
 */

// --- 2. Small Utility Functions ---

// Formats a date string to a readable format (e.g., Dec 9, 2025)
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

// Formats amount to currency (Rs 1,200.00)
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rs 0.00';
    return `Rs ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const d = new Date();
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

// Fallback for Cash payment method
const defaultCash = { id: 0, name: 'Cash', provider: null, accountNumberMasked: null, isActive: true };

// Category Icons & Colors Mapping (same as Categories module)
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
  Default: { icon: "📂", color: "#BDBDBD" }
};

// Get icon and color for a category name (case-insensitive matching)
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
  
  // Fallback to default
  return CATEGORY_ICONS.Default;
};

// --- 3. ViewToggle Component ---
const ViewToggle = ({ viewMode, setViewMode }) => {
    const isCard = viewMode === 'card';
    const isTable = viewMode === 'table';

    return (
        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 shadow-sm">
            <button
                onClick={() => {
                    setViewMode('card');
                    localStorage.setItem('expense_view_mode', 'card');
                }}
                className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md transition duration-150 ${
                    isCard
                        ? 'bg-[#7E57C2] text-white shadow'
                        : 'text-gray-600 hover:bg-white'
                }`}
                aria-label="Switch to Card View"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Cards
            </button>
            <button
                onClick={() => {
                    setViewMode('table');
                    localStorage.setItem('expense_view_mode', 'table');
                }}
                className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-md transition duration-150 ${
                    isTable
                        ? 'bg-[#7E57C2] text-white shadow'
                        : 'text-gray-600 hover:bg-white'
                }`}
                aria-label="Switch to Table View"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Table
            </button>
        </div>
    );
};


// --- 4. SummaryCards Component ---
const SummaryCards = ({ expenses, showSummary, setShowSummary, sidebarOpen }) => {

    // Compute summary data using useMemo for performance
    const summary = useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return { totalToday: 0, totalMonth: 0, topCategory: 'N/A' };
        }

        const today = getTodayDate();
        const startOfMonth = new Date(today.substring(0, 7) + '-01').getTime();

        let totalToday = 0;
        let totalMonth = 0;
        const categoryMap = {};

        expenses.forEach(expense => {
            // Validate date before processing
            const expenseDateRaw = expense.transactionDate || expense.date;
            if (!expenseDateRaw) {
                // Skip expenses with no date
                return;
            }

            const expenseDateObj = new Date(expenseDateRaw);
            
            // Check if date is valid
            if (isNaN(expenseDateObj.getTime())) {
                return;
            }

            const expenseDate = expenseDateObj.toISOString().substring(0, 10);
            const expenseTimestamp = expenseDateObj.getTime();

            if (expenseDate === today) {
                totalToday += expense.amount;
            }

            if (expenseTimestamp >= startOfMonth) {
                totalMonth += expense.amount;
            }

            categoryMap[expense.categoryName] = (categoryMap[expense.categoryName] || 0) + expense.amount;
        });

        // Find top category
        let topCategory = 'N/A';
        let maxAmount = 0;
        for (const name in categoryMap) {
            if (categoryMap[name] > maxAmount) {
                maxAmount = categoryMap[name];
                topCategory = name;
            }
        }

        return {
            totalToday: totalToday,
            totalMonth: totalMonth,
            topCategory: topCategory,
        };
    }, [expenses]);

    // Function to toggle summary visibility and persist to localStorage
    const toggleSummary = () => {
        const newState = !showSummary;
        setShowSummary(newState);
        localStorage.setItem('expenses_show_summary', newState ? 'true' : 'false');
    };

    // NOTE: Removed the 'if (error) return null' check as requested.

    return (
        <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-[#212121]">Summary</h3>
                <button
                    onClick={toggleSummary}
                    className="text-gray-500 hover:text-[#7E57C2] transition"
                    aria-label={showSummary ? "Hide Summary Cards" : "Show Summary Cards"}
                >
                    <svg className={`w-5 h-5 transform transition-transform duration-300 ${showSummary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            {showSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                    {/* Card 1: Total Today */}
                    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col justify-between border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Today</p>
                        <p className="text-2xl font-extrabold text-[#E53935]">{formatCurrency(summary.totalToday)}</p>
                    </div>

                    {/* Card 2: This Month */}
                    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col justify-between border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total This Month</p>
                        <p className="text-2xl font-extrabold text-[#E53935]">{formatCurrency(summary.totalMonth)}</p>
                    </div>

                    {/* Card 3: Top Category */}
                    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col justify-between border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Top Category</p>
                        <p className="text-xl font-extrabold text-[#1E88E5] truncate">{summary.topCategory}</p>
                    </div>

                    {/* Card 4: Expense Count */}
                    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col justify-between border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Records</p>
                        <p className="text-2xl font-extrabold text-[#43A047]">{expenses.length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- 5. PaymentMethodsModal Component ---
const PaymentMethodsModal = ({ isOpen, onClose, paymentMethods, setPaymentMethods, setSelectedMethod }) => {
    const [newMethodName, setNewMethodName] = useState('');
    const [newMethodProvider, setNewMethodProvider] = useState('');
    const [newMethodMasked, setNewMethodMasked] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState('');

    // Create combined list of all payment methods (including Cash)
    const allMethods = useMemo(() => {
        // paymentMethods should already include all methods from backend, including Cash
        return [...paymentMethods];
    }, [paymentMethods]);

    // Reset dropdown selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedMethodId('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectMethod = (method) => {
        setSelectedMethod(method);
        onClose();
    };

    const handleDropdownChange = (e) => {
        const methodId = e.target.value;
        if (methodId) {
            // Find method by either id or methodId
            const method = allMethods.find(m => {
                const mId = m.id || m.methodId || 0;
                const mMethodId = m.methodId || m.id || 0;
                return mId === Number(methodId) || mMethodId === Number(methodId);
            });
            if (method) {
                handleSelectMethod(method);
            }
        }
    };

    const handleAddMethod = async (e) => {
        e.preventDefault();
        setSaveError('');
        if (!newMethodName) {
            setSaveError('Payment method name is required.');
            return;
        }

        setIsSaving(true);
        try {
            const newMethod = await paymentMethodApi.create({
                name: newMethodName,
                provider: newMethodProvider || null,
                accountNumberMasked: newMethodMasked || null,
                isActive: true,
            });

            // Optimistic update of the payment methods list
            setPaymentMethods(prev => [...prev, newMethod]);

            // Normalize the new method to match our format
            const normalizedMethod = {
                id: newMethod.methodId || newMethod.id,
                methodId: newMethod.methodId || newMethod.id,
                name: newMethod.name,
                provider: newMethod.provider,
                accountNumberMasked: newMethod.accountNumberMasked,
                isActive: newMethod.isActive !== false,
            };
            
            // Auto-select the newly created method
            const methodIdToSelect = normalizedMethod.id || normalizedMethod.methodId;
            if (methodIdToSelect) {
                setSelectedMethodId(methodIdToSelect.toString());
            }
            handleSelectMethod(normalizedMethod);

            // Reset form fields
            setNewMethodName('');
            setNewMethodProvider('');
            setNewMethodMasked('');

        } catch (error) {
            setSaveError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
             role="dialog" aria-modal="true" aria-label="Select or Add Payment Method"
             onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-lg p-4 z-50 shadow-2xl transition-all transform duration-200 ease-out scale-100"
                 onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-lg font-bold text-[#7E57C2] mb-3 pr-8">Select or Add Payment Method</h2>

                {/* Payment Method Dropdown */}
                <div className="mb-3">
                    <label htmlFor="paymentMethodSelect" className="block text-xs font-medium text-gray-700 mb-1.5">Select Payment Method <span className="text-red-500">*</span></label>
                    <select
                        id="paymentMethodSelect"
                        value={selectedMethodId}
                        onChange={handleDropdownChange}
                        className="w-full border-b-2 border-[#1E88E5] py-1.5 px-1 bg-transparent outline-none text-sm"
                    >
                        <option value="" disabled>Choose a payment method...</option>
                        {allMethods.map(method => {
                            const methodId = method.id || method.methodId || 0;
                            const displayName = method.name || 'Unknown';
                            const isCash = displayName.toLowerCase() === 'cash';
                            return (
                                <option key={methodId} value={methodId}>
                                    {isCash ? `${displayName} (Default)` : displayName}
                                    {method.provider ? ` - ${method.provider}` : ''}
                                    {method.accountNumberMasked ? ` (•••${method.accountNumberMasked.slice(-4)})` : ''}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Add New Payment Method Form */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="text-base font-semibold text-[#212121] mb-2">Add New Method</h3>
                    <form onSubmit={handleAddMethod} className="space-y-2">
                        {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
                        <div>
                            <input
                                type="text"
                                placeholder="Name (e.g., Chase Visa, Savings Account)"
                                value={newMethodName}
                                onChange={(e) => setNewMethodName(e.target.value)}
                                className="w-full border-b-2 border-[#1E88E5] py-1.5 px-1 bg-transparent outline-none text-sm"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Provider (Optional, e.g., Bank of America)"
                                value={newMethodProvider}
                                onChange={(e) => setNewMethodProvider(e.target.value)}
                                className="w-full border-b-2 border-gray-300 py-1.5 px-1 bg-transparent outline-none text-sm"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Last 4 Digits (Optional)"
                                value={newMethodMasked}
                                onChange={(e) => setNewMethodMasked(e.target.value.replace(/[^0-9]/g, ''))} // only allow digits
                                maxLength={4}
                                className="w-full border-b-2 border-gray-300 py-1.5 px-1 bg-transparent outline-none text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full inline-flex justify-center py-1.5 px-4 rounded-full text-sm font-semibold text-white transition duration-300 transform hover:scale-[1.01] ${
                                isSaving
                                    ? 'bg-gray-400'
                                    : 'bg-[#1E88E5] hover:bg-blue-600 shadow-md'
                            }`}
                        >
                            {isSaving ? 'Adding...' : 'Add Payment Method'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};


// --- 6. AddEditExpenseModal Component ---
const AddEditExpenseModal = ({
    isOpen,
    onClose,
    editingExpense,
    categories,
    paymentMethods,
    setPaymentMethods,
    onSave,
    loading,
}) => {
    const isEditMode = !!editingExpense;

    // Local state for form fields
    const [formData, setFormData] = useState({
        categoryId: editingExpense?.categoryId || '',
        amount: editingExpense?.amount || '',
        description: editingExpense?.description || '',
        date: editingExpense?.transactionDate ? (editingExpense.transactionDate.substring(0, 10) || getTodayDate()) : getTodayDate(),
    });

    // State for payment method selection (manages the selection process)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        paymentMethods.find(pm => pm.id === editingExpense?.paymentMethodId) || defaultCash
    );

    const [isSaving, setIsSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Use a reference to focus on the first interactive element on mount
    const initialFocusRef = useCallback(node => {
        if (node !== null) {
            // Delay focus slightly to ensure modal is rendered
            setTimeout(() => node.focus(), 50);
        }
    }, []);

    // Effect to update local state when editingExpense changes (e.g., when opening the modal)
    useEffect(() => {
        if (editingExpense) {
            // Extract categoryId from expense object
            const categoryId = editingExpense.categoryId || (editingExpense.category?.categoryId || editingExpense.category?.id);
            const paymentMethodId = editingExpense.paymentMethodId || (editingExpense.paymentMethod?.methodId || editingExpense.paymentMethod?.id);
            const expenseDate = editingExpense.transactionDate || editingExpense.date;
            
            // Format date properly
            let dateStr = getTodayDate();
            if (expenseDate) {
                try {
                    const dateObj = new Date(expenseDate);
                    if (!isNaN(dateObj.getTime())) {
                        dateStr = dateObj.toISOString().substring(0, 10);
                    }
                } catch (e) {
                    // Invalid date format - skip
                }
            }
            
            setFormData({
                categoryId: categoryId || '',
                amount: editingExpense.amount || '',
                description: editingExpense.description || '',
                date: dateStr,
            });
            // Find payment method by matching id or methodId
            const foundMethod = paymentMethods.find(pm => {
                const pmId = pm.id || pm.methodId;
                const pmMethodId = pm.methodId || pm.id;
                return pmId === paymentMethodId || pmMethodId === paymentMethodId;
            });
            // If not found, try to find Cash, otherwise use defaultCash
            const cashMethod = paymentMethods.find(pm => (pm.name && pm.name.toLowerCase() === 'cash'));
            setSelectedPaymentMethod(foundMethod || cashMethod || defaultCash);
        } else {
            setFormData({
                categoryId: '',
                amount: '',
                description: '',
                date: getTodayDate(),
            });
            setSelectedPaymentMethod(defaultCash);
        }
    }, [editingExpense, paymentMethods]);

    // Input change handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error immediately on change
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Form Validation Logic
    const validate = () => {
        const errors = {};
        if (!formData.categoryId) {
            errors.categoryId = 'Please select an expense category.';
        }
        if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            errors.amount = 'Amount is required and must be greater than 0.';
        }
        if (!formData.date) {
            errors.date = 'Please provide a valid date.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Form submission handler (Create or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validate()) return;

        setIsSaving(true);
        // Get payment method ID - use methodId if available, otherwise use id
        // If it's the default Cash (id=0) or methodId is null, send null to let backend find Cash by name
        let paymentMethodIdValue = null;
        if (selectedPaymentMethod) {
            // If methodId exists and is not 0/null, use it
            if (selectedPaymentMethod.methodId && selectedPaymentMethod.methodId !== 0) {
                paymentMethodIdValue = selectedPaymentMethod.methodId;
            } 
            // Otherwise, if id exists and is not 0, use it
            else if (selectedPaymentMethod.id && selectedPaymentMethod.id !== 0 && selectedPaymentMethod.id !== defaultCash.id) {
                paymentMethodIdValue = selectedPaymentMethod.id;
            }
            // If methodId is null or 0, or id is 0 (defaultCash), send null to let backend default to Cash
        }
        
            // Prepare payload - only include fields that are provided
        const expensePayload = {};
        
        // For edit mode, only include fields that are being updated
        // For create mode, include all required fields
        if (isEditMode) {
            // Only include categoryId if it's different from current
            if (formData.categoryId && formData.categoryId !== editingExpense.categoryId) {
                expensePayload.categoryId = Number(formData.categoryId);
            }
            // Only include amount if it's provided and different
            if (formData.amount && Number(formData.amount) !== editingExpense.amount) {
                expensePayload.amount = Number(formData.amount);
            }
            // Always allow description update (can be cleared)
            if (formData.description !== undefined) {
                expensePayload.description = formData.description?.trim() || null;
            }
            // Always include transactionDate in edit mode
            // Use the date from form (which defaults to expense date when modal opens)
            // If formData.date exists, use it; otherwise preserve existing expense date
            const dateToSend = formData.date || (editingExpense.transactionDate || editingExpense.date);
            if (dateToSend) {
                try {
                    // If it's already in YYYY-MM-DD format (from form), convert to ISO date string (just the date part)
                    // Backend expects LocalDate which is just YYYY-MM-DD format
                    let dateStr;
                    if (typeof dateToSend === 'string' && dateToSend.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        // Format is already YYYY-MM-DD, use it directly
                        dateStr = dateToSend;
                    } else {
                        // Convert Date object or ISO string to YYYY-MM-DD
                        const dateObj = new Date(dateToSend);
                        if (!isNaN(dateObj.getTime())) {
                            dateStr = dateObj.toISOString().substring(0, 10);
                        }
                    }
                    
                    if (dateStr) {
                        expensePayload.transactionDate = dateStr;
                    }
                } catch (e) {
                    // Fallback: use existing expense date
                    const existingDate = editingExpense.transactionDate || editingExpense.date;
                    if (existingDate) {
                        const dateObj = new Date(existingDate);
                        if (!isNaN(dateObj.getTime())) {
                            expensePayload.transactionDate = dateObj.toISOString().substring(0, 10);
                        }
                    }
                }
            }
            // Only include paymentMethodId if it's different
            if (paymentMethodIdValue !== editingExpense.paymentMethodId) {
                expensePayload.paymentMethodId = paymentMethodIdValue;
            }
        } else {
            // Create mode - include all required fields
            expensePayload.categoryId = Number(formData.categoryId);
            expensePayload.paymentMethodId = paymentMethodIdValue; // null = backend will default to Cash
            expensePayload.amount = Number(formData.amount);
            // Include transactionDate - backend expects YYYY-MM-DD format (LocalDate)
            if (formData.date) {
                expensePayload.transactionDate = formData.date; // Already in YYYY-MM-DD format
            }
            // Only include description if it's not empty
            if (formData.description && formData.description.trim()) {
                expensePayload.description = formData.description.trim();
            }
        }

        try {
            let result;
            if (isEditMode) {
                // PUT request for editing
                const expenseId = editingExpense.id || editingExpense.expenseId;
                result = await expenseApi.update(expenseId, expensePayload);
            } else {
                // POST request for adding
                result = await expenseApi.create(expensePayload);
            }

            // Call parent component's onSave to update list - pass edit mode flag
            onSave(result, isEditMode);
            handleClose();

        } catch (error) {
            // Better error message extraction
            let errorMessage = 'Error saving expense. Please try again.';
            if (error.response?.data) {
                // Backend returns string for IllegalStateException
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (typeof error.response.data === 'object') {
                    // Try to extract first error message from object
                    const messages = Object.values(error.response.data).filter(msg => typeof msg === 'string');
                    if (messages.length > 0) {
                        errorMessage = messages[0];
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            setApiError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // Close handler that clears errors
    const handleClose = () => {
        setFormErrors({});
        setApiError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
             role="dialog" aria-modal="true" aria-label={isEditMode ? "Edit Expense" : "Add New Expense"}
             // Allow closing modal by clicking the backdrop
             onClick={handleClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-xl p-4 z-50 shadow-2xl transition-all transform duration-200 ease-out scale-100 max-h-[calc(100vh-8rem)] overflow-y-auto"
                 onClick={e => e.stopPropagation()} // Prevent click from closing modal
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-lg font-bold text-[#7E57C2] mb-3 pr-8">{isEditMode ? 'Edit Expense' : 'Add New Expense'}</h2>

                {/* API Error Message */}
                {apiError && (
                    <div className="p-2 mb-3 text-red-700 bg-red-100 rounded-lg border border-red-300 text-xs">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-2">

                    {/* Category Dropdown */}
                    <div>
                        <label htmlFor="categoryId" className="block text-xs font-medium text-gray-700 mb-0.5">Category <span className="text-red-500">*</span></label>
                        <select
                            id="categoryId"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            ref={initialFocusRef} // Initial focus trap element
                            className={`w-full border-b-2 py-1.5 px-1 bg-transparent outline-none text-sm ${formErrors.categoryId ? 'border-red-500' : 'border-[#1E88E5]'}`}
                        >
                            <option value="" disabled>Select Category</option>
                            {categories.length > 0 ? categories.map(cat => {
                                const catId = cat.id || cat.categoryId;
                                const catName = cat.name || cat.categoryName;
                                // Always use mapped icon (database icons may be corrupted)
                                const catIcon = getCategoryStyle(catName).icon;
                                return (
                                    <option key={catId} value={catId}>
                                        {catIcon} {catName}
                                    </option>
                                );
                            }) : loading ? (
                                <option value="" disabled>Loading Categories...</option>
                            ) : (
                                <option value="" disabled>No categories available. Create one on the Categories page.</option>
                            )}
                        </select>
                        {formErrors.categoryId && <p className="text-red-600 text-xs mt-0.5">{formErrors.categoryId}</p>}
                        {categories.length === 0 && (
                            <p className="text-yellow-600 text-xs mt-0.5">
                                No expense categories yet — create one on the Categories page.
                            </p>
                        )}
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label htmlFor="amount" className="block text-xs font-medium text-gray-700 mb-0.5">Amount (Rs) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-0 top-2 text-gray-500 text-sm">Rs</span>
                            <input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className={`w-full border-b-2 py-1.5 pl-6 pr-1 bg-transparent outline-none text-sm ${formErrors.amount ? 'border-red-500' : 'border-[#1E88E5]'}`}
                                step="0.01"
                                required
                            />
                        </div>
                        {formErrors.amount && <p className="text-red-600 text-xs mt-0.5">{formErrors.amount}</p>}
                    </div>

                    {/* Date Input */}
                    <div>
                        <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-0.5">Date <span className="text-red-500">*</span></label>
                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            className={`w-full border-b-2 border-[#1E88E5] py-1.5 px-1 bg-transparent outline-none text-sm`}
                            required
                        />
                        {formErrors.date && <p className="text-red-600 text-xs mt-0.5">{formErrors.date}</p>}
                    </div>

                    {/* Description Textarea */}
                    <div>
                        <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-0.5">Description (Optional)</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="1"
                            placeholder="Add a short note about this expense..."
                            className="w-full border border-gray-300 rounded-md p-1.5 focus:border-[#1E88E5] outline-none transition text-sm resize-none"
                        ></textarea>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-xs font-medium text-gray-700">
                            Payment Method:
                            <span className="ml-2 px-2 py-0.5 bg-white border border-blue-200 rounded-full text-blue-700 text-xs shadow-sm">
                                {selectedPaymentMethod.name}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="inline-flex items-center px-2.5 py-1 border border-[#1E88E5] text-[#1E88E5] rounded-full text-xs font-semibold hover:bg-blue-50 transition transform hover:scale-[1.03]"
                            aria-label="Select Payment Method"
                        >
                            Change Method
                        </button>
                    </div>

                    {/* Form Actions */}
                    <div className="pt-2 flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="border border-gray-300 text-gray-700 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-gray-50 transition"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-md transition duration-300 transform ${
                                isSaving
                                    ? 'bg-gray-400'
                                    : 'bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                        >
                            {isSaving ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Add Expense')}
                            {isSaving && (
                                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </form>

                {/* Nested Payment Methods Modal */}
                <PaymentMethodsModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    paymentMethods={paymentMethods}
                    setPaymentMethods={setPaymentMethods}
                    setSelectedMethod={setSelectedPaymentMethod}
                />
            </div>
        </div>
    );
};

// --- 7. ExpenseCardRow Component ---
const ExpenseCardRow = ({ expense, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col md:flex-row items-start md:items-center justify-between border border-gray-100">
            {/* Left/Center Details Area */}
            <div className="flex flex-col md:flex-row md:items-center w-full md:w-4/5 space-y-2 md:space-y-0 md:space-x-4">
                {/* Date & Category */}
                <div className="flex-shrink-0 w-full md:w-auto">
                    <p className="text-xs text-gray-500 font-medium mb-1 md:mb-0">{formatDate(expense.transactionDate || expense.date)}</p>
                    <span 
                        className="px-3 py-1 rounded-full text-sm font-medium border text-[#212121] inline-flex items-center gap-1"
                        style={{
                            backgroundColor: expense.categoryColor || getCategoryStyle(expense.categoryName).color || '#E0E0E0',
                            borderColor: expense.categoryColor || getCategoryStyle(expense.categoryName).color || '#E0E0E0',
                        }}
                    >
                        <span style={{ 
                            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "EmojiSymbols-Linux", "Twemoji Mozilla", "Noto Emoji", sans-serif',
                            fontSize: '16px'
                        }}>
                            {expense.categoryIcon || getCategoryStyle(expense.categoryName).icon}
                        </span>
                        {expense.categoryName}
                    </span>
                </div>
                
                {/* Description & Method */}
                <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-[#212121] truncate">{expense.description || 'No description provided'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Paid via: {expense.paymentMethodName || defaultCash.name}</p>
                </div>
            </div>

            {/* Right Amount & Actions Area */}
            <div className="flex flex-col-reverse md:flex-row items-start md:items-center md:space-x-4 mt-3 md:mt-0 w-full md:w-1/5">
                {/* Amount */}
                <div className="flex-grow-0 flex-shrink-0 text-left md:text-right w-full">
                    <p className="text-lg font-extrabold text-[#E53935]">{formatCurrency(expense.amount)}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 flex-shrink-0 self-end md:self-center mb-2 md:mb-0">
                    <button
                        onClick={() => onEdit(expense)}
                        className="p-1 rounded-full text-[#1E88E5] hover:bg-blue-100 transition"
                        aria-label="Edit expense"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(expense)}
                        className="p-1 rounded-full text-[#E53935] hover:bg-red-100 transition"
                        aria-label="Delete expense"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- 8. ExpenseTable Component ---
const ExpenseTable = ({ expenses, onEdit, onDelete }) => {
    return (
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-auto border border-gray-100">
            <table className="table-auto w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 hidden sm:table-cell">Payment Method</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">Description</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {expenses.map((expense) => (
                        <tr key={expense.id || expense.expenseId} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(expense.transactionDate || expense.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#212121]">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border"
                                    style={{
                                        backgroundColor: expense.categoryColor || getCategoryStyle(expense.categoryName).color || '#F5F5F5',
                                        borderColor: expense.categoryColor || getCategoryStyle(expense.categoryName).color || '#E0E0E0',
                                    }}
                                >
                                    <span style={{ 
                                        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "EmojiSymbols-Linux", "Twemoji Mozilla", "Noto Emoji", sans-serif',
                                        fontSize: '16px'
                                    }}>
                                        {expense.categoryIcon || getCategoryStyle(expense.categoryName).icon}
                                    </span>
                                    {expense.categoryName}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                {expense.paymentMethodName || defaultCash.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate hidden lg:table-cell">
                                {expense.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-extrabold text-[#E53935]">
                                {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <div className="flex justify-center space-x-3">
                                    <button
                                        onClick={() => onEdit(expense)}
                                        className="p-1 rounded-full text-[#1E88E5] hover:bg-blue-100 transition"
                                        aria-label="Edit expense"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete(expense)}
                                        className="p-1 rounded-full text-[#E53935] hover:bg-red-100 transition"
                                        aria-label="Delete expense"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- 9. ExpensesPage Container (Default Export) ---
const ExpensesPage = () => {
    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('sidebarOpen');
        return saved !== null ? saved === 'true' : false;
    });
    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', newState.toString());
    };
    const closeSidebar = () => {
        setSidebarOpen(false);
        localStorage.setItem('sidebarOpen', 'false');
    };

    // --- State Management ---
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    // Removed [error, setError] state as it is no longer used for rendering

    // UI state
    const [showSummary, setShowSummary] = useState(() => {
        return localStorage.getItem('expenses_show_summary') !== 'false';
    });
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('expense_view_mode') || 'card';
    });
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null); // null for add mode, Expense object for edit mode
    const [lastActionToast, setLastActionToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { expenseId: number, expenseDescription: string }
    const [dateFilter, setDateFilter] = useState(() => {
        const saved = localStorage.getItem('expense_date_filter') || 'all';
        // Reset to 'all' if saved filter is 'custom' (since we don't persist custom dates)
        return saved === 'custom' ? 'all' : saved;
    });
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDateRange, setShowCustomDateRange] = useState(false);

    // --- Data Fetching ---
    const fetchData = useCallback(async (filter = null, startDate = null, endDate = null) => {
        setLoading(true);
        // Error state setting removed as per user request
        try {
            // Fetch all data concurrently
            const [expenseData, categoryData, paymentMethodData] = await Promise.all([
                expenseApi.getAll(filter, startDate, endDate).then(data => {
                    // Backend returns List<ExpenseDTO> which is an array
                    const expenses = Array.isArray(data) ? data : (data.expenses || []);
                    return { expenses };
                }),
                categoryApi.getByType('EXPENSE').then(data => ({ categories: Array.isArray(data) ? data : data.categories || [] })),
                paymentMethodApi.getAll().then(data => {
                    // Backend returns List<PaymentMethodDTO> which is an array
                    const paymentMethods = Array.isArray(data) ? data : (data.paymentMethods || []);
                    return { paymentMethods };
                }),
            ]);

            // Combine category and payment method names into expenses for display
            const allCategories = categoryData.categories || [];
            // Normalize payment methods - backend returns methodId, frontend needs both id and methodId
            const rawPaymentMethods = paymentMethodData.paymentMethods || [];
            const allPaymentMethods = rawPaymentMethods
                .filter(pm => pm.isActive !== false)
                .map(pm => ({
                    id: pm.methodId || pm.id,  // Use methodId as primary ID
                    methodId: pm.methodId || pm.id,
                    name: pm.name,
                    provider: pm.provider,
                    accountNumberMasked: pm.accountNumberMasked,
                    isActive: pm.isActive !== false,
                }));

            // Find Cash payment method from DB or add default
            const cashMethod = allPaymentMethods.find(pm => pm.name === 'Cash' || pm.name === 'CASH');
            if (!cashMethod) {
                // If Cash doesn't exist in DB, add it as default (but backend should create it)
                allPaymentMethods.unshift({
                    id: 0, // Temporary ID for frontend
                    methodId: null, // Will be null to let backend find Cash by name
                    name: 'Cash',
                    provider: null,
                    accountNumberMasked: null,
                    isActive: true,
                });
            }

            // Process expenses: Backend returns nested objects (category: CategoryDTO, paymentMethod: PaymentMethodDTO)
            const processedExpenses = (expenseData.expenses || [])
                .map(exp => {
                    // Extract nested category and paymentMethod objects
                    const categoryObj = exp.category || {};
                    const paymentMethodObj = exp.paymentMethod || {};
                    
                    // Get category info (support both nested object and direct fields)
                    const categoryId = categoryObj.categoryId || categoryObj.id || exp.categoryId;
                    const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown';
                    
                    // Get mapped style as fallback
                    const mappedStyle = getCategoryStyle(categoryName);
                    
                    // Check if category name matches a predefined category (not Default)
                    const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
                      key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
                    );
                    
                    // For predefined categories, always use mapped icon to ensure correct icon
                    // For custom categories, use database icon if valid, otherwise use mapped icon
                    let finalIcon;
                    if (isPredefinedCategory) {
                      // Always use mapped icon for predefined categories (Insurance, Shopping, etc.)
                      finalIcon = mappedStyle.icon;
                    } else {
                      // For custom categories, use database icon if valid, otherwise use mapped icon
                      const dbIcon = (categoryObj.icon && categoryObj.icon.trim() !== '' && categoryObj.icon.trim() !== '??') 
                        ? categoryObj.icon.trim() 
                        : null;
                      finalIcon = dbIcon || mappedStyle.icon;
                    }
                    
                    // Use database color if it exists and is valid, otherwise use mapped color
                    const dbColor = (categoryObj.color && categoryObj.color.trim() !== '') ? categoryObj.color.trim() : null;
                    
                    const finalColor = dbColor || mappedStyle.color;
                    
                    // Get payment method info
                    const paymentMethodId = paymentMethodObj.methodId || paymentMethodObj.id || exp.paymentMethodId;
                    const paymentMethodName = paymentMethodObj.name || defaultCash.name;
                    
                    // Get date from transactionDate (backend uses transactionDate)
                    const expenseDate = exp.transactionDate || exp.date;
                    
                    // Get expense ID
                    const expenseId = exp.expenseId || exp.id;
                    
                    return {
                        id: expenseId,
                        expenseId: expenseId,
                        categoryId: categoryId,
                        paymentMethodId: paymentMethodId,
                        amount: exp.amount,
                        description: exp.description || '',
                        transactionDate: expenseDate,
                        date: expenseDate, // Keep for backward compatibility
                        categoryName: categoryName,
                        paymentMethodName: paymentMethodName,
                        categoryIcon: finalIcon,
                        categoryColor: finalColor,
                    };
                })
                // Sort by date descending
                .sort((a, b) => {
                    const dateA = new Date(a.transactionDate || a.date);
                    const dateB = new Date(b.transactionDate || b.date);
                    return dateB - dateA;
                });

            setExpenses(processedExpenses);
            // We only need EXPENSE type categories for the form - normalize field names
            const normalizedCategories = allCategories
                .filter(c => c.type === 'EXPENSE' || c.type === 'Expense')
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
            // Payment methods are already normalized above
            setPaymentMethods(allPaymentMethods);

        } catch (err) {
            // Extract error message from response
            let errorMessage = 'Failed to load data. Please check your connection and try again.';
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setExpenses([]);
            setCategories([]);
            setPaymentMethods([]);
            
            setLastActionToast({
                message: `Failed to load data: ${errorMessage} (Status: ${err.response?.status || 'Unknown'})`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch preset filters here (not custom date range, which is handled by Apply button)
        if (dateFilter !== 'custom') {
            const filterValue = dateFilter === 'all' ? null : dateFilter;
            fetchData(filterValue);
        }
        // Custom date range is handled by handleCustomDateRange when Apply is clicked
    }, [fetchData, dateFilter]);

    // Handler to change date filter
    const handleFilterChange = useCallback((filter) => {
        setDateFilter(filter);
        localStorage.setItem('expense_date_filter', filter);
        // Clear custom date range when preset filter is selected
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
    }, []);

    // Handler for custom date range
    const handleCustomDateRange = useCallback(() => {
        if (!customStartDate || !customEndDate) {
            setLastActionToast({ message: 'Please select both start and end dates.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }
        
        // Validate dates
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        if (start > end) {
            setLastActionToast({ message: 'Start date cannot be after end date.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }
        
        // Set filter to custom and trigger fetch directly
        setDateFilter('custom');
        localStorage.setItem('expense_date_filter', 'custom');
        // Trigger fetch with custom dates
        fetchData(null, customStartDate, customEndDate);
    }, [customStartDate, customEndDate, fetchData]);

    // Handler to clear custom date range
    const handleClearCustomDateRange = useCallback(() => {
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('all');
        localStorage.setItem('expense_date_filter', 'all');
        // useEffect will handle the fetch when dateFilter changes
    }, []);

    // --- CRUD Actions ---

    // Memoize category style lookups to avoid repeated calculations
    const categoryStyleCache = useMemo(() => {
        const cache = new Map();
        expenses.forEach(exp => {
            if (exp.categoryName && !cache.has(exp.categoryName)) {
                cache.set(exp.categoryName, getCategoryStyle(exp.categoryName));
            }
        });
        categories.forEach(cat => {
            const catName = cat.name || cat.categoryName;
            if (catName && !cache.has(catName)) {
                cache.set(catName, getCategoryStyle(catName));
            }
        });
        return cache;
    }, [expenses, categories]);

    // Handle creation or update of an expense from modal
    const handleExpenseSave = useCallback((savedExpense, isEdit = false) => {
        // Backend returns nested objects, extract them
        const categoryObj = savedExpense.category || {};
        const paymentMethodObj = savedExpense.paymentMethod || {};
        
        const categoryId = categoryObj.categoryId || categoryObj.id || savedExpense.categoryId;
        const categoryName = categoryObj.categoryName || categoryObj.name || 'Unknown';
        
        // Get mapped style as fallback
        const mappedStyle = getCategoryStyle(categoryName);
        
        // Check if category name matches a predefined category (not Default)
        const isPredefinedCategory = Object.keys(CATEGORY_ICONS).some(
          key => key !== 'Default' && key.toLowerCase() === categoryName.toLowerCase()
        );
        
        // For predefined categories, always use mapped icon to ensure correct icon
        // For custom categories, use database icon if valid, otherwise use mapped icon
        let finalIcon;
        if (isPredefinedCategory) {
          // Always use mapped icon for predefined categories (Insurance, Shopping, etc.)
          finalIcon = mappedStyle.icon;
        } else {
          // For custom categories, use database icon if valid, otherwise use mapped icon
          const dbIcon = (categoryObj.icon && categoryObj.icon.trim() !== '' && categoryObj.icon.trim() !== '??') 
            ? categoryObj.icon.trim() 
            : null;
          finalIcon = dbIcon || mappedStyle.icon;
        }
        
        // Use database color if it exists and is valid, otherwise use mapped color
        const dbColor = (categoryObj.color && categoryObj.color.trim() !== '') ? categoryObj.color.trim() : null;
        
        const finalColor = dbColor || mappedStyle.color;
        
        const paymentMethodId = paymentMethodObj.methodId || paymentMethodObj.id || savedExpense.paymentMethodId;
        const paymentMethodName = paymentMethodObj.name || defaultCash.name;
        
        const expenseId = savedExpense.expenseId || savedExpense.id;
        const expenseDate = savedExpense.transactionDate || savedExpense.date;

        const updatedExpense = {
            id: expenseId,
            expenseId: expenseId,
            categoryId: categoryId,
            paymentMethodId: paymentMethodId,
            amount: savedExpense.amount,
            description: savedExpense.description || '',
            transactionDate: expenseDate,
            date: expenseDate, // Keep for backward compatibility
            categoryName: categoryName,
            paymentMethodName: paymentMethodName,
            categoryIcon: finalIcon,
            categoryColor: finalColor,
        };

        setExpenses(prevExpenses => {
            if (isEdit) {
                // Edit: Replace the old expense by matching ID
                const oldExpenseId = expenseId;
                return prevExpenses.map(e => {
                    const currentId = e.id || e.expenseId;
                    return currentId === oldExpenseId ? updatedExpense : e;
                })
                    // Re-sort after potential date change
                    .sort((a, b) => {
                    const dateA = new Date(a.transactionDate || a.date);
                    const dateB = new Date(b.transactionDate || b.date);
                    return dateB - dateA;
                });
            } else {
                // Add: Prepend the new expense
                return [updatedExpense, ...prevExpenses]
                    // Re-sort after adding
                    .sort((a, b) => {
                    const dateA = new Date(a.transactionDate || a.date);
                    const dateB = new Date(b.transactionDate || b.date);
                    return dateB - dateA;
                });
            }
        });

        // Show toast
        setLastActionToast({
            message: isEdit ? 'Expense updated successfully.' : 'Expense added successfully.',
            type: 'success'
        });
        setTimeout(() => setLastActionToast(null), 3000); // Clear toast after 3 seconds
    }, []);

    // Prepare modal for adding an expense
    const handleAddExpense = useCallback(() => {
        setEditingExpense(null);
        setIsAddEditModalOpen(true);
    }, []);

    // Prepare modal for editing an expense
    const handleEditExpense = useCallback((expense) => {
        setEditingExpense(expense);
        setIsAddEditModalOpen(true);
    }, []);

    // Handle delete click - show confirmation modal
    const handleDeleteClick = useCallback((expense) => {
        const description = expense.description || expense.categoryName || 'this expense';
        const expenseId = expense.id || expense.expenseId;
        // Allow 0 as valid ID, only reject null/undefined/empty string
        if (expenseId === null || expenseId === undefined || expenseId === '') {
            setLastActionToast({ message: 'Invalid expense ID. Cannot delete.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }
        setDeleteConfirm({
            expenseId: expenseId,
            expenseDescription: description
        });
    }, []);

    // Handle confirmed delete
    const handleDeleteExpense = useCallback(async (expenseId) => {
        // Check if expenseId is null or undefined
        if (expenseId === null || expenseId === undefined || expenseId === '') {
            setDeleteConfirm(null);
            setLastActionToast({ message: 'Invalid expense ID. Cannot delete.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }

        const originalExpenses = expenses;
        // Convert expenseId to number for consistent comparison
        // Handle both string and number formats
        let idToDelete;
        try {
            if (typeof expenseId === 'string') {
                // Try parsing as integer (base 10), remove any whitespace first
                const trimmed = expenseId.trim();
                idToDelete = trimmed ? parseInt(trimmed, 10) : NaN;
            } else if (typeof expenseId === 'number') {
                idToDelete = expenseId;
            } else {
                // Try to convert to number as last resort
                idToDelete = Number(expenseId);
            }
        } catch (e) {
            console.error('Error converting expense ID:', e, 'expenseId:', expenseId);
            setDeleteConfirm(null);
            setLastActionToast({ message: 'Invalid expense ID format.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }
        
        // Check if conversion resulted in NaN or if it's not a finite positive number
        if (isNaN(idToDelete) || !isFinite(idToDelete) || idToDelete < 1 || !Number.isInteger(idToDelete)) {
            console.error('Invalid expense ID:', expenseId, 'Type:', typeof expenseId, 'converted to:', idToDelete);
            setDeleteConfirm(null);
            setLastActionToast({ message: 'Invalid expense ID format.', type: 'error' });
            setTimeout(() => setLastActionToast(null), 3000);
            return;
        }

        setExpenses(prev => prev.filter(e => {
            const eId = Number(e.id || e.expenseId);
            return isNaN(eId) || eId !== idToDelete;
        }));
        setDeleteConfirm(null); // Close confirmation dialog

        try {
            await expenseApi.delete(idToDelete);
            setLastActionToast({ message: 'Expense deleted successfully.', type: 'success' });
        } catch (error) {
            setExpenses(originalExpenses); // Rollback
            console.error('Delete expense error:', error);
            let errorMessage = 'Please try again.';
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            setLastActionToast({ 
                message: `Failed to delete expense: ${errorMessage}`, 
                type: 'error' 
            });
        } finally {
            setTimeout(() => setLastActionToast(null), 3000);
        }
    }, [expenses]);

    // Cancel delete confirmation
    const handleCancelDelete = useCallback(() => {
        setDeleteConfirm(null);
    }, []);


    // --- Render Logic ---

    // Content to display based on loading/empty state
    let content;
    if (loading) {
        // Skeleton loading state
        content = (
            <div className="mt-6 space-y-4">
                <div className="h-20 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
                <div className="h-20 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
                <div className="h-20 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
            </div>
        );
    } else if (expenses.length === 0) {
        // Empty state (used for successful empty fetch or failed fetch)
        content = (
            <div className="mt-6 p-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-6 0l6 6M5 12h14" />
                </svg>
                <p className="mt-3 text-lg font-medium">No expenses recorded yet.</p>
                <p className="text-sm">Click "Add Expense" to get started.</p>
            </div>
        );
    } else if (viewMode === 'card') {
        // Card View
        content = (
            <div className="mt-6 space-y-4">
                {expenses.map(expense => (
                    <ExpenseCardRow
                        key={expense.id}
                        expense={expense}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>
        );
    } else {
        // Table View
        content = (
            <ExpenseTable
                expenses={expenses}
                onEdit={handleEditExpense}
                onDelete={handleDeleteClick}
            />
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
                <div className="min-h-screen bg-white text-gray-800 p-6">
                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-[#7E57C2]">Your Expenses</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage expenses, payment methods and see quick summaries</p>
                        </div>
                        
                        {/* Right Controls (Add Button and View Toggle) */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            {/* Add Expense Button */}
                            <button
                                onClick={handleAddExpense}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition"
                                aria-label="Add New Expense"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Expense
                            </button>
                            
                            {/* View Toggle */}
                            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="mt-6">
                        <SummaryCards
                            expenses={expenses}
                            showSummary={showSummary}
                            setShowSummary={setShowSummary}
                            sidebarOpen={sidebarOpen}
                        />
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
                                        aria-label="Show all expenses"
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
                                        aria-label="Show last week expenses"
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
                                        aria-label="Show last month expenses"
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
                                        aria-label="Show last year expenses"
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
                                        aria-label="Custom date range"
                                    >
                                        Custom Range
                                    </button>
                                </div>
                            </div>
                            
                            {/* Custom Date Range Picker */}
                            {showCustomDateRange && (
                                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700">From:</label>
                                        <input
                                            id="startDate"
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700">To:</label>
                                        <input
                                            id="endDate"
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
                                            aria-label="Apply custom date range"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={handleClearCustomDateRange}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-300 transition"
                                            aria-label="Clear custom date range"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

            {/* Main Content Area (List/Table) */}
            {content}

            {/* Floating Toast Notification */}
            {lastActionToast && (
                <div 
                    className={`fixed bottom-6 right-6 text-white px-4 py-2 rounded-lg shadow-xl transition-opacity duration-300 ${
                        typeof lastActionToast === 'object' && lastActionToast.type === 'error' 
                            ? 'bg-red-600' 
                            : 'bg-[#43A047]'
                    }`}
                >
                    {typeof lastActionToast === 'string' ? lastActionToast : lastActionToast.message}
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
                            <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.expenseDescription}"</span>? 
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
                                onClick={() => handleDeleteExpense(deleteConfirm.expenseId)}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <AddEditExpenseModal
                isOpen={isAddEditModalOpen}
                onClose={() => setIsAddEditModalOpen(false)}
                editingExpense={editingExpense}
                categories={categories}
                loading={loading}
                paymentMethods={paymentMethods}
                setPaymentMethods={setPaymentMethods} // Passed down to update methods after creation
                onSave={handleExpenseSave}
            />
                </div>
            </main>
        </div>
    );
};

export default ExpensesPage;