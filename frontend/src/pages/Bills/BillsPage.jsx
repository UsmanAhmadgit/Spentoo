import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { billApi } from '../../api/billApi';
import { categoryApi } from '../../api/categoryApi';

/**
 * README: Bills Management Application (Single File Implementation)
 *
 * This file implements the entire Bills Management frontend page using React
 * functional components, hooks, and Tailwind CSS for styling.
 *
 * Endpoints Used:
 * - GET /bills: Retrieves all bills.
 * - POST /bills: Creates a new bill.
 * - PUT /bills/:id: Updates an existing bill (used for editing and participant status toggle).
 * - DELETE /bills/:id: Deletes a bill.
 * - GET /categories: Retrieves all categories for the dropdown.
 *
 * Data Shapes:
 * - Bill: { id, description, totalAmount, categoryName, billDate, dueDate, status, participants, ... }
 * - Category: { id, name, type, ... }
 * - Participant: { participantId, name, share, paid }
 */

// --- 2. Utility Functions ---

// Formats a date string to YYYY-MM-DD for input fields or a readable format.
const formatForInput = (dateString) => {
    if (!dateString) return '';
    // Ensure input format is YYYY-MM-DD
    return new Date(dateString).toISOString().substring(0, 10);
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

// --- 3. Header Component ---
const Header = ({ onAddBill }) => (
    <div className="flex items-center justify-between gap-4 mb-6">
        {/* Title and Subtitle */}
        <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] bg-clip-text text-transparent">Your Bills</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your bills by type and track spending progress</p>
        </div>
        
        {/* Add Bill Button */}
        <button
            onClick={onAddBill}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-white shadow-md transition duration-300 transform bg-gradient-to-r from-[#7E57C2] to-[#8E24AA] hover:shadow-lg hover:-translate-y-0.5"
            aria-label="Add New Bill"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Bill
        </button>
    </div>
);


// --- 4. ParticipantRow Component ---
const ParticipantRow = ({ participant, onTogglePaid, readOnly }) => {
    const isPaid = participant.paid;
    const isNewParticipant = participant.tempId !== undefined;

    return (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-4">
            {/* Participant Name and Share */}
            <div className="flex flex-col flex-grow">
                <span className="font-semibold text-gray-900">{participant.name}</span>
                <span className="text-xs text-gray-500 mt-0.5">Share: {formatCurrency(participant.share)}</span>
            </div>

            {/* Paid/Unpaid Toggle */}
            <button
                onClick={() => !readOnly && onTogglePaid(participant.participantId || participant.tempId)}
                disabled={readOnly || isNewParticipant} // Disable interaction on temporary IDs or if read-only
                className={`flex-shrink-0 rounded-full px-4 py-1 text-sm font-medium text-white transition transform duration-200 ${
                    isPaid
                        ? 'bg-[#43A047] hover:bg-green-600' // Green for Paid (Success)
                        : 'bg-[#E53935] hover:bg-red-600' // Red for Not paid (Danger)
                } ${readOnly || isNewParticipant ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95'}`}
                aria-label={`Mark participant ${participant.name} as ${isPaid ? 'Unpaid' : 'Paid'}`}
            >
                {isPaid ? 'Paid' : 'Not Paid'}
            </button>
        </div>
    );
};


// --- 5. ParticipantsList Component ---
const ParticipantsList = ({ bill, onTogglePaid, readOnly }) => {
    return (
        <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4 space-y-2">
            {bill.participants.map(p => (
                <ParticipantRow
                    key={p.participantId || p.tempId}
                    participant={p}
                    onTogglePaid={onTogglePaid}
                    readOnly={readOnly}
                />
            ))}
        </div>
    );
};


// --- 6. BillRow Component ---
const BillRow = ({ bill, onEdit, onDelete, onParticipantToggle, isExpanded, onToggleExpand }) => {
    const isCompleted = bill.status === 'Completed';

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
            {/* Main Bill Card */}
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* Left Column: Description, Category, Dates */}
                <div className="flex flex-col gap-1 w-full md:w-5/12">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg text-gray-900 truncate">{bill.description || 'Untitled Bill'}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#7E57C2] text-white">
                            {bill.categoryName || 'Unknown Category'}
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
                        <span>Created: <span className="text-gray-700 font-medium">
                            {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}
                        </span></span>
                    </div>
                </div>

                {/* Center Column: Amount and Status */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-4/12">
                    <div className="flex flex-col items-start md:items-end">
                        <span className="text-sm text-gray-500 uppercase">Total Amount</span>
                        <span className="text-xl font-extrabold text-[#111827]">{formatCurrency(bill.totalAmount)}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isCompleted
                            ? 'bg-[#43A047] text-white' // Completed (Green)
                            : 'bg-[#7E57C2]/10 text-[#7E57C2]' // Active (Purple Outline)
                    }`}>
                        {bill.status}
                    </span>
                </div>

                {/* Right Column: Actions and Toggle */}
                <div className="flex items-center justify-end gap-3 w-full md:w-3/12">
                    <button
                        onClick={() => onEdit(bill)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-[#2196F3] hover:bg-blue-50 transition opacity-80 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Edit Bill"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => onDelete(bill.id)}
                        className="p-1.5 rounded-full text-gray-400 hover:text-[#E53935] hover:bg-red-50 transition opacity-80 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Delete Bill"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>

                    {bill.participants && bill.participants.length > 0 && (
                        <button
                            onClick={() => onToggleExpand(bill.id)}
                            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition"
                            aria-label={isExpanded ? "Collapse participants" : "Expand participants"}
                            aria-expanded={isExpanded}
                            aria-controls={`participants-list-${bill.id}`}
                        >
                            <svg className={`w-6 h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Participants List */}
            {bill.participants && bill.participants.length > 0 && (
                <div
                    id={`participants-list-${bill.id}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 pt-3 px-4 pb-4' : 'max-h-0 opacity-0'}`}
                >
                    {isExpanded && (
                        <ParticipantsList bill={bill} onTogglePaid={onParticipantToggle} />
                    )}
                </div>
            )}
        </div>
    );
};


