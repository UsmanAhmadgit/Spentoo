import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  const [errors, setErrors] = useState({
    email: ''
  });
  
  const [touched, setTouched] = useState({
    email: false
  });

  const [emailFocused, setEmailFocused] = useState(false);

  // Countdown timer for redirect
  useEffect(() => {
    let timer;
    if (showSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showSuccess && countdown === 0) {
      handleLoginRedirect();
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess, countdown]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
    
    if (field === 'email') setEmailFocused(false);
  };

  const validateField = (field) => {
    let newErrors = { ...errors };

    if (field === 'email') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        newErrors.email = '';
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark field as touched
    setTouched({ email: true });

    // Validate email
    let newErrors = { email: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setIsProcessing(true);
      
      try {
        await authApi.forgotPassword(email);
        setShowSuccess(true);
        setCountdown(5);
      } catch (err) {
        // Handle error - show message but still show success for security (don't reveal if email exists)
        console.error('Error sending password reset email:', err);
        // Still show success message for security (don't reveal if email exists)
        setShowSuccess(true);
        setCountdown(5);
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const navigate = useNavigate();
  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Spentoo</h1>
      
      <div style={styles.card}>
        <div style={styles.formWrapper}>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Email Field */}
          <div style={styles.inputContainer}>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => handleBlur('email')}
              style={styles.input}
              disabled={isProcessing || showSuccess}
            />
            <label
              htmlFor="email"
              style={{
                ...styles.label,
                ...(emailFocused || email ? styles.labelFloat : {})
              }}
            >
              Email
            </label>
            {touched.email && errors.email && !showSuccess && (
              <span style={styles.error}>{errors.email}</span>
            )}
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div style={styles.successMessage}>
              <p style={styles.successText}>
                If an account with this email exists, a reset link has been sent.
              </p>
              <p style={styles.redirectText}>
                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || showSuccess}
            style={{
              ...styles.submitButton,
              ...(isProcessing || showSuccess ? styles.submitButtonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && !showSuccess) {
                e.target.style.backgroundColor = '#43A047';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing && !showSuccess) {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#43A047';
              }
            }}
          >
            {isProcessing ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to Login Link */}
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
  error: {
    display: 'block',
    color: '#E53935',
    fontSize: '12px',
    marginTop: '6px'
  },
  successMessage: {
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#E8F5E9',
    border: '1px solid #43A047'
  },
  successText: {
    color: '#43A047',
    fontSize: '14px',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
    fontWeight: '500'
  },
  redirectText: {
    color: '#666666',
    fontSize: '13px',
    margin: '0',
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

export default ForgotPassword;