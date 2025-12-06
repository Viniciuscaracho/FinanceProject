import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Shield, X } from 'lucide-react'
import { toast } from 'sonner'

export function SupportBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth()

  if (!isImpersonating) {
    return null
  }

  const handleStopImpersonating = async () => {
    const result = await stopImpersonating()
    if (result.success) {
      toast.success('Voltou ao seu perfil de administrador')
      // Recarregar a página para garantir que tudo está atualizado
      window.location.href = '/admin'
    } else {
      toast.error(result.error || 'Erro ao sair do modo de suporte')
    }
  }

  return (
    <div className="bg-yellow-500 dark:bg-yellow-600 border-b border-yellow-600 dark:border-yellow-700 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            Modo de Suporte Ativo - Visualizando como: {user?.name || user?.email}
          </span>
        </div>
        <Button
          onClick={handleStopImpersonating}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-600 dark:hover:bg-yellow-700"
        >
          <X className="h-4 w-4 mr-1" />
          Sair do Suporte
        </Button>
      </div>
    </div>
  )
}

