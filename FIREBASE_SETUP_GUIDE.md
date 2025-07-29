# 🔥 Guia Rápido - Configuração do Firebase

## ✅ Status Atual
O Firebase Auth está implementado, mas precisa de configuração das credenciais.

## 🚀 Configuração em 3 Passos

### 1. Criar Projeto Firebase
1. Acesse: https://console.firebase.google.com/
2. Clique em **"Create a project"**
3. Nome: `procfy-auth` (ou qualquer nome)
4. Continue com configurações padrão

### 2. Configurar Authentication
1. No console Firebase → **Authentication**
2. Clique em **"Get started"**
3. Aba **"Sign-in method"**
4. Clique em **"Google"** e ative
5. Configure email de suporte

### 3. Obter Credenciais
1. No console Firebase → **Project settings** (ícone ⚙️)
2. Aba **"General"** → **"Your apps"**
3. Clique em **"Add app"** → **"Web"**
4. Nome: `procfy-web`
5. **Copie a configuração** que aparece

### 4. Configurar Frontend
1. No diretório `frontend/`
2. Crie arquivo `.env`:
```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_API_URL=http://localhost:3000
```

### 5. Testar
1. Reinicie o servidor frontend: `pnpm dev`
2. Acesse: http://localhost:5174
3. Clique em **"Entrar com Google (Firebase)"**

## 🎯 Resultado Esperado
- Login com Google funcionando
- Usuário criado automaticamente no backend
- Redirecionamento para dashboard

## ❌ Problemas Comuns
- **API key inválida**: Verifique se copiou corretamente
- **Popup bloqueado**: Permita popups para localhost
- **Erro de CORS**: Configure domínios autorizados no Firebase

## 📞 Suporte
Se tiver problemas, verifique:
1. Console do navegador (F12)
2. Logs do servidor Rails
3. Configuração das variáveis de ambiente 