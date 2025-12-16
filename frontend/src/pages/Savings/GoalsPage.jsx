import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import dayjs from 'dayjs';
import { savingsApi } from '../../api/savingsApi';

/**
 * README: Saving Goals Management Application
 *
 * This file implements the entire Saving Goals frontend page.
 * It uses savingsApi for all API interactions.
 *
 * Endpoints Used:
 * - GET /api/goals
 * - GET /api/goals/:id
 * - POST /api/goals
 * - PUT /api/goals/:id
 * - DELETE /api/goals/:id
 */

// --- 2. Utility Functions & Constants ---
// Formats amount to currency (Rs 10,000.00)
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rs 0.00';
    return `Rs ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formats YYYY-MM string to MMM YYYY (e.g., Dec 2025)
const formatMonthDisplay = (monthStr) => {
    if (!monthStr) return '—';
    return dayjs(monthStr).format('MMM YYYY');
};

// Formats date string to readable format
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        return dayjs(dateString).format('DD MMM YYYY');
    } catch (e) {
        return '—';
    }
};

// Gets current month in YYYY-MM format (for input min attribute)
const getCurrentMonthForInput = () => dayjs().format('YYYY-MM');

// Determines the Tailwind class for the progress bar color
const progressColorClass = (percent) => {
    if (percent >= 100) return 'bg-[#E53935]'; // Red (Over 100%)
    if (percent >= 80) return 'bg-[#FFB300]'; // Yellow (80% to 99%)
    return 'bg-[#4CAF50]'; // Green (< 80%)
};

// --- 3. Toast Component ---
const Toast = ({ message, type }) => (
    <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl text-white transition-opacity duration-300 z-50 ${
        type === 'success' ? 'bg-[#4CAF50]' : 'bg-[#E53935]'
    }`}>
        {message}
    </div>
);

