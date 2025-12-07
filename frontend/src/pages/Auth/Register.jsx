import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: []
  });
  
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Minimum 8 characters required');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('At least 1 uppercase letter required');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('At least 1 number required');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('At least 1 special character required');
    }
    
    return errors;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
    
    if (field === 'email') setEmailFocused(false);
    if (field === 'username') setUsernameFocused(false);
    if (field === 'password') setPasswordFocused(false);
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

    if (field === 'username') {
      if (!username.trim()) {
        newErrors.username = 'Username is required';
      } else {
        newErrors.username = '';
      }
    }

    if (field === 'password') {
      if (!password.trim()) {
        newErrors.password = ['Password is required'];
      } else {
        newErrors.password = validatePassword(password);
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      username: true,
      password: true
    });

    // Validate all fields
    let newErrors = { email: '', username: '', password: [] };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = ['Password is required'];
      isValid = false;
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors;
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (isValid) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate random backend response
        const randomNum = Math.random();
        
        if (randomNum < 0.3) {
          // Simulate email already exists
          setErrors({
            ...newErrors,
            email: 'This email is already registered'
          });
          setIsLoading(false);
        } else if (randomNum < 0.5) {
          // Simulate username already exists
          setErrors({
            ...newErrors,
            username: 'This username is already taken'
          });
          setIsLoading(false);
        } else {
          // Success
          const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocktoken';
          console.log('Registration successful!');
          console.log('JWT Token:', mockToken);
          console.log('User data:', { email, username });
          
          setTimeout(() => {
            setIsLoading(false);
            alert('Registration successful! Redirecting to dashboard...');
            console.log('Navigating to /dashboard');
          }, 1000);
        }
      }, 2000);
    }
  };

  const navigate = useNavigate();

const handleLoginClick = () => {
  navigate("/login");
};

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <h1 style={styles.loadingLogo}>Spentoo</h1>
        <div style={styles.dotsContainer}>
          <div style={{...styles.dot, animationDelay: '0s'}}></div>
          <div style={{...styles.dot, animationDelay: '0.2s'}}></div>
          <div style={{...styles.dot, animationDelay: '0.4s'}}></div>
        </div>
        <style>
          {`
            @keyframes bounce {
              0%, 80%, 100% {
                transform: translateY(0);
              }
              40% {
                transform: translateY(-20px);
              }
            }
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.5;
              }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>Spentoo</h1>
      
      <div style={styles.card}>
        <div style={styles.formWrapper}>
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

          {/* Username Field */}
          <div style={styles.inputContainer}>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          {/* Password Field */}
          <div style={styles.inputContainer}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {touched.password && errors.password.length > 0 && (
              <div style={styles.errorContainer}>
                {errors.password.map((error, index) => (
                  <span key={index} style={styles.error}>{error}</span>
                ))}
              </div>
            )}
          </div>

          {/* Register Button */}
          <button
            type="button"
            onClick={handleSubmit}
            style={styles.registerButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#43A047';
              e.target.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.color = '#43A047';
            }}
          >
            Register
          </button>

          {/* Login Link */}
          <div style={styles.loginContainer}>
            <span style={styles.loginText}>Already a user? </span>
            <button
              type="button"
              onClick={handleLoginClick}
              style={styles.loginLink}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Login
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
  registerButton: {
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
  loginContainer: {
    textAlign: 'center',
    marginTop: '8px'
  },
  loginText: {
    color: '#000000',
    fontSize: '14px'
  },
  loginLink: {
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
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#FDFDFD',
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif'
  },
  loadingLogo: {
    fontSize: 'clamp(40px, 6vw, 72px)',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #7E57C2, #8E24AA)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '30px',
    animation: 'pulse 2s ease-in-out infinite'
  },
  dotsContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'linear-gradient(to right, #7E57C2, #8E24AA)',
    animation: 'bounce 1.4s ease-in-out infinite'
  }
};

export default Register;