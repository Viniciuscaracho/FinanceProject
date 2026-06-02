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
  if (typeof window !== 'undefined' && window.APP_API_BASE_URL) {
    return window.APP_API_BASE_URL;
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const base = envUrl.replace(/\/+$/, '');
    return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (isAndroidWebView || isAndroidEmulator || (isMobile && hostname !== 'localhost' && hostname !== '127.0.0.1')) {
      if (hostname === '10.0.2.2') return 'http://10.0.2.2:3000/api/v1';
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
        return `http://${hostname}:3000/api/v1`;
      }
    }
  }

  return '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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
    // Atualizar token do localStorage antes de cada requisição
    this.token = localStorage.getItem('auth_token');
    
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
    const config = { headers: this.getHeaders(), ...options };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData = {};
        let errorText = '';

        try {
          errorText = await response.text();
          if (errorText && errorText.trim().startsWith('{')) {
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }
          } else {
            errorData = { message: errorText || `HTTP error! status: ${response.status}` };
          }
        } catch {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }

        let errorMessage =
          (typeof errorData.error === 'string' ? errorData.error : null) ||
          (typeof errorData.message === 'string' ? errorData.message : null) ||
          (errorData.error ? String(errorData.error) : null) ||
          (errorData.message ? String(errorData.message) : null);

        if (!errorMessage && errorText) {
          const htmlMatch = errorText.match(/<title>(.*?)<\/title>/i) || errorText.match(/<h1>(.*?)<\/h1>/i);
          errorMessage = htmlMatch ? htmlMatch[1] : (errorText.length < 500 ? errorText : null);
        }

        if (!errorMessage && errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          } else if (typeof errorData.errors === 'object') {
            errorMessage = Object.entries(errorData.errors)
              .flatMap(([field, msgs]) =>
                Array.isArray(msgs) ? msgs.map(m => `${field}: ${m}`) : [`${field}: ${msgs}`]
              )
              .join(', ');
          }
        }

        if (!errorMessage) errorMessage = `HTTP error! status: ${response.status}`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      if (response.status === 204 || response.status === 205) return null;

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') return null;

      const contentType = response.headers.get('Content-Type') || '';
      const looksLikeJson =
        contentType.includes('application/json') ||
        responseText.trim().startsWith('{') ||
        responseText.trim().startsWith('[');

      if (looksLikeJson) {
        try {
          return JSON.parse(responseText);
        } catch {
          throw new Error('Erro ao processar resposta do servidor');
        }
      }

      return responseText;
    } catch (error) {
      throw error;
    }
  }

  async healthCheck() {
    return await this.request('/health');
  }

  async getGoogleAuthUrl() {
    return this.request('/oauth/google_oauth_url');
  }

  async acceptTerms() {
    return this.request('/auth/accept_terms', { method: 'POST' });
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

  async register({ name, accountName, email, password, document }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, account_name: accountName, email, password, document }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async requestPasswordReset(email) {
    return await this.request('/auth/password_reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async lookupCnpj(cnpj) {
    const digits = cnpj.replace(/\D/g, '')
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
    if (!res.ok) throw new Error('CNPJ não encontrado')
    return res.json()
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

  async createTransaction(data) {
    // Suportar tanto formato antigo quanto novo
    const transactionData = data.transaction || data
    const paymentPlan = data.payment_plan
    
    const body = { transaction: transactionData }
    if (paymentPlan) {
      body.payment_plan = paymentPlan
    }
    
    return await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateTransaction(id, transactionData) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ transaction: transactionData }),
    });
  }

  async deleteTransaction(id, option = null) {
    const url = option ? `/transactions/${id}?option=${option}` : `/transactions/${id}`
    return await this.request(url, {
      method: 'DELETE',
    });
  }

  async bulkDestroyTransactions(transactionIds, option = 'only_this_installment') {
    return await this.request('/transactions/bulk_destroy', {
      method: 'POST',
      body: JSON.stringify({ transaction_ids: transactionIds, option }),
    });
  }

  async bulkMarkAsPaidTransactions(transactionIds) {
    return await this.request('/transactions/bulk_mark_as_paid', {
      method: 'POST',
      body: JSON.stringify({ transaction_ids: transactionIds }),
    });
  }

  async bulkUpdateTransactions(transactionIds, fields) {
    return await this.request('/transactions/bulk_update', {
      method: 'POST',
      body: JSON.stringify({ transaction_ids: transactionIds, ...fields }),
    });
  }

  async checkRecurrenceExpiry() {
    return await this.request('/transactions/check_recurrence_expiry');
  }

  async extendRecurrence(paymentPlanId) {
    return await this.request('/transactions/extend_recurrence', {
      method: 'POST',
      body: JSON.stringify({ payment_plan: { id: paymentPlanId } }),
    });
  }

  // Payment Plans - Installments
  async getPaymentPlanInstallments(paymentPlanId) {
    return await this.request(`/payment_plans/${paymentPlanId}/installments`);
  }

  async updatePaymentPlanInstallments(paymentPlanId, installments) {
    return await this.request(`/payment_plans/${paymentPlanId}/update_installments`, {
      method: 'PUT',
      body: JSON.stringify({ installments }),
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

  // Onboarding demo data
  async seedDemoData() {
    return await this.request('/onboarding/seed_demo', { method: 'POST' });
  }

  async clearDemoData() {
    return await this.request('/onboarding/clear_demo', { method: 'DELETE' });
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
  // Appointment Notes
  async getAppointmentNotes(appointmentId) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes`);
  }

  async getAppointmentNote(appointmentId, noteId) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}`);
  }

  async createAppointmentNote(appointmentId, noteData) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes`, {
      method: 'POST',
      body: JSON.stringify({ appointment_note: noteData }),
    });
  }

  async updateAppointmentNote(appointmentId, noteId, noteData) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ appointment_note: noteData }),
    });
  }

  async deleteAppointmentNote(appointmentId, noteId) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // Patient Tasks
  async addPatientTask(appointmentId, noteId, taskDescription) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}/add_task`, {
      method: 'POST',
      body: JSON.stringify({ task: { description: taskDescription } }),
    });
  }

  async completePatientTask(appointmentId, noteId, taskId) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}/complete_task`, {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    });
  }

  async removePatientTask(appointmentId, noteId, taskId) {
    return await this.request(`/appointments/${appointmentId}/appointment_notes/${noteId}/remove_task/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Professional Documents from Appointments
  async getProfessionalDocumentTemplatesForAppointment(appointmentId) {
    return await this.request(`/appointments/${appointmentId}/professional_document_templates`);
  }

  async generateProfessionalDocumentFromAppointment(appointmentId, templateId, options = {}) {
    return await this.request(`/appointments/${appointmentId}/generate_professional_document`, {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        document_content: options.document_content || '',
        progress: options.progress || '',
        instructions: options.instructions || '',
        observations: options.observations || '',
      }),
    });
  }

  async sendAnamneseWhatsApp(appointmentId) {
    return await this.request(`/appointments/${appointmentId}/send_anamnese`, { method: 'POST' });
  }

  // Appointment Attachments
  async getAppointmentAttachments(appointmentId) {
    return await this.request(`/appointments/${appointmentId}/attachments`);
  }

  async uploadAppointmentAttachments(appointmentId, files) {
    const url = `${this.baseURL}/appointments/${appointmentId}/attachments`;
    const formData = new FormData();
    
    // Adicionar múltiplos arquivos
    if (files instanceof FileList) {
      Array.from(files).forEach(file => {
        formData.append('attachments[]', file);
      });
    } else if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('attachments[]', file);
      });
    } else {
      formData.append('attachments[]', files);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token || localStorage.getItem('auth_token')}`,
        // Não definir Content-Type - o browser vai definir automaticamente com boundary para FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw { status: response.status, data: errorData, message: errorData.error || 'Erro ao fazer upload' };
    }

    return await response.json();
  }

  async deleteAppointmentAttachment(appointmentId, attachmentId) {
    return await this.request(`/appointments/${appointmentId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

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

  // Commissions
  async getCommissions(startDate, endDate, professionalId = null) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (professionalId) {
      params.append('professional_id', professionalId);
    }
    return await this.request(`/commissions?${params}`);
  }

  async getCommissionsSummary(startDate, endDate, professionalId = null) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (professionalId) {
      params.append('professional_id', professionalId);
    }
    return await this.request(`/commissions/summary?${params}`);
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

  async getProfessionalCommissionConfigs(id) {
    return await this.request(`/professionals/${id}/commission_configs`);
  }

  async createProfessionalCommissionConfig(id, configData) {
    return await this.request(`/professionals/${id}/commission_configs`, {
      method: 'POST',
      body: JSON.stringify({ commission_config: configData }),
    });
  }

  async updateProfessionalCommissionConfig(id, configId, configData) {
    return await this.request(`/professionals/${id}/commission_configs/${configId}`, {
      method: 'PATCH',
      body: JSON.stringify({ commission_config: configData }),
    });
  }

  async deleteProfessionalCommissionConfig(id, configId) {
    return await this.request(`/professionals/${id}/commission_configs/${configId}`, {
      method: 'DELETE',
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
    return await this.request(`/reports/${reportId}${queryString}`);
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

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.errors?.join(', ') || `HTTP error! status: ${response.status}`;
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
  async getPublicAppointmentFull(token, { timeoutMs = 20000 } = {}) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }

    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/full`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timer);

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error((data && (data.error || data.message)) || `HTTP error! status: ${response.status}`);
      }

      if (!Array.isArray(data.services) || !Array.isArray(data.professionals) || typeof data.config !== 'object') {
        throw new Error('Formato de resposta inesperado da API');
      }

      return data;
    } catch (error) {
      clearTimeout(timer);
      if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Servidor indisponível ou tempo de resposta excedido. Tente novamente.');
      }
      throw error;
    }
  }

  async getPublicAppointmentServices(token) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }
    
    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/services`;
    
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);

      if (data && !Array.isArray(data)) {
        throw new Error(data.message || data.error || 'Formato de resposta inesperado da API');
      }

      return data;
    } catch (error) {
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
    
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);

      if (data && !Array.isArray(data)) {
        throw new Error(data.message || data.error || 'Formato de resposta inesperado da API');
      }

      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      throw error;
    }
  }

  async getPublicAppointmentConfig(token) {
    if (!token) {
      throw new Error('Token de agendamento não fornecido');
    }
    
    const baseUrl = this.baseURL.replace('/api/v1', '');
    const url = `${baseUrl}/api/v1/public/appointment_data/${token}/config`;
    
    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
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
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment: appointmentData }),
      });

      if (!response.ok) {
        let errorData = {};
        let errorText = '';
        try {
          errorText = await response.text();
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch { /* ignore parse errors */ }

        let errorMessage =
          (Array.isArray(errorData.errors) ? errorData.errors.join(', ') : null) ||
          (typeof errorData.error === 'string' ? errorData.error : errorData.error ? JSON.stringify(errorData.error) : null) ||
          errorData.message ||
          `HTTP error! status: ${response.status}`;

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        error.errors = errorData.errors || [];
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Client self-manage (public, no auth)
  async getManageAppointment(manageToken) {
    let baseUrl = this.baseURL.startsWith('/') ? 'http://localhost:3000' : this.baseURL.replace('/api/v1', '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/agendar/gerenciar/${manageToken}`)
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async cancelManageAppointment(manageToken) {
    let baseUrl = this.baseURL.startsWith('/') ? 'http://localhost:3000' : this.baseURL.replace('/api/v1', '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/agendar/gerenciar/${manageToken}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
    return data
  }

  async rescheduleManageAppointment(manageToken, newStartTime, newEndTime) {
    let baseUrl = this.baseURL.startsWith('/') ? 'http://localhost:3000' : this.baseURL.replace('/api/v1', '').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/agendar/gerenciar/${manageToken}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_start_time: newStartTime, new_end_time: newEndTime })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
    return data
  }

  async getPublicAvailableSlots(token, { professionalId, date, serviceId, excludeAppointmentId } = {}) {
    let baseUrl = this.baseURL.startsWith('/') ? 'http://localhost:3000' : this.baseURL.replace('/api/v1', '').replace(/\/$/, '')
    const params = new URLSearchParams()
    if (professionalId) params.set('professional_id', professionalId)
    if (date) params.set('date', date)
    if (serviceId) params.set('service_id', serviceId)
    if (excludeAppointmentId) params.set('exclude_appointment_id', excludeAppointmentId)
    const response = await fetch(`${baseUrl}/api/v1/public/appointment_data/${token}/available_slots?${params}`)
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `HTTP ${response.status}`)
    }
    return response.json()
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
    return await this.request('/subscriptions/create_checkout', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
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

  async syncSubscription() {
    return await this.request('/subscriptions/sync', {
      method: 'POST',
    });
  }

  // PIX Payments (AbacatePay)
  async createPixBilling({ amount, planId, planName, planDescription, frequency = 'MONTHLY' }) {
    return await this.request('/pix_payments/create_billing', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        plan_id: planId,
        plan_name: planName,
        plan_description: planDescription,
        frequency,
      }),
    });
  }

  async getPixBillingStatus(billingId) {
    return await this.request(`/pix_payments/status/${billingId}`);
  }

  async getPixBillings() {
    return await this.request('/pix_payments');
  }

  async syncPixPayment(billingId) {
    return await this.request('/pix_payments/sync', {
      method: 'POST',
      body: JSON.stringify({ billing_id: billingId }),
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

  async extendAdminTrial(accountId, days) {
    return await this.request(`/admin/accounts/${accountId}/extend_trial`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  async getAdminUsers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/users${queryParams ? `?${queryParams}` : ''}`);
  }

  async resendAdminConfirmation(userId) {
    return await this.request(`/admin/users/${userId}/resend_confirmation`, { method: 'POST' });
  }

  async getAdminWebhookLogs(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/webhooks${queryParams ? `?${queryParams}` : ''}`);
  }

  async retryAdminWebhook(webhookId) {
    return await this.request(`/admin/webhooks/${webhookId}/retry`, { method: 'POST' });
  }

  async syncStripe() {
    return await this.request('/admin/sync_stripe', { method: 'POST' });
  }

  async fixSubscriptions() {
    return await this.request('/admin/fix_subscriptions', { method: 'POST' });
  }

  async getAdminAuditLogs(accountId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await this.request(`/admin/accounts/${accountId}/audit_logs${queryParams ? `?${queryParams}` : ''}`);
  }

  // Announcements
  async getAdminAnnouncements() {
    return await this.request('/admin/announcements');
  }

  async createAdminAnnouncement(data) {
    return await this.request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ announcement: data }),
    });
  }

  async updateAdminAnnouncement(id, data) {
    return await this.request(`/admin/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ announcement: data }),
    });
  }

  async deleteAdminAnnouncement(id) {
    return await this.request(`/admin/announcements/${id}`, { method: 'DELETE' });
  }

  // Referral Codes
  async getAdminReferralCodes() {
    return await this.request('/admin/referral_codes');
  }

  async createAdminReferralCode(data) {
    return await this.request('/admin/referral_codes', {
      method: 'POST',
      body: JSON.stringify({ referral_code: data }),
    });
  }

  async updateAdminReferralCode(id, data) {
    return await this.request(`/admin/referral_codes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ referral_code: data }),
    });
  }

  async deleteAdminReferralCode(id) {
    return await this.request(`/admin/referral_codes/${id}`, { method: 'DELETE' });
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

  async uploadCompanyLogo(file) {
    const url = `${this.baseURL}/account_settings/upload_logo`
    const formData = new FormData()
    formData.append('logo', file)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.token || localStorage.getItem('auth_token')}` },
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || 'Erro ao enviar imagem')
    }
    return response.json()
  }

  async uploadCompanyCover(file) {
    const url = `${this.baseURL}/account_settings/upload_cover`
    const formData = new FormData()
    formData.append('cover', file)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.token || localStorage.getItem('auth_token')}` },
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || 'Erro ao enviar imagem')
    }
    return response.json()
  }

  // Document Templates - API v1 endpoints
  async getReceiptTemplates(page = 1, perPage = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return await this.request(`/receipt_templates?${params}`);
  }

  async getInvoiceTemplates(page = 1, perPage = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return await this.request(`/invoice_templates?${params}`);
  }

  async getContractTemplates(page = 1, perPage = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return await this.request(`/contract_templates?${params}`);
  }

  async getReceiptTemplate(id) {
    return await this.request(`/receipt_templates/${id}`);
  }

  async getInvoiceTemplate(id) {
    return await this.request(`/invoice_templates/${id}`);
  }

  async getContractTemplate(id) {
    return await this.request(`/contract_templates/${id}`);
  }

  async getProfessionalDocumentTemplates(page = 1, perPage = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    return await this.request(`/professional_document_templates?${params}`);
  }

  async getProfessionalDocumentTemplate(id) {
    return await this.request(`/professional_document_templates/${id}`);
  }

  async createReceiptTemplate(templateData) {
    return await this.request('/receipt_templates', {
      method: 'POST',
      body: JSON.stringify({ receipt_template: templateData }),
    });
  }

  async createInvoiceTemplate(templateData) {
    return await this.request('/invoice_templates', {
      method: 'POST',
      body: JSON.stringify({ invoice_template: templateData }),
    });
  }

  async createContractTemplate(templateData) {
    return await this.request('/contract_templates', {
      method: 'POST',
      body: JSON.stringify({ contract_template: templateData }),
    });
  }

  async createProfessionalDocumentTemplate(templateData) {
    return await this.request('/professional_document_templates', {
      method: 'POST',
      body: JSON.stringify({ professional_document_template: templateData }),
    });
  }

  async updateReceiptTemplate(id, templateData) {
    return await this.request(`/receipt_templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ receipt_template: templateData }),
    });
  }

  async updateInvoiceTemplate(id, templateData) {
    return await this.request(`/invoice_templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ invoice_template: templateData }),
    });
  }

  async updateContractTemplate(id, templateData) {
    return await this.request(`/contract_templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ contract_template: templateData }),
    });
  }

  async updateProfessionalDocumentTemplate(id, templateData) {
    return await this.request(`/professional_document_templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ professional_document_template: templateData }),
    });
  }

  async deleteReceiptTemplate(id) {
    return await this.request(`/receipt_templates/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteInvoiceTemplate(id) {
    return await this.request(`/invoice_templates/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteContractTemplate(id) {
    return await this.request(`/contract_templates/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteProfessionalDocumentTemplate(id) {
    return await this.request(`/professional_document_templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Método genérico para compatibilidade
  async deleteDocumentTemplate(id, type = 'receipt') {
    switch (type) {
      case 'invoice':
        return await this.deleteInvoiceTemplate(id);
      case 'contract':
        return await this.deleteContractTemplate(id);
      default:
        return await this.deleteReceiptTemplate(id);
    }
  }

  // Vitrine pública — Descobrir profissionais
  async discoverSearch(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
    ).toString()
    return this.request(`/public/discover${query ? `?${query}` : ''}`)
  }

  async discoverProfile(id) {
    return this.request(`/public/discover/${id}`)
  }

  async discoverCategories() {
    return this.request('/public/discover/categories')
  }

  // ── Google Calendar ──────────────────────────────────────────────────────────

  async getGoogleCalendarStatus() {
    return this.request('/google_calendar/status')
  }

  async getGoogleCalendarOAuthUrl() {
    return this.request('/google_calendar/oauth_url')
  }

  async disconnectGoogleCalendar() {
    return this.request('/google_calendar/disconnect', { method: 'DELETE' })
  }

  async syncGoogleCalendar() {
    return this.request('/google_calendar/sync', { method: 'POST' })
  }

  async getGoogleCalendarEvents(startDate, endDate) {
    return this.request(`/google_calendar/events?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`)
  }

  // ── Google Contacts ──────────────────────────────────────────────────────────

  async getGoogleContactsStatus() {
    return this.request('/google_contacts/status')
  }

  async getGoogleContactsOAuthUrl() {
    return this.request('/google_contacts/oauth_url')
  }

  async disconnectGoogleContacts() {
    return this.request('/google_contacts/disconnect', { method: 'DELETE' })
  }

  async listGoogleContacts() {
    return this.request('/google_contacts/list')
  }

  async importGoogleContacts(contacts) {
    return this.request('/google_contacts/import', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    })
  }

  // ── WhatsApp Connection ──────────────────────────────────────────────────────

  async getWhatsappConnectionStatus() {
    return this.request('/whatsapp_config/connection_status')
  }

  async getWhatsappQrCode() {
    return this.request('/whatsapp_config/qr_code')
  }

  async requestWhatsappPairingCode(phone) {
    return this.request('/whatsapp_config/pairing_code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  }

  async disconnectWhatsapp() {
    return this.request('/whatsapp_config/disconnect_instance', { method: 'DELETE' })
  }

  async getWhatsappConfig() {
    return this.request('/whatsapp_config')
  }

  async updateWhatsappConfig(data) {
    return this.request('/whatsapp_config', {
      method: 'PATCH',
      body: JSON.stringify({ whatsapp_config: data }),
    })
  }

  // ── Anamnese Templates ───────────────────────────────────────────────────────

  async getAnamneseTemplates() {
    return this.request('/anamnese_templates')
  }

  async createAnamneseTemplate(data) {
    return this.request('/anamnese_templates', {
      method: 'POST',
      body: JSON.stringify({ anamnese_template: data }),
    })
  }

  async updateAnamneseTemplate(id, data) {
    return this.request(`/anamnese_templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ anamnese_template: data }),
    })
  }

  async deleteAnamneseTemplate(id) {
    return this.request(`/anamnese_templates/${id}`, { method: 'DELETE' })
  }

  // ── Anamnese Responses (nested under appointments) ───────────────────────────

  async getAnamneseResponse(appointmentId) {
    return this.request(`/appointments/${appointmentId}/anamnese_response`)
  }

  async saveAnamneseResponse(appointmentId, data) {
    return this.request(`/appointments/${appointmentId}/anamnese_response`, {
      method: 'POST',
      body: JSON.stringify({ anamnese_response: data }),
    })
  }

  // ── Anamnese pública (preenchimento pelo paciente, sem auth) ─────────────────

  async getPublicAnamnese(token) {
    const url = `${this.baseURL}/public/anamnese/${token}`
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) throw new Error('Link inválido ou expirado')
    return res.json()
  }

  async submitPublicAnamnese(token, data) {
    const url = `${this.baseURL}/public/anamnese/${token}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anamnese_response: data }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Erro ao enviar anamnese')
    }
    return res.json()
  }

  // ── Última anamnese por contato ───────────────────────────────────────────────

  async getLastAnamneseResponse(contactId) {
    return this.request(`/contacts/${contactId}/last_anamnese_response`)
  }

  async getAnamneseHistory(contactId) {
    return this.request(`/contacts/${contactId}/anamnese_history`)
  }

  // ── Anamnese vinculada ao paciente (sem agendamento) ──────────────────────────

  async getContactAnamneseResponses(contactId) {
    return this.request(`/contacts/${contactId}/anamnese_responses`)
  }

  async createContactAnamneseResponse(contactId, data) {
    return this.request(`/contacts/${contactId}/anamnese_responses`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ── Patient Notes (evoluções clínicas, sem agendamento) ──────────────────────

  async getPatientNotes(contactId) {
    return this.request(`/contacts/${contactId}/patient_notes`)
  }

  async createPatientNote(contactId, content) {
    return this.request(`/contacts/${contactId}/patient_notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async updatePatientNote(contactId, noteId, content) {
    return this.request(`/contacts/${contactId}/patient_notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })
  }

  async deletePatientNote(contactId, noteId) {
    return this.request(`/contacts/${contactId}/patient_notes/${noteId}`, { method: 'DELETE' })
  }

  // ── Appointment: salvar template de anamnese ──────────────────────────────────

  async setAppointmentAnamneseTemplate(appointmentId, templateId) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ appointment: { anamnese_template_id: templateId } }),
    })
  }

  // ── Patient Goals (nested under contacts) ────────────────────────────────────

  async getPatientGoals(contactId) {
    return this.request(`/contacts/${contactId}/patient_goals`)
  }

  async createPatientGoal(contactId, data) {
    return this.request(`/contacts/${contactId}/patient_goals`, {
      method: 'POST',
      body: JSON.stringify({ patient_goal: data }),
    })
  }

  async updatePatientGoal(contactId, goalId, data) {
    return this.request(`/contacts/${contactId}/patient_goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify({ patient_goal: data }),
    })
  }

  async deletePatientGoal(contactId, goalId) {
    return this.request(`/contacts/${contactId}/patient_goals/${goalId}`, { method: 'DELETE' })
  }

  async addPatientGoalProgress(contactId, goalId, value, note = null, date = null) {
    return this.request(`/contacts/${contactId}/patient_goals/${goalId}/add_progress`, {
      method: 'POST',
      body: JSON.stringify({ value, note, date }),
    })
  }

  // ── Documentos do Paciente ────────────────────────────────────────────────────

  async getPatientDocuments(contactId) {
    return this.request(`/contacts/${contactId}/patient_documents`)
  }

  async createPatientDocument(contactId, data) {
    return this.request(`/contacts/${contactId}/patient_documents`, {
      method: 'POST',
      body: JSON.stringify({ patient_document: data }),
    })
  }

  async updatePatientDocument(contactId, docId, data) {
    return this.request(`/contacts/${contactId}/patient_documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({ patient_document: data }),
    })
  }

  async deletePatientDocument(contactId, docId) {
    return this.request(`/contacts/${contactId}/patient_documents/${docId}`, { method: 'DELETE' })
  }

  async togglePatientDocumentShared(contactId, docId) {
    return this.request(`/contacts/${contactId}/patient_documents/${docId}/toggle_shared`, { method: 'POST' })
  }

  async getPublicPatientDocument(token) {
    const url = `${this.baseURL}/public/documents/${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Documento não encontrado')
    return data
  }

  // ── Planos Alimentares ────────────────────────────────────────────────────────

  async getMealPlans(contactId) {
    return this.request(`/contacts/${contactId}/meal_plans`)
  }

  async getMealPlan(contactId, planId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}`)
  }

  async createMealPlan(contactId, data) {
    return this.request(`/contacts/${contactId}/meal_plans`, {
      method: 'POST',
      body: JSON.stringify({ meal_plan: data }),
    })
  }

  async updateMealPlan(contactId, planId, data) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify({ meal_plan: data }),
    })
  }

  async deleteMealPlan(contactId, planId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}`, { method: 'DELETE' })
  }

  async activateMealPlan(contactId, planId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/activate`, { method: 'POST' })
  }

  async addMealPlanDay(contactId, planId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/add_day`, { method: 'POST' })
  }

  async removeMealPlanDay(contactId, planId, dayId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}`, { method: 'DELETE' })
  }

  async addMeal(contactId, planId, dayId, name) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}/meals`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async removeMeal(contactId, planId, dayId, mealId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}/meals/${mealId}`, { method: 'DELETE' })
  }

  async addFoodToMeal(contactId, planId, dayId, mealId, data) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}/meals/${mealId}/foods`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateMealFood(contactId, planId, dayId, mealId, foodItemId, data) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}/meals/${mealId}/foods/${foodItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async removeMealFood(contactId, planId, dayId, mealId, foodItemId) {
    return this.request(`/contacts/${contactId}/meal_plans/${planId}/days/${dayId}/meals/${mealId}/foods/${foodItemId}`, { method: 'DELETE' })
  }

  // ── Modelos de Plano Alimentar ────────────────────────────────────────────────

  async getMealPlanTemplates() {
    return this.request('/meal_plan_templates')
  }

  async getMealPlanTemplate(id) {
    return this.request(`/meal_plan_templates/${id}`)
  }

  async createMealPlanTemplate(data) {
    return this.request('/meal_plan_templates', {
      method: 'POST',
      body: JSON.stringify({ meal_plan: data }),
    })
  }

  async updateMealPlanTemplate(id, data) {
    return this.request(`/meal_plan_templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ meal_plan: data }),
    })
  }

  async deleteMealPlanTemplate(id) {
    return this.request(`/meal_plan_templates/${id}`, { method: 'DELETE' })
  }

  async importSystemMealPlanTemplates() {
    return this.request('/meal_plan_templates/import_system', { method: 'POST' })
  }

  async savePlanAsTemplate(planId, data) {
    return this.request('/meal_plan_templates/from_plan', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, ...data }),
    })
  }

  async createMealPlanFromTemplate(contactId, templateId, title) {
    return this.request(`/contacts/${contactId}/meal_plans/from_template`, {
      method: 'POST',
      body: JSON.stringify({ template_id: templateId, title }),
    })
  }

  async addMealPlanTemplateDay(templateId) {
    return this.request(`/meal_plan_templates/${templateId}/add_day`, { method: 'POST' })
  }

  async removeMealPlanTemplateDay(templateId, dayId) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}`, { method: 'DELETE' })
  }

  async addMealToTemplate(templateId, dayId, name) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}/meals`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async removeMealFromTemplate(templateId, dayId, mealId) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}/meals/${mealId}`, { method: 'DELETE' })
  }

  async addFoodToTemplateMeal(templateId, dayId, mealId, data) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}/meals/${mealId}/foods`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTemplateMealFood(templateId, dayId, mealId, foodItemId, data) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}/meals/${mealId}/foods/${foodItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async removeTemplateMealFood(templateId, dayId, mealId, foodItemId) {
    return this.request(`/meal_plan_templates/${templateId}/days/${dayId}/meals/${mealId}/foods/${foodItemId}`, { method: 'DELETE' })
  }

  // ── Busca de Alimentos ────────────────────────────────────────────────────────

  async searchFoods(q, source = null) {
    const params = new URLSearchParams({ q })
    if (source) params.set('source', source)
    return this.request(`/foods?${params.toString()}`)
  }

  async searchFoodByBarcode(barcode) {
    return this.request(`/foods/barcode/${encodeURIComponent(barcode)}`)
  }

  async createCustomFood(data) {
    return this.request('/foods', {
      method: 'POST',
      body: JSON.stringify({ food: data }),
    })
  }

  async getPublicMealPlan(token) {
    const url = `${this.baseURL}/public/meal-plans/${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Plano não encontrado')
    return data
  }
}

export const apiService = new ApiService(); 