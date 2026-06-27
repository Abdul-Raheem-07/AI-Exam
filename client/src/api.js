const API = import.meta.env.VITE_API_URL;

export const loginUser = (data) => {
  return fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
};

export const registerUser = (data) => {
  return fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
};