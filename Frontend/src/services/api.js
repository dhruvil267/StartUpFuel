import axios from "axios";
import { API_BASE_URL } from "../config/url.js";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,       // e.g., https://d3h3t395jtlnig.cloudfront.net/api
  withCredentials: true,       // ⚠️ Important to send cookies/auth info
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem("authToken"),
  setToken: (token) => localStorage.setItem("authToken", token),
  removeToken: () => localStorage.removeItem("authToken"),
  isAuthenticated: () => !!localStorage.getItem("authToken"),
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      tokenManager.removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;
    tokenManager.setToken(token);
    return { token, user };
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    const { token, user } = response.data;
    tokenManager.setToken(token);
    return { token, user };
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      tokenManager.removeToken();
    }
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data.user;
  },
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: async () => {
    const response = await api.get("/portfolio");
    return response.data;
  },

  getAssets: async () => {
    const response = await api.get("/portfolio/assets");
    return response.data;
  },

  getPerformance: async (period = "1M") => {
    const response = await api.get(`/portfolio/performance?period=${period}`);
    return response.data;
  },
  addAsset: async (symbol, shares, purchasePrice, currentPrice, type) => {
    const response = await api.post("/portfolio/assets", {
      symbol,
      shares,
      purchasePrice,
      currentPrice,
      type,
    });
    return response.data;
  },

  getStockAllocations: async () => {
    const response = await api.get("/portfolio/allocations");
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (limit = 10, type = null, symbol = null) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit);
    if (type) params.append("type", type);
    if (symbol) params.append("symbol", symbol);

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data; // Return full response data
  },
};

// Reports API
export const reportsAPI = {
  getReports: async () => {
    const response = await api.get(`/reports`);
    return response.data;
  },
};

export default api;
