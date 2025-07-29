import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('simple'); // 'simple' or 'full'
  
  const { login, loginSimple, error, createTestUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginFunction = loginType === 'simple' ? loginSimple : login;
      const result = await loginFunction(email, password);
      
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Bem-vindo ao Procfy
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Faça login para acessar sua conta
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2 mb-4">
              <Button
                type="button"
                variant={loginType === 'simple' ? 'default' : 'outline'}
                onClick={() => setLoginType('simple')}
                className="flex-1"
              >
                Login Simples
              </Button>
              <Button
                type="button"
                variant={loginType === 'full' ? 'default' : 'outline'}
                onClick={() => setLoginType('full')}
                className="flex-1"
              >
                Login Completo
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateTestUser}
                disabled={isLoading}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Criar Usuário Teste
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>
                {loginType === 'simple' 
                  ? 'Login simples para desenvolvimento'
                  : 'Login completo com todas as funcionalidades'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 