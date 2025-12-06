import { useState, useEffect } from 'react'
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
  ChevronRight
} from 'lucide-react'
import { apiService } from '../lib/api'
import { StatCard, FluidSection } from '@/components/design'
import { useIsMobile } from '@/hooks/use-mobile'
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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

export function Contacts() {
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isNewContactOpen, setIsNewContactOpen] = useState(false)
  const [isEditContactOpen, setIsEditContactOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Form state for new/edit contact
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    notes: '',
    contact_type: 'customer'
  })

  useEffect(() => {
    loadContacts()
  }, [currentPage, selectedType])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiService.getContacts(currentPage, 20)
      setContacts(response.contacts || [])
      setTotalPages(response.meta?.total_pages || 1)
      setTotalCount(response.meta?.total_count || 0)

    } catch (error) {
      console.error('Error loading contacts:', error)
      setError('Erro ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      notes: '',
      contact_type: 'customer'
    })
    setEditingContact(null)
  }

  const handleCreateContact = async () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await apiService.createContact(formData)
      
      resetForm()
      setIsNewContactOpen(false)
      loadContacts()
      
    } catch (error) {
      console.error('Error creating contact:', error)
      setError(error.message || 'Erro ao criar contato')
    } finally {
      setLoading(false)
    }
  }

  const handleEditContact = (contact) => {
    // Mapear campos do backend para o formulário
    setFormData({
      name: contact.name || contact.first_name || '',
      email: contact.email || '',
      phone: contact.phone_number || contact.phone || '',
      document: contact.document_1 || contact.document || '',
      notes: contact.description || contact.notes || '',
      contact_type: contact.contact_type || 'customer'
    })
    setEditingContact(contact)
    setIsEditContactOpen(true)
  }

  const handleUpdateContact = async () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await apiService.updateContact(editingContact.id, formData)
      
      resetForm()
      setIsEditContactOpen(false)
      loadContacts()
      
    } catch (error) {
      console.error('Error updating contact:', error)
      setError(error.message || 'Erro ao atualizar contato')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return

    try {
      setLoading(true)
      setError(null)

      await apiService.deleteContact(id)
      loadContacts()
      
    } catch (error) {
      console.error('Error deleting contact:', error)
      setError(error.message || 'Erro ao excluir contato')
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const name = contact.name || contact.first_name || ''
    const email = contact.email || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Mapear tipos do backend para os valores do filtro
    const contactTypeMap = {
      'customer': 'customer',
      'employee': 'employee',
      'supplier': 'supplier',
      'partner': 'partner',
      'associate': 'associate',
    }
    const contactType = contactTypeMap[contact.contact_type] || contact.contact_type
    
    const matchesType = selectedType === 'all' || contactType === selectedType
    return matchesSearch && matchesType
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getContactTypeLabel = (type) => {
    const typeMap = {
      'customer': 'Cliente',
      'employee': 'Colaborador',
      'supplier': 'Fornecedor',
      'partner': 'Sócio',
      'associate': 'Associado',
    }
    return typeMap[type] || 'Contato'
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0 px-6 py-8 md:px-12 md:py-12 space-y-8 md:space-y-12">
        {/* Header - Bold Typography */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 responsive-text-xl text-text-primary">
              Contatos
            </h1>
            <p className="text-lg text-text-secondary">
              Gerencie seus clientes, fornecedores e parceiros
            </p>
          </div>

        <Dialog open={isNewContactOpen} onOpenChange={(open) => {
          setIsNewContactOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Contato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 col-span-2">
                <Label>Nome *</Label>
                <Input 
                  placeholder="Nome completo" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Telefone</Label>
                <Input 
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Documento</Label>
                <Input 
                  placeholder="CPF ou CNPJ"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label>Tipo de Contato</Label>
                <Select 
                  value={formData.contact_type} 
                  onValueChange={(value) => setFormData({...formData, contact_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 col-span-2">
                <Label>Observações</Label>
                <Textarea 
                  className="resize-none" 
                  rows={3}
                  placeholder="Observações adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => {
                setIsNewContactOpen(false)
                resetForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateContact} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {loading && contacts.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-text-secondary">Carregando contatos...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-auto"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Summary Cards - Modern Style */}
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

      {/* Filter Tabs - Modern Style */}
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
                variant={selectedType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedType(type.value)
                  setCurrentPage(1) // Reset to first page when filtering
                }}
                variant={selectedType === type.value ? "default" : "secondary"}
              >
                <span>{type.label}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              <Input
                placeholder="Pesquisar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 w-full md:w-64"
              />
            </div>
          </div>
        </div>
      </FluidSection>

      {/* Contacts Grid - Modern Style */}
      {!loading && !error && filteredContacts.length > 0 && (
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
                <div 
                  key={contact.id} 
                  className="group/item relative"
                >
                  <div className="relative bg-surface-elevated rounded-[var(--radius-lg)] p-6 border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-140">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            {getInitials(contactName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-text-primary">{contactName}</h3>
                          <Badge variant="outline" className="mt-1">
                            {getContactTypeLabel(contactType)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                          title="Editar contato"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          title="Excluir contato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-text-secondary">
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
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-text-secondary">{contactNotes}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-xs text-text-secondary">
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
                disabled={currentPage === 1 || loading}
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
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
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
                disabled={currentPage === totalPages || loading}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactOpen} onOpenChange={(open) => {
        setIsEditContactOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input 
                placeholder="Nome completo" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input 
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento</label>
              <Input 
                placeholder="CPF ou CNPJ"
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Contato</label>
              <Select 
                value={formData.contact_type} 
                onValueChange={(value) => setFormData({...formData, contact_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {contactTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea 
                className="resize-none" 
                rows={3}
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setIsEditContactOpen(false)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateContact} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty State - Modern Style */}
      {!loading && !error && filteredContacts.length === 0 && (
        <FluidSection
          title="Nenhum contato encontrado"
          subtitle={searchQuery || selectedType !== 'all' 
            ? 'Tente ajustar os filtros de busca'
            : 'Comece adicionando seu primeiro contato'
          }
          gradient="from-gray-400 to-gray-500"
        >
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-text-secondary mx-auto mb-4" />
            {!searchQuery && selectedType === 'all' && (
              <Button 
                onClick={() => setIsNewContactOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            )}
          </div>
        </FluidSection>
      )}
      </div>
    </div>
  )
}
