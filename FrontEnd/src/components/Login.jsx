import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { COACHING_ONLY } from '../config/featureFlags';

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const GOOGLE_SVG = (
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2a10.3 10.3 0 0 0-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export function Login() {
  const searchParams = new URLSearchParams(window.location.search);
  const googleError = searchParams.get('google_error') === '1';
  const googleErrorDetail = searchParams.get('detail');

  const [isLoading, setIsLoading] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devError, setDevError] = useState(null);
  const { loginWithGoogle, devLogin, error } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    setDevError(null);
    setIsLoading(true);
    const result = await devLogin(devEmail);
    if (!result.success) setDevError(result.error || 'Usuário não encontrado');
    setIsLoading(false);
  };

  const displayError = error || (googleError
    ? `Não foi possível autenticar com Google.${googleErrorDetail ? ` (${googleErrorDetail})` : ' Tente novamente.'}`
    : null);

  return (
    <div
      data-testid="login-page"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(145deg, #4a6f8a 0%, #5f8a85 40%, #6b9a8f 70%, #4a6f8a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background circles */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/orbi-logo.png" width={30} height={30} alt="Orbi" />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>Orbi</span>
        </a>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '48px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
      }}>

        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #5B7A9E, #7A9D96)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(91,122,158,0.35)',
        }}>
          {COACHING_ONLY ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5a6 6 0 1 0 11 0 6 6 0 0 0-11 0"/>
              <path d="M6 17.5 5 22l7-3 7 3-1-4.5"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          )}
        </div>

        <h1 style={{
          fontSize: '24px', fontWeight: 700, color: '#111827',
          margin: '0 0 8px', textAlign: 'center', lineHeight: 1.2,
        }}>
          {COACHING_ONLY ? 'Crie sua conta grátis' : 'Bem-vindo ao Orbi'}
        </h1>
        <p style={{
          fontSize: '14px', color: '#6B7280',
          margin: '0 0 32px', textAlign: 'center', lineHeight: 1.5,
        }}>
          {COACHING_ONLY
            ? '14 dias grátis · sem cartão de crédito'
            : 'Gerencie seu negócio em um só lugar'}
        </p>

        {displayError && (
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <Alert variant="destructive">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          data-testid="google-login-button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            height: '48px',
            border: '1.5px solid #E5E7EB',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            color: '#374151',
            fontSize: '15px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.65 : 1,
            transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#E5E7EB';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isLoading ? (
            <Loader2 style={{ width: '20px', height: '20px', color: '#9CA3AF', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              {GOOGLE_SVG}
              Continuar com Google
            </>
          )}
        </button>

        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '20px', textAlign: 'center', lineHeight: 1.5 }}>
          Ao entrar, você concorda com nossos{' '}
          <a href="/termos-de-uso" style={{ color: '#6B7280', textDecoration: 'underline' }}>Termos</a>
          {' '}e{' '}
          <a href="/politica-de-privacidade" style={{ color: '#6B7280', textDecoration: 'underline' }}>Privacidade</a>
        </p>

        {IS_LOCAL && (
          <form onSubmit={handleDevLogin} style={{ width: '100%', marginTop: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
            }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                DEV · login local
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>

            {devError && (
              <div style={{ marginBottom: '12px' }}>
                <Alert variant="destructive">
                  <AlertDescription>{devError}</AlertDescription>
                </Alert>
              </div>
            )}

            <input
              type="email"
              placeholder="E-mail do usuário"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              required
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                border: '1.5px solid #E5E7EB', padding: '0 12px',
                fontSize: '14px', color: '#111827', outline: 'none',
                marginBottom: '12px', boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                background: '#374151', color: '#fff', border: 'none',
                fontSize: '14px', fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.65 : 1,
              }}
            >
              {isLoading ? <Loader2 style={{ width: '18px', height: '18px', margin: '0 auto', animation: 'spin 1s linear infinite' }} /> : 'Entrar'}
            </button>
          </form>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '24px', zIndex: 10 }}>
        © {new Date().getFullYear()} Orbi
      </p>
    </div>
  );
}
