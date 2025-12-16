/**
 * Formats a number to currency format (Rs 10,000.00)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === '') return 'Rs 0.00';
    const num = Number(amount);
    if (isNaN(num)) return 'Rs 0.00';
    return `Rs ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

