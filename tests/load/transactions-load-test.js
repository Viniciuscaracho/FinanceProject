/**
 * Teste de Carga - Transações
 * 
 * Simula múltiplos usuários criando e consultando transações financeiras
 * 
 * Execução:
 * k6 run tests/load/transactions-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { authenticate, authenticatedRequest, generateTestData } from './k6-config.js';

const transactionCreationRate = new Rate('transaction_creation_success');
const transactionListRate = new Rate('transaction_list_success');
const transactionFilterRate = new Rate('transaction_filter_success');

const transactionCreationDuration = new Trend('transaction_creation_duration');

const ENV = __ENV.ENV || 'local';
const baseUrl = ENV === 'local' 
  ? 'http://localhost:3000' 
  : ENV === 'staging'
  ? 'https://staging.barbermanagement.com'
  : 'https://app.barbermanagement.com';

const apiUrl = `${baseUrl}/api/v1`;
const testEmail = __ENV.TEST_EMAIL || 'admin@exemplo.com';
const testPassword = __ENV.TEST_PASSWORD || 'password';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    transaction_creation_success: ['rate>0.95'],
    transaction_list_success: ['rate>0.95'],
  },
};

export function setup() {
  const token = authenticate(apiUrl, testEmail, testPassword);
  
  if (!token) {
    throw new Error('Falha na autenticação');
  }

  // Buscar categorias e contas bancárias
  const categoriesRes = authenticatedRequest('GET', `${apiUrl}/categories`, token);
  const accountsRes = authenticatedRequest('GET', `${apiUrl}/bank_accounts`, token);

  let categories = [];
  let accounts = [];

  if (categoriesRes.status === 200) {
    try {
      const data = JSON.parse(categoriesRes.body);
      categories = Array.isArray(data) ? data : (data.categories || []);
    } catch {}
  }

  if (accountsRes.status === 200) {
    try {
      const data = JSON.parse(accountsRes.body);
      accounts = Array.isArray(data) ? data : (data.bank_accounts || []);
    } catch {}
  }

  return {
    token,
    categories: categories.length > 0 ? categories : [{ id: 1 }],
    accounts: accounts.length > 0 ? accounts : [{ id: 1 }],
  };
}

export default function (data) {
  const { token, categories, accounts } = data;
  
  // 1. Listar transações (60%)
  if (Math.random() < 0.6) {
    const res = authenticatedRequest('GET', `${apiUrl}/transactions?page=1&per_page=50`, token);
    
    check(res, {
      'list transactions status 200': (r) => r.status === 200,
    });
    
    transactionListRate.add(res.status === 200);
    sleep(1);
  }
  
  // 2. Filtrar transações (20%)
  if (Math.random() < 0.2) {
    const filters = [
      '?type=income',
      '?type=expense',
      '?status=paid',
      '?status=pending',
    ];
    const filter = filters[Math.floor(Math.random() * filters.length)];
    
    const res = authenticatedRequest('GET', `${apiUrl}/transactions${filter}`, token);
    
    check(res, {
      'filter transactions status 200': (r) => r.status === 200,
    });
    
    transactionFilterRate.add(res.status === 200);
    sleep(1);
  }
  
  // 3. Criar transação (20%)
  if (Math.random() < 0.2) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const account = accounts[Math.floor(Math.random() * accounts.length)];
    const isIncome = Math.random() < 0.5;
    
    const transactionData = {
      type: isIncome ? 'income' : 'expense',
      amount: (Math.random() * 500 + 10).toFixed(2),
      description: `Transação de teste ${Math.random().toString(36).substring(7)}`,
      category_id: category.id,
      bank_account_id: account.id,
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
    };

    const startTime = Date.now();
    const res = authenticatedRequest('POST', `${apiUrl}/transactions`, token, transactionData);
    const duration = Date.now() - startTime;

    const success = check(res, {
      'create transaction status 201': (r) => r.status === 201 || r.status === 200,
    });

    transactionCreationRate.add(success);
    transactionCreationDuration.add(duration);
    
    sleep(2);
  }
  
  sleep(Math.random() * 2 + 1);
}

