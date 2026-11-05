// Centralized API Client for WARUNG POS Backend

const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('warung_pos_token');

  const headers = {
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error: ${endpoint}]`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Products
  getProducts: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.category_id) searchParams.set('category_id', params.category_id);
    if (params.low_stock) searchParams.set('low_stock', params.low_stock);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.order) searchParams.set('order', params.order);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/products${query}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (productData) => request('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  updateProduct: (id, productData) => request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE'
  }),
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/products/upload-image', {
      method: 'POST',
      body: formData
    });
  },

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (catData) => request('/categories', {
    method: 'POST',
    body: JSON.stringify(catData)
  }),
  updateCategory: (id, catData) => request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(catData)
  }),
  deleteCategory: (id) => request(`/categories/${id}`, {
    method: 'DELETE'
  }),

  // Transactions
  getTransactions: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.start_date) searchParams.set('start_date', params.start_date);
    if (params.end_date) searchParams.set('end_date', params.end_date);
    if (params.limit) searchParams.set('limit', params.limit);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/transactions${query}`);
  },
  getTransactionById: (id) => request(`/transactions/${id}`),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settingData) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingData)
  })
};

export default api;
