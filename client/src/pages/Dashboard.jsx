import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user?.name}</h1>
        <p className="text-gray-600 mb-8">Role: <span className="font-semibold text-blue-600">{user?.role}</span></p>
        
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
