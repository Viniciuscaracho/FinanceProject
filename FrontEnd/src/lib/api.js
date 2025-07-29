const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async loginSimple(email, password) {
    const response = await this.request('/auth/login_simple', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async createTestUser(userData) {
    return await this.request('/auth/create_test_user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Transactions
  async getTransactions(page = 1, perPage = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...filters
    });
    return await this.request(`/transactions?${params}`);
  }

  async getTransaction(id) {
    return await this.request(`/transactions/${id}`);
  }

  async createTransaction(transactionData) {
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify({ transaction: transactionData }),
    });
  }

  async updateTransaction(id, transactionData) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ transaction: transactionData }),
    });
  }

  async deleteTransaction(id) {
    return await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories() {
    return await this.request('/categories');
  }

  async getCategory(id) {
    return await this.request(`/categories/${id}`);
  }

  async createCategory(categoryData) {
    return await this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ category: categoryData }),
    });
  }

  async updateCategory(id, categoryData) {
    return await this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category: categoryData }),
    });
  }

  async deleteCategory(id) {
    return await this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Cost Centers
  async getCostCenters() {
    return await this.request('/cost_centers');
  }

  async getCostCenter(id) {
    return await this.request(`/cost_centers/${id}`);
  }

  async createCostCenter(costCenterData) {
    return await this.request('/cost_centers', {
      method: 'POST',
      body: JSON.stringify({ cost_center: costCenterData }),
    });
  }

  async updateCostCenter(id, costCenterData) {
    return await this.request(`/cost_centers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ cost_center: costCenterData }),
    });
  }

  async deleteCostCenter(id) {
    return await this.request(`/cost_centers/${id}`, {
      method: 'DELETE',
    });
  }

  // Bank Accounts
  async getBankAccounts() {
    return await this.request('/bank_accounts');
  }

  async getBankAccount(id) {
    return await this.request(`/bank_accounts/${id}`);
  }

  async getBankAccountBalance() {
    return await this.request('/bank_accounts/balance');
  }

  async getBankAccountTransactions(id) {
    return await this.request(`/bank_accounts/${id}/transactions`);
  }

  async createBankAccount(bankAccountData) {
    return await this.request('/bank_accounts', {
      method: 'POST',
      body: JSON.stringify({ bank_account: bankAccountData }),
    });
  }

  async updateBankAccount(id, bankAccountData) {
    return await this.request(`/bank_accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ bank_account: bankAccountData }),
    });
  }

  async deleteBankAccount(id) {
    return await this.request(`/bank_accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Contacts
  async getContacts() {
    return await this.request('/contacts');
  }

  async getContact(id) {
    return await this.request(`/contacts/${id}`);
  }

  async createContact(contactData) {
    return await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify({ contact: contactData }),
    });
  }

  async updateContact(id, contactData) {
    return await this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ contact: contactData }),
    });
  }

  async deleteContact(id) {
    return await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers() {
    return await this.request('/users');
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user: userData }),
    });
  }

  // Dashboard
  async getDashboardData() {
    return await this.request('/dashboard');
  }

  async getDashboardStatistics() {
    return await this.request('/dashboard/statistics');
  }

  async getRecentTransactions() {
    return await this.request('/dashboard/recent_transactions');
  }

  // Test endpoints
  async testTransactions() {
    return await this.request('/transactions/test');
  }

  async publicTest() {
    return await this.request('/transactions/public_test');
  }
}

export const apiService = new ApiService(); 