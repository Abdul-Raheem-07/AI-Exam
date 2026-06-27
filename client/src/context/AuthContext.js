import { createContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://ai-exam-iota.vercel.app/api');

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;