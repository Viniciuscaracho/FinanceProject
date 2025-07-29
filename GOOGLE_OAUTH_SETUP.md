# Configuração do Google OAuth

## 1. Criar projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ (se necessário)

## 2. Configurar OAuth 2.0

1. Vá para **"APIs & Services" > "Credentials"**
2. Clique em **"Create Credentials" > "OAuth 2.0 Client IDs"**
3. Configure:
   - **Application type**: Web application
   - **Name**: Procfy OAuth
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/oauth/callback` (para desenvolvimento)
     - `http://localhost:5174/oauth/callback` (para o frontend)

## 3. Obter as credenciais

Após criar, você receberá:
- **Client ID**: algo como `123456789-abcdef.apps.googleusercontent.com`
- **Client Secret**: uma string secreta

## 4. Configurar variáveis de ambiente

### Backend (Rails)

Crie um arquivo `.env` na raiz do projeto:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=9998
DATABASE_NAME=procfy_development
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5174
```

### Frontend (React)

Crie um arquivo `.env` na pasta `frontend/`:

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# API Configuration
VITE_API_URL=http://localhost:3000
```

## 5. Configurar banco de dados

```bash
# Parar o servidor Rails
pkill -f "rails server"

# Configurar variáveis de ambiente
export DATABASE_PORT=9998

# Criar e migrar banco
rails db:create
rails db:migrate

# Reiniciar servidor
rails server -p 3000 -d
```

## 6. Testar

1. Acesse: http://localhost:5174
2. Clique em "Entrar com Google"
3. Deve redirecionar para o Google e permitir login

## 7. URLs autorizadas no Google Console

Certifique-se de que estas URLs estão configuradas no Google Console:

- `http://localhost:3000/oauth/callback`
- `http://localhost:5174/oauth/callback`
- `http://localhost:3000/api/v1/oauth/google_oauth_url`

## Troubleshooting

### Erro "OAuth client was not found"
- Verifique se o Client ID está correto
- Verifique se as URLs de redirecionamento estão configuradas

### Erro de banco de dados
- Verifique se o Docker está rodando: `docker ps`
- Verifique se o PostgreSQL está na porta 9998
- Execute: `docker-compose up -d`

### Erro de CORS
- Verifique se o frontend está na porta correta
- Verifique se as URLs estão configuradas no Google Console 