import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";

// Countries list (195+ countries)
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Register = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    country: '',
    password: [],
    confirmPassword: ''
  });
  
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    country: false,
    password: false,
    confirmPassword: false
  });

  const [focused, setFocused] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    country: false,
    password: false,
    confirmPassword: false
  });

  // Redirect to login after 5 seconds on success
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const validateUsername = (username) => {
    if (!username.trim()) {
      return 'Username is required';
    }
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.trim().length > 50) {
      return 'Username must be at most 50 characters';
    }
    return '';
  };

  const validateField = (field) => {
    let newErrors = { ...errors };

    if (field === 'firstName') {
      if (!firstName.trim()) {
        newErrors.firstName = 'First name is required';
      } else {
        newErrors.firstName = '';
      }
    }

    if (field === 'lastName') {
      if (!lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      } else {
        newErrors.lastName = '';
      }
    }

    if (field === 'username') {
      newErrors.username = validateUsername(username);
    }

    if (field === 'email') {
      if (!email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        newErrors.email = '';
      }
    }

    if (field === 'country') {
      if (!country.trim()) {
        newErrors.country = 'Country is required';
      } else {
        newErrors.country = '';
      }
    }

    if (field === 'password') {
      if (!password) {
        newErrors.password = ['Password is required'];
      } else {
        newErrors.password = validatePassword(password);
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

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
    setFocused({ ...focused, [field]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      country: true,
      password: true,
      confirmPassword: true
    };
    setTouched(allTouched);

    // Validate all fields
    let newErrors = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      country: '',
      password: [],
      confirmPassword: ''
    };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      newErrors.username = usernameError;
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!country.trim()) {
      newErrors.country = 'Country is required';
      isValid = false;
    }

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
      setIsLoading(true);
      setSubmitError('');
      
      try {
        await authApi.register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          country: country.trim(),
          password,
          confirmPassword
        });

        // Show success message
        setShowSuccess(true);
      } catch (err) {
        // Handle registration errors
        let errorMessage = "Registration failed. Please try again.";
        const errorData = err?.response?.data;
        
        if (errorData) {
          if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
            // Backend returns Map<String, String> for validation errors
            const validationErrors = errorData;
            
            // Map field-specific errors
            Object.keys(validationErrors).forEach(field => {
              if (newErrors.hasOwnProperty(field)) {
                if (field === 'password') {
                  newErrors.password = Array.isArray(newErrors.password) 
                    ? [validationErrors[field]] 
                    : [validationErrors[field]];
                } else {
                  newErrors[field] = validationErrors[field];
                }
              }
            });
            
            setErrors(newErrors);
            const errorMessages = Object.values(validationErrors).filter(msg => msg);
            errorMessage = errorMessages.length > 0 ? errorMessages.join(', ') : errorMessage;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Check for specific error types
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          setErrors({
            ...newErrors,
            email: 'This email is already registered'
          });
          setSubmitError('');
        } else if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('already')) {
          setErrors({
            ...newErrors,
            username: 'This username is already taken'
          });
          setSubmitError('');
        } else {
          setSubmitError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  if (showSuccess) {
    return (
      <div style={styles.container}>
        <h1 style={styles.logo}>Spentoo</h1>
        <div style={styles.card}>
          <div style={styles.successContent}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Registration Successful!</h2>
            <p style={styles.successMessage}>
              You are registered and verify email is sent to your email.
            </p>
            <p style={styles.redirectMessage}>
              Redirecting to login page in 5 seconds...
            </p>
            <button onClick={handleLoginClick} style={styles.loginButton}>
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          {/* First Name Field */}
          <div style={styles.inputContainer}>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors({ ...errors, firstName: '' });
                if (submitError) setSubmitError('');
              }}
              onFocus={() => setFocused({ ...focused, firstName: true })}
              onBlur={() => handleBlur('firstName')}
              style={styles.input}
            />
            <label
              htmlFor="firstName"
              style={{
                ...styles.label,
                ...(focused.firstName || firstName ? styles.labelFloat : {})
              }}
            >
              First Name
            </label>
            {touched.firstName && errors.firstName && (
              <span style={styles.error}>{errors.firstName}</span>
            )}
          </div>

          {/* Last Name Field */}
          <div style={styles.inputContainer}>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors({ ...errors, lastName: '' });
                if (submitError) setSubmitError('');
              }}
              onFocus={() => setFocused({ ...focused, lastName: true })}
              onBlur={() => handleBlur('lastName')}
              style={styles.input}
            />
            <label
              htmlFor="lastName"
              style={{
                ...styles.label,
                ...(focused.lastName || lastName ? styles.labelFloat : {})
              }}
            >
              Last Name
            </label>
            {touched.lastName && errors.lastName && (
              <span style={styles.error}>{errors.lastName}</span>
            )}
          </div>

          {/* Username Field */}
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
              onFocus={() => setFocused({ ...focused, username: true })}
              onBlur={() => handleBlur('username')}
              style={styles.input}
            />
            <label
              htmlFor="username"
              style={{
                ...styles.label,
                ...(focused.username || username ? styles.labelFloat : {})
              }}
            >
              Username
            </label>
            {touched.username && errors.username && (
              <span style={styles.error}>{errors.username}</span>
            )}
          </div>

          {/* Email Field */}
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
              onFocus={() => setFocused({ ...focused, email: true })}
              onBlur={() => handleBlur('email')}
              style={styles.input}
            />
            <label
              htmlFor="email"
              style={{
                ...styles.label,
                ...(focused.email || email ? styles.labelFloat : {})
              }}
            >
              Email
            </label>
            {touched.email && errors.email && (
              <span style={styles.error}>{errors.email}</span>
            )}
          </div>

          {/* Country Field */}
          <div style={styles.inputContainer}>
            <select
              id="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (errors.country) setErrors({ ...errors, country: '' });
                if (submitError) setSubmitError('');
              }}
              onFocus={() => setFocused({ ...focused, country: true })}
              onBlur={() => handleBlur('country')}
              style={{
                ...styles.input,
                ...styles.select,
                ...(focused.country || country ? {} : { color: 'transparent' })
              }}
            >
              <option value="" disabled>Select Country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label
              htmlFor="country"
              style={{
                ...styles.label,
                ...(focused.country || country ? styles.labelFloat : {}),
                pointerEvents: 'none'
              }}
            >
              Country
            </label>
            {touched.country && errors.country && (
              <span style={styles.error}>{errors.country}</span>
            )}
          </div>

          {/* Password Field */}
          <div style={styles.inputContainer}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password.length > 0) setErrors({ ...errors, password: [] });
                if (submitError) setSubmitError('');
                // Revalidate confirm password if it's already filled
                if (confirmPassword) {
                  validateField('confirmPassword');
                }
              }}
              onFocus={() => setFocused({ ...focused, password: true })}
              onBlur={() => handleBlur('password')}
              style={styles.input}
            />
            <label
              htmlFor="password"
              style={{
                ...styles.label,
                ...(focused.password || password ? styles.labelFloat : {})
              }}
            >
              Password
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
                if (submitError) setSubmitError('');
              }}
              onFocus={() => setFocused({ ...focused, confirmPassword: true })}
              onBlur={() => handleBlur('confirmPassword')}
              style={styles.input}
            />
            <label
              htmlFor="confirmPassword"
              style={{
                ...styles.label,
                ...(focused.confirmPassword || confirmPassword ? styles.labelFloat : {})
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

          {/* General Error Message */}
          {submitError && (
            <div style={styles.submitError} role="alert">
              {submitError}
            </div>
          )}

          {/* Register Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              ...styles.registerButton,
              ...(isLoading ? styles.registerButtonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#43A047';
                e.target.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.color = '#43A047';
              }
            }}
          >
            {isLoading ? 'Registering...' : 'Register'}
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
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
    overflowY: 'auto'
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
  select: {
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%231E88E5\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0 top 50%',
    paddingRight: '20px',
    cursor: 'pointer'
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
  submitError: {
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
  registerButtonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed'
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
  },
  successContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px'
  },
  successIcon: {
    fontSize: '64px',
    color: '#43A047',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: '16px'
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

export default Register;
