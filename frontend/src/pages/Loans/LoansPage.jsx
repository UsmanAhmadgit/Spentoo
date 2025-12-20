import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { loanApi } from '../../api/loanApi';
import { paymentMethodApi } from '../../api/paymentMethodApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

/**
 * README: Loan Management Application (Improved Implementation)
 *
 * This component uses loanApi and paymentMethodApi for backend communication.
 *
 * Endpoints Used:
 * - GET /loans: Retrieves all loans
 * - POST /loans: Creates a new loan (installments are added via separate endpoint)
 * - PUT /loans/:id: Updates a loan
 * - DELETE /loans/:id: Deletes a loan
 * - POST /loans/:loanId/installments: Adds an installment to a loan
 * - GET /payment-methods: Retrieves all payment methods
 */

// --- Utility Functions & Constants ---

// Formats date string to YYYY-MM-DD for input fields
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

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

// Generates a temporary ID for client-side use
const generateTempId = () => Math.random().toString(36).substring(2, 9);

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

// --- InstallmentRow Component (Display Mode) ---
const InstallmentRow = React.memo(({ installment, onDelete, loanId, index, totalCount }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            {/* Left: Installment Info */}
            <div className="flex items-center gap-3 flex-grow">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7E57C2]/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#7E57C2]">{totalCount - index}</span>
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                    <span className="font-semibold text-gray-900">{formatCurrency(installment.amountPaid)}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>Date: <span className="font-medium text-gray-700">{formatForInput(installment.paymentDate)}</span></span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                            {installment.paymentMethodName || 'Cash'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Right: Delete Button */}
            <div className="flex-shrink-0">
                <button
                    onClick={() => onDelete(loanId, installment.installmentId || installment.id)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-[#E53935] hover:bg-red-50 transition"
                    aria-label="Delete installment"
                    title="Delete installment"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
});

InstallmentRow.displayName = 'InstallmentRow';

// --- LoanCard Component ---
const LoanCard = React.memo(({ loan, onEdit, onDelete, onToggleExpand, isExpanded, onInstallmentDelete, onStatusToggle }) => {
    // Ensure installments is always an array (handle null, undefined, or non-array values)
    const installments = Array.isArray(loan.installments) ? loan.installments : (loan.installments ? [loan.installments] : []);
    const isDeletable = installments.length === 0;
    const isClosed = loan.status === 'CLOSED';
    const loanId = loan.loanId || loan.id;

    return (
        <div className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
            {/* Main Loan Card */}
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* Left Column: Main Info */}
                <div className="flex flex-col gap-1 w-full md:w-5/12">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            loan.type === 'TAKEN' ? 'bg-red-50 text-[#E53935] border-[#E53935]' : 'bg-green-50 text-[#43A047] border-[#43A047]'
                        }`}>
                            {loan.type}
                        </span>
                        <span className="font-extrabold text-lg text-gray-900 truncate">{loan.personName}</span>
                        {installments.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {installments.length} {installments.length === 1 ? 'Installment' : 'Installments'}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
                        <span>Start Date: <span className="text-gray-700 font-medium">{formatForInput(loan.startDate)}</span></span>
                        {loan.dueDate && (
                            <span className="text-[#1E88E5] font-medium">
                                Due Date: {formatForInput(loan.dueDate)}
                            </span>
                        )}
                        {loan.interestRate > 0 && <span>Interest: {loan.interestRate}%</span>}
                    </div>
                    {loan.notes && (
                        <p className="text-sm text-gray-600 truncate mt-1">Notes: {loan.notes}</p>
                    )}
                </div>

                {/* Center Column: Amount and Status */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-4/12">
                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-sm text-gray-500 uppercase">Original Amount</span>
                        <span className="text-xl font-extrabold text-[#111827]">{formatCurrency(loan.originalAmount)}</span>
                        <span className="text-xs text-gray-500 mt-0.5">Remaining: 
                            <span className={`font-semibold ml-1 ${loan.remainingAmount <= 0 ? 'text-[#43A047]' : 'text-[#E53935]'}`}>
                                {formatCurrency(loan.remainingAmount)}
                            </span>
                        </span>
                    </div>

                    {isClosed ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            'bg-gray-200 text-gray-700'
                        }`}>
                            {loan.status}
                        </span>
                    ) : (
                        <button
                            onClick={() => onStatusToggle(loanId, loan.status)}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#43A047] text-white hover:bg-green-600 transition"
                            aria-label="Close loan"
                            title="Click to close loan"
                        >
                            {loan.status}
                        </button>
                    )}
                </div>

                {/* Right Column: Actions and Toggle */}
                <div className="flex items-center justify-end gap-3 w-full md:w-3/12">
                    {/* Dropdown Arrow for Installments - More Prominent */}
                    {installments.length > 0 && (
                        <button
                            onClick={() => onToggleExpand(loanId)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200"
                            aria-label={isExpanded ? "Collapse installments" : "Expand installments"}
                            aria-expanded={isExpanded}
                            aria-controls={`installments-list-${loanId}`}
                        >
                            <span className="text-xs text-gray-600">{installments.length}</span>
                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={() => onEdit(loan)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-[#2196F3] hover:bg-blue-50 transition opacity-100"
                        aria-label="Edit Loan"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => onDelete(loanId)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-[#E53935] hover:bg-red-50 transition opacity-100"
                        aria-label="Delete Loan"
                        title={isDeletable ? "Delete Loan" : "Cannot delete: remove installments first"}
                    >
                        <svg className={`w-5 h-5 ${!isDeletable ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Collapsible Installments List */}
            {installments.length > 0 && (
                <div
                    id={`installments-list-${loanId}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 ${
                        isExpanded 
                            ? 'max-h-[600px] opacity-100 pt-4 px-4 pb-4 bg-gray-50/50' 
                            : 'max-h-0 opacity-0'
                    }`}
                    aria-expanded={isExpanded}
                >
                    {isExpanded && (
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Installments ({installments.length})
                            </h4>
                            {/* Installments List */}
                            <div className="space-y-2">
                                {installments
                                    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                                    .map((installment, index) => (
                                        <InstallmentRow
                                            key={installment.installmentId || installment.id || installment.tempId}
                                            loanId={loanId}
                                            installment={installment}
                                            onDelete={onInstallmentDelete}
                                            index={index}
                                            totalCount={installments.length}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

LoanCard.displayName = 'LoanCard';

// --- LoanModal Component ---
const LoanModal = ({ isOpen, onClose, editingLoan, paymentMethods, onSave, onInstallmentDelete }) => {
    const isEditMode = !!editingLoan;
    
    // State for main loan fields
    const [loanForm, setLoanForm] = useState({
        type: editingLoan?.type || 'TAKEN',
        personName: editingLoan?.personName || '',
        originalAmount: editingLoan?.originalAmount || '',
        startDate: formatForInput(editingLoan?.startDate) || getTodayDate(),
        dueDate: formatForInput(editingLoan?.dueDate) || '',
        interestRate: editingLoan?.interestRate || '',
        notes: editingLoan?.notes || '',
    });

    // State for installments (map API data to include a tempId for new items)
    const [installments, setInstallments] = useState(
        (editingLoan?.installments || []).map(inst => ({ 
            ...inst, 
            tempId: inst.installmentId || inst.id || generateTempId(),
            id: inst.installmentId || inst.id,
            paymentMethodId: inst.paymentMethod?.methodId || inst.paymentMethod?.id || inst.paymentMethodId
        })) || []
    );

    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [apiError, setApiError] = useState('');
    const initialFocusRef = useRef(null);
    
    // Reset state when modal opens/changes context
    useEffect(() => {
        if (isOpen) {
            setApiError('');
            setFormErrors({});

            setLoanForm({
                type: editingLoan?.type || 'TAKEN',
                personName: editingLoan?.personName || '',
                originalAmount: editingLoan?.originalAmount || '',
                startDate: formatForInput(editingLoan?.startDate) || getTodayDate(),
                dueDate: formatForInput(editingLoan?.dueDate) || '',
                interestRate: editingLoan?.interestRate || '',
                notes: editingLoan?.notes || '',
            });

            setInstallments(
                (editingLoan?.installments || []).map(inst => ({ 
                    ...inst, 
                    tempId: inst.installmentId || inst.id || generateTempId(),
                    id: inst.installmentId || inst.id,
                    paymentMethodId: inst.paymentMethod?.methodId || inst.paymentMethod?.id || inst.paymentMethodId
                })) || []
            );

            // Focus trap/ESC close setup
            setTimeout(() => initialFocusRef.current?.focus(), 50);
            const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, editingLoan, onClose]);

    // General input change handler for loan form
    const handleLoanChange = useCallback((e) => {
        const { name, value } = e.target;
        setLoanForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]);

    // --- Installment Editing Handlers ---
    const handleAddInstallment = useCallback(() => {
        setInstallments(prev => [
            ...prev,
            { amountPaid: '', paymentDate: getTodayDate(), paymentMethodId: null, notes: '', tempId: generateTempId() }
        ]);
    }, []);

    const handleRemoveInstallment = useCallback((tempId) => {
        setInstallments(prev => prev.filter(inst => inst.tempId !== tempId));
    }, []);

    const handleInstallmentChange = useCallback((tempId, field, value) => {
        setInstallments(prev => prev.map(inst =>
            inst.tempId === tempId ? { ...inst, [field]: value } : inst
        ));
    }, []);

    // --- Validation and Submission ---
    const validate = useCallback(() => {
        const errors = {};
        let isValid = true;
        
        // Loan Form Validation
        if (!loanForm.personName.trim()) {
            errors.personName = 'Person Name is required.';
            isValid = false;
        }
        if (!loanForm.originalAmount || isNaN(Number(loanForm.originalAmount)) || Number(loanForm.originalAmount) <= 0) {
            errors.originalAmount = 'Original Amount must be greater than 0.';
            isValid = false;
        }
        if (!loanForm.startDate) {
            errors.startDate = 'Start Date is required.';
            isValid = false;
        }
        
        // Installment Validation
        const installmentErrors = [];
        installments.forEach((inst, index) => {
            const iError = {};
            if (!inst.amountPaid || isNaN(Number(inst.amountPaid)) || Number(inst.amountPaid) <= 0) {
                iError.amountPaid = 'Amount > 0 required.';
                isValid = false;
            }
            if (!inst.paymentDate) {
                iError.paymentDate = 'Date required.';
                isValid = false;
            }
            installmentErrors[index] = iError;
        });

        errors.installmentErrors = installmentErrors;
        setFormErrors(errors);
        return isValid;
    }, [loanForm, installments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validate()) return;
        
        setIsSaving(true);
        
        // Prepare payload: remove tempId from installments and convert amounts/dates
        const loanPayload = {
            ...loanForm,
            originalAmount: Number(loanForm.originalAmount),
            interestRate: loanForm.interestRate ? Number(loanForm.interestRate) : null,
            startDate: new Date(loanForm.startDate).toISOString(),
            dueDate: loanForm.dueDate ? new Date(loanForm.dueDate).toISOString() : null,
            
            installments: installments.map(({ tempId, ...rest }) => ({
                ...rest,
                amountPaid: Number(rest.amountPaid),
                paymentDate: new Date(rest.paymentDate).toISOString(),
                paymentMethodId: rest.paymentMethodId ? Number(rest.paymentMethodId) : null,
            }))
        };
        
        try {
            let result;
            if (isEditMode) {
                // PUT request for editing - backend allows updating certain fields including originalAmount and type
                // Installments need to be added separately via POST /loans/:loanId/installments
                const loanId = editingLoan.loanId || editingLoan.id;
                const updatePayload = {
                    personName: loanPayload.personName,
                    originalAmount: loanPayload.originalAmount,
                    type: loanPayload.type,
                    notes: loanPayload.notes || null,
                    dueDate: loanPayload.dueDate || null,
                    interestRate: loanPayload.interestRate || null,
                };
                result = await loanApi.update(loanId, updatePayload);
                
                // Add new installments separately
                const newInstallments = installments.filter(inst => !inst.id && !inst.installmentId);
                const installmentErrors = [];
                for (const inst of newInstallments) {
                    // Format paymentDate: if already YYYY-MM-DD, use it; otherwise convert
                    let paymentDateStr = inst.paymentDate;
                    if (paymentDateStr && !paymentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        paymentDateStr = new Date(paymentDateStr).toISOString().substring(0, 10);
                    }
                    
                    try {
                        const payload = {
                            amountPaid: Number(inst.amountPaid),
                            paymentDate: paymentDateStr,
                            paymentMethodId: inst.paymentMethodId && inst.paymentMethodId !== '' && inst.paymentMethodId !== '0' ? Number(inst.paymentMethodId) : null,
                            notes: inst.notes && inst.notes.trim() !== '' ? inst.notes.trim() : null
                        };
                        
                        await loanApi.addInstallment(loanId, payload);
                    } catch (err) {
                        const errorMsg = getErrorMessage(err);
                        installmentErrors.push(`Installment ${inst.amountPaid}: ${errorMsg}`);
                    }
                }
                
                // Refetch to get updated loan with all installments
                result = await loanApi.getById(loanId);
                
                // Show errors if any installments failed (but don't close modal)
                if (installmentErrors.length > 0) {
                    setApiError(`Loan updated, but some installments failed: ${installmentErrors.join('; ')}`);
                    setIsSaving(false);
                    return;
                }
            } else {
                // POST request for creation
                const createPayload = {
                    type: loanPayload.type,
                    personName: loanPayload.personName,
                    originalAmount: loanPayload.originalAmount,
                    startDate: loanPayload.startDate,
                    dueDate: loanPayload.dueDate,
                    interestRate: loanPayload.interestRate,
                    notes: loanPayload.notes,
                };
                result = await loanApi.create(createPayload);
                
                // Add installments separately after loan creation
                const newLoanId = result.loanId || result.id;
                const installmentErrors = [];
                for (const inst of installments) {
                    let paymentDateStr = inst.paymentDate;
                    if (paymentDateStr && !paymentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        paymentDateStr = new Date(paymentDateStr).toISOString().substring(0, 10);
                    }
                    
                    try {
                        const payload = {
                            amountPaid: Number(inst.amountPaid),
                            paymentDate: paymentDateStr,
                            paymentMethodId: inst.paymentMethodId && inst.paymentMethodId !== '' && inst.paymentMethodId !== '0' ? Number(inst.paymentMethodId) : null,
                            notes: inst.notes && inst.notes.trim() !== '' ? inst.notes.trim() : null
                        };
                        
                        await loanApi.addInstallment(newLoanId, payload);
                    } catch (err) {
                        const errorMsg = getErrorMessage(err);
                        installmentErrors.push(`Installment ${inst.amountPaid}: ${errorMsg}`);
                    }
                }
                
                // Refetch to get complete loan with installments
                result = await loanApi.getById(newLoanId);
                
                // Show errors if any installments failed (but don't close modal)
                if (installmentErrors.length > 0) {
                    setApiError(`Loan created, but some installments failed: ${installmentErrors.join('; ')}`);
                    setIsSaving(false);
                    return;
                }
            }

            onSave(result);
            onClose();

        } catch (error) {
            const errorMessage = getErrorMessage(error);
            setApiError(`Failed to save loan: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Component for Payment Method Dropdown (Themed)
    const PaymentMethodDropdown = ({ value, onChange, error }) => (
        <select
            value={value || ''}
            onChange={onChange}
            className={`w-full text-sm py-1 px-1 bg-transparent outline-none border-b focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] transition ${error ? 'border-red-500' : 'border-gray-300'}`}
            aria-label="Payment method"
        >
            <option value="">(Optional) Cash/Default</option>
            {paymentMethods.map(pm => {
                const pmId = pm.methodId || pm.id;
                return (
                    <option key={pmId} value={pmId}>
                        {pm.name} {pm.provider ? `(${pm.provider})` : ''}
                    </option>
                );
            })}
        </select>
    );

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            role="dialog" 
            aria-modal="true" 
            aria-label={isEditMode ? "Edit Loan" : "Add New Loan"}
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl transition-all duration-200 transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header - Fixed at top */}
                <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#7E57C2]">{isEditMode ? 'Edit Loan' : 'Add New Loan'}</h2>
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
                    {/* API Error Message */}
                    {apiError && (
                        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg border border-red-300 text-sm" role="alert">
                            {apiError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Loan Details (Responsive Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg border border-purple-100 bg-purple-50/50">
                            {/* Type (Radio/Segmented) - Full width on small screens */}
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <div className="flex rounded-lg bg-white p-1 border border-gray-300" role="radiogroup" aria-label="Loan type">
                                    {['TAKEN', 'GIVEN'].map(type => (
                                        <button
                                            type="button"
                                            key={type}
                                            name="type"
                                            onClick={() => setLoanForm(prev => ({ ...prev, type }))}
                                            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                                                loanForm.type === type 
                                                    ? 'bg-[#7E57C2] text-white shadow' 
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                            aria-pressed={loanForm.type === type}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Person Name */}
                            <div>
                                <label htmlFor="personName" className="block text-sm font-medium text-gray-700 mb-1">Person Name *</label>
                                <input
                                    id="personName"
                                    name="personName"
                                    type="text"
                                    value={loanForm.personName}
                                    onChange={handleLoanChange}
                                    maxLength={100}
                                    placeholder="e.g., Jane Doe"
                                    ref={initialFocusRef}
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:ring-1 focus:ring-[#7E57C2] focus:border-[#7E57C2] ${formErrors.personName ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                    aria-invalid={!!formErrors.personName}
                                    aria-describedby={formErrors.personName ? 'personName-error' : undefined}
                                />
                                {formErrors.personName && <p id="personName-error" className="text-red-600 text-xs mt-1">{formErrors.personName}</p>}
                            </div>

                            {/* Original Amount */}
                            <div>
                                <label htmlFor="originalAmount" className="block text-sm font-medium text-gray-700 mb-1">Original Amount (Rs) *</label>
                                <input
                                    id="originalAmount"
                                    name="originalAmount"
                                    type="number"
                                    inputMode="decimal"
                                    value={loanForm.originalAmount}
                                    onChange={handleLoanChange}
                                    placeholder="0.00"
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:ring-1 focus:ring-[#7E57C2] focus:border-[#7E57C2] ${formErrors.originalAmount ? 'border-red-500' : 'border-gray-300'}`}
                                    step="0.01"
                                    required
                                    aria-invalid={!!formErrors.originalAmount}
                                    aria-describedby={formErrors.originalAmount ? 'originalAmount-error' : undefined}
                                />
                                {formErrors.originalAmount && <p id="originalAmount-error" className="text-red-600 text-xs mt-1">{formErrors.originalAmount}</p>}
                            </div>
                            
                            {/* Start Date */}
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    value={loanForm.startDate}
                                    onChange={handleLoanChange}
                                    className={`w-full border-b-2 py-2 px-1 bg-transparent outline-none transition focus:ring-1 focus:ring-[#7E57C2] focus:border-[#7E57C2] ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                    aria-invalid={!!formErrors.startDate}
                                    aria-describedby={formErrors.startDate ? 'startDate-error' : undefined}
                                />
                                {formErrors.startDate && <p id="startDate-error" className="text-red-600 text-xs mt-1">{formErrors.startDate}</p>}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                                <input
                                    id="dueDate"
                                    name="dueDate"
                                    type="date"
                                    value={loanForm.dueDate}
                                    onChange={handleLoanChange}
                                    min={loanForm.startDate}
                                    className="w-full border-b-2 border-gray-300 focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] py-2 px-1 bg-transparent outline-none transition"
                                />
                            </div>

                            {/* Interest Rate */}
                            <div>
                                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                                <div className="relative">
                                    <input
                                        id="interestRate"
                                        name="interestRate"
                                        type="number"
                                        inputMode="decimal"
                                        value={loanForm.interestRate}
                                        onChange={handleLoanChange}
                                        placeholder="0.0"
                                        className="w-full border-b-2 border-gray-300 focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] py-2 px-1 bg-transparent outline-none transition"
                                        step="0.01"
                                        min="0"
                                    />
                                    <span className="absolute right-0 top-2 text-gray-500">%</span>
                                </div>
                            </div>

                            {/* Notes (Full Width) */}
                            <div className="lg:col-span-3 sm:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={loanForm.notes}
                                    onChange={handleLoanChange}
                                    rows="2"
                                    maxLength={300}
                                    placeholder="Add notes about this loan or agreement..."
                                    className="w-full border border-gray-300 rounded-md p-2 focus:border-[#7E57C2] focus:ring-1 focus:ring-[#7E57C2] outline-none transition"
                                ></textarea>
                            </div>
                        </div>

                        {/* Installments Editor */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Installments ({installments.length})</h3>
                                <button
                                    type="button"
                                    onClick={handleAddInstallment}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-[#7E57C2] hover:text-[#6A1B9A] transition"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Installment
                                </button>
                            </div>

                            {/* Installment Rows */}
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {installments.map((inst, index) => (
                                    <div key={inst.tempId} className="flex flex-col sm:flex-row gap-2 items-start p-3 border border-gray-100 rounded-md bg-white shadow-sm">
                                        <div className="w-full sm:w-1/5">
                                            <label className="block text-xs text-gray-500">Amount *</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                value={inst.amountPaid}
                                                onChange={(e) => handleInstallmentChange(inst.tempId, 'amountPaid', e.target.value)}
                                                placeholder="Amount Paid"
                                                className={`w-full text-sm py-1 px-1 bg-transparent outline-none border-b focus:border-[#7E57C2] ${formErrors.installmentErrors?.[index]?.amountPaid ? 'border-red-500' : 'border-gray-300'}`}
                                                required
                                                aria-invalid={!!formErrors.installmentErrors?.[index]?.amountPaid}
                                            />
                                            {formErrors.installmentErrors?.[index]?.amountPaid && (
                                                <p className="text-red-600 text-xs mt-1">{formErrors.installmentErrors[index].amountPaid}</p>
                                            )}
                                        </div>

                                        <div className="w-full sm:w-1/5">
                                            <label className="block text-xs text-gray-500">Date *</label>
                                            <input
                                                type="date"
                                                value={formatForInput(inst.paymentDate)}
                                                onChange={(e) => handleInstallmentChange(inst.tempId, 'paymentDate', e.target.value)}
                                                className={`w-full text-sm py-1 px-1 bg-transparent outline-none border-b focus:border-[#7E57C2] ${formErrors.installmentErrors?.[index]?.paymentDate ? 'border-red-500' : 'border-gray-300'}`}
                                                required
                                                aria-invalid={!!formErrors.installmentErrors?.[index]?.paymentDate}
                                            />
                                        </div>
                                        
                                        <div className="w-full sm:w-1/4">
                                            <label className="block text-xs text-gray-500">Method (Opt)</label>
                                            <PaymentMethodDropdown
                                                value={inst.paymentMethodId}
                                                onChange={(e) => handleInstallmentChange(inst.tempId, 'paymentMethodId', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="w-full sm:w-1/4 flex items-end">
                                            <div className="flex-grow">
                                                <label className="block text-xs text-gray-500">Notes (Opt)</label>
                                                <input
                                                    type="text"
                                                    value={inst.notes}
                                                    onChange={(e) => handleInstallmentChange(inst.tempId, 'notes', e.target.value)}
                                                    placeholder="Notes"
                                                    className="w-full text-sm py-1 px-1 bg-transparent outline-none border-b border-gray-300 focus:border-[#7E57C2]"
                                                />
                                            </div>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveInstallment(inst.tempId)}
                                                className="p-1 ml-2 text-gray-400 hover:text-[#E53935] transition flex-shrink-0"
                                                aria-label="Remove installment"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="pt-4 flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="border border-gray-300 text-gray-700 rounded-full px-4 py-2 font-semibold hover:bg-gray-50 transition"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform ${
                                    isSaving
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                            >
                                {isSaving ? 'Saving...' : (isEditMode ? 'Save changes' : 'Create Loan')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- LoansPage Component (Default Export) ---
const LoansPage = () => {
    // --- State Management ---
    const [loans, setLoans] = useState([]);
    
    // Date filter state
    const [dateFilter, setDateFilter] = useState(() => {
        const saved = localStorage.getItem('loans_date_filter') || 'all';
        return saved === 'custom' ? 'all' : saved;
    });
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDateRange, setShowCustomDateRange] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [expandedLoanIds, setExpandedLoanIds] = useState(new Set());
    const [toast, setToast] = useState(null); // { message: string, type: 'success'|'error' }
    const [closeConfirm, setCloseConfirm] = useState(null); // { loanId: number, personName: string }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { loanId: number, personName: string }

    // Utility: Calculate remaining amount and status
    const processedLoans = useMemo(() => {
        return loans.map(loan => {
            // Normalize field names (backend uses loanId, frontend expects id)
            const normalizedLoan = {
                ...loan,
                id: loan.loanId || loan.id,
            };

            // Normalize installments (backend uses installmentId, paymentMethod object)
            // Ensure installments is always an array (handle null, undefined, or non-array values)
            const installmentsArray = Array.isArray(normalizedLoan.installments) 
                ? normalizedLoan.installments 
                : (normalizedLoan.installments ? [normalizedLoan.installments] : []);
            
            const normalizedInstallments = installmentsArray.map(inst => {
                const paymentMethodId = inst.paymentMethod?.methodId || inst.paymentMethod?.id || inst.paymentMethodId;
                const paymentMethodName = inst.paymentMethod?.name || 
                    paymentMethods.find(pm => (pm.methodId || pm.id) === paymentMethodId)?.name || 
                    'Cash/Default';
                
                return {
                    ...inst,
                    id: inst.installmentId || inst.id,
                    paymentMethodId: paymentMethodId,
                    paymentMethodName: paymentMethodName,
                };
            });

            // Use backend's remainingAmount if available, otherwise calculate
            const remainingAmount = normalizedLoan.remainingAmount !== undefined 
                ? Number(normalizedLoan.remainingAmount)
                : normalizedLoan.originalAmount - normalizedInstallments.reduce((sum, inst) => sum + Number(inst.amountPaid || 0), 0);
            
            // Use backend's status if available, otherwise determine based on remaining amount
            // Keep loan active unless explicitly marked as closed
            const status = normalizedLoan.status || 'ACTIVE';

            return {
                ...normalizedLoan,
                remainingAmount,
                status,
                installments: normalizedInstallments,
            };
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [loans, paymentMethods]);

    // --- Data Fetching ---
    const fetchData = useCallback(async (filter = null, startDate = null, endDate = null) => {
        setLoading(true);
        try {
            const [loanData, pmData] = await Promise.all([
                loanApi.getAll(true, filter, startDate, endDate), // Include both active and closed loans
                paymentMethodApi.getAll(), // Payment methods are cached
            ]);

            // Handle different response formats
            const loansArray = Array.isArray(loanData) ? loanData : loanData.loans || [];
            const paymentMethodsArray = Array.isArray(pmData) ? pmData : pmData.paymentMethods || [];

            setLoans(loansArray);
            setPaymentMethods(paymentMethodsArray);

        } catch (err) {
            setLoans([]);
            setPaymentMethods([]);
            const errorMessage = getErrorMessage(err);
            setToast({ message: `Failed to load loans: ${errorMessage}`, type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateFilter !== 'custom') {
            const filterValue = dateFilter === 'all' ? null : dateFilter;
            // Explicitly pass null for startDate and endDate when using preset filters
            fetchData(filterValue, null, null);
        }
    }, [fetchData, dateFilter]);

    // Generic toast display handler
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Handler to change date filter
    const handleFilterChange = useCallback((filter) => {
        setDateFilter(filter);
        localStorage.setItem('loans_date_filter', filter);
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
        localStorage.setItem('loans_date_filter', 'custom');
        fetchData(null, customStartDate, customEndDate);
    }, [customStartDate, customEndDate, fetchData, showToast]);

    // Handler to clear custom date range
    const handleClearCustomDateRange = useCallback(() => {
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('all');
        localStorage.setItem('loans_date_filter', 'all');
    }, []);

    // Toggle loan expansion
    const handleToggleExpand = useCallback((id) => {
        setExpandedLoanIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    // Save loan (create or update)
    const handleLoanSave = useCallback(async (savedLoan) => {
        // Refetch all loans to get updated data
        await fetchData();
        if (savedLoan && savedLoan.personName) {
            const isEdit = editingLoan !== null;
            showToast(`Loan for ${savedLoan.personName} has been ${isEdit ? 'updated' : 'created'} successfully.`, 'success');
        } else {
            showToast('Loan saved successfully.', 'success');
        }
        setEditingLoan(null);
    }, [fetchData, editingLoan, showToast]);

    // Handle delete click - show confirmation modal
    const handleDeleteClick = useCallback((loanId) => {
        const loanToDelete = processedLoans.find(l => l.id === loanId);
        if (loanToDelete?.installments.length > 0) {
            showToast('Remove all installments before deleting the loan.', 'error');
            return;
        }

        setDeleteConfirm({
            loanId: loanId,
            personName: loanToDelete?.personName || 'this loan'
        });
    }, [processedLoans, showToast]);

    // Handle confirmed delete
    const handleDeleteLoan = useCallback(async (loanId) => {
        const originalLoans = loans;
        setLoans(prev => prev.filter(l => (l.loanId || l.id) !== loanId));
        setDeleteConfirm(null); // Close confirmation dialog

        try {
            await loanApi.delete(loanId);
            await fetchData();
            showToast('Loan deleted successfully.', 'success');
        } catch (error) {
            setLoans(originalLoans); // Rollback
            const errorMessage = getErrorMessage(error);
            showToast(`Failed to delete loan: ${errorMessage}`, 'error');
        }
    }, [loans, fetchData, showToast]);

    // Cancel delete confirmation
    const handleCancelDelete = useCallback(() => {
        setDeleteConfirm(null);
    }, []);
    
    // Delete an installment
    const handleInstallmentDelete = useCallback(async (loanId, installmentId) => {
        try {
            await loanApi.deleteInstallment(loanId, installmentId);
            await fetchData();
            showToast('Installment deleted successfully.', 'success');
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            showToast(`Failed to delete installment: ${errorMessage}`, 'error');
        }
    }, [fetchData, showToast]);

    // Show close confirmation dialog
    const handleStatusToggle = useCallback((loanId, currentStatus) => {
        // Only allow closing ACTIVE loans
        if (currentStatus === 'CLOSED') {
            return;
        }

        const loanToUpdate = processedLoans.find(l => (l.loanId || l.id) === loanId);
        
        if (!loanToUpdate) return;

        // Show confirmation dialog
        setCloseConfirm({
            loanId: loanId,
            personName: loanToUpdate.personName
        });
    }, [processedLoans]);

    // Handle confirmed loan closure
    const handleCloseLoan = useCallback(async (loanId) => {
        const loanToUpdate = processedLoans.find(l => (l.loanId || l.id) === loanId);
        
        if (!loanToUpdate) {
            setCloseConfirm(null);
            return;
        }

        const newStatus = 'CLOSED';

        // Optimistically update UI
        setLoans(prev => prev.map(l => {
            const id = l.loanId || l.id;
            if (id === loanId) {
                return {
                    ...l,
                    status: newStatus,
                    remainingAmount: 0
                };
            }
            return l;
        }));

        setCloseConfirm(null); // Close confirmation dialog

        try {
            // Include personName to satisfy backend validation
            await loanApi.update(loanId, { 
                personName: loanToUpdate.personName,
                status: newStatus 
            });
            await fetchData();
            showToast('Loan closed successfully.', 'success');
        } catch (error) {
            // Rollback on failure
            setLoans(prev => prev.map(l => {
                const id = l.loanId || l.id;
                return id === loanId ? loanToUpdate : l;
            }));
            const errorMessage = getErrorMessage(error);
            showToast(`Failed to close loan: ${errorMessage}`, 'error');
        }
    }, [processedLoans, fetchData, showToast]);

    // Cancel close confirmation
    const handleCancelClose = useCallback(() => {
        setCloseConfirm(null);
    }, []);

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

    // --- Render Logic ---
    let content;
    if (loading) {
        content = (
            <div className="mt-8 space-y-4 max-w-5xl mx-auto">
                <div className="h-28 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
                <div className="h-28 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
            </div>
        );
    } else if (processedLoans.length === 0) {
        content = (
            <div className="mt-12 p-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 max-w-2xl mx-auto">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.104 0 2 .896 2 2v1h-4v-1c0-1.104.896-2 2-2zm0-4c-2.21 0-4 1.79-4 4v3h8v-3c0-2.21-1.79-4-4-4z" />
                </svg>
                <p className="mt-3 text-lg font-medium text-gray-700">No loans yet.</p>
                <p className="text-sm">Start by adding a loan to track its repayments.</p>
                <button
                    onClick={() => { setEditingLoan(null); setModalOpen(true); }}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
                >
                    Add Loan
                </button>
            </div>
        );
    } else {
        content = (
            <div className="mt-8 space-y-4 max-w-5xl mx-auto">
                {processedLoans.map(loan => {
                    const loanId = loan.loanId || loan.id;
                    return (
                        <LoanCard
                            key={loanId}
                            loan={loan}
                            onEdit={l => { setEditingLoan(l); setModalOpen(true); }}
                            onDelete={handleDeleteClick}
                            onInstallmentDelete={handleInstallmentDelete}
                            onStatusToggle={handleStatusToggle}
                            isExpanded={expandedLoanIds.has(loanId)}
                            onToggleExpand={handleToggleExpand}
                        />
                    );
                })}
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
                <div className="min-h-screen bg-white text-gray-900 p-6 sm:p-8">
                    <div className="max-w-5xl mx-auto">
                        {/* Header and Add Button */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] bg-clip-text text-transparent">Your Loans</h1>
                                <p className="text-sm text-gray-500 mt-1">Track borrowed and given money, interest, and repayment progress</p>
                            </div>
                            
                            <button
                                onClick={() => { setEditingLoan(null); setModalOpen(true); }}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
                                aria-label="Add New Loan"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Loan
                            </button>
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
                                            <label htmlFor="loansStartDate" className="text-sm font-medium text-gray-700">From:</label>
                                            <input
                                                id="loansStartDate"
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label htmlFor="loansEndDate" className="text-sm font-medium text-gray-700">To:</label>
                                            <input
                                                id="loansEndDate"
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

                        {/* Main Content */}
                        {content}
                    </div>

                    {/* Loan Add/Edit Modal */}
                    <LoanModal
                        isOpen={modalOpen}
                        onClose={() => { setModalOpen(false); setEditingLoan(null); }}
                        editingLoan={editingLoan}
                        paymentMethods={paymentMethods}
                        onSave={handleLoanSave}
                        onInstallmentDelete={handleInstallmentDelete}
                    />

                    {/* Close Loan Confirmation Modal */}
                    {closeConfirm && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                             role="dialog" aria-modal="true" aria-label="Confirm Close Loan"
                             onClick={handleCancelClose}
                        >
                            <div className="bg-white rounded-2xl w-full max-w-md p-6 z-50 shadow-2xl"
                                 onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Close Loan</h3>
                                </div>
                                
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to close the loan for <span className="font-semibold text-gray-900">"{closeConfirm.personName}"</span>? 
                                    This will set the remaining amount to zero and mark the loan as closed. This action cannot be undone.
                                </p>
                                
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleCancelClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleCloseLoan(closeConfirm.loanId)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-[#43A047] rounded-lg hover:bg-green-600 transition"
                                    >
                                        Close Loan
                                    </button>
                                </div>
                            </div>
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
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Loan</h3>
                                </div>
                                
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete the loan for <span className="font-semibold text-gray-900">"{deleteConfirm.personName}"</span>? 
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
                                        onClick={() => handleDeleteLoan(deleteConfirm.loanId)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Toast Notification */}
                    {toast && (
                        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl text-white transition-opacity duration-300 ${
                            toast.type === 'success' ? 'bg-[#43A047]' : 'bg-[#E53935]'
                        }`}>
                            {toast.message}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default LoansPage;
