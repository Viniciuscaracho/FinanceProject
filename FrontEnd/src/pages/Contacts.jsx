import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertCircle
} from 'lucide-react'
import { apiService } from '../lib/api'

const contactTypes = [
  { label: 'Todos', value: 'all', count: 0 },
  { label: 'Associado', value: 'associado', count: 0 },
  { label: 'Cliente', value: 'cliente', count: 0 },
  { label: 'Colaborador', value: 'colaborador', count: 0 },
  { label: 'Fornecedor', value: 'fornecedor', count: 0 },
  { label: 'Sócio', value: 'socio', count: 0 },
  { label: 'Outro', value: 'outro', count: 0 },
]

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isNewContactOpen, setIsNewContactOpen] = useState(false)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Form state for new contact
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    notes: ''
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

  const handleCreateContact = async () => {
    try {
      setLoading(true)
      setError(null)

      await apiService.createContact(formData)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        document: '',
        notes: ''
      })
      
      setIsNewContactOpen(false)
      loadContacts() // Reload contacts
      
    } catch (error) {
      console.error('Error creating contact:', error)
      setError('Erro ao criar contato')
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
      loadContacts() // Reload contacts
      
    } catch (error) {
      console.error('Error deleting contact:', error)
      setError('Erro ao excluir contato')
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || contact.type?.toLowerCase() === selectedType
    return matchesSearch && matchesType
  })

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus clientes, fornecedores e parceiros</p>
        </div>

        <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
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
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <textarea 
                  className="w-full p-2 border rounded-md resize-none" 
                  rows={3}
                  placeholder="Observações adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewContactOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateContact} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
            <p className="text-gray-600">Carregando contatos...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contatos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contacts.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contatos carregados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Página Atual</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentPage}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              de {totalPages} páginas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              {contactTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="flex items-center space-x-2"
                >
                  <span>{type.label}</span>
                  {type.count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {type.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar contatos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {contact.type || 'Contato'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {contact.document && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>{contact.document}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{contact.notes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Criado em {formatDate(contact.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contato encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedType !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece adicionando seu primeiro contato'
              }
            </p>
            {!searchQuery && selectedType === 'all' && (
              <Button onClick={() => setIsNewContactOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

