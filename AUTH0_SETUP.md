# Auth0 - Plataforma de Autenticação

## Por que Auth0?

- ✅ **Free tier generoso** (7.000 usuários/mês)
- ✅ **Múltiplos provedores** (Google, Facebook, etc.)
- ✅ **SDK para React**
- ✅ **Dashboard completo**
- ✅ **Mais profissional que Firebase**

## 1. Criar conta Auth0

1. Acesse: https://auth0.com/
2. Clique em **"Sign Up"**
3. Crie uma conta gratuita

## 2. Configurar aplicação

1. No dashboard Auth0, vá para **"Applications"**
2. Clique em **"Create Application"**
3. Escolha **"Single Page Application"**
4. Configure:
   - **Allowed Callback URLs**: `http://localhost:5174/callback`
   - **Allowed Logout URLs**: `http://localhost:5174`
   - **Allowed Web Origins**: `http://localhost:5174`

## 3. Configurar Google

1. Vá para **"Authentication" > "Social"**
2. Clique em **"Google"**
3. Configure com suas credenciais Google

## 4. Instalar Auth0 no frontend

```bash
cd frontend
npm install @auth0/auth0-react
```

## 5. Configurar Auth0Provider

```javascript
// App.jsx
import { Auth0Provider } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain="seu-dominio.auth0.com"
      clientId="seu-client-id"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      {/* resto da aplicação */}
    </Auth0Provider>
  );
}
```

## 6. Usar no Login

```javascript
import { useAuth0 } from '@auth0/auth0-react';

const { loginWithRedirect, user, isAuthenticated } = useAuth0();

const handleGoogleLogin = () => {
  loginWithRedirect();
};
```

## Vantagens do Auth0

- 🏢 **Mais profissional**
- 📊 **Analytics completos**
- 🔧 **Muitas opções de customização**
- 🔒 **Enterprise-grade security** 