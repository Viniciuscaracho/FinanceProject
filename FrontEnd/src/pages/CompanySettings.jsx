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
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { T } from '@/lib/tokens'

export function CompanySettings() {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    pix_key: '',
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
          pix_key: account.pix_key || '',
        })
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
            [name]: value,
            // keep _natural fields in sync so the backend concern doesn't overwrite
            ...(name === 'document_1' ? { document_1_natural: value } : {}),
            ...(name === 'document_1_natural' ? { document_1: value } : {}),
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
        pix_key: formData.pix_key || null,
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

      // Invalida cache do banner de CPF/CNPJ no Layout
      qc.invalidateQueries({ queryKey: ['account-settings-doc-check'] })

      // Recarregar configurações para obter dados atualizados
      await loadAccountSettings()

    } catch (error) {
      const errorMessage = error.message || error.data?.error || 'Erro ao atualizar configurações da empresa'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
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
    <div className="space-y-3 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Configurações da Empresa
        </h1>
        <p className="text-muted-foreground">
          Gerencie as informações e configurações da sua empresa
        </p>
      </div>

      {/* Quick-jump nav */}
      <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { href: '#sec-empresa', label: 'Empresa' },
          { href: '#sec-endereco', label: 'Endereço' },
          { href: '#sec-financeiro', label: 'Financeiro' },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Informações da Empresa */}
      <Card id="sec-empresa">
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription style={{ margin: 0 }}>Dados cadastrais e informações de contato</CardDescription>
            </div>
          </div>
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
              <Label htmlFor="company_document_1">
                CNPJ/CPF
                {!formData.company.document_1 && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FEF3C7', border: '1px solid #F59E0B60', borderRadius: 6, padding: '2px 7px' }}>
                    Obrigatório
                  </span>
                )}
              </Label>
              <Input
                id="company_document_1"
                name="document_1"
                value={formData.company.document_1}
                onChange={(e) => handleInputChange(e, 'company')}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                className="w-full"
                style={!formData.company.document_1 ? { borderColor: '#F59E0B', boxShadow: '0 0 0 2px #FEF3C720' } : undefined}
              />
              {!formData.company.document_1 && (
                <p style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
                  Necessário para emissão de documentos, recibos e relatórios fiscais.
                </p>
              )}
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
      <Card id="sec-endereco">
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Endereço</CardTitle>
              <CardDescription style={{ margin: 0 }}>Informações de localização da empresa</CardDescription>
            </div>
          </div>
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
      <Card id="sec-financeiro">
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Configurações Financeiras</CardTitle>
              <CardDescription style={{ margin: 0 }}>Configurações relacionadas a faturas e pagamentos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Moeda Padrão</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { value: 'BRL', label: 'R$ Real' },
                  { value: 'USD', label: '$ Dólar' },
                  { value: 'EUR', label: '€ Euro' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, default_currency: opt.value }))}
                    style={{
                      padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                      borderColor: formData.default_currency === opt.value ? T.brand : T.border,
                      background: formData.default_currency === opt.value ? T.chip : T.white,
                      color: formData.default_currency === opt.value ? T.brand : T.text,
                      transition: 'all 150ms',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
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

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              name="pix_key"
              value={formData.pix_key}
              onChange={handleInputChange}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="w-full max-w-md"
            />
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              Exibida para pacientes na confirmação do agendamento.
            </p>
          </div>
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

