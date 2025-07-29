# Mock Google OAuth - Para Desenvolvimento

## Por que usar Mock?

- ✅ **Não precisa de projeto GCP**
- ✅ **Funciona offline**
- ✅ **Ideal para desenvolvimento**
- ✅ **Fácil de testar**

## 1. Implementar Mock no Frontend

```javascript
// frontend/src/utils/mockGoogleAuth.js
export const mockGoogleLogin = () => {
  return new Promise((resolve) => {
    // Simular delay do Google
    setTimeout(() => {
      const mockUser = {
        uid: 'mock-google-uid-123',
        email: 'teste@google.com',
        name: 'Usuário Teste',
        photo_url: 'https://via.placeholder.com/150'
      };
      resolve(mockUser);
    }, 1000);
  });
};
```

## 2. Atualizar Login.jsx

```javascript
import { mockGoogleLogin } from '../utils/mockGoogleAuth';

const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    setError('');
    
    // Simular popup do Google
    const user = await mockGoogleLogin();
    
    // Enviar para o backend
    const response = await fetch('http://localhost:3000/api/v1/auth/mock_google_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.name,
        photo_url: user.photo_url
      })
    });
    
    const data = await response.json();
    if (data.success) {
      navigate('/', { replace: true });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    setError('Erro ao fazer login com Google');
  } finally {
    setLoading(false);
  }
};
```

## 3. Backend endpoint

```ruby
# app/controllers/api/v1/auth_controller.rb
def mock_google_login
  user_data = params.permit(:uid, :email, :name, :photo_url)
  
  user = User.find_or_create_by(uid: user_data[:uid]) do |u|
    u.email = user_data[:email]
    u.first_name = user_data[:name]&.split(' ')&.first
    u.last_name = user_data[:name]&.split(' ')&.last || ''
    u.provider = 'google'
    u.password = Devise.friendly_token[0, 20]
  end
  
  render json: {
    success: true,
    user: user_data(user),
    token: generate_token(user)
  }
end
```

## Vantagens do Mock

- 🚀 **Setup instantâneo**
- 💻 **Funciona offline**
- 🧪 **Ideal para testes**
- 🔧 **Fácil de customizar** 