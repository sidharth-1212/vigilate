// frontend/src/api/auth.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/auth`;

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.key); // Save the Django Token
    return true;
  }
  throw new Error(data.non_field_errors || "Login failed");
};

export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/registration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username: email, password1: password, password2: password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.key);
    return true;
  }
  throw new Error(JSON.stringify(data));
};

export const logout = () => {
  localStorage.removeItem('token');
};