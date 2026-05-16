import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleContactsImport } from '@/components/contacts/GoogleContactsImport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '../lib/api'
import { StatCard, FluidSection } from '@/components/design'
import { useIsMobile } from '@/hooks/use-mobile'
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { T, DISPLAY } from '@/lib/tokens'

const contactTypes = [
  { label: 'Todos', value: 'all' },
  { label: 'Cliente', value: 'customer' },
  { label: 'Colaborador', value: 'employee' },
  { label: 'Fornecedor', value: 'supplier' },
  { label: 'Sócio', value: 'partner' },
  { label: 'Associado', value: 'associate' },
]

const contactTypeOptions = [
  { label: 'Cliente', value: 'customer' },
  { label: 'Colaborador', value: 'employee' },
  { label: 'Fornecedor', value: 'supplier' },
  { label: 'Sócio', value: 'partner' },
  { label: 'Associado', value: 'associate' },
]

const VALID_CONTACT_TYPES = contactTypeOptions.map(o => o.value)
const normalizeContactType = (type) => {
  if (!type) return 'customer'
  const lower = String(type).toLowerCase()
  if (VALID_CONTACT_TYPES.includes(lower)) return lower
  const aliases = { client: 'customer', cliente: 'customer', colaborador: 'employee', fornecedor: 'supplier', socio: 'partner', associado: 'associate' }
  return aliases[lower] || 'customer'
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  document: '',
  notes: '',
  contact_type: 'customer',
}

