import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to ALL requests (your backend expects token in header)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token; // Your backend expects just token, not "Bearer token"
  }
  return config;
});

export default API;