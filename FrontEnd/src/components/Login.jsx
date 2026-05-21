import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2, Search } from 'lucide-react';

const GRADIENT = 'linear-gradient(to right, #5B7A9E, #6B8FA3)';
const GRADIENT_HOVER = 'linear-gradient(to right, #4A5C7A, #5B7A9E)';

function PasswordInput({ id, value, onChange, placeholder, autoComplete, required, testId }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3] pr-12"
        required={required}
        data-testid={testId}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

function SubmitButton({ isLoading, label, loadingLabel, testId }) {
  return (
    <Button
      type="submit"
      data-testid={testId}
      className="w-full text-white h-11 text-base md:text-sm font-medium shadow-sm min-h-[48px] md:min-h-[44px] touch-manipulation"
      disabled={isLoading}
      style={{ WebkitTapHighlightColor: 'transparent', background: GRADIENT }}
      onMouseEnter={(e) => { e.currentTarget.style.background = GRADIENT_HOVER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = GRADIENT; }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 animate-spin" />
          {loadingLabel}
        </>
      ) : label}
    </Button>
  );
}

export function Login() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialMode = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [googleError] = useState(searchParams.get('google_error') === '1');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regAccountName, setRegAccountName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regDocument, setRegDocument] = useState('');
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false);
  const cnpjLookupTimer = useRef(null);

  const { loginSimple, register, loginWithGoogle, error } = useAuth();

  useEffect(() => {
    document.title = mode === 'register' ? 'Criar conta - Orbi' : 'Login - Orbi';
    document.body.setAttribute('data-page', mode);
    return () => document.body.removeAttribute('data-page');
  }, [mode]);

  const switchMode = (newMode) => {
    setLocalError(null);
    setForgotSent(false);
    setMode(newMode);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    try {
      await apiService.requestPasswordReset(forgotEmail);
    } catch {
      // Silently ignore — never reveal whether email exists
    } finally {
      setIsLoading(false);
      setForgotSent(true);
    }
  };

  const formatDocument = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const handleDocumentChange = (e) => {
    const formatted = formatDocument(e.target.value);
    setRegDocument(formatted);

    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      clearTimeout(cnpjLookupTimer.current);
      cnpjLookupTimer.current = setTimeout(async () => {
        setCnpjLookupLoading(true);
        try {
          const data = await apiService.lookupCnpj(digits);
          const name = data.nome_fantasia || data.razao_social || '';
          if (name && !regAccountName) setRegAccountName(name);
        } catch {
          // CNPJ inválido ou não encontrado — não bloquear
        } finally {
          setCnpjLookupLoading(false);
        }
      }, 600);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    try {
      const result = await loginSimple(email, password);
      if (!result.success) setLocalError(result.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (regPassword !== regPasswordConfirm) {
      setLocalError('As senhas não coincidem');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        name: regName,
        accountName: regAccountName || regName,
        email: regEmail,
        password: regPassword,
        document: regDocument || undefined,
      });
      if (!result.success) setLocalError(result.error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error || (googleError ? 'Não foi possível autenticar com Google. Tente novamente.' : null);

  const cardStyle = {
    width: '100%',
    padding: '32px',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  };

  const linkStyle = { color: '#6B8FA3', WebkitTapHighlightColor: 'transparent', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      data-testid="login-page"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(135deg, #5B7A9E 0%, #6B8FA3 25%, #7A9D96 50%, #5B7A9E 75%, #6B8FA3 100%)',
      }}
    >
      <div className="absolute top-6 left-6 z-10">
        <div className="text-white font-bold text-xl">Orbi</div>
      </div>

      <div className="z-10 mx-auto" style={{ width: '460px', maxWidth: 'calc(100vw - 32px)' }}>
        <div className="bg-white" style={cardStyle}>

          {displayError && (
            <div className="mb-5">
              <Alert variant="destructive">
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            </div>
          )}

          {mode === 'forgot' ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Recuperar senha</h1>
                <p className="text-sm text-gray-500 mt-1">Informe seu email para receber as instruções</p>
              </div>

              {forgotSent ? (
                <div className="text-center space-y-5">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    Se este email estiver cadastrado, você receberá as instruções de recuperação em breve.
                  </p>
                  <button type="button" style={{ ...linkStyle, fontSize: 14 }} onClick={() => switchMode('login')}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#5B7A9E'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B8FA3'; }}
                  >
                    ← Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                      required
                      autoComplete="email"
                      autoCapitalize="none"
                      inputMode="email"
                    />
                  </div>
                  <SubmitButton isLoading={isLoading} label="Enviar instruções" loadingLabel="Enviando..." />
                  <div className="text-center">
                    <button type="button" style={{ ...linkStyle, fontSize: 13 }} onClick={() => switchMode('login')}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#5B7A9E'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6B8FA3'; }}
                    >
                      ← Voltar ao login
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : mode === 'login' ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Acesse sua conta</h1>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                    required
                    data-testid="email-input"
                    autoComplete="email"
                    autoCapitalize="none"
                    inputMode="email"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                    <button type="button" style={{ ...linkStyle, fontSize: 13 }} onClick={() => switchMode('forgot')}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#5B7A9E'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6B8FA3'; }}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    testId="password-input"
                  />
                </div>

                <SubmitButton isLoading={isLoading} label="Entrar" loadingLabel="Entrando..." testId="login-button" />
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 h-11 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Novo no Orbi?{' '}
                  <button type="button" style={linkStyle} onClick={() => switchMode('register')}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#5B7A9E'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B8FA3'; }}
                  >
                    Crie uma conta
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Criar conta</h1>
                <p className="text-sm text-gray-500 mt-1">Comece a usar o Orbi gratuitamente</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="reg-document" className="block text-sm font-medium text-gray-700 mb-1.5">
                    CPF ou CNPJ <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="reg-document"
                      type="text"
                      value={regDocument}
                      onChange={handleDocumentChange}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3] pr-10"
                      autoComplete="off"
                      inputMode="numeric"
                    />
                    {cnpjLookupLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-account-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome do estabelecimento
                  </label>
                  <Input
                    id="reg-account-name"
                    type="text"
                    value={regAccountName}
                    onChange={(e) => setRegAccountName(e.target.value)}
                    placeholder="Ex: Consultório Dra. Ana Silva"
                    className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                    required
                    autoComplete="organization"
                  />
                </div>

                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Seu nome completo
                  </label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                    required
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-11 text-base md:text-sm border-gray-300 focus:border-[#6B8FA3] focus:ring-[#6B8FA3]"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    inputMode="email"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <PasswordInput
                    id="reg-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                    testId="reg-password-input"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmar senha
                  </label>
                  <PasswordInput
                    id="reg-password-confirm"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                    testId="reg-password-confirm-input"
                  />
                </div>

                <div className="pt-1">
                  <SubmitButton isLoading={isLoading} label="Criar conta" loadingLabel="Criando conta..." testId="register-button" />
                </div>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400">ou</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 h-11 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Criar conta com Google
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <button type="button" style={linkStyle} onClick={() => switchMode('login')}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#5B7A9E'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6B8FA3'; }}
                  >
                    Faça login
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10">
        <p className="text-white/80 text-xs">© Orbi Privacidade e termos</p>
      </div>
    </div>
  );
}
