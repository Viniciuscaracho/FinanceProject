import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { apiService } from '@/lib/api'
import { DocumentEditor } from '@/components/DocumentEditor'
import { DocumentPreview } from '@/components/DocumentPreview'
import { cn } from '@/lib/utils'

const DOCUMENT_TYPES = {
  receipt: {
    label: 'Recibos',
    singular: 'Recibo',
    endpoint: 'receipt',
    type: 'ReceiptTemplate',
  },
  invoice: {
    label: 'Faturas',
    singular: 'Fatura',
    endpoint: 'invoice',
    type: 'InvoiceTemplate',
  },
  contract: {
    label: 'Contratos',
    singular: 'Contrato',
    endpoint: 'contract',
    type: 'ContractTemplate',
  },
  professional: {
    label: 'Documentos Profissionais',
    singular: 'Documento Profissional',
    endpoint: 'professional',
    type: 'ProfessionalDocumentTemplate',
  },
}

export function DocumentTemplateForm() {
  const navigate = useNavigate()
  const { type, id } = useParams()
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    transaction_type_cd: 0,
    show_header: false,
    show_issue_date: false,
    show_due_date: true,
    show_recipient: true,
    show_detailed_lines: false,
    show_discount_info: false,
    show_tax_info: false,
    show_payment_info: true,
    enable_sessions: false,
    session_count: null,
    session_number: null,
    session_type: '',
    professional_type: '',
  })

  const docType = DOCUMENT_TYPES[type] || DOCUMENT_TYPES.receipt
  const isEditing = !!id

  useEffect(() => {
    if (isEditing) {
      loadTemplate()
    }
  }, [id, type])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      let response

      switch (docType.endpoint) {
        case 'receipt':
          response = await apiService.getReceiptTemplate(id)
          break
        case 'invoice':
          response = await apiService.getInvoiceTemplate(id)
          break
        case 'contract':
          response = await apiService.getContractTemplate(id)
          break
        case 'professional':
          response = await apiService.getProfessionalDocumentTemplate(id)
          break
      }

      const template = response.template || response
      setFormData({
        name: template.name || '',
        description: template.description || '',
        content: template.content || '',
        transaction_type_cd: template.transaction_type_cd || 0,
        show_header: template.show_header || false,
        show_issue_date: template.show_issue_date || false,
        show_due_date: template.show_due_date !== undefined ? template.show_due_date : true,
        show_recipient: template.show_recipient !== undefined ? template.show_recipient : true,
        show_detailed_lines: template.show_detailed_lines || false,
        show_discount_info: template.show_discount_info || false,
        show_tax_info: template.show_tax_info || false,
        show_payment_info: template.show_payment_info !== undefined ? template.show_payment_info : true,
        enable_sessions: template.enable_sessions || false,
        session_count: template.session_count || null,
        session_number: template.session_number || null,
        session_type: template.session_type || '',
        professional_type: template.professional_type || '',
      })
    } catch (err) {
      console.error('Error loading template:', err)
      setError('Erro ao carregar template')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const templatePayload = {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        enable_sessions: formData.enable_sessions,
        session_count: formData.session_count,
        session_number: formData.session_number,
        session_type: formData.session_type,
        professional_type: formData.professional_type,
      }

      if (docType.endpoint === 'receipt') {
        templatePayload.transaction_type_cd = formData.transaction_type_cd
        const payload = {
          receipt_template: {
            ...templatePayload,
            show_header: formData.show_header
          }
        }
        if (isEditing) {
          await apiService.updateReceiptTemplate(id, payload.receipt_template)
        } else {
          await apiService.createReceiptTemplate(payload.receipt_template)
        }
      } else if (docType.endpoint === 'invoice') {
        const settings = {
          show_header: formData.show_header,
          show_issue_date: formData.show_issue_date,
          show_due_date: formData.show_due_date,
          show_recipient: formData.show_recipient,
          show_detailed_lines: formData.show_detailed_lines,
          show_discount_info: formData.show_discount_info,
          show_tax_info: formData.show_tax_info,
          show_payment_info: formData.show_payment_info,
        }
        const payload = {
          invoice_template: {
            ...templatePayload,
            settings
          }
        }
        if (isEditing) {
          await apiService.updateInvoiceTemplate(id, payload.invoice_template)
        } else {
          await apiService.createInvoiceTemplate(payload.invoice_template)
        }
      } else if (docType.endpoint === 'contract') {
        const payload = {
          contract_template: {
            ...templatePayload,
            show_header: formData.show_header
          }
        }
        if (isEditing) {
          await apiService.updateContractTemplate(id, payload.contract_template)
        } else {
          await apiService.createContractTemplate(payload.contract_template)
        }
      } else if (docType.endpoint === 'professional') {
        const payload = {
          professional_document_template: templatePayload
        }
        if (isEditing) {
          await apiService.updateProfessionalDocumentTemplate(id, payload.professional_document_template)
        } else {
          await apiService.createProfessionalDocumentTemplate(payload.professional_document_template)
        }
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/document-templates')
      }, 800)
    } catch (err) {
      console.error('Error saving template:', err)
      setError(err.message || 'Erro ao salvar template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const insertVariable = (variable) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().insertContent(' ' + variable + ' ').run()
    } else {
      setFormData({...formData, content: formData.content + ' ' + variable + ' '})
    }
  }

  function getVariablesForType() {
    // Variáveis de sessões
    const sessionVariables = formData.enable_sessions ? {
      'Sessões': [
        { key: '[NUMERO_SESSAO]', description: 'Número da sessão atual' },
        { key: '[TOTAL_SESSOES]', description: 'Total de sessões do pacote' },
        { key: '[TIPO_SESSAO]', description: 'Tipo de sessão (ex: Terapia individual, Aula particular)' },
        { key: '[TIPO_PROFISSIONAL]', description: 'Tipo de profissional (ex: Psicólogo, Professor, Nutricionista)' },
        { key: '[SESSOES_RESTANTES]', description: 'Número de sessões restantes no pacote' },
        { key: '[SESSOES_REALIZADAS]', description: 'Número de sessões já realizadas' },
      ]
    } : {}

    // Variáveis comuns a todos os tipos
    const common = [
      { key: '[DATA_ATUAL]', description: 'Data de emissão do documento', category: 'Geral' },
      { key: '[MES_ATUAL]', description: 'Mês e ano da emissão (MM/AAAA)', category: 'Geral' },
      { key: '[MEU_NOME]', description: 'Nome do usuário logado no momento da emissão', category: 'Geral' },
      { key: '[MINHA_EMPRESA]', description: 'Nome da minha empresa/negócio', category: 'Empresa' },
    ]

    if (type === 'receipt') {
      return {
        ...sessionVariables,
        'Geral': [
          { key: '[DATA_ATUAL]', description: 'Data de emissão do documento' },
          { key: '[MES_ATUAL]', description: 'Mês e ano da emissão (MM/AAAA)' },
          { key: '[MEU_NOME]', description: 'Nome do usuário logado no momento da emissão' },
        ],
        'Empresa': [
          { key: '[MINHA_EMPRESA]', description: 'Nome da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_DOCUMENTO]', description: 'Número do documento (CPF/CNPJ) da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_ESTADO]', description: 'Estado da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_CIDADE]', description: 'Cidade da minha empresa/negócio' },
        ],
        'Transação': [
          { key: '[CODIGO_ITEM]', description: 'Código único da movimentação, gerado pelo sistema' },
          { key: '[CONTA_BANCARIA_ITEM]', description: 'Nome da conta bancária da movimentação' },
          { key: '[DATA_ITEM]', description: 'Data da movimentação que será emitido o recibo' },
          { key: '[VALOR_ITEM]', description: 'Valor da movimentação que será emitido o recibo' },
          { key: '[NUMERO_DOCUMENTO_ITEM]', description: 'Número do documento da movimentação' },
          { key: '[FORMA_PAGAMENTO_ITEM]', description: 'Forma de pagamento da movimentação' },
          { key: '[DESCRICAO_ITEM]', description: 'Descrição da movimentação que será emitido o recibo' },
          { key: '[DETALHES_ITEM]', description: 'Detalhes adicionais da movimentação' },
          { key: '[CATEGORIA_ITEM]', description: 'Categoria da movimentação que será emitido o recibo' },
        ],
        'Cliente': [
          { key: '[NOME_CLIENTE]', description: 'Nome do Cliente da movimentação' },
          { key: '[DOCUMENTO_CLIENTE]', description: 'CNPJ ou CPF do cliente dependendo do tipo dele' },
          { key: '[TELEFONE_CLIENTE]', description: 'Telefone do Cliente da movimentação' },
          { key: '[CELULAR_CLIENTE]', description: 'Celular do Cliente da movimentação' },
          { key: '[EMAIL_CLIENTE]', description: 'Email do Cliente da movimentação' },
        ],
      }
    }

    if (type === 'invoice') {
      return {
        ...sessionVariables,
        'Geral': [
          { key: '[DATA_ATUAL]', description: 'Data de emissão do documento' },
          { key: '[MES_ATUAL]', description: 'Mês e ano da emissão (MM/AAAA)' },
          { key: '[MEU_NOME]', description: 'Nome do usuário logado no momento da emissão' },
        ],
        'Empresa': [
          { key: '[MINHA_EMPRESA]', description: 'Nome da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_DOCUMENTO]', description: 'Número do documento (CPF/CNPJ) da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_ESTADO]', description: 'Estado da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_CIDADE]', description: 'Cidade da minha empresa/negócio' },
        ],
        'Fatura': [
          { key: '[VALOR_TOTAL]', description: 'Valor total da fatura' },
          { key: '[DATA_VENCIMENTO]', description: 'Data de vencimento da fatura' },
        ],
        'Cliente': [
          { key: '[NOME_CLIENTE]', description: 'Nome do Cliente/Fornecedor da fatura' },
          { key: '[DOCUMENTO_CLIENTE]', description: 'CNPJ ou CPF do cliente/fornecedor' },
        ],
      }
    }

    if (type === 'contract') {
      return {
        ...sessionVariables,
        'Geral': [
          { key: '[DATA_ATUAL]', description: 'Data de emissão do documento' },
          { key: '[MES_ATUAL]', description: 'Mês e ano da emissão (MM/AAAA)' },
          { key: '[MEU_NOME]', description: 'Nome do usuário logado no momento da emissão' },
        ],
        'Empresa': [
          { key: '[MINHA_EMPRESA]', description: 'Nome da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_CPF/CNPJ]', description: 'CPF ou CNPJ da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_NOME_FANTASIA]', description: 'Nome fantasia da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_RG/INS_ESTADUAL]', description: 'RG ou Inscrição Estadual da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_ENDERECO_COMPLETO]', description: 'Endereço completo da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_TELEFONE]', description: 'Telefone da minha empresa/negócio' },
        ],
        'Cliente': [
          { key: '[NOME_CLIENTE]', description: 'Nome do Cliente do contrato' },
          { key: '[CPF/CNPJ_CLIENTE]', description: 'CNPJ ou CPF do cliente dependendo do tipo dele' },
          { key: '[RG/INS_ESTADUAL_CLIENTE]', description: 'RG ou Inscrição Estadual do Cliente' },
          { key: '[ENDERECO_COMPLETO_CLIENTE]', description: 'Endereço completo do Cliente' },
          { key: '[TELEFONE_CLIENTE]', description: 'Telefone do Cliente' },
        ],
      }
    }

    if (type === 'professional') {
      return {
        ...sessionVariables,
        'Geral': [
          { key: '[DATA_ATUAL]', description: 'Data de emissão do documento' },
          { key: '[MES_ATUAL]', description: 'Mês e ano da emissão (MM/AAAA)' },
          { key: '[MEU_NOME]', description: 'Nome do usuário logado no momento da emissão' },
        ],
        'Empresa': [
          { key: '[MINHA_EMPRESA]', description: 'Nome da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_DOCUMENTO]', description: 'Número do documento (CPF/CNPJ) da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_ESTADO]', description: 'Estado da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_CIDADE]', description: 'Cidade da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_ENDERECO_COMPLETO]', description: 'Endereço completo da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_TELEFONE]', description: 'Telefone da minha empresa/negócio' },
          { key: '[MINHA_EMPRESA_CELULAR]', description: 'Celular da minha empresa/negócio' },
          { key: '[REGISTRO_PROFISSIONAL]', description: 'Registro profissional (CRP, CRN, CRM, etc.)' },
        ],
        'Cliente': [
          { key: '[NOME_CLIENTE]', description: 'Nome do Cliente/Paciente/Estudante' },
          { key: '[DOCUMENTO_CLIENTE]', description: 'CNPJ ou CPF do cliente' },
          { key: '[TELEFONE_CLIENTE]', description: 'Telefone do Cliente' },
          { key: '[CELULAR_CLIENTE]', description: 'Celular do Cliente' },
          { key: '[EMAIL_CLIENTE]', description: 'Email do Cliente' },
          { key: '[ENDERECO_COMPLETO_CLIENTE]', description: 'Endereço completo do Cliente' },
        ],
        'Conteúdo do Documento': [
          { key: '[CONTEUDO_DOCUMENTO]', description: 'Conteúdo principal do documento (planos, orientações, etc.)' },
          { key: '[PROGRESSO_CLIENTE]', description: 'Progresso e avanços do cliente/paciente/estudante' },
          { key: '[ORIENTACOES]', description: 'Orientações e tarefas para o cliente' },
          { key: '[OBSERVACOES]', description: 'Observações adicionais' },
        ],
        'Agendamento': [
          { key: '[DATA_AGENDAMENTO]', description: 'Data do agendamento/sessão' },
          { key: '[DATA_SESSAO]', description: 'Data da sessão/aula' },
          { key: '[HORA_AGENDAMENTO]', description: 'Hora do agendamento' },
          { key: '[SERVICO_AGENDAMENTO]', description: 'Nome do serviço do agendamento' },
          { key: '[PROFISSIONAL_AGENDAMENTO]', description: 'Nome do profissional responsável' },
          { key: '[VALOR_AGENDAMENTO]', description: 'Valor do agendamento' },
          { key: '[NOTAS_AGENDAMENTO]', description: 'Notas do agendamento' },
        ],
      }
    }

    return { 
      ...sessionVariables,
      'Geral': common 
    }
  }

  const variablesGrouped = getVariablesForType()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0">
        {/* Header - Compacto */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/document-templates')}
                size="sm"
                className="text-text-secondary hover:text-text-primary h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <span className="text-text-tertiary text-xs">/</span>
              <span className="text-text-tertiary text-xs">{docType.label}</span>
            </div>
            <h1 className="text-xl font-semibold text-text-primary">
              {isEditing ? `Editar ${docType.singular}` : `Novo ${docType.singular}`}
            </h1>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-4 py-2 md:px-6">
            <Alert variant="destructive" className="mb-0 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Erro</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="px-4 py-2 md:px-6">
            <Alert className="mb-0 border-green-200 bg-green-50 text-green-800 py-2">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-sm">Sucesso</AlertTitle>
              <AlertDescription className="text-xs">Template salvo com sucesso!</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Form */}
        <form id="document-form" onSubmit={handleSubmit} className="px-4 py-4 md:px-6 h-[calc(100vh-140px)] flex flex-col">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left Column - Form Compacto */}
            <div className="flex flex-col min-h-0">
              {/* Campos Compactos em Accordion */}
              <Accordion type="multiple" defaultValue={['basic']} className="mb-3 flex-shrink-0">
                <AccordionItem value="basic" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                  <AccordionTrigger className="py-2 text-sm font-medium">
                    Informações básicas
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">
                          Nome <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="Ex: Recibo Padrão"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-medium">
                          Descrição
                        </Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Opcional"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Configurações de Sessões */}
                <AccordionItem value="sessions" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                  <AccordionTrigger className="py-2 text-sm font-medium">
                    Sessões e Profissional
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enable_sessions"
                          checked={formData.enable_sessions}
                          onCheckedChange={(checked) => setFormData({...formData, enable_sessions: checked})}
                        />
                        <Label htmlFor="enable_sessions" className="font-normal cursor-pointer text-xs">
                          Habilitar sessões (para psicólogos, professores, nutricionistas, etc.)
                        </Label>
                      </div>
                      
                      {formData.enable_sessions && (
                        <>
                          <div className="space-y-1.5">
                            <Label htmlFor="professional_type" className="text-xs font-medium">
                              Tipo de Profissional
                            </Label>
                            <Select
                              value={formData.professional_type}
                              onValueChange={(value) => setFormData({...formData, professional_type: value})}
                            >
                              <SelectTrigger id="professional_type" className="h-8 text-sm">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="psicologo">Psicólogo</SelectItem>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="nutricionista">Nutricionista</SelectItem>
                                <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                                <SelectItem value="medico">Médico</SelectItem>
                                <SelectItem value="dentista">Dentista</SelectItem>
                                <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                                <SelectItem value="coach">Coach</SelectItem>
                                <SelectItem value="terapeuta">Terapeuta</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="session_count" className="text-xs font-medium">
                                Total de Sessões
                              </Label>
                              <Input
                                id="session_count"
                                type="number"
                                min="1"
                                value={formData.session_count || ''}
                                onChange={(e) => setFormData({...formData, session_count: e.target.value ? parseInt(e.target.value) : null})}
                                placeholder="Ex: 10"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="session_number" className="text-xs font-medium">
                                Número da Sessão Atual
                              </Label>
                              <Input
                                id="session_number"
                                type="number"
                                min="1"
                                value={formData.session_number || ''}
                                onChange={(e) => setFormData({...formData, session_number: e.target.value ? parseInt(e.target.value) : null})}
                                placeholder="Ex: 3"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="session_type" className="text-xs font-medium">
                              Tipo de Sessão
                            </Label>
                            <Input
                              id="session_type"
                              value={formData.session_type}
                              onChange={(e) => setFormData({...formData, session_type: e.target.value})}
                              placeholder="Ex: Terapia individual, Aula particular, Sessão"
                              className="h-8 text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Configurações do Recibo */}
                {type === 'receipt' && (
                  <AccordionItem value="settings" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      Configurações
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="transaction_type" className="text-xs font-medium">
                            Tipo de Transação
                          </Label>
                          <Select
                            value={formData.transaction_type_cd.toString()}
                            onValueChange={(value) => setFormData({...formData, transaction_type_cd: parseInt(value)})}
                          >
                            <SelectTrigger id="transaction_type" className="h-8 text-sm">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Receita</SelectItem>
                              <SelectItem value="1">Despesa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show_header"
                            checked={formData.show_header}
                            onCheckedChange={(checked) => setFormData({...formData, show_header: checked})}
                          />
                          <Label htmlFor="show_header" className="font-normal cursor-pointer text-xs flex items-center gap-1">
                            Exibir cabeçalho
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-text-tertiary cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Exibe logo e dados do profissional no topo do recibo</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Configurações da Fatura */}
                {type === 'invoice' && (
                  <AccordionItem value="settings" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      Configurações
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_header"
                              checked={formData.show_header}
                              onCheckedChange={(checked) => setFormData({...formData, show_header: checked})}
                            />
                            <Label htmlFor="show_header" className="font-normal cursor-pointer text-xs">
                              Cabeçalho
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_recipient"
                              checked={formData.show_recipient}
                              onCheckedChange={(checked) => setFormData({...formData, show_recipient: checked})}
                            />
                            <Label htmlFor="show_recipient" className="font-normal cursor-pointer text-xs">
                              Destinatário
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_issue_date"
                              checked={formData.show_issue_date}
                              onCheckedChange={(checked) => setFormData({...formData, show_issue_date: checked})}
                            />
                            <Label htmlFor="show_issue_date" className="font-normal cursor-pointer text-xs">
                              Data emissão
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_due_date"
                              checked={formData.show_due_date}
                              onCheckedChange={(checked) => setFormData({...formData, show_due_date: checked})}
                            />
                            <Label htmlFor="show_due_date" className="font-normal cursor-pointer text-xs">
                              Data vencimento
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_detailed_lines"
                              checked={formData.show_detailed_lines}
                              onCheckedChange={(checked) => setFormData({...formData, show_detailed_lines: checked})}
                            />
                            <Label htmlFor="show_detailed_lines" className="font-normal cursor-pointer text-xs">
                              Linhas detalhadas
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_discount_info"
                              checked={formData.show_discount_info}
                              onCheckedChange={(checked) => setFormData({...formData, show_discount_info: checked})}
                            />
                            <Label htmlFor="show_discount_info" className="font-normal cursor-pointer text-xs">
                              Desconto
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_tax_info"
                              checked={formData.show_tax_info}
                              onCheckedChange={(checked) => setFormData({...formData, show_tax_info: checked})}
                            />
                            <Label htmlFor="show_tax_info" className="font-normal cursor-pointer text-xs">
                              Imposto
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show_payment_info"
                              checked={formData.show_payment_info}
                              onCheckedChange={(checked) => setFormData({...formData, show_payment_info: checked})}
                            />
                            <Label htmlFor="show_payment_info" className="font-normal cursor-pointer text-xs">
                              Pagamento
                            </Label>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Configurações do Contrato */}
                {type === 'contract' && (
                  <AccordionItem value="settings" className="border border-gray-200 dark:border-gray-700 rounded-lg px-3">
                    <AccordionTrigger className="py-2 text-sm font-medium">
                      Configurações
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show_header"
                            checked={formData.show_header}
                            onCheckedChange={(checked) => setFormData({...formData, show_header: checked})}
                          />
                          <Label htmlFor="show_header" className="font-normal cursor-pointer text-xs">
                            Exibir cabeçalho
                          </Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {/* Editor de Documento - Área Principal */}
              <div className="flex-1 flex flex-col min-h-0 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content" className="text-sm font-medium">
                    Conteúdo do documento
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVariableDialogOpen(true)}
                    className="text-xs h-7 px-2"
                  >
                    Inserir variável
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <DocumentEditor
                    content={formData.content}
                    onChange={(html) => setFormData({...formData, content: html})}
                    onVariableInsert={() => setIsVariableDialogOpen(true)}
                    editorRef={editorRef}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Preview - Área Principal */}
            <div className="hidden xl:block flex-1 flex flex-col min-h-0">
              <div className="mb-2">
                <Label className="text-sm font-medium text-text-primary">Visualização</Label>
              </div>
              <div className="flex-1 min-h-0">
                <DocumentPreview 
                  content={formData.content} 
                  showHeader={formData.show_header}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Action Bar - Compacto */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 md:px-6 z-50 shadow-lg">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/document-templates')}
              disabled={isSubmitting}
              className="h-8 px-3 text-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="document-form"
              size="sm"
              disabled={isSubmitting}
              className="h-8 px-3 text-sm"
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isEditing ? 'Salvar' : 'Salvar'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Variables Dialog - Refinado com categorias */}
        <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Inserir Variável</DialogTitle>
              <p className="text-sm text-text-secondary mt-2">
                Selecione uma variável para inserir no documento. As variáveis serão substituídas pelos dados reais quando o documento for gerado.
              </p>
            </DialogHeader>
            <div className="py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {Object.entries(variablesGrouped).map(([category, variables]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-text-primary mb-3">{category}</h3>
                    <div className="space-y-2">
                      {variables.map((variable) => (
                        <Button
                          key={variable.key}
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-gray-50"
                          onClick={() => {
                            insertVariable(variable.key)
                            setIsVariableDialogOpen(false)
                          }}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <code className="font-mono text-sm font-semibold text-primary">{variable.key}</code>
                            <span className="text-xs text-text-secondary text-left">{variable.description}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

