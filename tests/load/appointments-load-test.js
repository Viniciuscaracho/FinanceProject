/**
 * Teste de Carga - Agendamentos
 * 
 * Simula múltiplos usuários criando, visualizando e atualizando agendamentos
 * 
 * Execução:
 * k6 run tests/load/appointments-load-test.js
 * k6 run --env ENV=staging tests/load/appointments-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { authenticate, authenticatedRequest, generateTestData } from './k6-config.js';

// Métricas customizadas
const appointmentCreationRate = new Rate('appointment_creation_success');
const appointmentListRate = new Rate('appointment_list_success');
const appointmentUpdateRate = new Rate('appointment_update_success');

const appointmentCreationDuration = new Trend('appointment_creation_duration');
const appointmentListDuration = new Trend('appointment_list_duration');

// Configuração
const ENV = __ENV.ENV || 'local';
const baseUrl = ENV === 'local' 
  ? 'http://localhost:3000' 
  : ENV === 'staging'
  ? 'https://staging.barbermanagement.com'
  : 'https://app.barbermanagement.com';

const apiUrl = `${baseUrl}/api/v1`;
const baseApiUrl = baseUrl; // Para usar na função authenticate que já adiciona /api/v1

// Credenciais de teste (devem ser configuradas via variáveis de ambiente)
const testEmail = __ENV.TEST_EMAIL || 'admin@exemplo.com';
const testPassword = __ENV.TEST_PASSWORD || 'password';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 VUs
    { duration: '3m', target: 10 },   // Stay at 10 VUs
    { duration: '1m', target: 50 },    // Ramp up to 50 VUs
    { duration: '5m', target: 50 },    // Stay at 50 VUs
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
    appointment_creation_success: ['rate>0.95'],
    appointment_list_success: ['rate>0.95'],
  },
};

export function setup() {
  // Setup: Autenticar e obter dados necessários
  console.log(`Autenticando como ${testEmail}...`);
  const token = authenticate(baseUrl, testEmail, testPassword);
  
  if (!token) {
    throw new Error('Falha na autenticação durante setup');
  }

  // Buscar profissionais e serviços disponíveis
  const professionalsRes = authenticatedRequest('GET', `${apiUrl}/professionals`, token);
  const servicesRes = authenticatedRequest('GET', `${apiUrl}/services`, token);

  let professionals = [];
  let services = [];

  if (professionalsRes.status === 200) {
    const data = JSON.parse(professionalsRes.body);
    professionals = Array.isArray(data) ? data : (data.professionals || []);
  }

  if (servicesRes.status === 200) {
    const data = JSON.parse(servicesRes.body);
    services = Array.isArray(data) ? data : (data.services || []);
  }

  return {
    token,
    professionals: professionals.length > 0 ? professionals : [{ id: 1 }],
    services: services.length > 0 ? services : [{ id: 1, price: 30 }],
  };
}

export default function (data) {
  const { token, professionals, services } = data;
  
  // 1. Listar agendamentos (70% das iterações)
  if (Math.random() < 0.7) {
    const startTime = Date.now();
    const res = authenticatedRequest('GET', `${apiUrl}/appointments?page=1&per_page=20`, token);
    const duration = Date.now() - startTime;
    
    const success = check(res, {
      'list appointments status 200': (r) => r.status === 200,
      'list appointments has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (Array.isArray(body) || Array.isArray(body.appointments));
        } catch {
          return false;
        }
      },
    });

    appointmentListRate.add(success);
    appointmentListDuration.add(duration);
    
    sleep(1);
  }
  
  // 2. Criar agendamento (20% das iterações)
  if (Math.random() < 0.2) {
    const professional = professionals[Math.floor(Math.random() * professionals.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const testData = generateTestData();
    
    // Data futura (próximos 30 dias)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const dateStr = futureDate.toISOString().split('T')[0];
    
    // Horário aleatório entre 9h e 18h
    const hour = 9 + Math.floor(Math.random() * 9);
    const minute = Math.random() < 0.5 ? 0 : 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const appointmentData = {
      professional_id: professional.id,
      service_id: service.id,
      date: dateStr,
      time: timeStr,
      contact_name: testData.name,
      contact_phone: testData.phone,
      contact_email: testData.email,
    };

    const startTime = Date.now();
    const res = authenticatedRequest('POST', `${apiUrl}/appointments`, token, appointmentData);
    const duration = Date.now() - startTime;

    const success = check(res, {
      'create appointment status 201': (r) => r.status === 201 || r.status === 200,
      'create appointment has id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (body.id || body.appointment?.id);
        } catch {
          return false;
        }
      },
    });

    appointmentCreationRate.add(success);
    appointmentCreationDuration.add(duration);
    
    sleep(2);
  }
  
  // 3. Visualizar detalhes de agendamento (5% das iterações)
  if (Math.random() < 0.05) {
    // Primeiro, listar para obter um ID
    const listRes = authenticatedRequest('GET', `${apiUrl}/appointments?page=1&per_page=5`, token);
    
    if (listRes.status === 200) {
      try {
        const body = JSON.parse(listRes.body);
        const appointments = Array.isArray(body) ? body : (body.appointments || []);
        
        if (appointments.length > 0) {
          const appointment = appointments[0];
          const appointmentId = appointment.id || appointment.appointment_id;
          
          const detailRes = authenticatedRequest('GET', `${apiUrl}/appointments/${appointmentId}`, token);
          
          check(detailRes, {
            'get appointment detail status 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    }
    
    sleep(1);
  }
  
  // 4. Atualizar agendamento (5% das iterações)
  if (Math.random() < 0.05) {
    const listRes = authenticatedRequest('GET', `${apiUrl}/appointments?page=1&per_page=5`, token);
    
    if (listRes.status === 200) {
      try {
        const body = JSON.parse(listRes.body);
        const appointments = Array.isArray(body) ? body : (body.appointments || []);
        
        if (appointments.length > 0) {
          const appointment = appointments[0];
          const appointmentId = appointment.id || appointment.appointment_id;
          
          const updateData = {
            notes: `Nota de teste atualizada em ${new Date().toISOString()}`,
          };
          
          const startTime = Date.now();
          const updateRes = authenticatedRequest('PATCH', `${apiUrl}/appointments/${appointmentId}`, token, updateData);
          const duration = Date.now() - startTime;

          const success = check(updateRes, {
            'update appointment status 200': (r) => r.status === 200,
          });

          appointmentUpdateRate.add(success);
        }
      } catch (e) {
        // Ignorar erros
      }
    }
    
    sleep(1);
  }
  
  // Sleep aleatório entre 1-3 segundos
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log('Teste de carga finalizado');
}

