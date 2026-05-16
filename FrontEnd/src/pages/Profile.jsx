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
  EyeOff,
  Shield,
  ShieldCheck,
  ShieldOff
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseAvailable } from '../lib/supabase'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { T } from '@/lib/tokens'

export function Profile() {
  const isMobile = useIsMobile()
  const { user: authUser, isAuthenticated, enrollMfa, verifyMfa, unenrollMfa, listMfaFactors } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // MFA state
  const [mfaFactors, setMfaFactors] = useState([])
  const [mfaEnrolling, setMfaEnrolling] = useState(false)
  const [mfaQrCode, setMfaQrCode] = useState(null)
  const [mfaSecret, setMfaSecret] = useState(null)
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState(null)
  
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
      loadMfaFactors()
    }
  }, [isAuthenticated, authUser])

  const loadMfaFactors = async () => {
    const { factors } = await listMfaFactors()
    setMfaFactors(factors)
  }

  const handleMfaEnroll = async () => {
    setMfaLoading(true)
    setMfaError(null)
    const result = await enrollMfa()
    if (!result.success) {
      setMfaError(result.error)
    } else {
      setMfaQrCode(result.totp.qr_code)
      setMfaSecret(result.totp.secret)
      setMfaFactorId(result.factorId)
      setMfaEnrolling(true)
    }
    setMfaLoading(false)
  }

  const handleMfaVerify = async () => {
    setMfaLoading(true)
    setMfaError(null)
    const result = await verifyMfa(mfaFactorId, mfaCode)
    if (!result.success) {
      setMfaError(result.error)
    } else {
      toast.success('MFA ativado com sucesso!')
      setMfaEnrolling(false)
      setMfaQrCode(null)
      setMfaSecret(null)
      setMfaCode('')
      await loadMfaFactors()
    }
    setMfaLoading(false)
  }

  const handleMfaUnenroll = async (factorId) => {
    setMfaLoading(true)
    setMfaError(null)
    const result = await unenrollMfa(factorId)
    if (!result.success) {
      setMfaError(result.error)
    } else {
      toast.success('MFA desativado.')
      await loadMfaFactors()
    }
    setMfaLoading(false)
  }

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      
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
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)

      if (!formData.name.trim()) {
        toast.error('Nome é obrigatório')
        return
      }

      if (!formData.email.trim()) {
        toast.error('Email é obrigatório')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Email inválido')
        return
      }

      if (formData.new_password) {
        if (!formData.current_password) {
          toast.error('Senha atual é obrigatória para alterar a senha')
          return
        }

        if (formData.new_password.length < 6) {
          toast.error('A nova senha deve ter pelo menos 6 caracteres')
          return
        }

        if (formData.new_password !== formData.new_password_confirmation) {
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
      const errorMessage = error.message || error.data?.error || 'Erro ao atualizar perfil'
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
    <div className="space-y-3 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações da conta
        </p>
      </div>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User className="h-4 w-4" style={{ color: T.brand }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Informações Pessoais</p>
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
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Lock className="h-4 w-4" style={{ color: T.brand }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Alterar Senha</p>
              </div>
              <p className="text-sm text-muted-foreground">
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

      {/* MFA / Segurança */}
      {isSupabaseAvailable && (
        <Card>
          <CardHeader className="pb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield className="h-4 w-4" style={{ color: T.brand }} />
              </div>
              <div>
                <CardTitle>Autenticação em duas etapas (MFA)</CardTitle>
                <CardDescription style={{ margin: 0 }}>Adicione uma camada extra de segurança usando um app autenticador.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {mfaError}
              </div>
            )}

            {mfaFactors.length > 0 ? (
              <div className="space-y-3">
                {mfaFactors.map(factor => (
                  <div key={factor.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">MFA ativo — {factor.friendly_name || 'TOTP'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMfaUnenroll(factor.id)}
                      disabled={mfaLoading}
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      {mfaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldOff className="h-4 w-4 mr-1" />Desativar</>}
                    </Button>
                  </div>
                ))}
              </div>
            ) : !mfaEnrolling ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                <div className="flex items-center gap-2 text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">MFA não configurado</span>
                </div>
                <Button size="sm" onClick={handleMfaEnroll} disabled={mfaLoading}>
                  {mfaLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Ativar MFA
                </Button>
              </div>
            ) : null}

            {mfaEnrolling && mfaQrCode && (
              <div className="space-y-4 p-4 border border-border rounded-md">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR code com seu app autenticador, depois insira o código de 6 dígitos para confirmar.
                </p>
                <div className="flex justify-center">
                  <img src={mfaQrCode} alt="QR Code MFA" className="w-48 h-48 border rounded-md" />
                </div>
                {mfaSecret && (
                  <p className="text-xs text-center text-muted-foreground font-mono break-all">
                    Chave manual: {mfaSecret}
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="tracking-widest text-center text-lg"
                  />
                  <Button onClick={handleMfaVerify} disabled={mfaCode.length !== 6 || mfaLoading}>
                    {mfaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                  </Button>
                  <Button variant="outline" onClick={() => { setMfaEnrolling(false); setMfaQrCode(null); setMfaCode('') }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

