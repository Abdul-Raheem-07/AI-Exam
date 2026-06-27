import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext.js';

// 🔥 API base URL (from env)
const API = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── INIT AUTH ─────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser?.token) {
          axios.defaults.headers.common['Authorization'] =
            `Bearer ${parsedUser.token}`;
        }
      } catch (err) {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, {
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
      const { data } = await axios.post(`${API}/auth/register`, {
        name,
        email,
        password,
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
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
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