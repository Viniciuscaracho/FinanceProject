import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { loginSimple, error, createTestUser } = useAuth();

  // Forçar atualização do DOM quando a página de login é exibida
  // Isso ajuda o Appium Inspector a detectar a mudança de tela
  useEffect(() => {
    // Mudar o título da página
    document.title = 'Login - BarberManagement'
    
    // Adicionar atributo ao body para facilitar detecção
    document.body.setAttribute('data-page', 'login')
    document.body.setAttribute('data-testid', 'login-page-body')
    
    // Adicionar classe ao html para facilitar seleção CSS
    document.documentElement.setAttribute('data-page', 'login')
    
    // Forçar scroll para o topo
    window.scrollTo(0, 0)
    
    // Forçar um pequeno delay para garantir que o DOM foi atualizado
    // Isso ajuda o Appium Inspector a detectar a mudança
    const timeout = setTimeout(() => {
      // Disparar um evento customizado para notificar mudança de página
      window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: 'login' } }))
    }, 100)
    
    return () => {
      // Cleanup ao desmontar
      clearTimeout(timeout)
      document.body.removeAttribute('data-page')
      document.body.removeAttribute('data-testid')
      document.documentElement.removeAttribute('data-page')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await loginSimple(email, password);
      
      if (!result.success) {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestUser = async () => {
    setIsLoading(true);
    try {
      const testUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Usuário Teste',
        account_name: 'Conta Teste'
      };
      
      const result = await createTestUser(testUserData);
      if (result.success) {
        setEmail(testUserData.email);
        setPassword(testUserData.password);
      }
    } catch (error) {
      console.error('Create test user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 safe-area-inset relative overflow-hidden"
      data-testid="login-page"
      data-page="login"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(135deg, #5B7A9E 0%, #6B8FA3 25%, #7A9D96 50%, #5B7A9E 75%, #6B8FA3 100%)',
      }}
    >
      {/* Logo no topo esquerdo */}
      <div className="absolute top-6 left-6 z-10">
        <div className="text-white font-bold text-xl">BarberManagement</div>
      </div>

      <div 
        className="z-10 mx-auto"
        style={{ width: '460px', maxWidth: 'calc(100vw - 32px)' }}
      >
        <div 
          className="bg-white"
          style={{
            width: '100%',
            padding: '32px',
            borderRadius: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Acesse sua conta
            </h1>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                  required
                  data-testid="email-input"
                  name="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <a 
                  href="#" 
                  className="text-sm font-medium"
                  style={{ color: '#6B8FA3' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#5B7A9E'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6B8FA3'}
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implementar recuperação de senha
                  }}
                >
                  Esqueceu sua senha?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3] pr-12"
                  required
                  data-testid="password-input"
                  name="password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 border-gray-300 rounded"
                style={{ accentColor: '#6B8FA3' }}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Lembrar de mim neste dispositivo
              </label>
            </div>

            <Button
              type="submit"
              className="w-full text-white h-11 text-base md:text-sm font-medium shadow-sm min-h-[48px] md:min-h-[44px] touch-manipulation"
              disabled={isLoading}
              data-testid="login-button"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                background: 'linear-gradient(to right, #5B7A9E, #6B8FA3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #4A5C7A, #5B7A9E)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #5B7A9E, #6B8FA3)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>

          {/* Alternative login options */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 h-11 text-base md:text-sm font-medium min-h-[48px] md:min-h-[44px] touch-manipulation"
              onClick={() => {
                // TODO: Implementar login com Google
                console.log('Login com Google')
              }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 h-11 text-base md:text-sm font-medium min-h-[48px] md:min-h-[44px] touch-manipulation"
              onClick={() => {
                // TODO: Implementar login com chave de acesso
                console.log('Login com chave de acesso')
              }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Fazer login com chave de acesso
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 h-11 text-base md:text-sm font-medium min-h-[48px] md:min-h-[44px] touch-manipulation"
              onClick={() => {
                // TODO: Implementar login com SSO
                console.log('Login com SSO')
              }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Entrar com SSO
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Novo no BarberManagement?{' '}
              <button
                type="button"
                onClick={handleCreateTestUser}
                disabled={isLoading}
                className="font-medium"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  color: '#6B8FA3'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#5B7A9E'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B8FA3'}
              >
                Crie uma conta
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 left-6 z-10">
        <p className="text-white/80 text-xs">
          © BarberManagement Privacidade e termos
        </p>
      </div>
    </div>
  );
} 