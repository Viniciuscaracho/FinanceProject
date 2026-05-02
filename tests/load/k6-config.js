/**
 * Configuração base para testes de carga com k6
 * 
 * Instalação:
 * - macOS: brew install k6
 * - Linux: https://k6.io/docs/getting-started/installation/
 * - Windows: https://k6.io/docs/getting-started/installation/
 * 
 * Execução:
 * k6 run tests/load/appointments-load-test.js
 * k6 run --vus 100 --duration 30s tests/load/appointments-load-test.js
 */

import http from 'k6/http';

export const config = {
  // Configurações de ambiente
  environments: {
    local: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3000/api/v1',
    },
    staging: {
      baseUrl: 'https://staging.barbermanagement.com',
      apiUrl: 'https://staging.barbermanagement.com/api/v1',
    },
    production: {
      baseUrl: 'https://app.barbermanagement.com',
      apiUrl: 'https://app.barbermanagement.com/api/v1',
    },
  },

  // Thresholds - limites de performance aceitáveis
  thresholds: {
    // Tempo de resposta HTTP
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% das requisições < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'], // Taxa de erro < 1%
    
    // Requisições por segundo
    http_reqs: ['rate>10'], // Mínimo 10 req/s
    
    // Iterações
    iteration_duration: ['p(95)<3000'], // 95% das iterações < 3s
    
    // Checks
    checks: ['rate>0.95'], // 95% dos checks devem passar
  },

  // Configurações de carga padrão
  scenarios: {
    // Carga constante
    constant_load: {
      executor: 'constant-vus',
      vus: 50, // Virtual Users
      duration: '5m',
    },
    
    // Carga crescente (ramp-up)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 VUs
        { duration: '5m', target: 50 },  // Stay at 50 VUs
        { duration: '2m', target: 100 }, // Ramp up to 100 VUs
        { duration: '5m', target: 100 },  // Stay at 100 VUs
        { duration: '2m', target: 0 },    // Ramp down to 0 VUs
      ],
    },
    
    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 200 }, // Spike
        { duration: '1m', target: 10 },
      ],
    },
    
    // Stress test
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};

// Função auxiliar para autenticação
export function authenticate(baseUrl, email, password) {
  const loginRes = http.post(`${baseUrl}/api/v1/auth/login`, JSON.stringify({
    email: email,
    password: password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    console.log(`Login falhou: status ${loginRes.status}, body: ${loginRes.body}`);
    return null;
  }

  try {
    const body = JSON.parse(loginRes.body);
    if (body.success && body.token) {
      return body.token;
    }
    console.log(`Login retornou sucesso mas sem token: ${JSON.stringify(body)}`);
    return null;
  } catch (e) {
    console.log(`Erro ao parsear resposta: ${e.message}, body: ${loginRes.body}`);
    return null;
  }
}

// Função auxiliar para fazer requisições autenticadas
export function authenticatedRequest(method, url, token, payload = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const params = { headers: headers };

  switch (method.toUpperCase()) {
    case 'GET':
      return http.get(url, params);
    case 'POST':
      return http.post(url, JSON.stringify(payload), params);
    case 'PUT':
      return http.put(url, JSON.stringify(payload), params);
    case 'PATCH':
      return http.patch(url, JSON.stringify(payload), params);
    case 'DELETE':
      return http.del(url, null, params);
    default:
      throw new Error(`Método HTTP não suportado: ${method}`);
  }
}

// Função auxiliar para gerar dados de teste
export function generateTestData() {
  return {
    name: `Cliente Teste ${Math.random().toString(36).substring(7)}`,
    phone: `+551199999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    email: `teste${Math.random().toString(36).substring(7)}@example.com`,
  };
}