export function Contacts() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [contacts, setContacts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // — estado da página (lista) —
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState(null)

  // — estado dos dialogs de criar/editar (compartilhado, nunca abertos ao mesmo tempo) —
  const [isNewContactOpen, setIsNewContactOpen] = useState(false)
  const [isEditContactOpen, setIsEditContactOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // — estado de exclusão —
  const [deleteLoadingId, setDeleteLoadingId] = useState(null)

  const [formData, setFormData] = useState(EMPTY_FORM)

  // — Google Contacts import modal —
  const [googleImportOpen, setGoogleImportOpen] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [currentPage, selectedType])

  // Abre o modal de importação automaticamente após o callback OAuth do Google
  useEffect(() => {
    const status = searchParams.get('google_contacts')
    if (status === 'connected') {
      setGoogleImportOpen(true)
      setSearchParams({}, { replace: true })
    } else if (status === 'error') {
      toast.error('Não foi possível conectar ao Google. Tente novamente.')
      setSearchParams({}, { replace: true })
    }
  }, [])

  const loadContacts = async () => {
    try {
      setPageLoading(true)
      setPageError(null)
      const response = await apiService.getContacts(currentPage, 20)
      setContacts(response.contacts || [])
      setTotalPages(response.meta?.total_pages || 1)
      setTotalCount(response.meta?.total_count || 0)
    } catch (err) {
      setPageError('Erro ao carregar contatos')
    } finally {
      setPageLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setEditingContact(null)
    setFormError(null)
  }

  const handleCreateContact = async () => {
    setFormError(null)
    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      await apiService.createContact(formData)
      toast.success(`Contato "${formData.name}" criado`)
      resetForm()
      setIsNewContactOpen(false)
      loadContacts()
    } catch (err) {
      setFormError(err.message || 'Erro ao criar contato')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditContact = (contact) => {
    setFormError(null)
    setFormData({
      name: contact.name || contact.first_name || '',
      email: contact.email || '',
      phone: contact.phone_number || contact.phone || '',
      document: contact.document_1 || contact.document || '',
      notes: contact.description || contact.notes || '',
      contact_type: normalizeContactType(contact.contact_type),
    })
    setEditingContact(contact)
    setIsEditContactOpen(true)
  }

  const handleUpdateContact = async () => {
    setFormError(null)
    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      await apiService.updateContact(editingContact.id, formData)
      toast.success(`Contato "${formData.name}" atualizado`)
      resetForm()
      setIsEditContactOpen(false)
      loadContacts()
    } catch (err) {
      setFormError(err.message || 'Erro ao atualizar contato')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteContact = async (contact) => {
    const name = contact.name || contact.first_name || 'Contato'
    if (!confirm(`Excluir "${name}"?`)) return

    try {
      setDeleteLoadingId(contact.id)
      await apiService.deleteContact(contact.id)
      setContacts((prev) => prev.filter((c) => c.id !== contact.id))
      toast.success(`Contato "${name}" excluído`)
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir contato')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const name = contact.name || contact.first_name || ''
    const email = contact.email || ''
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || contact.contact_type === selectedType
    return matchesSearch && matchesType
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getContactTypeLabel = (type) => {
    const typeMap = {
      customer: 'Cliente',
      employee: 'Colaborador',
      supplier: 'Fornecedor',
      partner: 'Sócio',
      associate: 'Associado',
    }
    return typeMap[type] || 'Contato'
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  if (pageLoading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: T.brand }} />
          <p style={{ color: T.muted }}>Carregando contatos...</p>
        </div>
      </div>
    )
  }

  if (pageError && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
          <p className="font-medium text-gray-700 dark:text-gray-300">{pageError}</p>
          <Button variant="outline" size="sm" onClick={loadContacts}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="contacts-page" className="relative min-h-screen" style={{ background: T.bg }}>
      <div className="relative z-10 w-full max-w-full min-w-0 space-y-3">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: T.text, ...DISPLAY }}>
            Contatos
          </h1>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGoogleImportOpen(true)}
              style={{ borderRadius: 8, fontSize: 13 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Importar do Google
            </Button>

          <Dialog open={isNewContactOpen} onOpenChange={(open) => {
            setIsNewContactOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button data-testid="new-contact-btn" size="sm" style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar Contato
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="contact-dialog">
              <DialogHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users className="h-5 w-5" style={{ color: T.brand }} />
                  </div>
                  <div>
                    <DialogTitle style={{ margin: 0 }}>Novo Contato</DialogTitle>
                    <DialogDescription style={{ margin: 0 }}>Preencha os dados para cadastrar um novo cliente.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tipo de Contato</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {contactTypeOptions.map((option) => (
                    <button key={option.value} type="button"
                      onClick={() => setFormData({ ...formData, contact_type: option.value })}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                        borderColor: formData.contact_type === option.value ? T.brand : T.border,
                        background: formData.contact_type === option.value ? T.chip : T.white,
                        color: formData.contact_type === option.value ? T.brand : T.text,
                        transition: 'all 150ms',
                      }}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contato</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Documento</Label>
                    <Input
                      placeholder="CPF ou CNPJ"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5 pt-5 border-t border-gray-100 dark:border-gray-800">
                <Label>Observações</Label>
                <Textarea
                  className="resize-none"
                  rows={3}
                  placeholder="Observações adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: T.red + '12', border: `1px solid ${T.red}40`, color: T.red }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}
              <DialogFooter>
                <Button variant="secondary" onClick={() => {
                  setIsNewContactOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateContact} disabled={isSubmitting} style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            title="Total de Contatos"
            value={totalCount}
            icon={Users}
            gradient="from-blue-400 to-cyan-500"
            subtitle="Contatos cadastrados"
          />
          <StatCard
            title="Contatos Ativos"
            value={contacts.length}
            icon={TrendingUp}
            gradient="from-green-400 to-emerald-500"
            subtitle="Contatos carregados"
          />
          <StatCard
            title="Página Atual"
            value={`${currentPage}/${totalPages}`}
            icon={Calendar}
            gradient="from-[#6B8FA3] to-[#5B7A9E]"
            subtitle="Navegação"
          />
        </div>

        {/* Filter Tabs */}
        <FluidSection
          title="Filtros e Busca"
          subtitle="Encontre os contatos que você precisa"
          gradient="from-[#5B7A9E] to-[#6B8FA3]"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              {contactTypes.map((type) => (
                <Button
                  key={type.value}
                  size="sm"
                  onClick={() => {
                    setSelectedType(type.value)
                    setCurrentPage(1)
                  }}
                  style={selectedType === type.value
                    ? { background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }
                    : { background: T.white, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8 }
                  }
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: T.muted }} />
              <Input
                placeholder="Pesquisar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 w-full md:w-64"
              />
            </div>
          </div>
        </FluidSection>

        {/* Contacts Grid */}
        {filteredContacts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredContacts.map((contact) => {
                const contactName = contact.name || contact.first_name || 'Sem nome'
                const contactEmail = contact.email || ''
                const contactPhone = contact.phone_number || contact.phone || ''
                const contactDocument = contact.document_1 || contact.document || ''
                const contactNotes = contact.description || contact.notes || ''
                const contactType = contact.contact_type || 'customer'

                return (
                  <div key={contact.id} className="group/item relative">
                    <div
                      className="relative rounded-xl p-6 transition-all duration-140"
                      style={{ background: T.white, border: `1px solid ${T.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = T.white)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: T.chip,
                            color: T.brand,
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {(contactName[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold" style={{ color: T.text }}>{contactName}</h3>
                            <span style={{
                              borderRadius: 20,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              display: 'inline-block',
                              marginTop: 4,
                              background: T.chip,
                              color: T.brand,
                            }}>
                              {getContactTypeLabel(contactType)}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            title="Ver prontuário"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                            onClick={() => handleEditContact(contact)}
                            title="Editar contato"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                            disabled={deleteLoadingId === contact.id}
                            onClick={() => handleDeleteContact(contact)}
                            title="Excluir contato"
                          >
                            {deleteLoadingId === contact.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2" style={{ fontSize: 12, color: T.muted }}>
                        {contactDocument && (
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4" />
                            <span>{contactDocument}</span>
                          </div>
                        )}
                        {contactEmail && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{contactEmail}</span>
                          </div>
                        )}
                        {contactPhone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{contactPhone}</span>
                          </div>
                        )}
                        {contactNotes && (
                          <p style={{ fontSize: 12, color: T.muted }}>{contactNotes}</p>
                        )}
                      </div>

                      <div className="mt-4" style={{ fontSize: 12, color: T.muted }}>
                        Criado em {formatDate(contact.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || pageLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={pageLoading}
                        style={currentPage === pageNum
                          ? { background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }
                          : { background: T.white, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8 }
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || pageLoading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!pageLoading && filteredContacts.length === 0 && (
          <FluidSection
            title="Nenhum contato encontrado"
            subtitle={searchQuery || selectedType !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando seu primeiro contato'
            }
            gradient="from-gray-400 to-gray-500"
          >
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4" style={{ color: T.muted }} />
              {!searchQuery && selectedType === 'all' && (
                <Button
                  onClick={() => setIsNewContactOpen(true)}
                  style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Contato
                </Button>
              )}
            </div>
          </FluidSection>
        )}

        {/* Edit Contact Dialog */}
        <Dialog open={isEditContactOpen} onOpenChange={(open) => {
          setIsEditContactOpen(open)
          if (!open) resetForm()
        }}>
          <DialogContent data-testid="edit-contact-dialog">
            <DialogHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users className="h-5 w-5" style={{ color: T.brand }} />
                </div>
                <div>
                  <DialogTitle style={{ margin: 0 }}>Editar Contato</DialogTitle>
                  <DialogDescription style={{ margin: 0 }}>Atualize as informações do cliente.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tipo de Contato</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {contactTypeOptions.map((option) => (
                  <button key={option.value} type="button"
                    onClick={() => setFormData({ ...formData, contact_type: option.value })}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                      borderColor: formData.contact_type === option.value ? T.brand : T.border,
                      background: formData.contact_type === option.value ? T.chip : T.white,
                      color: formData.contact_type === option.value ? T.brand : T.text,
                      transition: 'all 150ms',
                    }}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Contato</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Documento</Label>
                  <Input
                    placeholder="CPF ou CNPJ"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5 pt-5 border-t border-gray-100 dark:border-gray-800">
              <Label>Observações</Label>
              <Textarea
                className="resize-none"
                rows={3}
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: T.red + '12', border: `1px solid ${T.red}40`, color: T.red }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => {
                setIsEditContactOpen(false)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateContact} disabled={isSubmitting} style={{ background: T.brand, color: '#fff', border: 'none', borderRadius: 8 }}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {googleImportOpen && (
        <GoogleContactsImport
          onImported={loadContacts}
          onClose={() => setGoogleImportOpen(false)}
        />
      )}
    </div>
  )
}
