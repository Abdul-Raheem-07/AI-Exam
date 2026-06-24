import { createContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// ✅ Auto-detect: dev = local backend, production = Vercel backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://ai-exam-iota.vercel.app/api');

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
