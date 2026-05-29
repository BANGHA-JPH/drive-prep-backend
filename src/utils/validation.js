const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

const validateSignUp = (name, email, password) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password || !validatePassword(password)) {
    errors.push('Password must be at least 6 characters, contain uppercase, lowercase, and numbers');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (email, password) => {
  const errors = [];

  if (!email || !validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateSignUp,
  validateLogin
};
