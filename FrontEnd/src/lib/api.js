// Detectar se está rodando no emulador Android
const isAndroidEmulator = typeof window !== 'undefined' && 
  (window.location.hostname === '10.0.2.2' || 
   window.navigator.userAgent.includes('Android'));

// Detectar se está rodando em dispositivo móvel/emulador
const isMobile = typeof window !== 'undefined' && 
  (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent));

// Verificar se está rodando em WebView do Android
const isAndroidWebView = typeof window !== 'undefined' && 
  window.navigator.userAgent.includes('wv') || // WebView tem 'wv' no user agent
  (window.navigator.userAgent.includes('Android') && !window.navigator.userAgent.includes('Chrome'));

// URL base da API
// Para emulador Android: usa 10.0.2.2 (IP especial do Android para localhost do host)
// Para outros: usa variável de ambiente ou padrão
const getApiBaseUrl = () => {
  // 1. Verificar se foi injetado pelo WebView (prioridade máxima)
  if (typeof window !== 'undefined' && window.APP_API_BASE_URL) {
    console.log('🔧 Usando URL da API injetada pelo WebView:', window.APP_API_BASE_URL);
    return window.APP_API_BASE_URL;
  }
  
  // 2. Verificar variável de ambiente
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // 3. Detectar automaticamente baseado no ambiente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Se estiver em WebView Android ou dispositivo móvel
    if (isAndroidWebView || isAndroidEmulator || (isMobile && hostname !== 'localhost' && hostname !== '127.0.0.1')) {
      if (hostname === '10.0.2.2') {
        // Emulador Android - 10.0.2.2 é o IP especial para acessar localhost do host
        console.log('🔧 Detectado emulador Android, usando 10.0.2.2:3000');
        return 'http://10.0.2.2:3000/api/v1';
      } else if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
        // Dispositivo móvel na mesma rede - usa o IP da máquina
        const apiUrl = `http://${hostname}:3000/api/v1`;
        console.log('🔧 Detectado dispositivo móvel, usando:', apiUrl);
        return apiUrl;
      }
    }
  }
  
  // 4. Padrão: usa proxy do Vite ou localhost
  console.log('🔧 Usando URL padrão (proxy Vite): /api/v1');
  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
    
    // Log para debug (remover em produção)
    if (import.meta.env.DEV) {
      console.log('🔧 API Base URL:', this.baseURL);
      console.log('📱 Is Android Emulator:', isAndroidEmulator);
      console.log('📱 Is Mobile:', isMobile);
    }
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
    // Atualizar token do localStorage antes de cada requisição
    this.token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log('🔑 Token sendo enviado:', this.token.substring(0, 30) + '...');
      }
    } else {
      console.warn('⚠️ Nenhum token encontrado no localStorage');
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    // Log detalhado para debug
    console.log('🌐 API Request:', {
      method: config.method || 'GET',
      url: url,
      baseURL: this.baseURL,
      endpoint: endpoint,
      headers: config.headers,
      hasToken: !!this.token
    });

    try {
      const response = await fetch(url, config);
      
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Extract Rails validation errors
        let errorMessage = errorData.message || errorData.error;
        
        // Handle Rails validation errors format: { errors: [...] } or { errors: { field: [...] } }
        if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            // Format: { errors: ["Error 1", "Error 2"] }
            errorMessage = errorData.errors.join(', ');
          } else if (typeof errorData.errors === 'object') {
            // Format: { errors: { field: ["Error message"] } }
            const errorMessages = [];
            Object.keys(errorData.errors).forEach(field => {
              const fieldErrors = errorData.errors[field];
              if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach(msg => {
                  errorMessages.push(`${field}: ${msg}`);
                });
              } else {
                errorMessages.push(`${field}: ${fieldErrors}`);
              }
            });
            errorMessage = errorMessages.join(', ');
          }
        }
        
        // Fallback to generic error message
        if (!errorMessage) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        console.error('❌ API Error:', {
          status: response.status,
          error: errorMessage,
          data: errorData,
          fullError: errorData
        });
        
        // Criar erro com mais informações
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const data = await response.json();
      console.log('✅ API Success:', { endpoint, data });
      return data;
    } catch (error) {
      console.error('❌ API request failed:', {
        url: url,
        endpoint: endpoint,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    console.log('🏥 Executando health check...');
    try {
      const result = await this.request('/health');
      console.log('✅ Health check OK:', result);
      return result;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      throw error;
    }
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

  async supabaseLogin(accessToken) {
    const response = await this.request('/auth/supabase_login', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
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
    });
    
    // Adicionar filtros, tratando arrays corretamente
    Object.keys(filters).forEach(key => {
      const value = filters[key]
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()))
      } else if (value !== null && value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })
    
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

  // Tags
  async getTags() {
    return await this.request('/tags');
  }

  // Contacts
  async getContacts(page = 1, perPage = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return await this.request(`/contacts?${params}`);
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

  async getOverdueCommitments() {
    return await this.request('/dashboard/overdue_commitments');
  }

  async getTodayCommitments() {
    return await this.request('/dashboard/today_commitments');
  }

  // Appointments
  async getAppointments(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/appointments?${params}`);
  }

  async getAppointment(id) {
    return await this.request(`/appointments/${id}`);
  }

  async createAppointment(appointmentData) {
    return await this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify({ appointment: appointmentData }),
    });
  }

  async updateAppointment(id, appointmentData) {
    return await this.request(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ appointment: appointmentData }),
    });
  }

  async deleteAppointment(id) {
    return await this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointmentServices() {
    return await this.request('/appointments/services');
  }

  async getAppointmentProfessionals() {
    return await this.request('/appointments/professionals');
  }

  async getAvailableSlots(professionalId, date, serviceId = null) {
    const params = new URLSearchParams({
      professional_id: professionalId,
      date: date,
    });
    if (serviceId) {
      params.append('service_id', serviceId);
    }
    return await this.request(`/appointments/available_slots?${params}`);
  }

  // Appointment Reports
  async getAppointmentReportsByProfessional(startDate, endDate, professionalId = null) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (professionalId) {
      params.append('professional_id', professionalId);
    }
    return await this.request(`/appointment_reports/by_professional?${params}`);
  }

  async getAppointmentReportsSummary(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return await this.request(`/appointment_reports/summary?${params}`);
  }

  // Professionals
  async getProfessionals() {
    return await this.request('/professionals');
  }

  async getProfessional(id) {
    return await this.request(`/professionals/${id}`);
  }

  async createProfessional(professionalData) {
    return await this.request('/professionals', {
      method: 'POST',
      body: JSON.stringify({ professional: professionalData }),
    });
  }

  async updateProfessional(id, professionalData) {
    return await this.request(`/professionals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ professional: professionalData }),
    });
  }

  async deleteProfessional(id) {
    return await this.request(`/professionals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProfessionalSchedule(id, scheduleData) {
    return await this.request(`/professionals/${id}/update_schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ schedule: scheduleData }),
    });
  }

  // Reports
  async getReports() {
    return await this.request('/reports');
  }

  async getReport(reportId, params = {}) {
    // Construir query string manualmente para lidar com arrays e objetos
    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue;
      if (key.endsWith('[]')) {
        // Já está no formato de array
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      } else if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== null && v !== undefined) {
            queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
          }
        });
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const url = `/reports/${reportId}${queryString}`;
    console.log('📊 Fetching report:', url);
    return await this.request(url);
  }

  async getAppointmentsIntegratedReport(startDate, endDate) {
    return await this.getReport('appointments_integrated', {
      start_date: startDate,
      end_date: endDate
    });
  }

  async getFinancialWithAppointmentsReport(startDate, endDate) {
    return await this.getReport('financial_with_appointments', {
      start_date: startDate,
      end_date: endDate
    });
  }

  // Financial Reports
  async getDreReport(startDate, endDate, params = {}) {
    const queryParams = {
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date'
    };
    // Não enviar paid se não especificado, o backend usa padrão
    if (params.paid !== undefined) {
      if (Array.isArray(params.paid)) {
        params.paid.forEach(p => queryParams['paid[]'] = p);
      } else {
        queryParams.paid = params.paid;
      }
    }
    return await this.getReport('dre', queryParams);
  }

  async getExtractReport(startDate, endDate, params = {}) {
    const queryParams = {
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date',
      page: params.page || 1,
      per_page: params.per_page || 100
    };
    
    // Adicionar arrays se presentes
    if (params.bank_account_ids && params.bank_account_ids.length > 0) {
      params.bank_account_ids.forEach(id => {
        queryParams['bank_account_ids[]'] = id;
      });
    }
    
    return await this.getReport('extract', queryParams);
  }

  async getPerCategoryReport(transactionType, startDate, endDate, params = {}) {
    return await this.getReport('per_category', {
      transaction_type: transactionType,
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date',
      order: params.order
    });
  }

  async getPerDescriptionReport(transactionType, startDate, endDate, params = {}) {
    return await this.getReport('per_description', {
      transaction_type: transactionType,
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date',
      order: params.order
    });
  }

  async getPerPeriodReport(transactionType, startDate, endDate, params = {}) {
    return await this.getReport('per_period', {
      transaction_type: transactionType,
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date',
      order: params.order
    });
  }

  async getFinancialHistoryReport(startDate, endDate, params = {}) {
    return await this.getReport('financial_history', {
      start_date: startDate,
      end_date: endDate,
      date_type: params.date_type || 'due_date'
    });
  }

  // Services
  async getServices() {
    return await this.request('/services');
  }

  async getService(id) {
    return await this.request(`/services/${id}`);
  }

  async createService(serviceData) {
    return await this.request('/services', {
      method: 'POST',
      body: JSON.stringify({ service: serviceData }),
    });
  }

  async updateService(id, serviceData) {
    return await this.request(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ service: serviceData }),
    });
  }

  async deleteService(id) {
    return await this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Imports
  async getImports(page = 1, perPage = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...filters
    });
    return await this.request(`/imports?${params}`);
  }

  async getImport(id) {
    return await this.request(`/imports/${id}`);
  }

  async createImport(importData) {
    const formData = new FormData();
    
    // Adicionar arquivo se presente (dentro de import[file])
    if (importData.file) {
      formData.append('import[file]', importData.file);
    }
    
    // Adicionar source se presente (dentro de import[source])
    if (importData.source) {
      formData.append('import[source]', importData.source);
    }

    // Usar fetch diretamente para FormData
    const url = `${this.baseURL}/imports`;
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Deixar o browser definir o Content-Type com boundary

    console.log('📤 Uploading import:', {
      url,
      hasFile: !!importData.file,
      source: importData.source,
      fileName: importData.file?.name
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    console.log('📥 Upload response:', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.errors?.join(', ') || `HTTP error! status: ${response.status}`;
      console.error('❌ Upload error:', errorData);
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async deleteImport(id) {
    return await this.request(`/imports/${id}`, {
      method: 'DELETE',
    });
  }

  async discardImport(id) {
    return await this.request(`/imports/${id}/discard`, {
      method: 'PUT',
    });
  }

  async undiscardImport(id) {
    return await this.request(`/imports/${id}/undiscard`, {
      method: 'PUT',
    });
  }

  // Test endpoints
  async testTransactions() {
    return await this.request('/transactions/test');
  }

  async publicTest() {
    return await this.request('/transactions/public_test');
  }

  // Public Appointment Booking (no authentication required)
  async getPublicAppointmentServices(token) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }
    
    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/services`;
    
    console.log('📡 Fetching services from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Services response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('✅ Services data received:', data);
      
      // Se a resposta não for ok, lançar erro
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('❌ Services API Error:', {
          status: response.status,
          error: errorMessage,
          data: data
        });
        throw new Error(errorMessage);
      }
      
      // Se a resposta for um objeto de erro (não um array), lançar erro
      if (data && !Array.isArray(data)) {
        if (data.error || data.message) {
          console.warn('⚠️ API returned error object instead of array:', data);
          throw new Error(data.message || data.error || 'Formato de resposta inválido da API');
        }
        // Se não for array nem objeto de erro, algo está errado
        console.error('❌ Unexpected response format:', data);
        throw new Error('Formato de resposta inesperado da API');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Services request failed:', {
        url: url,
        error: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw error;
    }
  }

  async getPublicAppointmentProfessionals(token) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }
    
    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/professionals`;
    
    console.log('📡 Fetching professionals from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Professionals response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const data = await response.json();
      console.log('✅ Professionals data received:', data);
      
      // Se a resposta não for ok, lançar erro
      if (!response.ok) {
        const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
        console.error('❌ Professionals API Error:', {
          status: response.status,
          error: errorMessage,
          data: data
        });
        throw new Error(errorMessage);
      }
      
      // Se a resposta for um objeto de erro (não um array), lançar erro
      if (data && !Array.isArray(data)) {
        if (data.error || data.message) {
          console.warn('⚠️ API returned error object instead of array:', data);
          throw new Error(data.message || data.error || 'Formato de resposta inválido da API');
        }
        // Se não for array nem objeto de erro, algo está errado
        console.error('❌ Unexpected response format:', data);
        throw new Error('Formato de resposta inesperado da API');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Professionals request failed:', {
        url: url,
        error: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw error;
    }
  }

  async getPublicAvailableSlots(token, professionalId, date, serviceId = null) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }
    if (!professionalId) {
      throw new Error('ID do profissional não fornecido');
    }
    if (!date) {
      throw new Error('Data não fornecida');
    }
    
    const params = new URLSearchParams({
      professional_id: professionalId,
      date: date,
    });
    if (serviceId) {
      params.append('service_id', serviceId);
    }
    
    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/available_slots?${params}`;
    
    console.log('📡 Fetching available slots from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Available slots response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        console.error('❌ Available slots API Error:', {
          status: response.status,
          error: errorMessage,
          data: errorData
        });
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Available slots data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Available slots request failed:', {
        url: url,
        error: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      throw error;
    }
  }

  async createPublicAppointment(token, appointmentData) {
    // A rota /agendar NÃO está no proxy do Vite, então sempre usar URL completa do backend
    // Se baseURL começa com /, construir URL do backend (localhost:3000)
    // Caso contrário, usar baseURL removendo /api/v1
    let baseUrl;
    
    if (this.baseURL.startsWith('/')) {
      // Usando proxy do Vite - construir URL do backend diretamente
      baseUrl = 'http://localhost:3000';
    } else {
      // URL completa do backend - remover /api/v1
      baseUrl = this.baseURL.replace('/api/v1', '').replace(/\/$/, '');
    }
    
    const url = `${baseUrl}/agendar/${token}/book`;
    
    console.log('📡 Creating public appointment:', {
      baseURL: this.baseURL,
      baseUrl: baseUrl,
      token: token,
      url: url,
      data: appointmentData
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointment: appointmentData }),
      });
      
      console.log('📡 Public Appointment Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: url
      });
      
      if (!response.ok) {
        let errorData = {};
        let errorText = '';
        try {
          errorText = await response.text();
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch (e) {
          console.warn('⚠️ Could not parse error response as JSON:', e);
          errorText = errorText || 'No error message';
        }
        
        // Extrair mensagens de erro de diferentes formatos
        let errorMessage = '';
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        // Log detalhado
        console.error('❌ Public Appointment Error:');
        console.error('  Status:', response.status, response.statusText);
        console.error('  URL:', url);
        console.error('  Error Message:', errorMessage);
        console.error('  Full Error Data:', JSON.stringify(errorData, null, 2));
        console.error('  Raw Response Text:', errorText);
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        error.errors = errorData.errors || [];
        throw error;
      }
      
      const data = await response.json();
      console.log('✅ Public Appointment Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Public Appointment request failed:', {
        url: url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Appointment Links Management
  async getAppointmentLinks() {
    return await this.request('/appointment_links');
  }

  async getAppointmentLink(id) {
    return await this.request(`/appointment_links/${id}`);
  }

  async createAppointmentLink(linkData) {
    return await this.request('/appointment_links', {
      method: 'POST',
      body: JSON.stringify({ appointment_link: linkData }),
    });
  }

  async updateAppointmentLink(id, linkData) {
    return await this.request(`/appointment_links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ appointment_link: linkData }),
    });
  }

  async deleteAppointmentLink(id) {
    return await this.request(`/appointment_links/${id}`, {
      method: 'DELETE',
    });
  }

  // Subscriptions
  async getSubscription() {
    return await this.request('/subscriptions');
  }

  async getSubscriptionPlans() {
    return await this.request('/subscriptions/plans');
  }

  async createSubscriptionCheckout(planId) {
    try {
      return await this.request('/subscriptions/create_checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });
    } catch (error) {
      // Extrair mensagem de erro mais detalhada
      const errorMessage = error.message || 'Erro desconhecido ao criar checkout';
      console.error('Erro detalhado no checkout:', {
        message: errorMessage,
        planId: planId
      });
      throw new Error(errorMessage);
    }
  }

  async getBillingPortal(returnUrl = null) {
    const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
    return await this.request(`/subscriptions/billing_portal${params}`);
  }

  async cancelSubscription() {
    return await this.request('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  async reactivateSubscription() {
    return await this.request('/subscriptions/reactivate', {
      method: 'POST',
    });
  }

  // Admin endpoints (exclusivo para dono do sistema)
  async getAdminDashboard() {
    return await this.request('/admin/dashboard');
  }

  async getAdminAccounts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/accounts${queryParams ? `?${queryParams}` : ''}`);
  }

  async getAdminAccountDetails(id) {
    return await this.request(`/admin/accounts/${id}`);
  }

  async updateAdminAccount(id, accountData) {
    return await this.request(`/admin/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ account: accountData }),
    });
  }

  async suspendAdminAccount(id) {
    return await this.request(`/admin/accounts/${id}/suspend`, {
      method: 'POST',
    });
  }

  async activateAdminAccount(id) {
    return await this.request(`/admin/accounts/${id}/activate`, {
      method: 'POST',
    });
  }

  async getAdminAccountSubscriptions(id) {
    return await this.request(`/admin/accounts/${id}/subscriptions`);
  }

  async getAdminSubscriptions(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/subscriptions${queryParams ? `?${queryParams}` : ''}`);
  }

  async getAdminSubscriptionDetails(id) {
    return await this.request(`/admin/subscriptions/${id}`);
  }

  async createAdminSubscription(accountId, planId) {
    return await this.request('/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, plan_id: planId }),
    });
  }

  async updateAdminSubscription(id, subscriptionData) {
    return await this.request(`/admin/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(subscriptionData),
    });
  }

  async cancelAdminSubscription(id, immediately = false) {
    return await this.request(`/admin/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ immediately }),
    });
  }

  async reactivateAdminSubscription(id) {
    return await this.request(`/admin/subscriptions/${id}/reactivate`, {
      method: 'POST',
    });
  }

  // Support/Impersonation
  async impersonateAccount(accountId) {
    return await this.request(`/admin/accounts/${accountId}/impersonate`, {
      method: 'POST',
    });
  }

  async stopImpersonating() {
    return await this.request('/admin/stop_impersonating', {
      method: 'POST',
    });
  }

  // Account Settings (somente para admins da conta)
  async getAccountSettings() {
    return await this.request('/account_settings');
  }

  async updateAccountSettings(accountData) {
    return await this.request('/account_settings', {
      method: 'PATCH',
      body: JSON.stringify({ account: accountData }),
    });
  }
}

export const apiService = new ApiService(); 