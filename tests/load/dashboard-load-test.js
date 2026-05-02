/**
 * Teste de Carga - Dashboard
 * 
 * Simula múltiplos usuários acessando o dashboard simultaneamente
 * 
 * Execução:
 * k6 run tests/load/dashboard-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { authenticate, authenticatedRequest } from './k6-config.js';

const dashboardLoadRate = new Rate('dashboard_load_success');
const dashboardLoadDuration = new Trend('dashboard_load_duration');
const reportsLoadRate = new Rate('reports_load_success');

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
    { duration: '1m', target: 30 },
    { duration: '5m', target: 30 },
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // Dashboard pode ser mais pesado
    http_req_failed: ['rate<0.01'],
    dashboard_load_success: ['rate>0.95'],
  },
};

export function setup() {
  const token = authenticate(apiUrl, testEmail, testPassword);
  
  if (!token) {
    throw new Error('Falha na autenticação');
  }

  return { token };
}

export default function (data) {
  const { token } = data;
  
  // 1. Carregar dados do dashboard (60%)
  if (Math.random() < 0.6) {
    const startTime = Date.now();
    
    // Buscar múltiplos endpoints do dashboard em paralelo
    const [metricsRes, appointmentsRes, transactionsRes] = http.batch([
      ['GET', `${apiUrl}/dashboard/metrics`, null, {
        headers: { 'Authorization': `Bearer ${token}` },
      }],
      ['GET', `${apiUrl}/appointments?page=1&per_page=10&status=confirmed`, null, {
        headers: { 'Authorization': `Bearer ${token}` },
      }],
      ['GET', `${apiUrl}/transactions?page=1&per_page=10`, null, {
        headers: { 'Authorization': `Bearer ${token}` },
      }],
    ]);
    
    const duration = Date.now() - startTime;

    const success = check(metricsRes, {
      'dashboard metrics status 200': (r) => r.status === 200,
    }) && check(appointmentsRes, {
      'dashboard appointments status 200': (r) => r.status === 200,
    }) && check(transactionsRes, {
      'dashboard transactions status 200': (r) => r.status === 200,
    });

    dashboardLoadRate.add(success);
    dashboardLoadDuration.add(duration);
    
    sleep(2);
  }
  
  // 2. Carregar relatórios (30%)
  if (Math.random() < 0.3) {
    const period = ['today', 'week', 'month'][Math.floor(Math.random() * 3)];
    const res = authenticatedRequest('GET', `${apiUrl}/reports/financial?period=${period}`, token);
    
    check(res, {
      'reports load status 200': (r) => r.status === 200,
    });
    
    reportsLoadRate.add(res.status === 200);
    sleep(2);
  }
  
  // 3. Buscar estatísticas (10%)
  if (Math.random() < 0.1) {
    const res = authenticatedRequest('GET', `${apiUrl}/dashboard/stats`, token);
    
    check(res, {
      'stats load status 200': (r) => r.status === 200,
    });
    
    sleep(1);
  }
  
  sleep(Math.random() * 2 + 1);
}

