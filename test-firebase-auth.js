#!/usr/bin/env node

/**
 * Script de teste para Firebase Authentication
 * Execute: node test-firebase-auth.js
 */

const http = require('http');

console.log('🧪 Testando implementação do Firebase Auth...\n');

// Teste 1: Verificar se o servidor Rails está rodando
console.log('1️⃣ Testando servidor Rails...');
const testRailsServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/health_check', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Servidor Rails está rodando na porta 3000');
        resolve(true);
      } else {
        console.log('❌ Servidor Rails não está respondendo corretamente');
        reject(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Servidor Rails não está rodando na porta 3000');
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Timeout ao conectar com servidor Rails');
      reject(false);
    });
  });
};

// Teste 2: Verificar se o endpoint do Firebase está disponível
console.log('\n2️⃣ Testando endpoint Firebase...');
const testFirebaseEndpoint = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      photo_url: 'https://example.com/photo.jpg',
      provider: 'firebase'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/auth/firebase_login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Endpoint Firebase está funcionando');
            resolve(true);
          } else {
            console.log('❌ Endpoint Firebase retornou erro:', response.error);
            reject(false);
          }
        } catch (e) {
          console.log('❌ Erro ao parsear resposta do endpoint Firebase');
          reject(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Erro ao conectar com endpoint Firebase:', e.message);
      reject(false);
    });

    req.write(postData);
    req.end();
  });
};

// Teste 3: Verificar se o frontend está rodando
console.log('\n3️⃣ Testando servidor Frontend...');
const testFrontendServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5173', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Servidor Frontend está rodando na porta 5173');
        resolve(true);
      } else {
        console.log('❌ Servidor Frontend não está respondendo corretamente');
        reject(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Servidor Frontend não está rodando na porta 5173');
      reject(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Timeout ao conectar com servidor Frontend');
      reject(false);
    });
  });
};

// Executar todos os testes
async function runTests() {
  try {
    await testRailsServer();
    await testFirebaseEndpoint();
    await testFrontendServer();
    
    console.log('\n🎉 Todos os testes passaram!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente do Firebase');
    console.log('2. Acesse http://localhost:5173');
    console.log('3. Teste o login com Google');
    console.log('4. Verifique se o usuário foi criado no banco');
    
  } catch (error) {
    console.log('\n❌ Alguns testes falharam');
    console.log('\n🔧 Soluções:');
    console.log('1. Certifique-se de que o Rails está rodando: rails server');
    console.log('2. Certifique-se de que o Frontend está rodando: cd frontend && pnpm dev');
    console.log('3. Verifique se o banco de dados está configurado: rails db:migrate');
  }
}

runTests(); 