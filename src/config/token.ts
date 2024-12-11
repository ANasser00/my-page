const TOKEN_KEY = 'auth_token'; // Key used to store the token in localStorage

// Save token to localStorage
export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Retrieve token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
