import axios from "axios";

// Automatically switches between Localhost and your future Cloud Backend URL
const baseURL = process.env.NODE_ENV === "production" 
  ? process.env.REACT_APP_API_URL // We will set this in Vercel later
  : "http://localhost:5000/api";

const API = axios.create({ baseURL });

// Add a request interceptor to include the Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Add a response interceptor to handle Session Expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;