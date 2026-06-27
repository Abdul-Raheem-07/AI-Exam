import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext.js';
axios.defaults.baseURL = "https://melodious-imagination-production-2381.up.railway.app/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      if (data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      toast.success('Logged in successfully!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const { data } = await axios.post('/auth/register', { name, email, password, role });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      if (data.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }
      toast.success('Registered successfully!');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};