// --- 7. BillModal Component ---
const BillModal = ({ isOpen, onClose, editingBill, categories, onSave }) => {
    const isEditMode = !!editingBill;
    
    // Initial state for participants, mapping API structure to modal structure
    // Participants are optional - start with empty array if no participants exist
    const initialParticipants = editingBill?.participants && editingBill.participants.length > 0
        ? editingBill.participants.map(p => ({
            ...p,
            // Use tempId only if the participantId is null/0 (shouldn't happen on edit, but safe)
            tempId: p.participantId || Math.random().toString(36).substring(2, 9),
        }))
        : [];

    const [description, setDescription] = useState(editingBill?.description || '');
    const [totalAmount, setTotalAmount] = useState(editingBill?.totalAmount || '');
    const [categoryId, setCategoryId] = useState(editingBill?.categoryId || '');
    const [participants, setParticipants] = useState(initialParticipants);

    const [formErrors, setFormErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const initialFocusRef = useRef(null);

    // Reset form when modal opens/closes or editingBill changes
    useEffect(() => {
        if (isOpen) {
            // Set initial values when modal opens
            setDescription(editingBill?.description || '');
            setTotalAmount(editingBill?.totalAmount || '');
            setCategoryId(editingBill?.categoryId || '');
            setParticipants(editingBill?.participants && editingBill.participants.length > 0
                ? editingBill.participants.map(p => ({
                    ...p,
                    tempId: p.participantId || Math.random().toString(36).substring(2, 9),
                }))
                : []);
            setFormErrors({});
            setApiError('');
            setIsSaving(false);
            
            // Set initial focus
            setTimeout(() => {
                initialFocusRef.current?.focus();
            }, 50);

            // Close on ESC key press
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, editingBill, onClose]);

    // Validation Logic
    const validate = () => {
        const errors = {};
        let isValid = true;

        if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
            errors.totalAmount = 'Total Amount is required and must be greater than 0.';
            isValid = false;
        }
        // Category is only required if participants are provided
        if (participants.length > 0 && !categoryId) {
            errors.categoryId = 'Please select a category (required when participants are added).';
            isValid = false;
        }

        // Validate participants (optional - only validate if provided)
        const participantErrors = [];
        if (participants.length > 0) {
            participants.forEach((p, index) => {
                const pError = {};
                if (!p.name.trim()) {
                    pError.name = 'Name required';
                    isValid = false;
                }
                if (!p.share || isNaN(Number(p.share)) || Number(p.share) <= 0) {
                    pError.share = 'Share must be > 0';
                    isValid = false;
                }
                participantErrors[index] = pError;
            });
        }

        errors.participantErrors = participantErrors;
        setFormErrors(errors);
        return isValid;
    };

    // Participant handlers
    const handleAddParticipant = () => {
        setParticipants(prev => [
            ...prev,
            { name: '', share: '', paid: false, tempId: Math.random().toString(36).substring(2, 9) }
        ]);
    };

    const handleRemoveParticipant = (tempId) => {
        setParticipants(prev => prev.filter(p => p.tempId !== tempId));
        // Re-validate participants on removal
        validate();
    };

    const handleParticipantChange = (tempId, field, value) => {
        setParticipants(prev => prev.map(p =>
            p.tempId === tempId ? { ...p, [field]: value } : p
        ));
    };
    
    // Toggle Paid status for a participant in the modal form
    const handleParticipantTogglePaid = (tempId) => {
        setParticipants(prev => prev.map(p =>
            p.tempId === tempId ? { ...p, paid: !p.paid } : p
        ));
    };

    // Submission Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validate()) return;

        setIsSaving(true);
        
        // Final payload construction: map frontend fields to backend DTO fields
        const validParticipants = participants.filter(p => p.name && p.name.trim() && p.share && Number(p.share) > 0);
        const payloadParticipants = validParticipants.map(({ tempId, name, share, paid, ...rest }) => ({
            participantName: name.trim(),
            shareAmount: Number(share),
            isCreator: false, // Default to false, will be set to true for first participant if needed
            ...rest // Keep participantId if editing
        }));
        
        // Mark the first participant as creator if there are participants
        if (payloadParticipants.length > 0) {
            payloadParticipants[0].isCreator = true;
        }
        
        const payload = {
            description: description || null, // Send null if empty to match backend expectations
            totalAmount: Number(totalAmount),
            // Only include categoryId if it's a valid number and participants exist
            ...(categoryId && !isNaN(Number(categoryId)) && Number(categoryId) > 0 && payloadParticipants.length > 0
                ? { categoryId: Number(categoryId) }
                : {}),
            // Only include participants if there are any valid ones
            participants: payloadParticipants.length > 0 ? payloadParticipants : null,
        };

        try {
            let result;
            if (isEditMode) {
                result = await billApi.update(editingBill.id, payload);
            } else {
                result = await billApi.create(payload);
            }

            onSave(result); // Update main list
            onClose();

        } catch (error) {
            console.error('Error saving bill:', error);
            let errorMessage = 'Failed to save bill';
            if (error.response) {
                // Extract error message from response
                if (error.response.data) {
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data;
                    } else if (error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (typeof error.response.data === 'object') {
                        // Try to extract first error message
                        const errors = error.response.data;
                        const firstError = Object.values(errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || errorMessage;
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


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             role="dialog" aria-modal="true" aria-label={isEditMode ? "Edit Bill" : "Create New Bill"}
             onClick={onClose}
        >
            <div className="bg-[#FAFAFA] rounded-2xl w-full max-w-2xl p-4 z-50 shadow-2xl transition-all duration-200 transform scale-100 max-h-[calc(100vh-8rem)] overflow-y-auto"
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

                <h2 className="text-lg font-bold text-[#7E57C2] mb-3 pr-8">{isEditMode ? 'Edit Bill' : 'Create New Bill'}</h2>

                {/* API Error Message */}
                {apiError && (
                    <div className="p-2 mb-3 text-red-700 bg-red-100 rounded-lg border border-red-300 text-xs">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">

                    {/* Main Bill Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-0.5">Description (Optional)</label>
                            <input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Dinner at Ali's"
                                className="w-full border-b-2 border-gray-300 focus:border-[#2196F3] py-1.5 px-1 bg-transparent outline-none transition text-sm"
                            />
                        </div>

                        {/* Total Amount */}
                        <div>
                            <label htmlFor="totalAmount" className="block text-xs font-medium text-gray-700 mb-0.5">Total Amount (Rs) *</label>
                            <input
                                id="totalAmount"
                                type="number"
                                inputMode="decimal"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                placeholder="e.g., 1250"
                                className={`w-full border-b-2 py-1.5 px-1 bg-transparent outline-none transition text-sm ${formErrors.totalAmount ? 'border-red-500' : 'border-[#2196F3]'}`}
                                required
                            />
                            {formErrors.totalAmount && <p className="text-red-600 text-xs mt-0.5">{formErrors.totalAmount}</p>}
                        </div>

                        {/* Category Dropdown (Required only if participants are added) */}
                        <div>
                            <label htmlFor="categoryId" className="block text-xs font-medium text-gray-700 mb-0.5">
                                Category {participants.length > 0 ? '*' : '(Optional)'}
                            </label>
                            <select
                                id="categoryId"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                ref={initialFocusRef}
                                className={`w-full border-b-2 py-1.5 px-1 bg-transparent outline-none transition text-sm ${formErrors.categoryId ? 'border-red-500' : 'border-[#2196F3]'}`}
                                required={participants.length > 0}
                            >
                                <option value="" disabled>Select Category</option>
                                {categories && categories.length > 0 ? (
                                    categories.map(cat => (
                                        <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
                                            {cat.name || cat.categoryName}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No expense categories available</option>
                                )}
                            </select>
                            {formErrors.categoryId && <p className="text-red-600 text-xs mt-0.5">{formErrors.categoryId}</p>}
                        </div>

                    </div>
                    
                    {/* Participants Section (Optional) */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Participants (Optional)</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Add participants to split the bill</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddParticipant}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#7E57C2] hover:text-[#6A1B9A] transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add participant
                            </button>
                        </div>
                        
                        {/* Participant List Inputs */}
                        {participants.length === 0 ? (
                            <div className="text-center py-4 text-sm text-gray-500">
                                No participants added. Click "Add participant" to split the bill.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {participants.map((p, index) => (
                                <div key={p.tempId} className="flex gap-2 items-start p-1.5 border border-gray-100 rounded-md bg-gray-50">
                                    {/* Name Input */}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={p.name}
                                            onChange={(e) => handleParticipantChange(p.tempId, 'name', e.target.value)}
                                            placeholder="Name"
                                            className={`w-full text-xs py-1 px-1 bg-transparent outline-none border-b ${formErrors.participantErrors?.[index]?.name ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                        />
                                        {formErrors.participantErrors?.[index]?.name && <p className="text-red-600 text-xs mt-0.5">{formErrors.participantErrors[index].name}</p>}
                                    </div>
                                    
                                    {/* Share Input */}
                                    <div className="w-20 flex-shrink-0">
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={p.share}
                                            onChange={(e) => handleParticipantChange(p.tempId, 'share', e.target.value)}
                                            placeholder="Share"
                                            className={`w-full text-xs py-1 px-1 bg-transparent outline-none border-b ${formErrors.participantErrors?.[index]?.share ? 'border-red-500' : 'border-gray-300'}`}
                                            required
                                        />
                                        {formErrors.participantErrors?.[index]?.share && <p className="text-red-600 text-xs mt-0.5">{formErrors.participantErrors[index].share}</p>}
                                    </div>
                                    
                                    {/* Paid Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => handleParticipantTogglePaid(p.tempId)}
                                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white transition ${p.paid ? 'bg-[#43A047]' : 'bg-gray-500'}`}
                                    >
                                        {p.paid ? 'Paid' : 'Unpaid'}
                                    </button>

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParticipant(p.tempId)}
                                        className="p-0.5 text-gray-400 hover:text-[#E53935] transition"
                                        aria-label="Remove participant"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            </div>
                        )}
                        
                        {formErrors.participants && <p className="text-red-600 text-xs mt-1.5">{formErrors.participants}</p>}
                        
                        {/* Note about participants */}
                        {participants.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1.5 p-1.5 bg-gray-100 rounded-md">
                                Participants shares do not need to equal total amount.
                            </p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="pt-2 flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
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
                            {isSaving ? 'Saving...' : (isEditMode ? 'Update Bill' : 'Create Bill')}
                            {isSaving && (
                                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};


// --- 8. BillsPage Container (Default Export) ---
const BillsPage = () => {
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
    const [bills, setBills] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [toast, setToast] = useState(null); // { message: string, type: 'success'|'error' }
    const [expandedBillIds, setExpandedBillIds] = useState(new Set());

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all data concurrently
            const billDataArray = await billApi.getAll();
            const billData = Array.isArray(billDataArray) ? billDataArray : billDataArray.bills || [];
            
            const categoryDataArray = await categoryApi.getAll();
            
            // Handle different response structures
            let allCategories = [];
            if (Array.isArray(categoryDataArray)) {
                allCategories = categoryDataArray;
            } else if (categoryDataArray && Array.isArray(categoryDataArray.categories)) {
                allCategories = categoryDataArray.categories;
            } else if (categoryDataArray && categoryDataArray.data && Array.isArray(categoryDataArray.data)) {
                allCategories = categoryDataArray.data;
            }
            
            // Filter to only show EXPENSE type categories and active categories (bills use expense categories)
            const expenseCategories = allCategories.filter(cat => 
                cat.type === 'EXPENSE' && (cat.isActive !== false)
            );
            
            // Map category names to bills for display and sort newest first
            const processedBills = (billData || [])
                .map(bill => {
                    const category = expenseCategories.find(c => c.id === bill.categoryId);
                    return {
                        ...bill,
                        categoryName: category ? category.name : 'Unknown',
                        // Ensure status is correctly set based on participants (if any)
                        status: bill.participants && bill.participants.length > 0
                            ? (bill.participants.every(p => p.paid) ? 'Completed' : 'Active')
                            : (bill.status || 'Active'),
                    };
                })
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            setBills(processedBills);
            setCategories(expenseCategories);

        } catch (err) {
            console.error('Initial data fetch failed:', err);
            // Show empty lists on failure, as requested
            setBills([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- UI Logic & Handlers ---

    // Generic toast display handler
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Toggle bill expansion
    const handleToggleExpand = (id) => {
        setExpandedBillIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Handle creation or update of a bill from modal
    const handleBillSave = (savedBill) => {
        const category = categories.find(c => c.id === savedBill.categoryId);
        
        const updatedBill = {
            ...savedBill,
            categoryName: category ? category.name : 'Unknown',
            status: savedBill.participants && savedBill.participants.length > 0
                ? (savedBill.participants.every(p => p.paid) ? 'Completed' : 'Active')
                : (savedBill.status || 'Active'),
        };

        setBills(prevBills => {
            if (editingBill) {
                // Edit: Replace the old bill
                return prevBills.map(b => b.id === savedBill.id ? updatedBill : b)
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            } else {
                // Add: Prepend the new bill
                return [updatedBill, ...prevBills]
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            }
        });

        showToast(editingBill ? 'Bill updated successfully.' : 'Bill created successfully.', 'success');
        setEditingBill(null);
    };

    // Open modal for editing
    const handleEditBill = (bill) => {
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    // Handle immediate deletion of a bill
    const handleDeleteBill = async (id) => {
        const originalBills = bills;
        setBills(prev => prev.filter(b => b.id !== id));
        
        try {
            await billApi.delete(id);
            showToast('Bill deleted.', 'success');
        } catch (error) {
            setBills(originalBills); // Rollback
            showToast(`Failed to delete bill: ${error.message}`, 'error');
            console.error('Delete failed:', error);
        }
    };
    
    // Handle toggling paid status for a participant
    const handleParticipantToggle = async (billId, participantId) => {
        const billToUpdate = bills.find(b => b.id === billId);
        if (!billToUpdate) return;
        
        // 1. Optimistic Update (UI)
        const updatedParticipants = billToUpdate.participants.map(p =>
            p.participantId === participantId ? { ...p, paid: !p.paid } : p
        );
        
        const newStatus = updatedParticipants.every(p => p.paid) ? 'Completed' : 'Active';
        const updatedBill = {
            ...billToUpdate,
            participants: updatedParticipants,
            status: newStatus,
        };
        
        setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
        
        // 2. API Update (PUT /bills/:id)
        try {
            const apiPayload = {
                ...updatedBill,
                // Send necessary API fields (excluding client-side added categoryName)
                categoryName: undefined,
                status: undefined,
            };
            const result = await billApi.update(billId, apiPayload);
            
            // Reconcile with API response (optional, but robust)
            handleBillSave(result);

        } catch (error) {
            // 3. Rollback on Failure
            setBills(prev => prev.map(b => b.id === billId ? billToUpdate : b));
            showToast(`Failed to update participant status: ${error.message}`, 'error');
            console.error('Participant toggle failed:', error);
        }
    };

    // --- Render Logic ---

    let content;
    if (loading) {
        // Skeleton loading state
        content = (
            <div className="mt-8 space-y-4">
                <div className="h-24 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
                <div className="h-24 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
                <div className="h-24 bg-gray-50 rounded-xl animate-pulse shadow-sm"></div>
            </div>
        );
    } else if (bills.length === 0) {
        // Empty state (used for successful empty fetch or failed fetch)
        content = (
            <div className="mt-8 p-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500 max-w-2xl mx-auto">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="mt-3 text-lg font-medium text-gray-700">No bills set up yet.</p>
                <p className="text-sm">Click "+ Add Bill" to start managing your shared expenses and due dates.</p>
            </div>
        );
    } else {
        // Bills List
        content = (
            <div className="mt-8 space-y-4 max-w-5xl mx-auto">
                {bills.map(bill => (
                    <BillRow
                        key={bill.id}
                        bill={bill}
                        onEdit={handleEditBill}
                        onDelete={handleDeleteBill}
                        onParticipantToggle={(participantId) => handleParticipantToggle(bill.id, participantId)}
                        isExpanded={expandedBillIds.has(bill.id)}
                        onToggleExpand={handleToggleExpand}
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
                <div className="min-h-screen bg-white text-gray-900 p-6 sm:p-8">
                    <div className="max-w-5xl mx-auto">
                        
                        {/* Header and Add Button */}
                        <Header onAddBill={() => { setEditingBill(null); setIsModalOpen(true); }} />

                        {/* Main Content (List/Empty/Loading) */}
                        {content}

                    </div>

                    {/* Floating Toast Notification */}
                    {toast && (
                        <div className={`fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-xl text-white transition-opacity duration-300 ${
                            toast.type === 'success' ? 'bg-[#43A047]' : 'bg-[#E53935]'
                        }`}>
                            {toast.message}
                        </div>
                    )}

                    {/* Bill Add/Edit Modal */}
                    <BillModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        editingBill={editingBill}
                        categories={categories}
                        onSave={handleBillSave}
                    />
                </div>
            </main>
        </div>
    );
};

export default BillsPage;
