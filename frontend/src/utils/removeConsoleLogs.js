/**
 * Utility to conditionally remove console.log in production
 * Use this instead of console.log for debug statements
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

// Always log errors in production
export const logError = (...args) => {
  console.error(...args);
};

