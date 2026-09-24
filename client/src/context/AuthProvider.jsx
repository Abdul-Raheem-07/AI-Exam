import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext.js';

// 🔥 API base URL (from env)
const API = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    let active = true;
    const storedUser = localStorage.getItem('user');
    let parsedUser = null;

    try { parsedUser = storedUser ? JSON.parse(storedUser) : null; } catch { localStorage.removeItem('user'); }

    if (!parsedUser?.token) {
      queueMicrotask(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    axios.get('/user').then(({ data }) => {
      if (!active) return;
      const restoredUser = { ...data, token: parsedUser.token };
      setUser(restoredUser);
      localStorage.setItem('user', JSON.stringify(restoredUser));
    }).catch(error => {
      if (!active) return;
      if (error.response?.status === 401) clearAuth();
      else setUser(parsedUser);
    }).finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(response => response, error => {
      if (error.response?.status === 401 && localStorage.getItem('user')) {
        clearAuth();
        if (window.location.pathname !== '/login') window.location.assign('/login');
      }
      return Promise.reject(error);
    });
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // ─── INIT AUTH ─────────────────────────────────────────────
  useEffect(() => {
    if (user?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    }
  }, [user]);

  // ─── LOGIN ────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/login', {
        email,
        password,
      });

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      if (data?.token) {
        axios.defaults.headers.common['Authorization'] =
          `Bearer ${data.token}`;
      }

      toast.success('Logged in successfully!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // ─── REGISTER ─────────────────────────────────────────────
  const register = async (name, email, password, role) => {
    try {
      const { data } = await axios.post('/register', {
        name,
        email,
        password,
        password_confirmation: password,
        role,
      });

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      if (data?.token) {
        axios.defaults.headers.common['Authorization'] =
          `Bearer ${data.token}`;
      }

      toast.success('Registered successfully!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // ─── LOGOUT ───────────────────────────────────────────────
  const logout = () => {
    clearAuth();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};