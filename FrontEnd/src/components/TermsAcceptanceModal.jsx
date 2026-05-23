import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function TermsAcceptanceModal() {
  const { acceptTerms, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await acceptTerms();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Termos de Uso e Privacidade</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para continuar usando o Orbi, leia e aceite nossos termos.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto space-y-3">
          <p>
            Ao usar o Orbi, você concorda com a coleta e uso dos seus dados para fornecer e melhorar
            nossos serviços, conforme descrito em nossa Política de Privacidade.
          </p>
          <p>
            Seus dados são armazenados com segurança e nunca são vendidos a terceiros.
            Você pode solicitar a exclusão da sua conta e dados a qualquer momento.
          </p>
          <p>
            O uso indevido da plataforma, como spam ou atividades ilegais, pode resultar
            na suspensão da conta.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading ? 'Salvando...' : 'Aceitar e continuar'}
          </button>
          <button
            onClick={logout}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
