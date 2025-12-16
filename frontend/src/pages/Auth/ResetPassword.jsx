import React, { useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../api/authApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({ 
    password: [], 
    confirmPassword: '',
    general: ''
  });
  const [touched, setTouched] = useState({ 
    password: false, 
    confirmPassword: false 
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Validate password to match backend regex: ^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Minimum 8 characters required');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('At least 1 lowercase letter required');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least 1 uppercase letter required');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least 1 number required');
    }
    if (!/[@#$%^&+=]/.test(password)) {
      errors.push('At least 1 special character (@#$%^&+=) required');
    }
    if (/\s/.test(password)) {
      errors.push('Password cannot contain spaces');
    }
    
    return errors;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
    
    if (field === 'password') setPasswordFocused(false);
    if (field === 'confirmPassword') setConfirmPasswordFocused(false);
  };

  const validateField = (field) => {
    let newErrors = { ...errors };

    if (field === 'password') {
      if (!password) {
        newErrors.password = ['Password is required'];
      } else {
        newErrors.password = validatePassword(password);
      }
      // Revalidate confirm password if it's already filled
      if (confirmPassword) {
        if (password !== confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          newErrors.confirmPassword = '';
        }
      }
    }

    if (field === 'confirmPassword') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        newErrors.confirmPassword = '';
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if token exists
    if (!token) {
      setErrors({
        ...errors,
        general: 'Invalid reset link. No token provided.'
      });
      return;
    }

    setTouched({ password: true, confirmPassword: true });

    let newErrors = { 
      password: [], 
      confirmPassword: '',
      general: ''
    };
    let isValid = true;

    if (!password) {
      newErrors.password = ['Password is required'];
      isValid = false;
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
        isValid = false;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsProcessing(true);
      setErrors({ ...newErrors, general: '' });
      
      try {
        await authApi.resetPassword(token, password, confirmPassword);
        // Navigate to login after successful reset
        navigate("/login");
      } catch (err) {
        // Handle error
        let errorMessage = "Password reset failed. Please try again.";
        const errorData = err?.response?.data;
        
        if (errorData) {
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            // Backend returns Map<String, String> for validation errors
            const validationErrors = errorData;
            
            // Map field-specific errors
            if (validationErrors.newPassword) {
              newErrors.password = Array.isArray(newErrors.password) 
                ? [validationErrors.newPassword] 
                : [validationErrors.newPassword];
            }
            if (validationErrors.confirmPassword) {
              newErrors.confirmPassword = validationErrors.confirmPassword;
            }
            if (validationErrors.token) {
              newErrors.general = validationErrors.token;
            }
            
            const errorMessages = Object.values(validationErrors).filter(msg => msg);
            errorMessage = errorMessages.length > 0 ? errorMessages.join(', ') : errorMessage;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Check for specific error messages
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('invalid') || 
            errorMessage.toLowerCase().includes('expired')) {
          setErrors({
            ...newErrors,
            general: errorMessage
          });
        } else {
          setErrors({
            ...newErrors,
            general: errorMessage
          });
        }
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Spentoo</h1>
      
      <div style={styles.card}>
        <div style={styles.formWrapper}>
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.description}>
            Enter your new password below.
          </p>

          {/* General Error Message */}
          {errors.general && (
            <div style={styles.generalError} role="alert">
              {errors.general}
            </div>
          )}

          {/* Password Field */}
          <div style={styles.inputContainer}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password.length > 0) setErrors({ ...errors, password: [] });
                if (errors.general) setErrors({ ...errors, general: '' });
                // Revalidate confirm password if it's already filled
                if (confirmPassword) {
                  validateField('confirmPassword');
                }
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => handleBlur('password')}
              style={styles.input}
              disabled={isProcessing}
            />
            <label
              htmlFor="password"
              style={{
                ...styles.label,
                ...(passwordFocused || password ? styles.labelFloat : {})
              }}
            >
              New Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            {touched.password && errors.password.length > 0 && (
              <div style={styles.errorContainer}>
                {errors.password.map((error, index) => (
                  <span key={index} style={styles.error}>{error}</span>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={styles.inputContainer}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                if (errors.general) setErrors({ ...errors, general: '' });
              }}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => handleBlur('confirmPassword')}
              style={styles.input}
              disabled={isProcessing}
            />
            <label
              htmlFor="confirmPassword"
              style={{
                ...styles.label,
                ...(confirmPasswordFocused || confirmPassword ? styles.labelFloat : {})
              }}
            >
              Confirm Password
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
              tabIndex={-1}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
            {touched.confirmPassword && errors.confirmPassword && (
              <span style={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            style={{
              ...styles.submitButton,
              ...(isProcessing ? styles.submitButtonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.target.style.backgroundColor = '#43A047';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#43A047';
              }
            }}
          >
            {isProcessing ? 'Resetting...' : 'Reset Password'}
          </button>

          <div style={styles.backToLoginContainer}>
            <button
              type="button"
              onClick={handleBackToLogin}
              style={styles.backToLoginLink}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#FDFDFD',
    padding: '20px',
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
  },
  logo: {
    fontSize: 'clamp(32px, 5vw, 60px)',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #7E57C2, #8E24AA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '40px',
    textAlign: 'center',
    margin: '0 0 40px 0'
  },
  card: {
    width: '90%',
    maxWidth: '450px',
    minWidth: '280px',
    padding: '2rem',
    borderRadius: '16px',
    backgroundColor: '#FAFAFA',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  formWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    margin: '0'
  },
  description: {
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center',
    margin: '0',
    lineHeight: '1.5'
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '8px',
    marginTop: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 0 8px 0',
    fontSize: '16px',
    color: '#000000',
    border: 'none',
    borderBottom: '2px solid #1E88E5',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box'
  },
  label: {
    position: 'absolute',
    left: '0',
    top: '12px',
    color: '#1E88E5',
    fontSize: '16px',
    pointerEvents: 'none',
    transition: 'all 0.3s ease',
    transformOrigin: 'left top'
  },
  labelFloat: {
    transform: 'translateY(-24px)',
    fontSize: '12px',
    color: '#1976D2'
  },
  eyeButton: {
    position: 'absolute',
    right: '0',
    top: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0',
    outline: 'none'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px'
  },
  error: {
    display: 'block',
    color: '#E53935',
    fontSize: '12px',
    marginTop: '6px'
  },
  generalError: {
    display: 'block',
    color: '#E53935',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '8px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    border: '1px solid #E53935',
    textAlign: 'center'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#43A047',
    backgroundColor: '#ffffff',
    border: '2px solid #43A047',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    fontFamily: 'inherit',
    marginTop: '8px'
  },
  submitButtonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed'
  },
  backToLoginContainer: {
    textAlign: 'center',
    marginTop: '8px'
  },
  backToLoginLink: {
    color: '#000000',
    fontSize: '14px',
    textDecoration: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'none',
    border: 'none',
    padding: '0',
    fontFamily: 'inherit'
  }
};

export default ResetPassword;
