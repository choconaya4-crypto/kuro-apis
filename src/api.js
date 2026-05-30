// src/api.js
const API_BASE_URL = 'https://api.apis-zyvora.biz.id';

export const API_ENDPOINTS = {
  clever: `${API_BASE_URL}/clever-endpoint`,
  health: `${API_BASE_URL}/clever-endpoint`, // alias
};

export async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Fungsi khusus buat cek status API
export async function checkAPIStatus() {
  return fetchAPI(API_ENDPOINTS.clever);
}
