import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

export function Profile() {
  const isMobile = useIsMobile()
  const { user: authUser, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })

  useEffect(() => {
    if (isAuthenticated && authUser) {
      loadUserProfile()
    }
  }, [isAuthenticated, authUser])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getCurrentUser()
      if (response.user) {
        setFormData({
          name: response.user.name || response.user.first_name || '',
          email: response.user.email || '',
          phone: response.user.phone || response.user.phone_number || '',
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Erro ao carregar perfil')
      toast.error('Erro ao carregar informações do perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar mensagens de sucesso/erro ao editar
    if (success) setSuccess(false)
    if (error) setError(null)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Validar campos obrigatórios
      if (!formData.name.trim()) {
        setError('Nome é obrigatório')
        toast.error('Nome é obrigatório')
        return
      }

      if (!formData.email.trim()) {
        setError('Email é obrigatório')
        toast.error('Email é obrigatório')
        return
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Email inválido')
        toast.error('Email inválido')
        return
      }

      // Se há senha nova, validar
      if (formData.new_password) {
        if (!formData.current_password) {
          setError('Senha atual é obrigatória para alterar a senha')
          toast.error('Senha atual é obrigatória para alterar a senha')
          return
        }

        if (formData.new_password.length < 6) {
          setError('A nova senha deve ter pelo menos 6 caracteres')
          toast.error('A nova senha deve ter pelo menos 6 caracteres')
          return
        }

        if (formData.new_password !== formData.new_password_confirmation) {
          setError('As senhas não coincidem')
          toast.error('As senhas não coincidem')
          return
        }
      }

      // Preparar dados para atualização
      const updateData = {
        name: formData.name,
        email: formData.email,
      }

      if (formData.phone) {
        updateData.phone = formData.phone
      }

      // Adicionar senhas se fornecidas
      if (formData.new_password) {
        updateData.current_password = formData.current_password
        updateData.password = formData.new_password
        updateData.password_confirmation = formData.new_password_confirmation
      }

      // Atualizar perfil
      const userId = authUser?.id
      if (!userId) {
        throw new Error('ID do usuário não encontrado')
      }

      await apiService.updateUser(userId, updateData)
      
      setSuccess(true)
      toast.success('Perfil atualizado com sucesso!')
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      }))

      // Recarregar perfil para obter dados atualizados
      await loadUserProfile()

    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error.message || error.data?.error || 'Erro ao atualizar perfil'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">Perfil atualizado com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-xl sm:text-2xl">
                {getInitials(formData.name || authUser?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">
                {formData.name || authUser?.name || 'Usuário'}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1">
                {formData.email || authUser?.email || 'user@example.com'}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  Premium
                </Badge>
                {authUser?.admin && (
                  <Badge variant="outline" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Informações Pessoais
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Alterar Senha */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Alterar Senha
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Deixe em branco se não desejar alterar a senha
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_password">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  name="current_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.current_password}
                  onChange={handleInputChange}
                  placeholder="Digite sua senha atual"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    name="new_password"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.new_password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password_confirmation">Confirmar Nova Senha</Label>
                <Input
                  id="new_password_confirmation"
                  name="new_password_confirmation"
                  type="password"
                  value={formData.new_password_confirmation}
                  onChange={handleInputChange}
                  placeholder="Confirme a nova senha"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

