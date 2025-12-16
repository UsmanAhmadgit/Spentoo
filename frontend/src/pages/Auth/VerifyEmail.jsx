import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        const errorMessage = err?.response?.data || err?.message || 'Email verification failed. Please try again.';
        setMessage(typeof errorMessage === 'string' ? errorMessage : 'Email verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Spentoo</h1>
      <div style={styles.card}>
        {status === 'verifying' && (
          <div style={styles.content}>
            <div style={styles.spinner}></div>
            <p style={styles.message}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.content}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successMessage}>{message}</p>
            <p style={styles.redirectMessage}>Redirecting to login page...</p>
            <button onClick={handleLoginClick} style={styles.loginButton}>
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.content}>
            <div style={styles.errorIcon}>✗</div>
            <p style={styles.errorMessage}>{message}</p>
            <button onClick={handleLoginClick} style={styles.loginButton}>
              Go to Login
            </button>
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px'
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #7E57C2',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  message: {
    fontSize: '16px',
    color: '#666666',
    marginBottom: '12px'
  },
  successIcon: {
    fontSize: '64px',
    color: '#43A047',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  successMessage: {
    fontSize: '16px',
    color: '#666666',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  redirectMessage: {
    fontSize: '14px',
    color: '#999999',
    marginBottom: '24px'
  },
  errorIcon: {
    fontSize: '64px',
    color: '#E53935',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  errorMessage: {
    fontSize: '16px',
    color: '#E53935',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  loginButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#43A047',
    backgroundColor: '#ffffff',
    border: '2px solid #43A047',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    fontFamily: 'inherit'
  }
};

export default VerifyEmail;

