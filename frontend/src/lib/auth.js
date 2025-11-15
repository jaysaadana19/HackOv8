export const AUTH_REDIRECT_URL = `${window.location.origin}/dashboard`;
export const EMERGENT_AUTH_URL = `${process.env.REACT_APP_AUTH_URL || 'https://auth.emergentagent.com'}/?redirect=${encodeURIComponent(AUTH_REDIRECT_URL)}`;

export const isAuthenticated = () => {
  return !!localStorage.getItem('session_token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuth = (sessionToken, user) => {
  localStorage.setItem('session_token', sessionToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Set cookie for backend
  document.cookie = `session_token=${sessionToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;
};

export const clearAuth = () => {
  localStorage.removeItem('session_token');
  localStorage.removeItem('user');
  document.cookie = 'session_token=; path=/; max-age=0';
};
