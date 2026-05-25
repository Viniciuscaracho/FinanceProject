import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate(`/login?google_error=1&detail=${encodeURIComponent(error || 'no_token')}`, { replace: true });
      return;
    }

    loginWithToken(token).then(result => {
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        navigate('/login?google_error=1', { replace: true });
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ background: 'linear-gradient(135deg, #5B7A9E 0%, #6B8FA3 25%, #7A9D96 50%, #5B7A9E 75%, #6B8FA3 100%)' }}>
      <Loader2 className="w-8 h-8 animate-spin text-white" />
      <p className="text-white/80 text-sm">Finalizando login com Google...</p>
    </div>
  );
}
