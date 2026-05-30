// src/components/APIStatus.jsx
import React, { useState, useEffect } from 'react';
import { checkAPIStatus } from '../api';

export default function APIStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkAPIStatus();
        setStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500">Checking API...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">⚠️ API Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-700 font-medium">✅ API Connected</p>
          <p className="text-gray-500 text-sm mt-1">{status?.message}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Status: {status?.status}</p>
          <p className="text-xs text-gray-400 mt-1">Uptime: {status?.uptime}</p>
        </div>
      </div>
    </div>
  );
}

