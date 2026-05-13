import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Globe,
  Eye,
  ExternalLink,
  Camera,
  X
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function CompanySettings() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [coverUrl, setCoverUrl] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Verificar se o usuário é admin da conta
  const isAccountAdmin = user?.account_admin || user?.account_owner || false

  const [formData, setFormData] = useState({
    // Informações da empresa
    company: {
      id: null,
      name: '',
      screen_name_natural: '',
      name_natural: '',
      document_1: '',
      document_1_natural: '',
      document_2: '',
      email: '',
      phone_number: '',
      description: '',
      addresses: [{
        country: '',
        state: '',
        city: '',
        address_line1: '',
        address_line2: '',
        district: '',
        postcode: ''
      }]
    },
    // Configurações da conta
    default_currency: 'BRL',
    country_code: 'BR',
    invoice_number_starts_at: 1,
    invoice_due_days: 30,
    invoice_tax_percentage: 0,
    invoice_tax_already_applied: false,
    // Vitrine pública
    directory_visible: false,
    profession_category: '',
    directory_description: '',
  })

  useEffect(() => {
    // Verificar permissões
    if (!isAccountAdmin) {
      toast.error('Você não tem permissão para acessar esta página')
      navigate('/')
      return
    }

    loadAccountSettings()
  }, [isAccountAdmin, navigate])

  const loadAccountSettings = async () => {
    try {
      setLoading(true)
      
      const response = await apiService.getAccountSettings()
      if (response.account) {
        const account = response.account
        setFormData({
          company: {
            id: account.company?.id || null,
            name: account.company?.name || '',
            screen_name_natural: account.company?.screen_name || '',
            name_natural: account.company?.name_natural || '',
            document_1: account.company?.document_1 || '',
            document_1_natural: account.company?.document_1_natural || '',
            document_2: account.company?.document_2 || '',
            email: account.company?.email || '',
            phone_number: account.company?.phone_number || '',
            description: account.company?.description || '',
            addresses: account.company?.addresses && account.company.addresses.length > 0
              ? account.company.addresses
              : [{
                  country: '',
                  state: '',
                  city: '',
                  address_line1: '',
                  address_line2: '',
                  district: '',
                  postcode: ''
                }]
          },
          default_currency: account.default_currency || 'BRL',
          country_code: account.country_code || 'BR',
          invoice_number_starts_at: account.invoice_number_starts_at || 1,
          invoice_due_days: account.invoice_due_days || 30,
          invoice_tax_percentage: account.invoice_tax_percentage || 0,
          invoice_tax_already_applied: account.invoice_tax_already_applied || false,
          directory_visible: account.directory_visible || false,
          profession_category: account.profession_category || '',
          directory_description: account.directory_description || '',
        })
        setLogoUrl(account.company?.logo_url || null)
        setCoverUrl(account.company?.cover_url || null)
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações da empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e, section = null, field = null) => {
    const { name, value, type, checked } = e.target

    if (section === 'company') {
      if (field === 'address') {
        const addressIndex = parseInt(name.split('_')[0])
        const addressField = name.split('_').slice(1).join('_')
        setFormData(prev => ({
          ...prev,
          company: {
            ...prev.company,
            addresses: prev.company.addresses.map((addr, idx) =>
              idx === addressIndex ? { ...addr, [addressField]: value } : addr
            )
          }
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          company: {
            ...prev.company,
            [name]: value
          }
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      if (!formData.company.name.trim()) {
        toast.error('Nome da empresa é obrigatório')
        return
      }

      // Preparar dados para atualização
      const updateData = {
        default_currency: formData.default_currency,
        country_code: formData.country_code,
        invoice_number_starts_at: parseInt(formData.invoice_number_starts_at) || 1,
        invoice_due_days: parseInt(formData.invoice_due_days) || 30,
        invoice_tax_percentage: parseFloat(formData.invoice_tax_percentage) || 0,
        invoice_tax_already_applied: formData.invoice_tax_already_applied,
        directory_visible: formData.directory_visible,
        profession_category: formData.profession_category,
        directory_description: formData.directory_description,
        company_attributes: {
          ...(formData.company.id ? { id: formData.company.id } : {}),
          name: formData.company.name,
          screen_name_natural: formData.company.screen_name_natural,
          name_natural: formData.company.name_natural,
          document_1: formData.company.document_1,
          document_1_natural: formData.company.document_1_natural,
          document_2: formData.company.document_2,
          email: formData.company.email,
          phone_number: formData.company.phone_number,
          description: formData.company.description,
          addresses_attributes: formData.company.addresses.map(addr => ({
            ...(addr.id ? { id: addr.id } : {}),
            country: addr.country,
            state: addr.state,
            city: addr.city,
            address_line1: addr.address_line1,
            address_line2: addr.address_line2,
            district: addr.district,
            postcode: addr.postcode
          }))
        }
      }

      await apiService.updateAccountSettings(updateData)
      
      toast.success('Configurações da empresa atualizadas com sucesso!')

      // Recarregar configurações para obter dados atualizados
      await loadAccountSettings()

    } catch (error) {
      const errorMessage = error.message || error.data?.error || 'Erro ao atualizar configurações da empresa'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }
    try {
      setUploadingLogo(true)
      const preview = URL.createObjectURL(file)
      setLogoUrl(preview)
      const res = await apiService.uploadCompanyLogo(file)
      if (res.logo_url) setLogoUrl(res.logo_url)
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao enviar foto')
      setLogoUrl(null)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB')
      return
    }
    try {
      setUploadingCover(true)
      const preview = URL.createObjectURL(file)
      setCoverUrl(preview)
      const res = await apiService.uploadCompanyCover(file)
      if (res.cover_url) setCoverUrl(res.cover_url)
      toast.success('Capa atualizada!')
    } catch {
      toast.error('Erro ao enviar capa')
      setCoverUrl(null)
    } finally {
      setUploadingCover(false)
    }
  }

  if (!isAccountAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Configurações da Empresa
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e configurações da sua empresa
        </p>
      </div>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Dados cadastrais e informações de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                name="name"
                value={formData.company.name}
                onChange={(e) => handleInputChange(e, 'company')}
                placeholder="Nome da empresa"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_document_1">CNPJ/CPF</Label>
              <Input
                id="company_document_1"
                name="document_1"
                value={formData.company.document_1}
                onChange={(e) => handleInputChange(e, 'company')}
                placeholder="00.000.000/0000-00"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="company_email"
                  name="email"
                  type="email"
                  value={formData.company.email}
                  onChange={(e) => handleInputChange(e, 'company')}
                  placeholder="empresa@exemplo.com"
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="company_phone"
                  name="phone_number"
                  value={formData.company.phone_number}
                  onChange={(e) => handleInputChange(e, 'company')}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_description">Descrição</Label>
            <textarea
              id="company_description"
              name="description"
              value={formData.company.description}
              onChange={(e) => handleInputChange(e, 'company')}
              placeholder="Descrição da empresa"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Endereço
          </CardTitle>
          <CardDescription>
            Informações de localização da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.company.addresses.map((address, index) => (
            <div key={index} className="space-y-4 p-4 border border-border rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_address_line1`}>Endereço</Label>
                  <Input
                    id={`address_${index}_address_line1`}
                    name={`${index}_address_line1`}
                    value={address.address_line1}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="Rua, Avenida, etc."
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_address_line2`}>Complemento</Label>
                  <Input
                    id={`address_${index}_address_line2`}
                    name={`${index}_address_line2`}
                    value={address.address_line2}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="Apto, Sala, etc."
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_city`}>Cidade</Label>
                  <Input
                    id={`address_${index}_city`}
                    name={`${index}_city`}
                    value={address.city}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="Cidade"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_state`}>Estado</Label>
                  <Input
                    id={`address_${index}_state`}
                    name={`${index}_state`}
                    value={address.state}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="Estado"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_postcode`}>CEP</Label>
                  <Input
                    id={`address_${index}_postcode`}
                    name={`${index}_postcode`}
                    value={address.postcode}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="00000-000"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`address_${index}_country`}>País</Label>
                  <Input
                    id={`address_${index}_country`}
                    name={`${index}_country`}
                    value={address.country}
                    onChange={(e) => handleInputChange(e, 'company', 'address')}
                    placeholder="Brasil"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configurações Financeiras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Configurações Financeiras
          </CardTitle>
          <CardDescription>
            Configurações relacionadas a faturas e pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_currency">Moeda Padrão</Label>
              <select
                id="default_currency"
                name="default_currency"
                value={formData.default_currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="BRL">R$ (Real Brasileiro)</option>
                <option value="USD">$ (Dólar Americano)</option>
                <option value="EUR">€ (Euro)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Código do País</Label>
              <Input
                id="country_code"
                name="country_code"
                value={formData.country_code}
                onChange={handleInputChange}
                placeholder="BR"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number_starts_at">Número Inicial da Fatura</Label>
              <Input
                id="invoice_number_starts_at"
                name="invoice_number_starts_at"
                type="number"
                value={formData.invoice_number_starts_at}
                onChange={handleInputChange}
                min="1"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_due_days">Dias para Vencimento</Label>
              <Input
                id="invoice_due_days"
                name="invoice_due_days"
                type="number"
                value={formData.invoice_due_days}
                onChange={handleInputChange}
                min="1"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_tax_percentage">Percentual de Imposto (%)</Label>
              <Input
                id="invoice_tax_percentage"
                name="invoice_tax_percentage"
                type="number"
                step="0.01"
                value={formData.invoice_tax_percentage}
                onChange={handleInputChange}
                min="0"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="invoice_tax_already_applied"
              name="invoice_tax_already_applied"
              checked={formData.invoice_tax_already_applied}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="invoice_tax_already_applied" className="cursor-pointer">
              Imposto já aplicado nos valores
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Vitrine Pública */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2 text-emerald-600" />
            Vitrine Pública
          </CardTitle>
          <CardDescription>
            Apareça no Descobrir — nosso diretório público de profissionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
            <input
              type="checkbox"
              id="directory_visible"
              name="directory_visible"
              checked={formData.directory_visible}
              onChange={handleInputChange}
              className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <Label htmlFor="directory_visible" className="cursor-pointer font-medium text-emerald-900 dark:text-emerald-100">
                Aparecer no Descobrir
              </Label>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Seu perfil ficará visível para qualquer pessoa que buscar no diretório público
              </p>
              {formData.directory_visible && (
                <a
                  href="/descobrir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver vitrine pública
                </a>
              )}
            </div>
          </div>

          {formData.directory_visible && (
            <>
              {/* Logo / Foto de perfil */}
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div style={{
                      width: 72, height: 72, borderRadius: 12,
                      background: logoUrl ? 'transparent' : '#EEF2FA',
                      border: '2px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={() => setLogoUrl(null)}
                        />
                      ) : (
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#4C60AA' }}>
                          {(formData.company.screen_name_natural || formData.company.name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {uploadingLogo && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={18} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="logo-upload" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4C60AA', background: '#EEF2FA', border: 'none', borderRadius: 8, padding: '7px 14px' }}>
                      <Camera size={14} />
                      {logoUrl ? 'Trocar foto' : 'Adicionar foto'}
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-gray-500 mt-1.5">JPG, PNG ou WebP · max 5MB</p>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="text-xs text-red-500 hover:underline mt-1 flex items-center gap-1"
                      >
                        <X size={11} /> Remover foto
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Aparece no seu card e perfil público no Descobrir.</p>
              </div>

              {/* Capa / Cover photo */}
              <div className="space-y-2">
                <Label>Foto de capa</Label>
                <div className="space-y-2">
                  <div className="relative w-full" style={{ height: 120, borderRadius: 12, overflow: 'hidden', border: '2px dashed var(--border)', background: coverUrl ? 'transparent' : 'linear-gradient(135deg, #1E2440, #4C60AA)' }}>
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt="Capa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setCoverUrl(null)}
                      />
                    )}
                    {!coverUrl && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        Pré-visualização da capa
                      </div>
                    )}
                    {uploadingCover && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={22} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="cover-upload" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4C60AA', background: '#EEF2FA', border: 'none', borderRadius: 8, padding: '7px 14px' }}>
                      <Camera size={14} />
                      {coverUrl ? 'Trocar capa' : 'Adicionar capa'}
                    </label>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCoverUpload}
                    />
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={() => setCoverUrl(null)}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1"
                      >
                        <X size={11} /> Remover capa
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Imagem horizontal · JPG, PNG ou WebP · max 10MB · aparece no topo do seu perfil público.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_screen_name">
                  Nome de exibição na vitrine
                </Label>
                <Input
                  id="company_screen_name"
                  name="screen_name_natural"
                  value={formData.company.screen_name_natural}
                  onChange={(e) => handleInputChange(e, 'company')}
                  placeholder={formData.company.name || 'Ex: Dr. João Silva Psicólogo'}
                  className="w-full sm:max-w-sm"
                />
                <p className="text-xs text-gray-500">
                  Como seu perfil aparece no Descobrir. Se vazio, usa o nome da empresa.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession_category">Categoria profissional</Label>
                <select
                  id="profession_category"
                  name="profession_category"
                  value={formData.profession_category}
                  onChange={handleInputChange}
                  className="w-full sm:max-w-xs px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {[
                    'Psicólogo', 'Advogado', 'Nutricionista', 'Personal Trainer',
                    'Barbeiro', 'Cabeleireiro', 'Dentista', 'Médico', 'Fisioterapeuta',
                    'Professor', 'Coach', 'Terapeuta', 'Contador', 'Veterinário',
                    'Arquiteto', 'Designer', 'Outro',
                  ].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="directory_description">Descrição pública</Label>
                <textarea
                  id="directory_description"
                  name="directory_description"
                  value={formData.directory_description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descreva sua especialidade, forma de atendimento, diferenciais..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-gray-500">Esta descrição aparece no seu perfil público para clientes em potencial.</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-medium">Para o perfil funcionar completamente:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300">
                  <li>Preencha <strong>Cidade</strong> e <strong>Bairro</strong> no endereço acima — aparece nos filtros de localização</li>
                  <li>Crie pelo menos um <strong>Serviço</strong> — aparece no card da vitrine</li>
                  <li>Crie um <strong>Link de Agendamento</strong> ativo — habilita o botão "Agendar" no perfil público</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleSaveSettings}
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
    </div>
  )
}

