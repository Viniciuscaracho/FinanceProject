import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiService } from '../lib/api'

export function Transactions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [selectedTransactions, setSelectedTransactions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [costCenters, setCostCenters] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // States for quick add modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isAddCostCenterOpen, setIsAddCostCenterOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newCostCenterName, setNewCostCenterName] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState('')

  // Form state for new transaction
  const [formData, setFormData] = useState({
    description: '',
    amount_cents: '',
    amount_currency: 'BRL',
    transaction_type_cd: 0,
    due_date: '',
    paid_at: '', // Data de pagamento efetivo
    category_id: '',
    cost_center_id: '',
    contact_id: '',
    bank_account_id: '1', // Use default bank account as initial value
    payment_method_cd: 0,
    payment_type_cd: 0,
    paid: false
  })

  // Form state for editing transaction
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount_cents: '',
    amount_currency: 'BRL',
    transaction_type_cd: 0,
    due_date: '',
    paid_at: '',
    category_id: '',
    cost_center_id: '',
    contact_id: '',
    bank_account_id: '1',
    payment_method_cd: 0,
    payment_type_cd: 0,
    paid: false
  })

  useEffect(() => {
    loadTransactions()
    loadFormData()
  }, [currentPage, selectedFilter])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {}
      if (selectedFilter !== 'all') {
        filters.transaction_type = selectedFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }

      const response = await apiService.getTransactions(currentPage, 20, filters)
      setTransactions(response.transactions || [])
      setTotalPages(response.meta?.total_pages || 1)
      setTotalCount(response.meta?.total_count || 0)

    } catch (error) {
      console.error('Error loading transactions:', error)
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const loadFormData = async () => {
    try {
      const [categoriesRes, costCentersRes, bankAccountsRes, contactsRes] = await Promise.all([
        apiService.getCategories(),
        apiService.getCostCenters(),
        apiService.getBankAccounts(),
        apiService.getContacts()
      ])

      setCategories(categoriesRes.categories || [])
      setCostCenters(costCentersRes.cost_centers || [])
      setBankAccounts(bankAccountsRes.bank_accounts || [])
      setContacts(contactsRes.contacts || [])
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }

  const handleCreateTransaction = async () => {
    try {
      setLoading(true)
      
      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(formData.amount_cents) * 100)
      
      // Convert Brazilian date format to ISO
      const dueDate = formData.due_date ? convertDateToISO(formData.due_date) : ''
      const paidAt = formData.paid_at ? convertDateToISO(formData.paid_at) : null
      
      // Clean up empty fields and convert to null
      const transactionData = {
        description: formData.description,
        amount_cents: amountInCents,
        amount_currency: formData.amount_currency,
        transaction_type_cd: formData.transaction_type_cd,
        due_date: dueDate,
        paid_at: paidAt,
        category_id: formData.category_id || null,
        cost_center_id: formData.cost_center_id || null,
        contact_id: formData.contact_id || null,
        bank_account_id: formData.bank_account_id || 1, // Use default bank account if none selected
        payment_method_cd: formData.payment_method_cd,
        payment_type_cd: formData.payment_type_cd,
        paid: formData.paid
      }

      await apiService.createTransaction(transactionData)
      
      // Reset form and close dialog
      setFormData({
        description: '',
        amount_cents: '',
        amount_currency: 'BRL',
        transaction_type_cd: 0,
        due_date: '',
        paid_at: '',
        category_id: '',
        cost_center_id: '',
        contact_id: '',
        bank_account_id: '1', // Reset to default bank account
        payment_method_cd: 0,
        payment_type_cd: 0,
        paid: false
      })
      setIsNewTransactionOpen(false)
      
      // Reload transactions
      loadTransactions()
      
    } catch (error) {
      console.error('Error creating transaction:', error)
      setError('Erro ao criar transação')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    
    // Convert amount from cents to decimal
    const amountInDecimal = transaction.amount_cents ? (transaction.amount_cents / 100).toFixed(2) : ''
    
    // Format dates for Brazilian format
    const dueDate = transaction.due_date ? formatDateForInput(transaction.due_date) : ''
    const paidAt = transaction.paid_at ? formatDateForInput(transaction.paid_at) : ''
    
    setEditFormData({
      description: transaction.description || transaction.name || '',
      amount_cents: amountInDecimal,
      amount_currency: transaction.amount_currency || 'BRL',
      transaction_type_cd: transaction.transaction_type_cd || 0,
      due_date: dueDate,
      paid_at: paidAt,
      category_id: transaction.category_id?.toString() || '',
      cost_center_id: transaction.cost_center_id?.toString() || '',
      contact_id: transaction.contact_id?.toString() || '',
      bank_account_id: transaction.bank_account_id?.toString() || '1',
      payment_method_cd: transaction.payment_method_cd || 0,
      payment_type_cd: transaction.payment_type_cd || 0,
      paid: transaction.paid || false
    })
    
    setIsEditTransactionOpen(true)
  }

  const handleUpdateTransaction = async () => {
    try {
      setLoading(true)
      
      // Convert amount to cents
      const amountInCents = Math.round(parseFloat(editFormData.amount_cents) * 100)
      
      // Convert Brazilian date format to ISO
      const dueDate = editFormData.due_date ? convertDateToISO(editFormData.due_date) : ''
      const paidAt = editFormData.paid_at ? convertDateToISO(editFormData.paid_at) : null
      
      // Clean up empty fields and convert to null
      const transactionData = {
        description: editFormData.description,
        amount_cents: amountInCents,
        amount_currency: editFormData.amount_currency,
        transaction_type_cd: editFormData.transaction_type_cd,
        due_date: dueDate,
        paid_at: paidAt,
        category_id: editFormData.category_id || null,
        cost_center_id: editFormData.cost_center_id || null,
        contact_id: editFormData.contact_id || null,
        bank_account_id: editFormData.bank_account_id || 1,
        payment_method_cd: editFormData.payment_method_cd,
        payment_type_cd: editFormData.payment_type_cd,
        paid: editFormData.paid
      }

      await apiService.updateTransaction(editingTransaction.id, transactionData)
      
      // Reset form and close dialog
      setEditFormData({
        description: '',
        amount_cents: '',
        amount_currency: 'BRL',
        transaction_type_cd: 0,
        due_date: '',
        paid_at: '',
        category_id: '',
        cost_center_id: '',
        contact_id: '',
        bank_account_id: '1',
        payment_method_cd: 0,
        payment_type_cd: 0,
        paid: false
      })
      setEditingTransaction(null)
      setIsEditTransactionOpen(false)
      
      // Reload transactions
      loadTransactions()
      
    } catch (error) {
      console.error('Error updating transaction:', error)
      setError('Erro ao atualizar transação')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        setError('Nome da categoria é obrigatório')
        return
      }

      // Verificar duplicata
      const hasDuplicate = checkDuplicate(newCategoryName, categories, 'categoria')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createCategory({ name: newCategoryName.trim() })
      
      // Adicionar nova categoria à lista
      setCategories([...categories, response.category])
      
      // Limpar formulário e fechar modal
      setNewCategoryName('')
      setIsAddCategoryOpen(false)
      setDuplicateWarning('')
      
    } catch (error) {
      console.error('Error creating category:', error)
      setError('Erro ao criar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async () => {
    try {
      if (!newContactName.trim()) {
        setError('Nome do contato é obrigatório')
        return
      }

      // Verificar duplicata
      const hasDuplicate = checkDuplicate(newContactName, contacts, 'contato')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createContact({ name: newContactName.trim() })
      
      // Adicionar novo contato à lista
      setContacts([...contacts, response.contact])
      
      // Limpar formulário e fechar modal
      setNewContactName('')
      setIsAddContactOpen(false)
      setDuplicateWarning('')
      
    } catch (error) {
      console.error('Error creating contact:', error)
      setError('Erro ao criar contato')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCostCenter = async () => {
    try {
      if (!newCostCenterName.trim()) {
        setError('Nome do centro de custo é obrigatório')
        return
      }

      // Verificar duplicata
      const hasDuplicate = checkDuplicate(newCostCenterName, costCenters, 'centro de custo')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createCostCenter({ name: newCostCenterName.trim() })
      
      // Adicionar novo centro de custo à lista
      setCostCenters([...costCenters, response.cost_center])
      
      // Limpar formulário e fechar modal
      setNewCostCenterName('')
      setIsAddCostCenterOpen(false)
      setDuplicateWarning('')
      
    } catch (error) {
      console.error('Error creating cost center:', error)
      setError('Erro ao criar centro de custo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return
    }

    try {
      await apiService.deleteTransaction(id)
      loadTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setError('Erro ao excluir transação')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Função para formatar data para o padrão brasileiro (dd/mm/aaaa)
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Função para converter data do formato brasileiro para ISO
  const convertDateToISO = (dateString) => {
    if (!dateString) return ''
    const parts = dateString.split('/')
    if (parts.length !== 3) return ''
    const [day, month, year] = parts
    return `${year}-${month}-${day}`
  }

  // Função para aplicar máscara de data brasileira
  const applyDateMask = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara dd/mm/aaaa
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

  // Função para validar formato de data brasileiro
  const isValidBrazilianDate = (dateString) => {
    if (!dateString) return false
    const parts = dateString.split('/')
    if (parts.length !== 3) return false
    
    const [day, month, year] = parts.map(Number)
    const date = new Date(year, month - 1, day)
    
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year
  }

  // Função para normalizar texto (remover acentos, converter para minúsculas)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .trim()
  }

  // Função para verificar duplicatas
  const checkDuplicate = (name, items, type) => {
    const normalizedName = normalizeText(name)
    const normalizedItems = items.map(item => normalizeText(item.name))
    
    const duplicate = normalizedItems.find(item => item === normalizedName)
    
    if (duplicate) {
      const originalItem = items.find(item => normalizeText(item.name) === normalizedName)
      setDuplicateWarning(`Já existe um ${type} com o nome "${originalItem.name}". Deseja continuar mesmo assim?`)
      return true
    }
    
    setDuplicateWarning('')
    return false
  }

  const getTransactionTypeLabel = (type) => {
    const types = {
      revenue: 'Receita',
      fixed_expense: 'Despesa Fixa',
      variable_expense: 'Despesa Variável',
      payroll: 'Folha de Pagamento',
      tax: 'Imposto',
      transfer: 'Transferência'
    }
    return types[type] || type
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Dinheiro',
      bank_transfer: 'Transferência Bancária',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      check: 'Cheque',
      pix: 'PIX'
    }
    return methods[method] || method
  }

  const getTransactionTypeColor = (type) => {
    const colors = {
      revenue: 'bg-green-100 text-green-800',
      fixed_expense: 'bg-red-100 text-red-800',
      variable_expense: 'bg-orange-100 text-orange-800',
      payroll: 'bg-blue-100 text-blue-800',
      tax: 'bg-yellow-100 text-yellow-800',
      transfer: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || transaction.transaction_type_cd === parseInt(selectedFilter)
    return matchesSearch && matchesFilter
  })

  const filters = [
    { label: 'Todos', value: 'all', count: totalCount },
    { label: 'Receitas', value: '0', count: transactions.filter(t => t.transaction_type_cd === 0).length },
    { label: 'Despesas', value: '1', count: transactions.filter(t => t.transaction_type_cd >= 1 && t.transaction_type_cd <= 4).length },
    { label: 'Transferências', value: '5', count: transactions.filter(t => t.transaction_type_cd === 5).length },
  ]

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-600">Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600 mt-1 text-xs lg:text-sm xl:text-base">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="whitespace-nowrap">
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exp</span>
          </Button>
          <Dialog open={isNewTransactionOpen} onOpenChange={setIsNewTransactionOpen}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap preserve-colors">
                <Plus className="w-4 h-4 mr-1 sm:mr-2 preserve-colors" />
                <span className="hidden sm:inline preserve-colors">Nova Transação</span>
                <span className="sm:hidden preserve-colors">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl preserve-colors">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição da transação"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount_cents}
                    onChange={(e) => setFormData({...formData, amount_cents: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select 
                    value={formData.transaction_type_cd.toString()} 
                    onValueChange={(value) => setFormData({...formData, transaction_type_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Receita</SelectItem>
                      <SelectItem value="1">Despesa Fixa</SelectItem>
                      <SelectItem value="2">Despesa Variável</SelectItem>
                      <SelectItem value="3">Folha de Pagamento</SelectItem>
                      <SelectItem value="4">Imposto</SelectItem>
                      <SelectItem value="5">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={formData.due_date}
                    onChange={(e) => {
                      const value = e.target.value
                      const maskedValue = applyDateMask(value)
                      setFormData({...formData, due_date: maskedValue})
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value && isValidBrazilianDate(value)) {
                        // Data válida, manter como está
                      } else if (value && !isValidBrazilianDate(value)) {
                        // Data inválida, limpar o campo
                        setFormData({...formData, due_date: ''})
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Pagamento Efetivo</label>
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={formData.paid_at}
                    onChange={(e) => {
                      const value = e.target.value
                      const maskedValue = applyDateMask(value)
                      setFormData({...formData, paid_at: maskedValue})
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value && isValidBrazilianDate(value)) {
                        // Data válida, manter como está
                      } else if (value && !isValidBrazilianDate(value)) {
                        // Data inválida, limpar o campo
                        setFormData({...formData, paid_at: ''})
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.category_id 
                          ? categories.find(c => c.id.toString() === formData.category_id)?.name || 'Selecione uma categoria'
                          : 'Selecione uma categoria'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Categorias Existentes</DropdownMenuLabel>
                      {categories.map((category) => (
                        <DropdownMenuItem 
                          key={category.id}
                          onClick={() => setFormData({...formData, category_id: category.id.toString()})}
                          className="cursor-pointer"
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddCategoryOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Nova Categoria
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centro de Custo</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.cost_center_id 
                          ? costCenters.find(c => c.id.toString() === formData.cost_center_id)?.name || 'Selecione um centro de custo'
                          : 'Selecione um centro de custo'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Centros de Custo Existentes</DropdownMenuLabel>
                      {costCenters.map((costCenter) => (
                        <DropdownMenuItem 
                          key={costCenter.id}
                          onClick={() => setFormData({...formData, cost_center_id: costCenter.id.toString()})}
                          className="cursor-pointer"
                        >
                          {costCenter.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddCostCenterOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Novo Centro de Custo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contato</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {formData.contact_id 
                          ? contacts.find(c => c.id.toString() === formData.contact_id)?.name || 'Selecione um contato'
                          : 'Selecione um contato'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Contatos Existentes</DropdownMenuLabel>
                      {contacts.map((contact) => (
                        <DropdownMenuItem 
                          key={contact.id}
                          onClick={() => setFormData({...formData, contact_id: contact.id.toString()})}
                          className="cursor-pointer"
                        >
                          {contact.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddContactOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Novo Contato
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta Bancária</label>
                  <Select 
                    value={formData.bank_account_id?.toString() || '1'} 
                    onValueChange={(value) => setFormData({...formData, bank_account_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.name}</span>
                            {account.default && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pagamento</label>
                  <Select 
                    value={formData.payment_method_cd.toString()} 
                    onValueChange={(value) => setFormData({...formData, payment_method_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Indefinido</SelectItem>
                      <SelectItem value="1">Dinheiro</SelectItem>
                      <SelectItem value="2">Cartão de Crédito</SelectItem>
                      <SelectItem value="3">Cartão de Débito</SelectItem>
                      <SelectItem value="4">PIX</SelectItem>
                      <SelectItem value="5">Transferência</SelectItem>
                      <SelectItem value="6">Boleto</SelectItem>
                      <SelectItem value="7">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Pagamento</label>
                  <Select 
                    value={formData.payment_type_cd.toString()} 
                    onValueChange={(value) => setFormData({...formData, payment_type_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">À vista</SelectItem>
                      <SelectItem value="1">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={formData.paid.toString()} 
                    onValueChange={(value) => setFormData({...formData, paid: value === 'true'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Pendente</SelectItem>
                      <SelectItem value="true">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsNewTransactionOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTransaction} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Criar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Transaction Modal */}
          <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
            <DialogContent className="max-w-2xl preserve-colors">
              <DialogHeader>
                <DialogTitle>Editar Transação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    placeholder="Descrição da transação"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editFormData.amount_cents}
                    onChange={(e) => setEditFormData({...editFormData, amount_cents: e.target.value})}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select 
                    value={editFormData.transaction_type_cd.toString()} 
                    onValueChange={(value) => setEditFormData({...editFormData, transaction_type_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Receita</SelectItem>
                      <SelectItem value="1">Despesa Fixa</SelectItem>
                      <SelectItem value="2">Despesa Variável</SelectItem>
                      <SelectItem value="3">Folha de Pagamento</SelectItem>
                      <SelectItem value="4">Imposto</SelectItem>
                      <SelectItem value="5">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={editFormData.due_date}
                    onChange={(e) => {
                      const value = e.target.value
                      const maskedValue = applyDateMask(value)
                      setEditFormData({...editFormData, due_date: maskedValue})
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value && isValidBrazilianDate(value)) {
                        // Data válida, manter como está
                      } else if (value && !isValidBrazilianDate(value)) {
                        // Data inválida, limpar o campo
                        setEditFormData({...editFormData, due_date: ''})
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Pagamento Efetivo</label>
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={editFormData.paid_at}
                    onChange={(e) => {
                      const value = e.target.value
                      const maskedValue = applyDateMask(value)
                      setEditFormData({...editFormData, paid_at: maskedValue})
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value && isValidBrazilianDate(value)) {
                        // Data válida, manter como está
                      } else if (value && !isValidBrazilianDate(value)) {
                        // Data inválida, limpar o campo
                        setEditFormData({...editFormData, paid_at: ''})
                      }
                    }}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {editFormData.category_id 
                          ? categories.find(c => c.id.toString() === editFormData.category_id)?.name || 'Selecione uma categoria'
                          : 'Selecione uma categoria'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Categorias Existentes</DropdownMenuLabel>
                      {categories.map((category) => (
                        <DropdownMenuItem 
                          key={category.id}
                          onClick={() => setEditFormData({...editFormData, category_id: category.id.toString()})}
                          className="cursor-pointer"
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddCategoryOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Nova Categoria
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Centro de Custo</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {editFormData.cost_center_id 
                          ? costCenters.find(c => c.id.toString() === editFormData.cost_center_id)?.name || 'Selecione um centro de custo'
                          : 'Selecione um centro de custo'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Centros de Custo Existentes</DropdownMenuLabel>
                      {costCenters.map((costCenter) => (
                        <DropdownMenuItem 
                          key={costCenter.id}
                          onClick={() => setEditFormData({...editFormData, cost_center_id: costCenter.id.toString()})}
                          className="cursor-pointer"
                        >
                          {costCenter.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddCostCenterOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Novo Centro de Custo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contato</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {editFormData.contact_id 
                          ? contacts.find(c => c.id.toString() === editFormData.contact_id)?.name || 'Selecione um contato'
                          : 'Selecione um contato'
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[200px]">
                      <DropdownMenuLabel>Contatos Existentes</DropdownMenuLabel>
                      {contacts.map((contact) => (
                        <DropdownMenuItem 
                          key={contact.id}
                          onClick={() => setEditFormData({...editFormData, contact_id: contact.id.toString()})}
                          className="cursor-pointer"
                        >
                          {contact.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setIsAddContactOpen(true)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Novo Contato
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conta Bancária</label>
                  <Select 
                    value={editFormData.bank_account_id?.toString() || '1'} 
                    onValueChange={(value) => setEditFormData({...editFormData, bank_account_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.name}</span>
                            {account.default && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pagamento</label>
                  <Select 
                    value={editFormData.payment_method_cd.toString()} 
                    onValueChange={(value) => setEditFormData({...editFormData, payment_method_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Indefinido</SelectItem>
                      <SelectItem value="1">Dinheiro</SelectItem>
                      <SelectItem value="2">Cartão de Crédito</SelectItem>
                      <SelectItem value="3">Cartão de Débito</SelectItem>
                      <SelectItem value="4">PIX</SelectItem>
                      <SelectItem value="5">Transferência</SelectItem>
                      <SelectItem value="6">Boleto</SelectItem>
                      <SelectItem value="7">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Pagamento</label>
                  <Select 
                    value={editFormData.payment_type_cd.toString()} 
                    onValueChange={(value) => setEditFormData({...editFormData, payment_type_cd: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">À vista</SelectItem>
                      <SelectItem value="1">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editFormData.paid.toString()} 
                    onValueChange={(value) => setEditFormData({...editFormData, paid: value === 'true'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Pendente</SelectItem>
                      <SelectItem value="true">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditTransactionOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateTransaction} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Atualizar Transação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Add Category Modal */}
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogContent className="max-w-lg preserve-colors">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-base font-medium">Nome da Categoria</label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Digite o nome da categoria"
                    className="text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory()
                      }
                    }}
                  />
                </div>
                {duplicateWarning && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{duplicateWarning}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddCategoryOpen(false)
                    setNewCategoryName('')
                    setDuplicateWarning('')
                  }}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCategory} 
                  disabled={loading || !newCategoryName.trim()}
                  className="px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Criar Categoria
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Add Contact Modal */}
          <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
            <DialogContent className="max-w-lg preserve-colors">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Contato</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-base font-medium">Nome do Contato</label>
                  <Input
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Digite o nome do contato"
                    className="text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateContact()
                      }
                    }}
                  />
                </div>
                {duplicateWarning && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{duplicateWarning}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddContactOpen(false)
                    setNewContactName('')
                    setDuplicateWarning('')
                  }}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateContact} 
                  disabled={loading || !newContactName.trim()}
                  className="px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Criar Contato
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Add Cost Center Modal */}
          <Dialog open={isAddCostCenterOpen} onOpenChange={setIsAddCostCenterOpen}>
            <DialogContent className="max-w-lg preserve-colors">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Centro de Custo</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-base font-medium">Nome do Centro de Custo</label>
                  <Input
                    value={newCostCenterName}
                    onChange={(e) => setNewCostCenterName(e.target.value)}
                    placeholder="Digite o nome do centro de custo"
                    className="text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCostCenter()
                      }
                    }}
                  />
                </div>
                {duplicateWarning && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{duplicateWarning}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddCostCenterOpen(false)
                    setNewCostCenterName('')
                    setDuplicateWarning('')
                  }}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCostCenter} 
                  disabled={loading || !newCostCenterName.trim()}
                  className="px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Criar Centro de Custo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar transações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1 lg:gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter.value)}
              className="whitespace-nowrap text-xs lg:text-sm preserve-colors"
            >
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-2 lg:p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-500" />
          <p className="text-red-700 text-sm lg:text-base">{error}</p>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            <Table className="table-fixed">
              <TableHeader className="sticky top-0 bg-white z-10 preserve-colors">
                <TableRow>
                  <TableHead className="w-[90px] lg:w-[100px] whitespace-nowrap text-xs lg:text-sm">Vencimento</TableHead>
                  <TableHead className="w-[90px] lg:w-[100px] whitespace-nowrap text-xs lg:text-sm">Pagamento</TableHead>
                  <TableHead className="w-[200px] lg:w-[250px] text-xs lg:text-sm">Descrição</TableHead>
                  <TableHead className="w-[120px] lg:w-[150px] text-xs lg:text-sm">Categoria</TableHead>
                  <TableHead className="w-[120px] lg:w-[150px] text-xs lg:text-sm">Contato</TableHead>
                  <TableHead className="w-[90px] lg:w-[100px] whitespace-nowrap text-xs lg:text-sm">Valor</TableHead>
                  <TableHead className="w-[80px] lg:w-[100px] whitespace-nowrap text-xs lg:text-sm">Tipo</TableHead>
                  <TableHead className="w-[100px] lg:w-[120px] text-xs lg:text-sm">Método</TableHead>
                  <TableHead className="w-[70px] lg:w-[80px] whitespace-nowrap text-xs lg:text-sm">Status</TableHead>
                  <TableHead className="w-[80px] lg:w-[100px] text-right whitespace-nowrap text-xs lg:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="align-top cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleEditTransaction(transaction)}
                  >
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      {transaction.formatted_due_date || formatDate(transaction.due_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs lg:text-sm">
                      {transaction.formatted_paid_at || formatDate(transaction.paid_at)}
                    </TableCell>
                    <TableCell className="w-[200px] lg:w-[250px]">
                      <div className="break-words font-medium text-xs lg:text-sm leading-tight" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {transaction.name || transaction.description || 'Sem descrição'}
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] lg:w-[150px]">
                      <div className="break-words text-xs lg:text-sm leading-tight" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {transaction.category?.name || 'Sem categoria'}
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px] lg:w-[150px]">
                      <div className="break-words text-xs lg:text-sm leading-tight" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {transaction.contact?.name || 'Sem contato'}
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      'font-semibold whitespace-nowrap text-xs lg:text-sm',
                      transaction.transaction_type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.transaction_type === 'revenue' ? '+' : '-'}
                      {formatCurrency(transaction.formatted_amount || transaction.amount_cents)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={cn(getTransactionTypeColor(transaction.transaction_type), 'text-xs')}>
                        {transaction.transaction_type_name || getTransactionTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[100px] lg:w-[120px]">
                      <div className="break-words text-xs lg:text-sm leading-tight" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                        {transaction.payment_method_name || getPaymentMethodLabel(transaction.payment_method_cd)}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={transaction.paid ? 'default' : 'secondary'} className="text-xs">
                        {transaction.paid ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 lg:h-8 lg:w-8 p-0 preserve-colors"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Edit className="h-3 w-3 lg:h-4 lg:w-4 preserve-colors" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 lg:h-8 lg:w-8 p-0 preserve-colors"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 preserve-colors" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs lg:text-sm text-gray-500">
            Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, totalCount)} de {totalCount} transações
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-xs lg:text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

