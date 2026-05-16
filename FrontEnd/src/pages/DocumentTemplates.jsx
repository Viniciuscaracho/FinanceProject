import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit,
  Trash2,
  FileText,
  Receipt,
  FileCheck,
  FileSignature,
  Loader2,
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { apiService } from '@/lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { T } from '@/lib/tokens'

const DOCUMENT_TYPES = {
  receipt: {
    label: 'Recibos',
    labelMobile: 'Recibos',
    icon: Receipt,
    type: 'ReceiptTemplate',
    endpoint: 'receipt',
    color: 'text-green-600'
  },
  invoice: {
    label: 'Faturas',
    labelMobile: 'Faturas',
    icon: FileCheck,
    type: 'InvoiceTemplate',
    endpoint: 'invoice',
    color: 'text-blue-600'
  },
  contract: {
    label: 'Contratos',
    labelMobile: 'Contratos',
    icon: FileSignature,
    type: 'ContractTemplate',
    endpoint: 'contract',
    color: 'text-purple-600'
  },
  professional: {
    label: 'Documentos Profissionais',
    labelMobile: 'Profis.',
    icon: GraduationCap,
    type: 'ProfessionalDocumentTemplate',
    endpoint: 'professional',
    color: 'text-orange-600'
  }
}

export function DocumentTemplates() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('receipt')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadTemplates()
  }, [activeTab, currentPage])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const docType = DOCUMENT_TYPES[activeTab]
      let response

      switch (docType.endpoint) {
        case 'receipt':
          response = await apiService.getReceiptTemplates(currentPage, 20)
          break
        case 'invoice':
          response = await apiService.getInvoiceTemplates(currentPage, 20)
          break
        case 'contract':
          response = await apiService.getContractTemplates(currentPage, 20)
          break
        case 'professional':
          response = await apiService.getProfessionalDocumentTemplates(currentPage, 20)
          break
        default:
          response = await apiService.getReceiptTemplates(currentPage, 20)
      }

      // A resposta da API v1 vem no formato { templates: [], meta: {} }
      if (response.templates) {
        setTemplates(response.templates)
        setTotalPages(response.meta?.total_pages || 1)
      } else if (Array.isArray(response)) {
        setTemplates(response)
        setTotalPages(1)
      } else {
        setTemplates([])
        setTotalPages(1)
      }
    } catch (err) {
      setError('Erro ao carregar templates de documentos')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId) => {
    try {
      const docType = DOCUMENT_TYPES[activeTab]

      switch (docType.endpoint) {
        case 'receipt':
          await apiService.deleteReceiptTemplate(templateId)
          break
        case 'invoice':
          await apiService.deleteInvoiceTemplate(templateId)
          break
        case 'contract':
          await apiService.deleteContractTemplate(templateId)
          break
        case 'professional':
          await apiService.deleteProfessionalDocumentTemplate(templateId)
          break
      }

      toast.success('Template excluído com sucesso!')
      loadTemplates()
    } catch (err) {
      const errorMessage = err.data?.error || err.message || 'Erro ao excluir template'
      toast.error(errorMessage)
    }
  }

  const handleEdit = (template) => {
    navigate(`/document-templates/${activeTab}/${template.id}/edit`)
  }

  const handleCreate = () => {
    navigate(`/document-templates/${activeTab}/new`)
  }

  const docType = DOCUMENT_TYPES[activeTab]
  const Icon = docType.icon

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0 space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-text-primary">
              Modelos de Documentos
            </h1>
            <p className="text-lg text-text-secondary">
              Gerencie templates de recibos, faturas, contratos e documentos profissionais
            </p>
          </div>
          <Button 
            onClick={handleCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto border-b">
                <TabsList className="w-max min-w-full justify-start rounded-none bg-transparent p-0 h-auto">
                  {Object.entries(DOCUMENT_TYPES).map(([key, type]) => {
                    const TabIcon = type.icon
                    return (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className="data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none shrink-0 whitespace-nowrap"
                      >
                        <TabIcon className="h-4 w-4 mr-2" />
                        {isMobile ? type.labelMobile : type.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {Object.keys(DOCUMENT_TYPES).map((key) => (
                <TabsContent key={key} value={key} className="m-0">
                  <div className="p-6">
                    {loading ? (
                      <div className="space-y-3 animate-pulse py-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center gap-4 px-2 py-3">
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-1/4" />
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-2/5" />
                            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-1/6 ml-auto" />
                          </div>
                        ))}
                      </div>
                    ) : templates.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                        {(() => {
                          const cfg = DOCUMENT_TYPES[key]
                          const Icon = cfg?.icon || FileText
                          const msgs = {
                            receipt: { title: 'Nenhum recibo criado', sub: 'Crie templates de recibos para emitir comprovantes de pagamento rápido' },
                            invoice: { title: 'Nenhuma fatura criada', sub: 'Templates de fatura para cobranças formais com dados do cliente' },
                            contract: { title: 'Nenhum contrato criado', sub: 'Modelos de contrato para formalizar o acordo com seus clientes' },
                            professional_document: { title: 'Nenhum documento profissional', sub: 'Templates personalizados para documentação de sessões e evoluções' },
                          }
                          const m = msgs[key] || { title: 'Nenhum template', sub: 'Crie um novo template para começar' }
                          return (
                            <>
                              <div style={{ width: 56, height: 56, borderRadius: 16, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Icon className="h-7 w-7" style={{ color: T.brand }} />
                              </div>
                              <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>{m.title}</p>
                              <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>{m.sub}</p>
                            </>
                          )
                        })()}
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Descrição</TableHead>
                              {key === 'receipt' && <TableHead>Tipo de Transação</TableHead>}
                              <TableHead>Profissional/Sessões</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templates.map((template) => (
                              <TableRow key={template.id}>
                                <TableCell className="font-medium">
                                  {template.name}
                                  {template.default && (
                                    <Badge variant="secondary" className="ml-2">
                                      Padrão
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{template.description || '-'}</TableCell>
                                {key === 'receipt' && (
                                  <TableCell>
                                    {template.transaction_type_cd === 0 ? 'Receita' : 'Despesa'}
                                  </TableCell>
                                )}
                                <TableCell>
                                  {template.enable_sessions ? (
                                    <div className="flex flex-col gap-1">
                                      {template.professional_type_label && (
                                        <Badge variant="outline" className="w-fit text-xs">
                                          {template.professional_type_label}
                                        </Badge>
                                      )}
                                      {template.session_count && (
                                        <span className="text-xs text-text-secondary">
                                          {template.session_number ? `Sessão ${template.session_number}` : ''} de {template.session_count}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-text-tertiary">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(template)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(template.id)}
                                      disabled={template.default}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm text-text-secondary">
                              Página {currentPage} de {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Próxima
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

