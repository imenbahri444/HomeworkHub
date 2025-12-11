import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to ALL requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token; // backend expects token as is
  }
  return config;
});

// Auth helpers
export const loginUser = (email, password) => API.post('/auth/login', { email, password });
export const registerUser = (username, email, password) => API.post('/auth/register', { username, email, password });

// Assignments helpers
export const getAssignments = () => API.get('/assignments');
export const createAssignment = (assignment) => API.post('/assignments', assignment);
export const updateAssignment = (id, assignment) => API.put(`/assignments/${id}`, assignment);
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);

export default API;
