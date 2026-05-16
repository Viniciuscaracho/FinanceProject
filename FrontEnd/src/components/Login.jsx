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
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

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

  const { loginSimple, register, error } = useAuth();

  useEffect(() => {
    document.title = mode === 'register' ? 'Criar conta - Orbi' : 'Login - Orbi';
    document.body.setAttribute('data-page', mode);
    return () => document.body.removeAttribute('data-page');
  }, [mode]);

  const switchMode = (newMode) => {
    setLocalError(null);
    setMode(newMode);
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

  const displayError = localError || error;

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

          {mode === 'login' ? (
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

              <div className="mt-8 text-center">
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

              <div className="mt-6 text-center">
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
