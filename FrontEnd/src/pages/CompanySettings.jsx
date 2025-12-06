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
  Globe
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
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Verificar se o usuário é admin da conta
  const isAccountAdmin = user?.account_admin || user?.account_owner || false

  const [formData, setFormData] = useState({
    // Informações da empresa
    company: {
      name: '',
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
    invoice_tax_already_applied: false
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
      setError(null)
      
      const response = await apiService.getAccountSettings()
      if (response.account) {
        const account = response.account
        setFormData({
          company: {
            name: account.company?.name || '',
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
          invoice_tax_already_applied: account.invoice_tax_already_applied || false
        })
      }
    } catch (error) {
      console.error('Error loading account settings:', error)
      setError('Erro ao carregar configurações da empresa')
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

    // Limpar mensagens de sucesso/erro ao editar
    if (success) setSuccess(false)
    if (error) setError(null)
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Validar campos obrigatórios
      if (!formData.company.name.trim()) {
        setError('Nome da empresa é obrigatório')
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
        company_attributes: {
          name: formData.company.name,
          name_natural: formData.company.name_natural,
          document_1: formData.company.document_1,
          document_1_natural: formData.company.document_1_natural,
          document_2: formData.company.document_2,
          email: formData.company.email,
          phone_number: formData.company.phone_number,
          description: formData.company.description,
          addresses_attributes: formData.company.addresses.map((addr, idx) => ({
            id: addr.id || null,
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
      
      setSuccess(true)
      toast.success('Configurações da empresa atualizadas com sucesso!')

      // Recarregar configurações para obter dados atualizados
      await loadAccountSettings()

    } catch (error) {
      console.error('Error updating account settings:', error)
      const errorMessage = error.message || error.data?.error || 'Erro ao atualizar configurações da empresa'
      setError(errorMessage)
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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configurações da Empresa
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie as informações e configurações da sua empresa
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">Configurações atualizadas com sucesso!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
            <div key={index} className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

