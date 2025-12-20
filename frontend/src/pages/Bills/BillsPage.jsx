import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../Dashboard/Navbar';
import Sidebar from '../Dashboard/Sidebar';
import { cn } from '../../lib/utils';
import { billApi } from '../../api/billApi';
import { apiCache } from '../../utils/apiCache';

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rs 0.00';
    return `Rs ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

const ParticipantRow = React.memo(({ participant, readOnly, index }) => {
    const participantName = participant.name || participant.participantName || 'Unknown';
    const participantShare = participant.share || participant.shareAmount || 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
            {/* Left: Participant Info */}
            <div className="flex items-center gap-3 flex-grow">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7E57C2]/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#7E57C2]">{index + 1}</span>
                </div>
                <div className="flex flex-col flex-grow min-w-0">
                    <span className="font-semibold text-gray-900 truncate">{participantName}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>Share: <span className="font-medium text-gray-700">{formatCurrency(participantShare)}</span></span>
                        {participant.isCreator && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                Creator
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

ParticipantRow.displayName = 'ParticipantRow';

const ParticipantsList = ({ bill, readOnly }) => {
    return (
        <div className="space-y-2">
            {bill.participants.map((p, index) => (
                <ParticipantRow
                    key={p.participantId || p.tempId}
                    participant={p}
                    readOnly={readOnly}
                    index={index}
                />
            ))}
        </div>
    );
};

const BillRow = ({ bill, onEdit, onDelete, isExpanded, onToggleExpand, onBillStatusToggle }) => {
    return (
        <div className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
            {/* Main Bill Card */}
            <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* Left Column: Description and Dates */}
                <div className="flex flex-col gap-1 w-full md:w-5/12">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-lg text-gray-900 truncate">{bill.description || 'Untitled Bill'}</span>
                        {bill.participants && bill.participants.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {bill.participants.length} {bill.participants.length === 1 ? 'Participant' : 'Participants'}
                            </span>
                        )}
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

                    {/* Bill Status Display - Clickable for all bills */}
                    <button
                        onClick={() => onBillStatusToggle(bill.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            bill.status === 'Paid' || bill.status === 'Completed'
                                ? 'bg-[#43A047] text-white hover:bg-green-600'
                                : 'bg-[#E53935] text-white hover:bg-red-600'
                        }`}
                    >
                        {bill.status === 'Paid' || bill.status === 'Completed' ? 'Paid' : 'Unpaid'}
                    </button>
                </div>

                {/* Right Column: Actions and Toggle */}
                <div className="flex items-center justify-end gap-3 w-full md:w-3/12">
                    {/* Dropdown Arrow for Participants - More Prominent */}
                    {bill.participants && bill.participants.length > 0 && (
                        <button
                            onClick={() => onToggleExpand(bill.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200"
                            aria-label={isExpanded ? "Collapse participants" : "Expand participants"}
                            aria-expanded={isExpanded}
                            aria-controls={`participants-list-${bill.id}`}
                        >
                            <span className="text-xs text-gray-600">{bill.participants.length}</span>
                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={() => onEdit(bill)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-[#2196F3] hover:bg-blue-50 transition opacity-100"
                        aria-label="Edit Bill"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => onDelete(bill)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-[#E53935] hover:bg-red-50 transition opacity-100"
                        aria-label="Delete Bill"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Collapsible Participants List */}
            {bill.participants && bill.participants.length > 0 && (
                <div
                    id={`participants-list-${bill.id}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 ${
                        isExpanded 
                            ? 'max-h-[600px] opacity-100 pt-4 px-4 pb-4 bg-gray-50/50' 
                            : 'max-h-0 opacity-0'
                    }`}
                >
                    {isExpanded && (
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Participants ({bill.participants.length})
                            </h4>
                            <ParticipantsList bill={bill} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const BillModal = ({ isOpen, onClose, editingBill, onSave }) => {
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
    const [participants, setParticipants] = useState(initialParticipants);
    const [billStatus, setBillStatus] = useState(editingBill?.status === 'Paid' || editingBill?.status === 'Completed' ? 'Paid' : 'Unpaid');

    const [formErrors, setFormErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Set initial values when modal opens
            setDescription(editingBill?.description || '');
            setTotalAmount(editingBill?.totalAmount || '');
            setParticipants(editingBill?.participants && editingBill.participants.length > 0
                ? editingBill.participants.map(p => ({
                    ...p,
                    tempId: p.participantId || Math.random().toString(36).substring(2, 9),
                }))
                : []);
            // Initialize bill status from editingBill if available
            setBillStatus(editingBill?.status === 'Paid' || editingBill?.status === 'Completed' ? 'Paid' : 'Unpaid');
            setFormErrors({});
            setApiError('');
            setIsSaving(false);

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
            { name: '', share: '', tempId: Math.random().toString(36).substring(2, 9) }
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
    

    // Submission Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validate()) return;

        setIsSaving(true);
        
        // Final payload construction: map frontend fields to backend DTO fields
        const validParticipants = participants.filter(p => p.name && p.name.trim() && p.share && Number(p.share) > 0);
        const payloadParticipants = validParticipants.map(({ tempId, name, share, isCreator, ...rest }) => ({
            participantName: name.trim(),
            shareAmount: Number(share),
            isCreator: false, // Will be set below - explicitly exclude from rest
            ...rest // Keep participantId if editing (but not isCreator)
        }));
        
        // Mark ONLY the first participant as creator if there are participants
        // Ensure all others are explicitly set to false
        if (payloadParticipants.length > 0) {
            payloadParticipants.forEach((p, index) => {
                p.isCreator = index === 0; // Only first participant is creator
            });
        }
        
        const payload = {
            description: description || null, // Send null if empty to match backend expectations
            totalAmount: Number(totalAmount),
            // Only include participants if there are any valid ones
            participants: payloadParticipants.length > 0 ? payloadParticipants : null,
            // Include status (always include for editing, or when no participants)
            status: billStatus,
        };

        try {
            let result;
            if (isEditMode) {
                result = await billApi.update(editingBill.id, payload);
            } else {
                result = await billApi.create(payload);
            }

            onSave(result);
            onClose();

        } catch (error) {
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

                        {/* Bill Status (Paid/Unpaid) - Show always */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Bill Status</label>
                            <div className="flex gap-2 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setBillStatus('Paid')}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                        billStatus === 'Paid'
                                            ? 'bg-[#43A047] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Paid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillStatus('Unpaid')}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                        billStatus === 'Unpaid'
                                            ? 'bg-[#E53935] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Unpaid
                                </button>
                            </div>
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
                            <>
                            {formErrors.participants && (
                                <div className="mb-2 p-2 text-red-700 bg-red-100 rounded-lg border border-red-300 text-xs">
                                    {formErrors.participants}
                                </div>
                            )}
                            <div className="text-xs text-gray-600 mb-2">
                                Total Shares: <span className="font-semibold">{participants.reduce((sum, p) => sum + (Number(p.share) || 0), 0).toFixed(2)}</span> / 
                                Total Amount: <span className="font-semibold">{Number(totalAmount) || 0}</span>
                            </div>
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
                            </>
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

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [toast, setToast] = useState(null); // { message: string, type: 'success'|'error' }
    const [expandedBillIds, setExpandedBillIds] = useState(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { billId: number, billDescription: string }
    
    // Date filter state
    const [dateFilter, setDateFilter] = useState(() => {
        const saved = localStorage.getItem('bills_date_filter') || 'all';
        return saved === 'custom' ? 'all' : saved;
    });
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showCustomDateRange, setShowCustomDateRange] = useState(false);

    // Helper to get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const d = new Date();
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    // --- Data Fetching ---
    const fetchData = useCallback(async (filter = null, startDate = null, endDate = null) => {
        setLoading(true);
        try {
            // Fetch all bills
            const billDataArray = await billApi.getAll(filter, startDate, endDate);
            const billData = Array.isArray(billDataArray) ? billDataArray : billDataArray.bills || [];
            
            // Normalize participants and sort newest first
            const processedBills = (billData || [])
                .map(bill => {
                    // Normalize participants: ensure they have consistent field names
                    const normalizedParticipants = bill.participants && bill.participants.length > 0
                        ? bill.participants.map(p => ({
                            participantId: p.participantId,
                            participantName: p.participantName,
                            shareAmount: p.shareAmount,
                            isCreator: p.isCreator,
                            // Map to frontend structure
                            name: p.participantName || p.name,
                            share: p.shareAmount || p.share,
                            // Keep original fields for API calls
                            ...p
                        }))
                        : [];
                    
                    return {
                        ...bill,
                        id: bill.billsId || bill.id, // Normalize ID field
                        participants: normalizedParticipants,
                        status: bill.status || 'Unpaid',
                    };
                })
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            setBills(processedBills);

        } catch (err) {
            setBills([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (dateFilter !== 'custom') {
            if (dateFilter === 'all') {
                fetchData(null, null, null);
            } else if (dateFilter === 'lastmonth') {
                // Calculate last 30 days instead of previous calendar month
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);
                
                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];
                
                // Invalidate cache to ensure fresh data
                apiCache.invalidate('bills_all');
                fetchData(null, startDateStr, endDateStr);
            } else {
                // For lastweek and lastyear, use the filter parameter
                const filterValue = dateFilter;
                fetchData(filterValue, null, null);
            }
        }
    }, [dateFilter, fetchData]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFilterChange = useCallback((filter) => {
        apiCache.invalidate('bills_all');
        setDateFilter(filter);
        localStorage.setItem('bills_date_filter', filter);
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
    }, []);

    const handleCustomDateRange = useCallback(() => {
        if (!customStartDate || !customEndDate) {
            showToast('Please select both start and end dates.', 'error');
            return;
        }
        
        // Ensure dates are in YYYY-MM-DD format (remove time component if present)
        const startDateStr = customStartDate.split('T')[0];
        const endDateStr = customEndDate.split('T')[0];
        
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        if (start > end) {
            showToast('Start date cannot be after end date.', 'error');
            return;
        }
        
        // Invalidate cache to ensure fresh data
        apiCache.invalidate('bills_all');
        setDateFilter('custom');
        localStorage.setItem('bills_date_filter', 'custom');
        fetchData(null, startDateStr, endDateStr);
    }, [customStartDate, customEndDate, fetchData, showToast]);

    const handleClearCustomDateRange = useCallback(() => {
        setCustomStartDate('');
        setCustomEndDate('');
        setShowCustomDateRange(false);
        setDateFilter('all');
        localStorage.setItem('bills_date_filter', 'all');
        fetchData(null, null, null);
    }, [fetchData]);

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

    const handleBillSave = (savedBill) => {
        // Normalize participants: ensure they have consistent field names
        const normalizedParticipants = savedBill.participants && savedBill.participants.length > 0
            ? savedBill.participants.map(p => ({
                participantId: p.participantId,
                participantName: p.participantName,
                shareAmount: p.shareAmount,
                isCreator: p.isCreator,
                // Map to frontend structure
                name: p.participantName || p.name,
                share: p.shareAmount || p.share,
                // Keep original fields for API calls
                ...p
            }))
            : [];
        
        const updatedBill = {
            ...savedBill,
            id: savedBill.billsId || savedBill.id, // Normalize ID field
            participants: normalizedParticipants,
            status: savedBill.status || 'Unpaid',
            categoryId: savedBill.categoryId || editingBill?.categoryId, // Preserve categoryId
        };

        setBills(prevBills => {
            if (editingBill) {
                // Edit: Replace the old bill - check both id and billsId
                const billId = savedBill.billsId || savedBill.id;
                return prevBills.map(b => {
                    const currentId = b.id || b.billsId;
                    return currentId === billId ? updatedBill : b;
                })
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

    const handleEditBill = (bill) => {
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (bill) => {
        setDeleteConfirm({
            billId: bill.id,
            billDescription: bill.description || 'Untitled Bill'
        });
    };

    const handleDeleteBill = async (id) => {
        const originalBills = bills;
        setBills(prev => prev.filter(b => b.id !== id));
        setDeleteConfirm(null); // Close confirmation dialog
        
        try {
            await billApi.delete(id);
            showToast('Bill deleted successfully.', 'success');
        } catch (error) {
            setBills(originalBills); // Rollback
            showToast(`Failed to delete bill: ${error.message}`, 'error');
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirm(null);
    };
    
    const handleBillStatusToggle = async (billId) => {
        const billToUpdate = bills.find(b => b.id === billId);
        if (!billToUpdate) return;
        
        const newStatus = billToUpdate.status === 'Paid' || billToUpdate.status === 'Completed' ? 'Unpaid' : 'Paid';
        const updatedBill = { ...billToUpdate, status: newStatus };
        
        // Update UI immediately
        setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
        
        try {
            // Build payload based on whether bill has participants
            let apiPayload;
            
            if (billToUpdate.participants && billToUpdate.participants.length > 0) {
                // For bills with participants, include participants in payload
                const payloadParticipants = billToUpdate.participants.map(p => ({
                    participantName: p.participantName || p.name,
                    shareAmount: Number(p.shareAmount || p.share),
                    isCreator: p.isCreator || false,
                    ...(p.participantId ? { participantId: p.participantId } : {})
                }));
                
                apiPayload = {
                    description: billToUpdate.description || null,
                    totalAmount: Number(billToUpdate.totalAmount),
                    participants: payloadParticipants,
                    status: newStatus,
                };
            } else {
                // For bills without participants
                apiPayload = {
                    totalAmount: Number(billToUpdate.totalAmount),
                    description: billToUpdate.description || null,
                    status: newStatus,
                };
            }
            
            const result = await billApi.update(billId, apiPayload);
            
            // Update with response data
            const finalBill = {
                ...result,
                id: result.billsId || result.id,
                status: result.status || newStatus,
                // Preserve participants if they exist
                participants: result.participants || billToUpdate.participants || []
            };
            
            setBills(prev => prev.map(b => b.id === billId ? finalBill : b));
            showToast('Bill status updated successfully.', 'success');
        } catch (error) {
            // Rollback on failure
            setBills(prev => prev.map(b => b.id === billId ? billToUpdate : b));
            showToast(`Failed to update bill status: ${error.message}`, 'error');
        }
    };

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
                        onDelete={handleDeleteClick}
                        onBillStatusToggle={handleBillStatusToggle}
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
                                            <label htmlFor="billsStartDate" className="text-sm font-medium text-gray-700">From:</label>
                                            <input
                                                id="billsStartDate"
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label htmlFor="billsEndDate" className="text-sm font-medium text-gray-700">To:</label>
                                            <input
                                                id="billsEndDate"
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
                        onClose={() => { setIsModalOpen(false); setEditingBill(null); }}
                        editingBill={editingBill}
                        onSave={handleBillSave}
                    />

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
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Bill</h3>
                                </div>
                                
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.billDescription}"</span>? 
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
                                        onClick={() => handleDeleteBill(deleteConfirm.billId)}
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

export default BillsPage;