// --- 4. ProgressDetailsModal Component ---
const ProgressDetailsModal = ({ isOpen, onClose, goalId, goalName }) => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProgress = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Backend includes progress in the goal DTO, so we fetch the goal
            const goalData = await savingsApi.getById(id);
            // Map goal data to progress format - backend returns savedAmount and progressPercentage
            const progressPercent = goalData.progressPercentage !== undefined && goalData.progressPercentage !== null 
                ? Number(goalData.progressPercentage) 
                : 0;
            const savedAmount = goalData.savedAmount !== undefined && goalData.savedAmount !== null 
                ? Number(goalData.savedAmount) 
                : 0;
            const targetAmount = goalData.targetAmount ? Number(goalData.targetAmount) : 0;
            setProgress({
                progressPercent,
                possibleSavings: savedAmount,
                status: goalData.status?.toLowerCase() || 'active',
                targetAmount,
                incomeThisMonth: 0, // Not available in backend DTO (calculated internally)
                expenseThisMonth: 0, // Not available in backend DTO (calculated internally)
                remainingAmount: Math.max(0, targetAmount - savedAmount),
            });
        } catch (err) {
            console.error('Error fetching goal progress:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch progress details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && goalId) {
            fetchProgress(goalId);
        }
    }, [isOpen, goalId, fetchProgress]);

    if (!isOpen) return null;

    const percent = progress?.progressPercent || 0;
    const progressWidth = `${Math.min(percent, 100)}%`;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             role="dialog" aria-modal="true" aria-label={`Progress Details for ${goalName}`}
             onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl transition-all duration-200"
                 onClick={e => e.stopPropagation()}
            >
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#7E57C2]">Goal Details: {goalName}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 transition"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <p className="text-gray-500">Loading progress...</p>
                    ) : error ? (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
                    ) : progress && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: Progress Indicator */}
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                                <div className="text-4xl font-extrabold text-[#7E57C2]">{percent.toFixed(0)}%</div>
                                <div className="w-full mt-4 h-3 rounded-full bg-gray-200">
                                    <div 
                                        className={`h-full rounded-full ${progressColorClass(percent)} transition-all duration-500`}
                                        style={{ width: progressWidth }}
                                        aria-valuenow={percent}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    ></div>
                                </div>
                                <p className={`mt-3 font-semibold text-lg ${progress?.status === 'completed' ? 'text-[#4CAF50]' : 'text-gray-700'}`}>
                                    Status: <span className="uppercase">{progress.status}</span>
                                </p>
                            </div>
                            {/* Right: Numeric Summary */}
                            <div className="space-y-3">
                                <DetailRow label="Target Amount" value={formatCurrency(progress.targetAmount)} />
                                <DetailRow label="Income This Month" value={formatCurrency(progress.incomeThisMonth)} color="text-green-600" />
                                <DetailRow label="Expense This Month" value={formatCurrency(progress.expenseThisMonth)} color="text-red-600" />
                                <DetailRow label="Possible Savings" value={formatCurrency(progress.possibleSavings)} color="text-blue-600" />
                                <DetailRow label="Remaining Needed" value={formatCurrency(progress.remainingAmount)} />
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="border border-gray-300 text-gray-700 rounded-full px-4 py-2 font-medium hover:bg-gray-50 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper for DetailRow (for ProgressDetailsModal)
const DetailRow = ({ label, value, color = 'text-gray-800' }) => (
    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-base font-semibold ${color}`}>{value}</span>
    </div>
);

// --- 5. GoalModal Component (Add/Edit) ---
// Helper functions for date conversion
const deadlineToMonth = (deadlineDate) => {
    if (!deadlineDate) return getCurrentMonthForInput();
    return dayjs(deadlineDate).format('YYYY-MM');
};

const monthToDeadline = (month) => {
    if (!month) return dayjs().format('YYYY-MM-DD');
    return dayjs(month).startOf('month').format('YYYY-MM-DD');
};

// --- Custom Month Picker Component ---
const MonthPicker = ({ value, onChange, min, disabled, error, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(() => {
        if (value) return dayjs(value).year();
        return dayjs().year();
    });
    const pickerRef = useRef(null);

    // Generate months for the selected year
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get available months (current and future)
    const getAvailableMonths = () => {
        const currentDate = dayjs();
        const minDate = min ? dayjs(min) : currentDate;
        const isCurrentYear = selectedYear === currentDate.year();
        const isMinYear = selectedYear === minDate.year();
        
        return months.map((month, index) => {
            const monthDate = dayjs(`${selectedYear}-${String(index + 1).padStart(2, '0')}-01`);
            const isPast = monthDate.isBefore(minDate, 'month');
            const isSelected = value && dayjs(value).format('YYYY-MM') === monthDate.format('YYYY-MM');
            
            return {
                name: month,
                value: monthDate.format('YYYY-MM'),
                index: index + 1,
                isPast,
                isSelected,
                isCurrentMonth: monthDate.isSame(currentDate, 'month')
            };
        });
    };

    const availableMonths = getAvailableMonths();
    const displayValue = value ? dayjs(value).format('MMM YYYY') : 'Select Month';

    // Handle month selection
    const handleMonthSelect = (monthValue) => {
        onChange({ target: { name: 'month', value: monthValue } });
        setIsOpen(false);
    };

    // Handle year navigation
    const handleYearChange = (direction) => {
        setSelectedYear(prev => {
            const newYear = direction === 'next' ? prev + 1 : prev - 1;
            const currentYear = dayjs().year();
            const minYear = min ? dayjs(min).year() : currentYear;
            // Don't allow going before minimum year
            if (newYear < minYear) return prev;
            // Limit to 5 years in the future
            if (newYear > currentYear + 5) return prev;
            return newYear;
        });
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Update selected year when value changes
    useEffect(() => {
        if (value) {
            setSelectedYear(dayjs(value).year());
        }
    }, [value]);

    return (
        <>
            {/* Custom Scrollbar Styles */}
            <style>{`
                .month-picker-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .month-picker-scroll::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 4px;
                }
                .month-picker-scroll::-webkit-scrollbar-thumb {
                    background: #c084fc;
                    border-radius: 4px;
                }
                .month-picker-scroll::-webkit-scrollbar-thumb:hover {
                    background: #a855f7;
                }
            `}</style>
            <div className={`relative ${className}`} ref={pickerRef}>
                {/* Input Button */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition text-left flex items-center justify-between ${
                        error ? 'border-red-500' : 'border-gray-300'
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-[#7E57C2] focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2]'} ${isOpen ? 'border-[#7E57C2]' : ''}`}
                >
                    <span className={value ? 'text-gray-900' : 'text-gray-400'}>{displayValue}</span>
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Picker */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                        {/* Year Navigation */}
                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] text-white">
                            <button
                                type="button"
                                onClick={() => handleYearChange('prev')}
                                disabled={selectedYear <= (min ? dayjs(min).year() : dayjs().year())}
                                className="p-0.5 rounded hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous year"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-sm font-semibold">{selectedYear}</span>
                            <button
                                type="button"
                                onClick={() => handleYearChange('next')}
                                disabled={selectedYear >= dayjs().year() + 5}
                                className="p-0.5 rounded hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next year"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Months Grid - Scrollable */}
                        <div 
                            className="max-h-48 overflow-y-auto p-2 month-picker-scroll"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#c084fc #f3f4f6'
                            }}
                        >
                            <div className="grid grid-cols-3 gap-1.5">
                                {availableMonths.map((month) => (
                                    <button
                                        key={month.value}
                                        type="button"
                                        onClick={() => !month.isPast && handleMonthSelect(month.value)}
                                        disabled={month.isPast}
                                        className={`
                                            px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200
                                            ${month.isSelected 
                                                ? 'bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] text-white shadow-md' 
                                                : month.isPast
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-[#7E57C2] hover:shadow-sm'
                                            }
                                            ${month.isCurrentMonth && !month.isSelected ? 'ring-1 ring-purple-200' : ''}
                                        `}
                                    >
                                        <div className="text-center">
                                            <div className="font-semibold">{month.name.substring(0, 3)}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="border-t border-gray-200 p-1.5 bg-gray-50">
                            <button
                                type="button"
                                onClick={() => {
                                    const currentMonth = getCurrentMonthForInput();
                                    handleMonthSelect(currentMonth);
                                }}
                                className="w-full px-2 py-1 text-xs text-[#7E57C2] hover:bg-purple-50 rounded transition"
                            >
                                Select Current Month
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

const GoalModal = ({ isOpen, onClose, onSave, initialData }) => {
    const isEditMode = !!initialData;
    const initialFocusRef = useRef(null);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        targetAmount: initialData?.targetAmount || '',
        month: deadlineToMonth(initialData?.deadlineDate) || getCurrentMonthForInput(),
        priority: initialData?.priority || 'Medium', // Frontend-only field, not sent to backend
    });
    const [formErrors, setFormErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setApiError('');
            setFormErrors({});
            
            // Reset form data when modal opens or initialData changes
            setFormData({
                name: initialData?.name || '',
                targetAmount: initialData?.targetAmount || '',
                month: deadlineToMonth(initialData?.deadlineDate) || getCurrentMonthForInput(),
                priority: initialData?.priority || 'Medium',
            });
            
            setTimeout(() => initialFocusRef.current?.focus(), 50);
            const handleEscape = (e) => { 
                if (e.key === 'Escape' && onClose) {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const errors = {};
        let isValid = true;

        if (!formData.name.trim()) {
            errors.name = 'Goal Name is required.';
            isValid = false;
        }

        if (!formData.targetAmount || isNaN(Number(formData.targetAmount)) || Number(formData.targetAmount) <= 0) {
            errors.targetAmount = 'Target Amount must be greater than 0.';
            isValid = false;
        }
        
        // Month validation: must be current or future
        if (!formData.month || dayjs(formData.month).isBefore(dayjs(), 'month')) {
             errors.month = 'Month must be current or future.';
             isValid = false;
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
            name: formData.name.trim(),
            targetAmount: Number(formData.targetAmount),
            deadlineDate: monthToDeadline(formData.month), // Convert month to deadlineDate (first day of month)
        };

        console.log('Sending goal payload:', payload);

        try {
            let result;
            if (isEditMode) {
                const id = initialData.goalId || initialData.id;
                result = await savingsApi.update(id, payload);
            } else {
                result = await savingsApi.create(payload);
            }
            
            onSave(result);
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error saving goal:', error);
            console.error('Error response:', error?.response?.data);
            const message = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Unknown network error.';
            setApiError(`Failed to save goal: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Disable inputs if the goal is completed (assumption for UX)
    // Backend uses uppercase status, normalize for comparison
    const isGoalCompleted = initialData?.status?.toLowerCase() === 'completed' || initialData?.status === 'COMPLETED';

    // Handle close with proper cleanup
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    // Don't render anything if modal is not open (after all hooks are called)
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             role="dialog" aria-modal="true" aria-label={isEditMode ? "Edit Goal" : "Create Goal"}
             onClick={handleClose}
        >
            <div className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl transition-all duration-200 ${isGoalCompleted ? 'opacity-70' : ''}`}
                 onClick={e => e.stopPropagation()}
            >
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#7E57C2]">{isEditMode ? 'Edit Goal' : 'Create Goal'}</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-700 transition"
                            aria-label="Close modal"
                            type="button"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                    {isGoalCompleted && (
                        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg border border-green-300 text-sm">
                            This goal is completed and cannot be modified.
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Goal Name and Target Amount */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Vacation Fund"
                                    ref={initialFocusRef}
                                    disabled={isGoalCompleted}
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${formErrors.name ? 'border-red-500' : 'border-gray-300'} ${isGoalCompleted ? 'bg-gray-100' : ''}`}
                                />
                                {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            
                            <div>
                                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">Target Amount (Rs) *</label>
                                <input
                                    id="targetAmount"
                                    name="targetAmount"
                                    type="number"
                                    inputMode="decimal"
                                    value={formData.targetAmount}
                                    onChange={handleChange}
                                    placeholder="10000.00"
                                    step="0.01"
                                    min="0.01"
                                    disabled={isGoalCompleted}
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] ${formErrors.targetAmount ? 'border-red-500' : 'border-gray-300'} ${isGoalCompleted ? 'bg-gray-100' : ''}`}
                                />
                                {formErrors.targetAmount && <p className="text-red-600 text-xs mt-1">{formErrors.targetAmount}</p>}
                            </div>
                        </div>

                        {/* Month and Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Target Month *</label>
                                <MonthPicker
                                    value={formData.month}
                                    onChange={handleChange}
                                    min={getCurrentMonthForInput()}
                                    disabled={isGoalCompleted}
                                    error={!!formErrors.month}
                                />
                                {formErrors.month && <p className="text-red-600 text-xs mt-1">{formErrors.month}</p>}
                                <p className="text-xs text-gray-500 mt-1">Month must be current or future.</p>
                            </div>
                            
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    disabled={isGoalCompleted}
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] border-gray-300 ${isGoalCompleted ? 'bg-gray-100' : ''}`}
                                >
                                    {['Low', 'Medium', 'High'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
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
                                disabled={isSaving || isGoalCompleted}
                                className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform ${
                                    isSaving
                                        ? 'bg-gray-400'
                                        : 'bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5'
                                } ${isGoalCompleted ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                {isSaving ? 'Saving...' : (isEditMode ? 'Save changes' : 'Add Goal')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- 6. GoalRow Component ---
const GoalRow = ({ goal, onEdit, onDelete, onDetails, onStatusChange }) => {
    // Normalize status - backend uses uppercase (ACTIVE, COMPLETED, FAILED), frontend expects lowercase
    const normalizedStatus = goal.status?.toLowerCase() || 'active';
    
    // Use progress data directly from goal object (backend includes it in the DTO)
    // Fallback to fetching if not available
    const progressPercent = goal.progressPercentage !== undefined ? Number(goal.progressPercentage) : 0;
    const savedAmount = goal.savedAmount !== undefined ? Number(goal.savedAmount) : 0;
    const [progress, setProgress] = useState({ 
        progressPercent, 
        possibleSavings: savedAmount, 
        status: normalizedStatus 
    });
    const [loading, setLoading] = useState(false);

    const fetchProgress = useCallback(async () => {
        // Only fetch if progress data is not already available
        if (goal.progressPercentage === undefined || goal.savedAmount === undefined) {
            setLoading(true);
            try {
                const goalId = goal.goalId || goal.id;
                const goalData = await savingsApi.getById(goalId);
                const progressPercent = goalData.progressPercentage ? Number(goalData.progressPercentage) : 0;
                const savedAmount = goalData.savedAmount ? Number(goalData.savedAmount) : 0;
                const status = goalData.status?.toLowerCase() || goal.status || 'active';
                
                setProgress({
                    progressPercent,
                    possibleSavings: savedAmount,
                    status: status,
                });
            } catch (err) {
                console.error('Error fetching inline progress:', err);
                // Keep existing progress or default
                setProgress(prev => ({ 
                    ...prev, 
                    progressPercent: prev.progressPercent || 0, 
                    possibleSavings: prev.possibleSavings || 0 
                }));
            } finally {
                setLoading(false);
            }
        }
    }, [goal.goalId, goal.id, goal.status, goal.progressPercentage, goal.savedAmount]);

    useEffect(() => {
        // Update progress from goal data if available, otherwise fetch
        if (goal.progressPercentage !== undefined && goal.savedAmount !== undefined) {
            setProgress({
                progressPercent: Number(goal.progressPercentage) || 0,
                possibleSavings: Number(goal.savedAmount) || 0,
                status: goal.status?.toLowerCase() || 'active',
            });
        } else {
            // Only fetch if data is not available
            fetchProgress();
        }
    }, [goal.progressPercentage, goal.savedAmount, goal.status, fetchProgress]);

    const percent = progress.progressPercent;
    const progressWidth = `${Math.min(percent, 100)}%`;
    const progressBgClass = progressColorClass(percent);

    // Status Badge Logic - Backend uses ACTIVE, COMPLETED, FAILED (uppercase)
    const status = progress.status?.toLowerCase() || goal.status?.toLowerCase() || 'active';
    let statusClass = 'bg-gray-100 text-gray-700';
    if (status === 'active') statusClass = 'bg-purple-100 text-[#7E57C2]';
    if (status === 'paused') statusClass = 'bg-gray-100 text-gray-700';
    if (status === 'completed') statusClass = 'bg-green-100 text-[#4CAF50]';
    if (status === 'failed') statusClass = 'bg-red-100 text-[#E53935]';
    
    // Status Action Logic - Backend doesn't support pause/resume, but keeping UI
    const actionText = status === 'paused' ? 'Resume' : 'Pause';

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Name and Target Info */}
                <div className="flex-1">
                    <span className="text-lg font-bold text-gray-800">{goal.name}</span>
                    <p className="text-sm text-gray-600 mt-1">
                        Target: <span className="font-semibold text-[#7E57C2]">{formatCurrency(goal.targetAmount)}</span>
                        {' • '}
                        Month: <span className="font-medium">{formatMonthDisplay(goal.month || goal.deadlineDate)}</span>
                    </p>
                </div>

                {/* Center: Progress Bar and Savings */}
                <div className="flex-grow w-full lg:w-1/3">
                    <div className="flex items-center space-x-3">
                        {loading ? (
                            <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse"></div>
                        ) : (
                            <>
                                <div className="w-64 h-3 rounded-full bg-gray-200 flex-shrink-0">
                                    <div 
                                        className={`h-full rounded-full ${progressBgClass}`}
                                        style={{ width: progressWidth }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 flex-shrink-0">{percent.toFixed(0)}%</span>
                            </>
                        )}
                    </div>
                    
                    {!loading && (
                        <p className="text-xs text-gray-500 mt-1">
                            Possible savings: <span className="font-semibold text-[#4CAF50]">{formatCurrency(progress.possibleSavings)}</span>
                        </p>
                    )}
                </div>

                {/* Right: Status and Actions */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${statusClass} flex-shrink-0`}>
                        {status.toUpperCase()}
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                        {/* Details */}
                        <button
                            onClick={() => onDetails(goal.goalId || goal.id, goal.name)}
                            className="text-xs font-medium border border-[#7E57C2] text-[#7E57C2] hover:bg-purple-50 px-3 py-1 rounded-md transition"
                            aria-label={`View details for ${goal.name}`}
                        >
                            Details
                        </button>
                        {/* Pause / Resume - Backend doesn't support this, but keeping UI for consistency */}
                        {status !== 'completed' && status !== 'failed' && (
                            <button
                                onClick={() => onStatusChange(goal.goalId || goal.id, actionText.toLowerCase())}
                                className="text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-md transition"
                                aria-label={`${actionText} goal ${goal.name}`}
                            >
                                {actionText}
                            </button>
                        )}
                        {/* Edit */}
                        <button
                            onClick={() => onEdit(goal)}
                            className="text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-md transition"
                            aria-label={`Edit goal ${goal.name}`}
                        >
                            Edit
                        </button>
                        
                        {/* Delete */}
                        <button
                            onClick={() => onDelete(goal.goalId || goal.id)}
                            className="text-xs font-medium text-[#E53935] hover:bg-red-50 px-3 py-1 rounded-md transition"
                            aria-label={`Delete goal ${goal.name}`}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 7. GoalsPage Component (Default Export) ---
const GoalsPage = () => {
    const location = useLocation();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [pageError, setPageError] = useState(null);
    
    // Progress Details Modal State
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [selectedGoalName, setSelectedGoalName] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        setPageError(null);
        try {
            console.log('Fetching goals...');
            console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api');
            console.log('Full endpoint will be:', `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/goals`);
            
            const data = await savingsApi.getAll();
            console.log('Received goals data:', data);
            console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
            
            // Normalize IDs and convert deadlineDate to month for display
            // Backend returns savedAmount and progressPercentage in the DTO
            const normalizedGoals = (Array.isArray(data) ? data : []).map(goal => ({
                ...goal,
                id: goal.goalId || goal.id, // Normalize ID field
                month: goal.deadlineDate ? dayjs(goal.deadlineDate).format('YYYY-MM') : null, // Convert deadlineDate to month
                // Ensure savedAmount and progressPercentage are numbers
                savedAmount: goal.savedAmount ? Number(goal.savedAmount) : 0,
                progressPercentage: goal.progressPercentage ? Number(goal.progressPercentage) : 0,
            }));

            // Sort by deadlineDate ascending (to show oldest goal first)
            setGoals(normalizedGoals.sort((a, b) => {
                const dateA = a.deadlineDate ? dayjs(a.deadlineDate).unix() : 0;
                const dateB = b.deadlineDate ? dayjs(b.deadlineDate).unix() : 0;
                return dateA - dateB;
            }));
        } catch (error) {
            console.error('Error fetching goals:', error);
            console.error('Error response:', error?.response);
            console.error('Error response data:', error?.response?.data);
            console.error('Error response status:', error?.response?.status);
            console.error('Error config:', error?.config);
            
            // Extract detailed error information
            let errorMessage = 'Unknown error occurred';
            const statusCode = error?.response?.status || 'Network Error';
            
            if (error?.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.errorMessage) {
                    errorMessage = error.response.data.errorMessage;
                } else {
                    errorMessage = JSON.stringify(error.response.data);
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            setPageError(`Failed to load goals (Status: ${statusCode}). ${errorMessage}`);
            setGoals([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    // Ensure modal is closed when component mounts or route changes
    useEffect(() => {
        // Reset all modal states when navigating to this page
        setModalOpen(false);
        setEditItem(null);
        setProgressModalOpen(false);
        setSelectedGoalId(null);
        setSelectedGoalName('');
    }, [location.pathname]); // Reset when pathname changes
    
    // Handlers for CRUD/Actions
    const handleSave = async (savedItem) => {
        await fetchGoals();
        showToast(editItem ? 'Goal updated successfully.' : 'Goal created successfully.', 'success');
        setEditItem(null);
        setModalOpen(false); // Ensure modal is closed after save
    };

    const handleDelete = async (id) => {
        const originalGoals = goals;
        setGoals(prev => prev.filter(g => (g.goalId || g.id) !== id));
        
        try {
            await savingsApi.delete(id);
            showToast('Goal deleted successfully.', 'success');
        } catch (error) {
            setGoals(originalGoals); // Rollback
            showToast(`Delete failed: ${error?.response?.data?.message || error?.message || 'Error'}`, 'error');
        }
    };
    
    const handleStatusChange = async (id, action) => {
        // Backend doesn't support pause/resume - status is calculated automatically
        // This is a frontend-only feature, so we'll just show a message
        showToast('Status is automatically managed by the system based on progress and deadline.', 'success');
        // Refresh to get updated status
        await fetchGoals();
    };
    
    const handleDetails = (id, name) => {
        // Normalize ID - use goalId if available, otherwise id
        const goalId = typeof id === 'object' ? (id.goalId || id.id) : id;
        setSelectedGoalId(goalId);
        setSelectedGoalName(name);
        setProgressModalOpen(true);
    };

    // Calculate summary statistics - memoized
    const summary = useMemo(() => {
        return goals.reduce(
            (acc, goal) => {
                acc.totalTarget += Number(goal.targetAmount || 0);
                acc.totalSaved += Number(goal.savedAmount || 0);
                acc.activeCount += goal.status === 'ACTIVE' || goal.status?.toLowerCase() === 'active' ? 1 : 0;
                acc.completedCount += goal.status === 'COMPLETED' || goal.status?.toLowerCase() === 'completed' ? 1 : 0;
                return acc;
            },
            { totalTarget: 0, totalSaved: 0, activeCount: 0, completedCount: 0 }
        );
    }, [goals]);

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
                <button onClick={fetchGoals} className="mt-4 px-4 py-1.5 bg-[#7E57C2] text-white rounded-full text-sm hover:bg-purple-700 transition">
                    Retry Load
                </button>
            </div>
        );
    } else if (goals.length === 0) {
        content = (
            <div className="mt-12 p-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 max-w-2xl mx-auto">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                <p className="mt-3 text-lg font-medium text-gray-700">You have no saving goals set up yet.</p>
                <p className="text-sm">Start managing your financial future now!</p>
                <button
                    onClick={() => { setEditItem(null); setModalOpen(true); }}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
                >
                    Add Goal
                </button>
            </div>
        );
    } else {
        content = (
            <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Total Goals</p>
                        <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Total Target</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalTarget)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Total Saved</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSaved)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Active Goals</p>
                        <p className="text-2xl font-bold text-blue-600">{summary.activeCount}</p>
                    </div>
                </div>

                {/* Goals List */}
                <div className="space-y-4 mt-6 max-w-5xl mx-auto">
                    {goals.map(g => (
                        <GoalRow
                            key={g.id || g.goalId}
                            goal={g}
                            onEdit={g => { setEditItem(g); setModalOpen(true); }}
                            onDelete={handleDelete}
                            onDetails={handleDetails}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            </>
        );
    }

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
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-[#7E57C2]">Your Goals</h1>
                                <p className="text-sm text-gray-600 mt-1">Manage your monthly saving goals</p>
                            </div>
                            
                            <button
                                onClick={() => { setEditItem(null); setModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
                                aria-label="Add New Goal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Goal
                            </button>
                        </div>
                        {/* Main Content Area */}
                        {content}
                    </div>
                    {/* Toast Notification */}
                    {toast && <Toast message={toast.message} type={toast.type} />}
                    {/* Add/Edit Modal */}
                    <GoalModal
                        isOpen={modalOpen}
                        onClose={() => {
                            setModalOpen(false);
                            setEditItem(null);
                        }}
                        onSave={handleSave}
                        initialData={editItem}
                    />
                    {/* Progress Details Modal */}
                    <ProgressDetailsModal
                        isOpen={progressModalOpen}
                        onClose={() => setProgressModalOpen(false)}
                        goalId={selectedGoalId}
                        goalName={selectedGoalName}
                    />
                </div>
            </main>
        </div>
    );
};

export default GoalsPage;
