import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../api/authApi";

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('username');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false
  });

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => password.length >= 6;

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
    
    if (field === 'username') setUsernameFocused(false);
    if (field === 'email') setEmailFocused(false);
    if (field === 'password') setPasswordFocused(false);
  };

  const validateField = (field) => {
    let newErrors = { ...errors };

    if (field === 'username' && loginMethod === 'username') {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else {
        newErrors.username = '';
      }
    }

    if (field === 'email' && loginMethod === 'email') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        newErrors.email = '';
      }
    }

    if (field === 'password') {
      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(password)) {
        newErrors.password = 'Password must be at least 8 characters and contain 1 special character';
      } else {
        newErrors.password = '';
      }
    }

    setErrors(newErrors);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({ username: '', email: '', password: '' });

    setTouched({
      username: loginMethod === 'username',
      email: loginMethod === 'email',
      password: true
    });

    let newErrors = { username: '', email: '', password: '' };
    let isValid = true;

    if (loginMethod === 'username') {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
        isValid = false;
      }
    } else {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
        isValid = false;
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    try {
      setIsSubmitting(true);
      const response = await authApi.login({
        loginMethod,
        username,
        email,
        password,
      });

      // Expecting { user: {...}, token: '...' } from backend
      const userData = response.user || {
        username: loginMethod === 'username' ? username : email,
        email: loginMethod === 'email' ? email : undefined,
      };
      const token = response.token || null;

      login(userData, token);

      const redirectPath = location.state?.from?.pathname || "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Extract error message from validation errors or general error
      let message = "Login failed. Please try again.";
      
      if (err?.response?.data) {
        const errorData = err.response.data;
        // Handle validation errors (Map format from backend)
        if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
          const errorMessages = Object.values(errorData).filter(msg => msg);
          message = errorMessages.length > 0 ? errorMessages.join(', ') : message;
        } else if (typeof errorData === 'string') {
          message = errorData;
        } else if (errorData.message) {
          message = errorData.message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };
  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Spentoo</h1>
      
      <div style={styles.card}>
        <div style={styles.formWrapper}>
          <div style={styles.toggleContainer}>
            <button
              type="button"
              style={{
                ...styles.toggleButton,
                ...(loginMethod === 'username' ? styles.toggleButtonActive : {})
              }}
              onClick={() => {
                setLoginMethod('username');
                setEmail('');
                setErrors({ ...errors, email: '' });
              }}
            >
              Username
            </button>
            <span style={styles.orText}>OR</span>
            <button
              type="button"
              style={{
                ...styles.toggleButton,
                ...(loginMethod === 'email' ? styles.toggleButtonActive : {})
              }}
              onClick={() => {
                setLoginMethod('email');
                setUsername('');
                setErrors({ ...errors, username: '' });
              }}
            >
              Email
            </button>
          </div>

          {loginMethod === 'username' && (
            <div style={styles.inputContainer}>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors({ ...errors, username: '' });
                  if (submitError) setSubmitError('');
                }}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => handleBlur('username')}
                style={styles.input}
              />
              <label
                htmlFor="username"
                style={{
                  ...styles.label,
                  ...(usernameFocused || username ? styles.labelFloat : {})
                }}
              >
                Username
              </label>
              {touched.username && errors.username && (
                <span style={styles.error}>{errors.username}</span>
              )}
            </div>
          )}

          {loginMethod === 'email' && (
            <div style={styles.inputContainer}>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                  if (submitError) setSubmitError('');
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => handleBlur('email')}
                style={styles.input}
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
              {touched.email && errors.email && (
                <span style={styles.error}>{errors.email}</span>
              )}
            </div>
          )}

          <div style={styles.inputContainer}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
                if (submitError) setSubmitError('');
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => handleBlur('password')}
              style={styles.input}
            />
            <label
              htmlFor="password"
              style={{
                ...styles.label,
                ...(passwordFocused || password ? styles.labelFloat : {})
              }}
            >
              Password
            </label>
            {touched.password && errors.password && (
              <span style={styles.error}>{errors.password}</span>
            )}
          </div>

          <div style={styles.forgotPasswordContainer}>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              style={styles.forgotPassword}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            style={styles.loginButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#43A047';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.color = '#43A047';
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          {submitError && (
            <div style={styles.submitError} role="alert">
              {submitError}
            </div>
          )}

          <div style={styles.registerContainer}>
            <span style={styles.registerText}>New here? </span>
            <button
              type="button"
              onClick={handleRegisterClick}
              style={styles.registerLink}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Register
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
    gap: '24px'
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  toggleButton: {
    padding: '8px 20px',
    border: '2px solid #1E88E5',
    borderRadius: '20px',
    backgroundColor: 'transparent',
    color: '#1E88E5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit'
  },
  toggleButtonActive: {
    backgroundColor: '#1E88E5',
    color: '#ffffff'
  },
  orText: {
    color: '#666',
    fontSize: '12px',
    fontWeight: '500'
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '8px'
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
  submitError: {
    display: 'block',
    color: '#E53935',
    fontSize: '14px',
    marginTop: '12px',
    marginBottom: '8px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    border: '1px solid #E53935',
    textAlign: 'center',
    fontWeight: '500'
  },
  forgotPasswordContainer: {
    textAlign: 'right',
    marginTop: '-12px'
  },
  forgotPassword: {
    color: '#000000',
    fontSize: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'none',
    border: 'none',
    padding: '0',
    fontFamily: 'inherit'
  },
  loginButton: {
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
  registerContainer: {
    textAlign: 'center',
    marginTop: '8px'
  },
  registerText: {
    color: '#000000',
    fontSize: '14px'
  },
  registerLink: {
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

export default Login;