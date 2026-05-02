import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  ChevronDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Circle,
  X
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { apiService } from '../lib/api'
import { useIsMobile } from '@/hooks/use-mobile'
import { StatCard, FluidSection } from '@/components/design'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction, transactionKeys } from '@/hooks/useTransactions'
import { useQueryClient } from '@tanstack/react-query'
import { useCategories, useCostCenters, useBankAccounts, useContacts, useTags } from '@/hooks/useFormData'
import { Wizard } from '@/components/ui/wizard'
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const convertDateToISO = (dateString) => {
  if (!dateString) return ''
  const parts = dateString.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts
  return `${year}-${month}-${day}`
}

// Função para quebrar texto a cada X palavras
const formatDescriptionWithBreaks = (text, wordsPerLine = 6) => {
  if (!text) return ''
  // Remove quebras de linha existentes e divide por espaços
  const cleanText = text.replace(/\n+/g, ' ').trim()
  const words = cleanText.split(/\s+/).filter(word => word.length > 0)
  if (words.length === 0) return ''
  
  const lines = []
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '))
  }
  return lines.join('\n')
}

export function Transactions() {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const location = useLocation()
  const initialFilterApplied = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false) // Começar com filtros ocultos para destacar a tabela
  const [showMoreFilters, setShowMoreFilters] = useState(false) // Estado para mostrar mais filtros
  
  // Estados dos filtros avançados
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [selectedCostCenterIds, setSelectedCostCenterIds] = useState([])
  const [selectedBankAccountIds, setSelectedBankAccountIds] = useState([])
  const [selectedContactIds, setSelectedContactIds] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState([])
  const [includePaid, setIncludePaid] = useState(true)
  const [includeUnpaid, setIncludeUnpaid] = useState(true)
  const [dateType, setDateType] = useState('payment') // 'payment' | 'competency'
  
  // Debounced search query para evitar muitas requisições
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // React Query hooks
  const filters = useMemo(() => {
    const f = {}
    if (selectedFilter !== 'all') {
      f.transaction_type = selectedFilter
    }
    if (debouncedSearchQuery) {
      f.search = debouncedSearchQuery
    }
    if (startDate) {
      // Converter data do formato brasileiro (dd/mm/aaaa) para ISO (aaaa-mm-dd)
      const isoStartDate = convertDateToISO(startDate)
      if (isoStartDate) {
        f.start_date = isoStartDate
      }
    }
    if (endDate) {
      // Converter data do formato brasileiro (dd/mm/aaaa) para ISO (aaaa-mm-dd)
      const isoEndDate = convertDateToISO(endDate)
      if (isoEndDate) {
        f.end_date = isoEndDate
      }
    }
    if (selectedCategoryIds.length > 0) {
      f.category_ids = selectedCategoryIds
    }
    if (selectedCostCenterIds.length > 0) {
      f.cost_center_ids = selectedCostCenterIds
    }
    if (selectedBankAccountIds.length > 0) {
      f.bank_account_ids = selectedBankAccountIds
    }
    if (selectedContactIds.length > 0) {
      f.contact_ids = selectedContactIds
    }
    if (selectedTagIds.length > 0) {
      f.tag_ids = selectedTagIds
    }
    if (selectedPaymentMethods.length > 0) {
      f.payment_methods = selectedPaymentMethods
    }
    if (selectedPaymentTypes.length > 0) {
      f.payment_types = selectedPaymentTypes
    }
    // Quando nenhum está marcado, forçar resultado vazio enviando filtro impossível
    if (!includePaid && !includeUnpaid) {
      f.paid = ['__none__']
    } else if (includePaid && !includeUnpaid) {
      f.paid = ['true']
    } else if (!includePaid && includeUnpaid) {
      f.paid = ['false']
    }
    // ambos marcados → sem filtro (backend retorna tudo)
    if (dateType) {
      f.date_type = dateType
    }
    return f
  }, [
    selectedFilter, 
    debouncedSearchQuery, 
    startDate, 
    endDate, 
    selectedCategoryIds, 
    selectedCostCenterIds, 
    selectedBankAccountIds, 
    selectedContactIds, 
    selectedTagIds, 
    selectedPaymentMethods, 
    selectedPaymentTypes, 
    includePaid, 
    includeUnpaid, 
    dateType
  ])
  
  // Aplicar filtros/pesquisa ao navegar a partir do dashboard
  useEffect(() => {
    if (initialFilterApplied.current || !location.state) return
    initialFilterApplied.current = true

    const { filter, search } = location.state

    if (search) {
      setSearchQuery(search)
      setDebouncedSearchQuery(search)
    }

    const formatDate = (d) => {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    }

    if (filter === 'today') {
      const today = new Date()
      setStartDate(formatDate(today))
      setEndDate(formatDate(today))
      setShowFilters(true)
    } else if (filter === 'overdue') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setEndDate(formatDate(yesterday))
      setIncludePaid(false)
      setIncludeUnpaid(true)
      setShowFilters(true)
    }
  }, [location.state])

  const { data: transactionsData, isLoading: loadingTransactions, error: transactionsError } = useTransactions(currentPage, 20, filters)
  const { data: categoriesData, isLoading: loadingCategories } = useCategories()
  const { data: costCentersData, isLoading: loadingCostCenters } = useCostCenters()
  const { data: bankAccountsData, isLoading: loadingBankAccounts } = useBankAccounts()
  const { data: contactsData, isLoading: loadingContacts } = useContacts()
  const { data: tagsData, isLoading: loadingTags } = useTags()
  
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  
  // Extrair dados das respostas
  const transactions = transactionsData?.transactions || []
  const totalPages = transactionsData?.meta?.total_pages || 1
  const totalCount = transactionsData?.meta?.total_count || 0
  const categories = categoriesData?.categories || []
  const costCenters = costCentersData?.cost_centers || []
  const bankAccounts = bankAccountsData?.bank_accounts || []
  const contacts = contactsData?.contacts || []
  const tags = tagsData?.tags || []
  
  const loading = loadingTransactions || loadingCategories || loadingCostCenters || loadingBankAccounts || loadingContacts || loadingTags
  const error = transactionsError?.message || null

  // States for quick add modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isAddCostCenterOpen, setIsAddCostCenterOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [newCostCenterName, setNewCostCenterName] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState('')
  const [expiringRecurrences, setExpiringRecurrences] = useState([])
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false)
  const [selectedRecurrence, setSelectedRecurrence] = useState(null)
  const [showEditInstallmentsDialog, setShowEditInstallmentsDialog] = useState(false)
  const [editingPaymentPlan, setEditingPaymentPlan] = useState(null)
  const [installmentsData, setInstallmentsData] = useState([])
  const [loadingInstallments, setLoadingInstallments] = useState(false)

  // Form state for new transaction
  const [formData, setFormData] = useState({
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

  // Payment plan state
  const [paymentPlan, setPaymentPlan] = useState({
    enabled: false,
    type: 'installment', // 'installment' ou 'recurring'
    number_of_installments: 2,
    frequency: 'monthly', // 'daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'
    amount_type: 'total_amount' // 'total_amount' ou 'installment_amount'
  })

  // Quick add form state (campos essenciais apenas)
  const getTodayDate = () => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  const [quickAddData, setQuickAddData] = useState({
    description: '',
    amount_cents: '',
    due_date: getTodayDate(),
    paid: false,
    transaction_type_cd: 0 // Receita por padrão
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

  // Verificar recorrências próximas do fim
  useEffect(() => {
    const checkRecurrences = async () => {
      try {
        const response = await apiService.checkRecurrenceExpiry()
        if (response.expiring_recurrences && response.expiring_recurrences.length > 0) {
          setExpiringRecurrences(response.expiring_recurrences)
          // Mostrar diálogo apenas se não estiver já aberto e houver recorrências
          setShowRecurrenceDialog(prev => {
            if (!prev && response.expiring_recurrences.length > 0) {
              setSelectedRecurrence(response.expiring_recurrences[0])
              return true
            }
            return prev
          })
        } else {
          setExpiringRecurrences([])
        }
      } catch (error) {
        console.error('Erro ao verificar recorrências:', error)
      }
    }

    // Verificar imediatamente e depois a cada 5 minutos
    checkRecurrences()
    const interval = setInterval(checkRecurrences, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Debounce para busca - reset página quando busca muda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (currentPage !== 1) {
        setCurrentPage(1) // Reset para primeira página ao buscar
      }
    }, 500) // Aguarda 500ms após parar de digitar

    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Reset página quando filtro muda
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedFilter])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const revenue = transactions
      .filter(t => t.transaction_type_cd === 0)
      .reduce((sum, t) => sum + (parseFloat(t.amount_cents || 0) / 100), 0)
    
    const expenses = transactions
      .filter(t => t.transaction_type_cd >= 1 && t.transaction_type_cd <= 4)
      .reduce((sum, t) => sum + (parseFloat(t.amount_cents || 0) / 100), 0)
    
    const balance = revenue - expenses

    return { revenue, expenses, balance }
  }, [transactions])

  const handleQuickAdd = () => {
    // Validações básicas
    if (!quickAddData.description || quickAddData.description.trim() === '') {
      alert('Por favor, preencha a descrição da transação')
      return
    }
    
    if (!quickAddData.amount_cents || parseFloat(quickAddData.amount_cents) <= 0) {
      alert('Por favor, informe um valor válido maior que zero')
      return
    }
    
    if (!quickAddData.due_date) {
      alert('Por favor, informe a data de vencimento')
      return
    }
    
    const amountInCents = Math.round(parseFloat(quickAddData.amount_cents) * 100)
    const dueDate = convertDateToISO(quickAddData.due_date)
    
    // Usar primeira conta bancária disponível ou padrão
    const bankAccountId = bankAccounts.length > 0 ? bankAccounts[0].id : 1
    
    const transactionData = {
      transaction: {
        name: quickAddData.description.trim(),
        description: quickAddData.description.trim(),
        amount_cents: amountInCents,
        amount_currency: 'BRL',
        transaction_type_cd: quickAddData.transaction_type_cd || 0,
        due_date: dueDate,
        paid_at: quickAddData.paid ? new Date().toISOString().split('T')[0] : null,
        bank_account_id: bankAccountId,
        payment_method_cd: 0,
        payment_type_cd: 0,
        paid: quickAddData.paid || false
      }
    }

    console.log('📤 Enviando transação rápida:', transactionData)
    
    createTransaction.mutate(transactionData, {
      onSuccess: () => {
        setQuickAddData({
          description: '',
          amount_cents: '',
          due_date: getTodayDate(),
          paid: false,
          transaction_type_cd: 0
        })
        setIsQuickAddOpen(false)
        // Focar no campo de descrição para próximo lançamento rápido
        setTimeout(() => {
          const descInput = document.getElementById('quick-description')
          descInput?.focus()
        }, 100)
      },
      onError: (error) => {
        console.error('Error creating transaction:', error)
        const errorMessage = error?.data?.errors?.join?.('\n') || 
                            error?.data?.error || 
                            error?.message || 
                            'Erro ao criar transação. Verifique os dados e tente novamente.'
        alert(errorMessage)
      }
    })
  }

  const handleCreateTransaction = () => {
    // Validações básicas
      if (!formData.description || formData.description.trim() === '') {
        alert('Por favor, preencha a descrição da transação')
        return
      }
      
      if (!formData.amount_cents || parseFloat(formData.amount_cents) <= 0) {
        alert('Por favor, informe um valor válido maior que zero')
        return
      }
      
      if (!formData.due_date) {
        alert('Por favor, informe a data de vencimento')
        return
      }
      
      const amountInCents = Math.round(parseFloat(formData.amount_cents) * 100)
      const dueDate = convertDateToISO(formData.due_date)
      const paidAt = formData.paid_at ? convertDateToISO(formData.paid_at) : null
      
      // Converter IDs de string para inteiro ou null
      const categoryId = formData.category_id && formData.category_id !== '' 
        ? parseInt(formData.category_id) 
        : null
      const costCenterId = formData.cost_center_id && formData.cost_center_id !== '' 
        ? parseInt(formData.cost_center_id) 
        : null
      const contactId = formData.contact_id && formData.contact_id !== '' 
        ? parseInt(formData.contact_id) 
        : null
      const bankAccountId = formData.bank_account_id 
        ? parseInt(formData.bank_account_id) 
        : 1
      
      const transactionData = {
        transaction: {
          name: formData.description.trim(), // name é usado como título principal
          description: formData.description.trim(),
          amount_cents: amountInCents,
          amount_currency: formData.amount_currency || 'BRL',
          transaction_type_cd: formData.transaction_type_cd || 0,
          due_date: dueDate,
          paid_at: paidAt,
          category_id: categoryId,
          cost_center_id: costCenterId,
          contact_id: contactId,
          bank_account_id: bankAccountId,
          payment_method_cd: formData.payment_method_cd || 0,
          payment_type_cd: formData.payment_type_cd || 0,
          paid: formData.paid || false
        }
      }

      // Adicionar payment_plan se habilitado
      if (paymentPlan.enabled) {
        // Para recorrência, usar número máximo de meses (12 meses) sem mostrar ao cliente
        const numberOfInstallments = paymentPlan.type === 'recurring' 
          ? 12  // Máximo de 12 meses para recorrência
          : paymentPlan.number_of_installments
        
        transactionData.payment_plan = {
          type: paymentPlan.type,
          amount_type: paymentPlan.type === 'recurring' ? 'installment_amount' : paymentPlan.amount_type,
          number_of_installments: numberOfInstallments,
          frequency: paymentPlan.frequency
        }
        
        // O amount_cents sempre representa o valor informado pelo usuário
        // O backend vai calcular se é total ou por parcela baseado no amount_type
        transactionData.transaction.amount_cents = amountInCents
      }

      console.log('📤 Enviando transação:', transactionData)
      
      // Usar mutate em vez de mutateAsync para melhor UX (não bloquear UI)
      createTransaction.mutate(transactionData, {
        onSuccess: (data) => {
          // Se foi criado com parcelas, oferecer opção de editar
          if (data.installments && data.installments.length > 0) {
            const shouldEdit = confirm(
              `Transação criada com ${data.installments.length} parcelas!\n\nDeseja editar as parcelas agora?`
            )
            
            if (shouldEdit) {
              // Preparar dados para edição
              const installments = data.installments.map(inst => ({
                id: inst.id,
                installment_number: inst.installment_number,
                amount_cents: (inst.amount_cents / 100).toFixed(2),
                due_date: formatDateForInput(inst.due_date),
                paid: inst.paid,
                paid_at: inst.paid_at ? formatDateForInput(inst.paid_at) : '',
                description: inst.description || inst.name || '',
                name: inst.name || '',
                category_id: inst.category_id,
                cost_center_id: inst.cost_center_id,
                contact_id: inst.contact_id,
                bank_account_id: inst.bank_account_id
              }))
              
              setInstallmentsData(installments)
              setEditingPaymentPlan(data.transaction.payment_plan_id)
              setShowEditInstallmentsDialog(true)
            }
          }
          
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
            bank_account_id: '1',
            payment_method_cd: 0,
            payment_type_cd: 0,
            paid: false
          })
          setPaymentPlan({
            enabled: false,
            type: 'installment',
            number_of_installments: 2,
            frequency: 'monthly',
            amount_type: 'total_amount'
          })
          setIsNewTransactionOpen(false)
        },
        onError: (error) => {
          console.error('Error creating transaction:', error)
          // Mostrar mensagem de erro mais detalhada
          const errorMessage = error?.data?.errors?.join?.('\n') || 
                              error?.data?.error || 
                              error?.message || 
                              'Erro ao criar transação. Verifique os dados e tente novamente.'
          alert(errorMessage)
        }
      })
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    
    const amountInDecimal = transaction.amount_cents ? (transaction.amount_cents / 100).toFixed(2) : ''
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
      // Validações básicas
      if (!editFormData.description || editFormData.description.trim() === '') {
        alert('Por favor, preencha a descrição da transação')
        return
      }
      
      if (!editFormData.amount_cents || parseFloat(editFormData.amount_cents) <= 0) {
        alert('Por favor, informe um valor válido maior que zero')
        return
      }
      
      if (!editFormData.due_date) {
        alert('Por favor, informe a data de vencimento')
        return
      }
      
      const amountInCents = Math.round(parseFloat(editFormData.amount_cents) * 100)
      const dueDate = convertDateToISO(editFormData.due_date)
      const paidAt = editFormData.paid_at ? convertDateToISO(editFormData.paid_at) : null
      
      // Converter IDs de string para inteiro ou null
      const categoryId = editFormData.category_id && editFormData.category_id !== '' 
        ? parseInt(editFormData.category_id) 
        : null
      const costCenterId = editFormData.cost_center_id && editFormData.cost_center_id !== '' 
        ? parseInt(editFormData.cost_center_id) 
        : null
      const contactId = editFormData.contact_id && editFormData.contact_id !== '' 
        ? parseInt(editFormData.contact_id) 
        : null
      const bankAccountId = editFormData.bank_account_id 
        ? parseInt(editFormData.bank_account_id) 
        : 1
      
      const transactionData = {
        name: editFormData.description.trim(), // name é usado como título principal
        description: editFormData.description.trim(),
        amount_cents: amountInCents,
        amount_currency: editFormData.amount_currency || 'BRL',
        transaction_type_cd: editFormData.transaction_type_cd || 0,
        due_date: dueDate,
        paid_at: paidAt,
        category_id: categoryId,
        cost_center_id: costCenterId,
        contact_id: contactId,
        bank_account_id: bankAccountId,
        payment_method_cd: editFormData.payment_method_cd || 0,
        payment_type_cd: editFormData.payment_type_cd || 0,
        paid: editFormData.paid || false
      }

      console.log('📤 Atualizando transação:', transactionData)
      await updateTransaction.mutateAsync({ id: editingTransaction.id, data: transactionData })
      
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
      
    } catch (error) {
      console.error('Error updating transaction:', error)
      // Mostrar mensagem de erro mais detalhada
      const errorMessage = error?.data?.errors?.join?.('\n') || 
                          error?.data?.error || 
                          error?.message || 
                          'Erro ao atualizar transação. Verifique os dados e tente novamente.'
      alert(errorMessage)
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        setError('Nome da categoria é obrigatório')
        return
      }

      const hasDuplicate = checkDuplicate(newCategoryName, categories, 'categoria')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createCategory({ name: newCategoryName.trim() })
      
      setCategories([...categories, response.category])
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

      const hasDuplicate = checkDuplicate(newContactName, contacts, 'contato')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createContact({ name: newContactName.trim() })
      
      setContacts([...contacts, response.contact])
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

      const hasDuplicate = checkDuplicate(newCostCenterName, costCenters, 'centro de custo')
      
      if (hasDuplicate && !confirm(duplicateWarning)) {
        return
      }

      setLoading(true)
      const response = await apiService.createCostCenter({ name: newCostCenterName.trim() })
      
      setCostCenters([...costCenters, response.cost_center])
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
      await deleteTransaction.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleEditInstallments = async (transaction) => {
    if (!transaction.payment_plan_id) {
      alert('Esta transação não possui parcelas para editar')
      return
    }

    setLoadingInstallments(true)
    setEditingPaymentPlan(transaction.payment_plan_id)
    
    try {
      const response = await apiService.getPaymentPlanInstallments(transaction.payment_plan_id)
      
      // Preparar dados para edição
      const installments = response.installments.map(inst => ({
        id: inst.id,
        installment_number: inst.installment_number,
        amount_cents: (inst.amount_cents / 100).toFixed(2),
        due_date: formatDateForInput(inst.due_date),
        paid: inst.paid,
        paid_at: inst.paid_at ? formatDateForInput(inst.paid_at) : '',
        description: inst.description || inst.name || '',
        name: inst.name || '',
        category_id: inst.category_id,
        cost_center_id: inst.cost_center_id,
        contact_id: inst.contact_id,
        bank_account_id: inst.bank_account_id
      }))
      
      setInstallmentsData(installments)
      setShowEditInstallmentsDialog(true)
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error)
      alert('Erro ao carregar parcelas. Tente novamente.')
    } finally {
      setLoadingInstallments(false)
    }
  }

  const handleUpdateInstallments = async () => {
    if (!editingPaymentPlan) return

    setLoadingInstallments(true)
    
    try {
      // Preparar dados para envio
      const installmentsToUpdate = installmentsData.map(inst => ({
        id: inst.id,
        amount_cents: parseFloat(inst.amount_cents) || 0,
        due_date: convertDateToISO(inst.due_date),
        paid: inst.paid,
        paid_at: inst.paid && inst.paid_at ? convertDateToISO(inst.paid_at) : null,
        description: inst.description,
        name: inst.name,
        category_id: inst.category_id || null,
        cost_center_id: inst.cost_center_id || null,
        contact_id: inst.contact_id || null,
        bank_account_id: inst.bank_account_id || null
      }))

      await apiService.updatePaymentPlanInstallments(editingPaymentPlan, installmentsToUpdate)
      
      // Invalidar cache e recarregar
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      
      setShowEditInstallmentsDialog(false)
      setEditingPaymentPlan(null)
      setInstallmentsData([])
      
      alert('Parcelas atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar parcelas:', error)
      const errorMessage = error?.data?.errors?.join?.('\n') || 
                          error?.data?.error || 
                          error?.message || 
                          'Erro ao atualizar parcelas. Verifique os dados e tente novamente.'
      alert(errorMessage)
    } finally {
      setLoadingInstallments(false)
    }
  }

  const updateInstallmentField = (index, field, value) => {
    const updated = [...installmentsData]
    updated[index] = { ...updated[index], [field]: value }
    setInstallmentsData(updated)
  }

  const handleTogglePaidStatus = async (transaction) => {
    try {
      const newPaidStatus = !transaction.paid
      
      await updateTransaction.mutateAsync({ 
        id: transaction.id, 
        data: {
          name: transaction.name || transaction.description,
          description: transaction.description || transaction.name,
          amount_cents: transaction.amount_cents,
          amount_currency: transaction.amount_currency || 'BRL',
          transaction_type_cd: transaction.transaction_type_cd,
          due_date: transaction.due_date,
          category_id: transaction.category_id,
          cost_center_id: transaction.cost_center_id,
          contact_id: transaction.contact_id,
          bank_account_id: transaction.bank_account_id,
          payment_method_cd: transaction.payment_method_cd || 0,
          payment_type_cd: transaction.payment_type_cd || 0,
          paid: newPaidStatus,
          paid_at: newPaidStatus ? new Date().toISOString().split('T')[0] : null
        }
      })
    } catch (error) {
      console.error('Error toggling paid status:', error)
      const errorMessage = error?.data?.errors?.join?.('\n') || 
                          error?.data?.error || 
                          error?.message || 
                          'Erro ao alterar status da transação'
      alert(errorMessage)
    }
  }

  const formatCurrency = (value) => {
    if (typeof value === 'string' && value.includes('R$')) {
      return value
    }
    const numValue = typeof value === 'number' ? value : parseFloat(value || 0) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }


  const applyDateMask = (value) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
    }
  }

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

  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
  }

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

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedCategoryIds([])
    setSelectedCostCenterIds([])
    setSelectedBankAccountIds([])
    setSelectedContactIds([])
    setSelectedTagIds([])
    setSelectedPaymentMethods([])
    setSelectedPaymentTypes([])
    setIncludePaid(true)
    setIncludeUnpaid(true)
    setDateType('payment')
    setSelectedFilter('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleExportCSV = async () => {
    try {
      // Buscar todas as transações (sem paginação) com os filtros aplicados
      const exportFilters = {}
      if (selectedFilter !== 'all') {
        exportFilters.transaction_type = selectedFilter
      }
      if (debouncedSearchQuery) {
        exportFilters.search = debouncedSearchQuery
      }
      
      // Buscar todas as páginas
      let allTransactions = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const response = await apiService.getTransactions(page, 100, exportFilters) // 100 por página para reduzir chamadas
        const pageTransactions = response.transactions || []
        allTransactions = [...allTransactions, ...pageTransactions]
        
        hasMore = page < (response.meta?.total_pages || 1)
        page++
      }
      
      // Criar CSV
      const headers = [
        'Data Vencimento',
        'Data Pagamento',
        'Descrição',
        'Valor',
        'Tipo',
        'Categoria',
        'Centro de Custo',
        'Contato',
        'Método Pagamento',
        'Status',
        'Conta Bancária'
      ]
      
      const csvRows = [
        headers.join(','),
        ...allTransactions.map(transaction => {
          const amount = parseFloat(transaction.amount_cents || 0) / 100
          const row = [
            formatDate(transaction.due_date) || '',
            transaction.paid_at ? formatDate(transaction.paid_at) : '',
            `"${(transaction.description || transaction.name || '').replace(/"/g, '""')}"`,
            amount.toFixed(2).replace('.', ','),
            getTransactionTypeLabel(transaction.transaction_type_cd),
            transaction.category?.name || '',
            transaction.cost_center?.name || '',
            transaction.contact?.name || '',
            getPaymentMethodLabel(transaction.payment_method_cd || 0),
            transaction.paid ? 'Pago' : 'Pendente',
            bankAccounts.find(acc => acc.id.toString() === transaction.bank_account_id?.toString())?.name || ''
          ]
          return row.join(',')
        })
      ]
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM para Excel reconhecer UTF-8
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const dateStr = new Date().toISOString().split('T')[0]
      link.download = `transacoes_${dateStr}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const getTransactionTypeLabel = (type) => {
    const types = {
      0: 'Receita',
      1: 'Despesa Fixa',
      2: 'Despesa Variável',
      3: 'Folha de Pagamento',
      4: 'Imposto',
      5: 'Transferência'
    }
    return types[type] || 'Desconhecido'
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      0: 'Indefinido',
      1: 'Dinheiro',
      2: 'Cartão de Crédito',
      3: 'Cartão de Débito',
      4: 'PIX',
      5: 'Transferência',
      6: 'Boleto',
      7: 'Cheque'
    }
    return methods[method] || 'Indefinido'
  }

  const getTransactionTypeColor = (type) => {
    const colors = {
      0: 'bg-surface-elevated text-accent border-border',
      1: 'bg-surface-elevated text-danger border-border',
      2: 'bg-surface-elevated text-text-primary border-border',
      3: 'bg-surface-elevated text-accent border-border',
      4: 'bg-surface-elevated text-text-primary border-border',
      5: 'bg-surface-elevated text-text-secondary border-border'
    }
    return colors[type] || 'bg-surface-elevated text-text-secondary border-border'
  }

  // Os dados já vêm filtrados do backend, mas mantemos o filtro local como fallback
  // principalmente para filtros por tipo quando já temos os dados carregados
  const filteredTransactions = useMemo(() => {
    // Se temos filtro aplicado no backend, não precisamos filtrar novamente
    // Mas se o usuário mudou o filtro e ainda não recarregou, aplicamos o filtro local
    if (selectedFilter === 'all' && !searchQuery) {
      return transactions
    }
    
    return transactions.filter(transaction => {
      // Filtro por tipo - pode ser aplicado localmente se necessário
      const matchesFilter = selectedFilter === 'all' || transaction.transaction_type_cd === parseInt(selectedFilter)
      
      // Busca já é feita no backend, mas mantemos como fallback
      const matchesSearch = !searchQuery || 
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesFilter && matchesSearch
    })
  }, [transactions, selectedFilter, searchQuery])

  const filterOptions = [
    { label: 'Todos', value: 'all', count: totalCount, icon: Wallet },
    { label: 'Receitas', value: '0', count: transactions.filter(t => t.transaction_type_cd === 0).length, icon: TrendingUp },
    { label: 'Despesas', value: '1', count: transactions.filter(t => t.transaction_type_cd >= 1 && t.transaction_type_cd <= 4).length, icon: TrendingDown },
    { label: 'Transferências', value: '5', count: transactions.filter(t => t.transaction_type_cd === 5).length, icon: ArrowUpDown },
  ]

  if (loading && transactions.length === 0) {
    return (
      <div className="relative min-h-screen bg-surface">
        <div className="relative z-10 w-full max-w-full min-w-0 px-6 py-8 md:px-12 md:py-12">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <Skeleton className="h-12 w-48 mb-2" />
              <Skeleton className="h-6 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          
          {/* Filters Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          
          {/* Transactions Skeleton */}
          <div className="block md:hidden">
            <SkeletonList items={5} />
          </div>
          <div className="hidden md:block">
            <SkeletonTable rows={5} columns={7} />
          </div>
        </div>
      </div>
    )
  }
  
  const isLoading = loading || createTransaction.isPending || updateTransaction.isPending || deleteTransaction.isPending

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="relative z-10 w-full max-w-full min-w-0 px-6 py-6 md:px-12 md:py-8">
        {/* Header - Minimalista */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 w-full max-w-full mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2 leading-tight text-text-primary">
              Transações
            </h1>
            <p className="text-sm text-text-secondary">
              Gerencie suas receitas e despesas
            </p>
          </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"}
              size="sm" 
              className="hidden sm:flex backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-white/20"
              onClick={handleExportCSV}
              disabled={isLoading || transactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <Dialog open={isQuickAddOpen} onOpenChange={(open) => {
              setIsQuickAddOpen(open)
              if (!open) {
                // Reset form quando fechar
                setQuickAddData({
                  description: '',
                  amount_cents: '',
                  due_date: getTodayDate(),
                  paid: false,
                  transaction_type_cd: 0
                })
              }
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Input
                      id="quick-description"
                      value={quickAddData.description}
                      onChange={(e) => setQuickAddData({...quickAddData, description: e.target.value})}
                      placeholder="Ex: Venda de produto, Pagamento fornecedor"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          const amountInput = document.getElementById('quick-amount')
                          amountInput?.focus()
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor *</Label>
                      <Input
                        id="quick-amount"
                        type="number"
                        step="0.01"
                        value={quickAddData.amount_cents}
                        onChange={(e) => setQuickAddData({...quickAddData, amount_cents: e.target.value})}
                        placeholder="0,00"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const dateInput = document.getElementById('quick-date')
                            dateInput?.focus()
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={quickAddData.transaction_type_cd.toString()} 
                        onValueChange={(value) => setQuickAddData({...quickAddData, transaction_type_cd: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Receita</SelectItem>
                          <SelectItem value="1">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data de Vencimento *</Label>
                    <Input
                      id="quick-date"
                      type="text"
                      placeholder="dd/mm/aaaa"
                      value={quickAddData.due_date}
                      onChange={(e) => {
                        const value = e.target.value
                        const maskedValue = applyDateMask(value)
                        setQuickAddData({...quickAddData, due_date: maskedValue})
                      }}
                      maxLength={10}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleQuickAdd()
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="quick-paid"
                      checked={quickAddData.paid}
                      onCheckedChange={(checked) => 
                        setQuickAddData({...quickAddData, paid: checked === true})
                      }
                    />
                    <Label htmlFor="quick-paid" className="cursor-pointer">
                      Marcar como pago
                    </Label>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleQuickAdd}
                      className="flex-1 bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white"
                      disabled={createTransaction.isPending}
                    >
                      {createTransaction.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsQuickAddOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  {/* Botão de mais opções mais destacado */}
                  <div className="pt-3 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-primary font-medium"
                      onClick={() => {
                        // Transferir dados do formulário rápido para o formulário completo
                        const amountInDecimal = quickAddData.amount_cents ? parseFloat(quickAddData.amount_cents).toFixed(2) : ''
                        
                        // Converter data de pagamento para formato brasileiro se estiver pago
                        let paidAtFormatted = ''
                        if (quickAddData.paid) {
                          const today = new Date()
                          const day = today.getDate().toString().padStart(2, '0')
                          const month = (today.getMonth() + 1).toString().padStart(2, '0')
                          const year = today.getFullYear()
                          paidAtFormatted = `${day}/${month}/${year}`
                        }
                        
                        setFormData({
                          description: quickAddData.description || '',
                          amount_cents: amountInDecimal,
                          amount_currency: 'BRL',
                          transaction_type_cd: quickAddData.transaction_type_cd || 0,
                          due_date: quickAddData.due_date || getTodayDate(),
                          paid_at: paidAtFormatted,
                          category_id: '',
                          cost_center_id: '',
                          contact_id: '',
                          bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '1',
                          payment_method_cd: 0,
                          payment_type_cd: 0,
                          paid: quickAddData.paid || false
                        })
                        
                        // Resetar payment plan
                        setPaymentPlan({
                          enabled: false,
                          type: 'installment',
                          number_of_installments: 2,
                          frequency: 'monthly',
                          amount_type: 'total_amount'
                        })
                        
                        setIsQuickAddOpen(false)
                        // Pequeno delay para garantir que o estado foi atualizado
                        setTimeout(() => {
                          setIsNewTransactionOpen(true)
                        }, 100)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Mais Opções (Categoria, Centro de Custo, Parcelamento, etc.)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isNewTransactionOpen} onOpenChange={(open) => {
              setIsNewTransactionOpen(open)
              if (!open) {
                // Reset form quando fechar
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
                  bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id.toString() : '1',
                  payment_method_cd: 0,
                  payment_type_cd: 0,
                  paid: false
                })
                setPaymentPlan({
                  enabled: false,
                  type: 'installment',
                  number_of_installments: 2,
                  frequency: 'monthly',
                  amount_type: 'total_amount'
                })
              }
            }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <Wizard
                initialStep={0}
                steps={[
                  {
                    title: 'Básico',
                    content: (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            onBlur={(e) => {
                              const text = e.target.value
                              if (text && text.trim()) {
                                const formatted = formatDescriptionWithBreaks(text, 6)
                                if (formatted !== text) {
                                  setFormData({...formData, description: formatted})
                                }
                              }
                            }}
                            placeholder="Descrição da transação"
                            rows={4}
                            className="resize-y min-h-[100px] w-full"
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Valor *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.amount_cents}
                            onChange={(e) => setFormData({...formData, amount_cents: e.target.value})}
                            placeholder="0,00"
                            required
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Tipo *</Label>
                          <Select 
                            value={formData.transaction_type_cd.toString()} 
                            onValueChange={(value) => setFormData({...formData, transaction_type_cd: parseInt(value)})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o tipo" />
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
                      </div>
                    )
                  },
                  {
                    title: 'Datas',
                    content: (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Data de Vencimento *</Label>
                          <Input
                            type="text"
                            placeholder="dd/mm/aaaa"
                            value={formData.due_date}
                            onChange={(e) => {
                              const value = e.target.value
                              const maskedValue = applyDateMask(value)
                              setFormData({...formData, due_date: maskedValue})
                            }}
                            maxLength={10}
                            required
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Data de Pagamento</Label>
                          <Input
                            type="text"
                            placeholder="dd/mm/aaaa"
                            value={formData.paid_at}
                            onChange={(e) => {
                              const value = e.target.value
                              const maskedValue = applyDateMask(value)
                              setFormData({...formData, paid_at: maskedValue})
                            }}
                            maxLength={10}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                          <Label>Status</Label>
                          <Select 
                            value={formData.paid.toString()} 
                            onValueChange={(value) => setFormData({...formData, paid: value === 'true'})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false">Pendente</SelectItem>
                              <SelectItem value="true">Pago</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Detalhes',
                    content: (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Categoria</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                <span className="truncate mr-2">
                                  {formData.category_id 
                                    ? categories.find(c => c.id.toString() === formData.category_id)?.name || 'Selecione'
                                    : 'Selecione uma categoria'}
                                </span>
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]">
                              <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                              {categories.map((category) => (
                                <DropdownMenuItem 
                                  key={category.id}
                                  onClick={() => setFormData({...formData, category_id: category.id.toString()})}
                                >
                                  {category.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setIsAddCategoryOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Categoria
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Centro de Custo</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                <span className="truncate mr-2">
                                  {formData.cost_center_id 
                                    ? costCenters.find(c => c.id.toString() === formData.cost_center_id)?.name || 'Selecione'
                                    : 'Selecione um centro de custo'}
                                </span>
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]">
                              <DropdownMenuLabel>Centros de Custo</DropdownMenuLabel>
                              {costCenters.map((costCenter) => (
                                <DropdownMenuItem 
                                  key={costCenter.id}
                                  onClick={() => setFormData({...formData, cost_center_id: costCenter.id.toString()})}
                                >
                                  {costCenter.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setIsAddCostCenterOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Centro de Custo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Contato</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                <span className="truncate mr-2">
                                  {formData.contact_id 
                                    ? contacts.find(c => c.id.toString() === formData.contact_id)?.name || 'Selecione'
                                    : 'Selecione um contato'}
                                </span>
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]">
                              <DropdownMenuLabel>Contatos</DropdownMenuLabel>
                              {contacts.map((contact) => (
                                <DropdownMenuItem 
                                  key={contact.id}
                                  onClick={() => setFormData({...formData, contact_id: contact.id.toString()})}
                                >
                                  {contact.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setIsAddContactOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Contato
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <Label>Conta Bancária</Label>
                          <Select 
                            value={formData.bank_account_id?.toString() || '1'} 
                            onValueChange={(value) => setFormData({...formData, bank_account_id: value})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                          <Label>Método de Pagamento</Label>
                          <Select 
                            value={formData.payment_method_cd.toString()} 
                            onValueChange={(value) => setFormData({...formData, payment_method_cd: parseInt(value)})}
                          >
                            <SelectTrigger className="w-full">
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
                      </div>
                    )
                  },
                  {
                    title: 'Parcelamento/Recorrência',
                    content: (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="enable-payment-plan"
                              checked={paymentPlan.enabled}
                              onCheckedChange={(checked) => {
                                setPaymentPlan({
                                  ...paymentPlan, 
                                  enabled: checked === true,
                                  type: checked ? paymentPlan.type : 'installment'
                                })
                              }}
                            />
                            <Label htmlFor="enable-payment-plan" className="cursor-pointer font-medium">
                              Habilitar parcelamento ou recorrência
                            </Label>
                          </div>
                        </div>
                        
                        {!paymentPlan.enabled && (
                          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Precisa parcelar ou criar uma recorrência?
                            </p>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentPlan({
                                    ...paymentPlan,
                                    enabled: true,
                                    type: 'installment'
                                  })
                                }}
                                className="text-xs"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Ir para Parcelamento
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentPlan({
                                    ...paymentPlan,
                                    enabled: true,
                                    type: 'recurring'
                                  })
                                }}
                                className="text-xs"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                Ir para Recorrência
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {paymentPlan.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 space-y-4 pl-6 border-l-2 border-border">
                            <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                              <Label>Tipo *</Label>
                              <Select 
                                value={paymentPlan.type} 
                                onValueChange={(value) => {
                                  setPaymentPlan({
                                    ...paymentPlan, 
                                    type: value,
                                    // Reset número de parcelas quando mudar tipo
                                    number_of_installments: value === 'recurring' ? 12 : 2
                                  })
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="installment">
                                    <div>
                                      <div className="font-medium">Parcelamento</div>
                                      <div className="text-xs text-text-secondary">Dividir em parcelas fixas</div>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="recurring">
                                    <div>
                                      <div className="font-medium">Recorrência</div>
                                      <div className="text-xs text-text-secondary">Repetir automaticamente</div>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Mostrar número de parcelas apenas para parcelamento */}
                            {paymentPlan.type === 'installment' && (
                              <div className="space-y-2 sm:space-y-3">
                                <Label>Número de Parcelas *</Label>
                                <Input
                                  type="number"
                                  min="2"
                                  max="120"
                                  value={paymentPlan.number_of_installments}
                                  onChange={(e) => setPaymentPlan({
                                    ...paymentPlan, 
                                    number_of_installments: parseInt(e.target.value) || 2
                                  })}
                                  className="w-full"
                                />
                                <p className="text-xs text-text-secondary">Mínimo: 2, Máximo: 120</p>
                              </div>
                            )}
                            
                            {/* Mensagem informativa apenas para parcelamento */}
                            {paymentPlan.type === 'installment' && (
                              <div className="space-y-2 sm:space-y-3 sm:col-span-2">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                    Você pode ajustar o número de parcelas conforme necessário. O valor será recalculado automaticamente.
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newValue = Math.min(paymentPlan.number_of_installments + 1, 120)
                                        setPaymentPlan({...paymentPlan, number_of_installments: newValue})
                                      }}
                                      disabled={paymentPlan.number_of_installments >= 120}
                                      className="text-xs"
                                    >
                                      +1 Parcela
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newValue = Math.min(paymentPlan.number_of_installments + 3, 120)
                                        setPaymentPlan({...paymentPlan, number_of_installments: newValue})
                                      }}
                                      disabled={paymentPlan.number_of_installments >= 120}
                                      className="text-xs"
                                    >
                                      +3 Parcelas
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const newValue = Math.min(paymentPlan.number_of_installments + 6, 120)
                                        setPaymentPlan({...paymentPlan, number_of_installments: newValue})
                                      }}
                                      disabled={paymentPlan.number_of_installments >= 120}
                                      className="text-xs"
                                    >
                                      +6 Parcelas
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-2 sm:space-y-3">
                              <Label>Frequência *</Label>
                              <Select 
                                value={paymentPlan.frequency} 
                                onValueChange={(value) => setPaymentPlan({...paymentPlan, frequency: value})}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Diária</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                                  <SelectItem value="monthly">Mensal</SelectItem>
                                  <SelectItem value="bimonthly">Bimestral</SelectItem>
                                  <SelectItem value="quarterly">Trimestral</SelectItem>
                                  <SelectItem value="semiannual">Semestral</SelectItem>
                                  <SelectItem value="annual">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Tipo de valor apenas para parcelamento */}
                            {paymentPlan.type === 'installment' && (
                              <div className="space-y-2 sm:space-y-3">
                                <Label>Tipo de Valor</Label>
                                <Select 
                                  value={paymentPlan.amount_type} 
                                  onValueChange={(value) => setPaymentPlan({...paymentPlan, amount_type: value})}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="total_amount">Valor Total (dividido em parcelas)</SelectItem>
                                    <SelectItem value="installment_amount">Valor por Parcela</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {/* Resumo apenas para parcelamento */}
                            {paymentPlan.type === 'installment' && formData.amount_cents && paymentPlan.number_of_installments > 0 && (
                              <div className="sm:col-span-2 p-4 bg-surface-elevated rounded-lg border border-border">
                                <p className="text-sm text-text-secondary mb-2">Resumo:</p>
                                <p className="text-sm">
                                  {paymentPlan.amount_type === 'total_amount' ? (
                                    <>
                                      Valor total: {formatCurrency(parseFloat(formData.amount_cents || 0) * 100)}<br/>
                                      Valor por parcela: {formatCurrency(
                                        (parseFloat(formData.amount_cents || 0) * 100) / paymentPlan.number_of_installments
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      Valor por parcela: {formatCurrency(parseFloat(formData.amount_cents || 0) * 100)}<br/>
                                      Valor total: {formatCurrency(
                                        (parseFloat(formData.amount_cents || 0) * 100) * paymentPlan.number_of_installments
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
                onComplete={() => {
                  handleCreateTransaction()
                }}
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Summary Cards - Stripe Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Receitas"
          value={formatCurrency(summary.revenue)}
          icon={ArrowUpCircle}
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(summary.expenses)}
          icon={ArrowDownCircle}
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(summary.balance)}
          icon={Wallet}
        />
      </div>

      {/* Search and Filters - Stripe Style */}
      <FluidSection
        title="Buscar e Filtrar"
        subtitle="Encontre as transações que você precisa"
        className="mb-6"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
            <Input
              placeholder="Pesquisar transações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>

          {/* Filter Pills - sempre visíveis em mobile, controláveis em desktop */}
          {(showFilters || isMobile) && (
            <div className="flex flex-wrap gap-3">
              {filterOptions.map((filter) => {
                const Icon = filter.icon
                return (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                    <Badge variant="secondary" className="ml-1">
                      {filter.count}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          )}

          {/* Painel de Filtros Avançados - Minimalista dentro do FluidSection */}
          {(showFilters || isMobile) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="p-3">
                {/* Filtros principais - sempre visíveis */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Período</span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={startDate}
                        onChange={(e) => {
                          const value = e.target.value
                          const maskedValue = applyDateMask(value)
                          setStartDate(maskedValue)
                        }}
                        maxLength={10}
                        className="w-28 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <Input
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={endDate}
                        onChange={(e) => {
                          const value = e.target.value
                          const maskedValue = applyDateMask(value)
                          setEndDate(maskedValue)
                        }}
                        maxLength={10}
                        className="w-28 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Categorias</span>
                    <Select
                      value={selectedCategoryIds.length > 0 ? selectedCategoryIds[0]?.toString() : 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setSelectedCategoryIds([])
                        } else {
                          setSelectedCategoryIds([value])
                        }
                      }}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories.slice(0, 20).map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Contas</span>
                    <Select
                      value={selectedBankAccountIds.length > 0 ? selectedBankAccountIds[0]?.toString() : 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setSelectedBankAccountIds([])
                        } else {
                          setSelectedBankAccountIds([value])
                        }
                      }}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Mais Filtros */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className="h-8 text-xs border-gray-300"
                  >
                    {showMoreFilters ? 'Menos filtros' : 'Mais filtros'}
                    <ChevronDown className={cn("ml-1 h-3 w-3 transition-transform", showMoreFilters && "rotate-180")} />
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="include-paid"
                        checked={includePaid}
                        onCheckedChange={(checked) => setIncludePaid(checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="include-paid" className="text-xs text-gray-700 cursor-pointer font-normal">
                        Pagos
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="include-unpaid"
                        checked={includeUnpaid}
                        onCheckedChange={(checked) => setIncludeUnpaid(checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="include-unpaid" className="text-xs text-gray-700 cursor-pointer font-normal">
                        Não pagos
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-xs text-gray-600 hover:text-gray-900 px-3"
                    >
                      Limpar
                    </Button>
                    {loadingTransactions ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-500">Carregando...</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {totalCount} resultado{totalCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Filtros adicionais - expandíveis */}
                {showMoreFilters && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Centros de custo</span>
                      <Select
                        value={selectedCostCenterIds.length > 0 ? selectedCostCenterIds[0]?.toString() : 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setSelectedCostCenterIds([])
                          } else {
                            setSelectedCostCenterIds([value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {costCenters.map((costCenter) => (
                            <SelectItem key={costCenter.id} value={costCenter.id.toString()}>
                              {costCenter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Contatos</span>
                      <Select
                        value={selectedContactIds.length > 0 ? selectedContactIds[0]?.toString() : 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setSelectedContactIds([])
                          } else {
                            setSelectedContactIds([value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {contacts.slice(0, 20).map((contact) => (
                            <SelectItem key={contact.id} value={contact.id.toString()}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Modo de pagamento</span>
                      <Select
                        value={selectedPaymentMethods.length > 0 ? selectedPaymentMethods[0]?.toString() : 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setSelectedPaymentMethods([])
                          } else {
                            setSelectedPaymentMethods([value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="5">Dinheiro</SelectItem>
                          <SelectItem value="1">Cartão de Crédito</SelectItem>
                          <SelectItem value="2">Cartão de Débito</SelectItem>
                          <SelectItem value="6">PIX</SelectItem>
                          <SelectItem value="7">Transferência</SelectItem>
                          <SelectItem value="3">Boleto</SelectItem>
                          <SelectItem value="4">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Tipo pagamento</span>
                      <Select
                        value={selectedPaymentTypes.length > 0 ? selectedPaymentTypes[0]?.toString() : 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setSelectedPaymentTypes([])
                          } else {
                            setSelectedPaymentTypes([value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="0">À vista</SelectItem>
                          <SelectItem value="1">Parcelado</SelectItem>
                          <SelectItem value="2">Recorrente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Tags</span>
                      <Select
                        value={selectedTagIds.length > 0 ? selectedTagIds[0]?.toString() : 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setSelectedTagIds([])
                          } else {
                            setSelectedTagIds([value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {tags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id.toString()}>
                              {tag.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Tipo de data</span>
                      <Select
                        value={dateType}
                        onValueChange={setDateType}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="Por pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payment">Por pagamento</SelectItem>
                          <SelectItem value="competency">Por competência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </FluidSection>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transactions List - Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredTransactions.length === 0 ? (
          <FluidSection
            title="Nenhuma transação encontrada"
            subtitle="Tente ajustar os filtros de busca"
          >
            <div className="text-center py-12">
              <p className="text-text-secondary">Nenhuma transação encontrada</p>
            </div>
          </FluidSection>
        ) : (
          filteredTransactions.map((transaction, index) => {
            const amount = parseFloat(transaction.amount_cents || 0) / 100
            const isRevenue = transaction.transaction_type_cd === 0
            const isFirst = index === 0
            const isLast = index === filteredTransactions.length - 1
            
            return (
              <div 
                key={transaction.id}
                className={cn(
                  "group/item",
                  isFirst && "serial-position-first",
                  isLast && "serial-position-last"
                )}
              >
                <div 
                  className="bg-surface-elevated rounded-[var(--radius-lg)] p-6 border border-border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-140 cursor-pointer"
                  onClick={() => handleEditTransaction(transaction)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-text-primary whitespace-pre-line break-words leading-relaxed">
                        {formatDescriptionWithBreaks(transaction.name || transaction.description || 'Sem descrição', 4)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {transaction.category && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.category.name}
                          </Badge>
                        )}
                        <Badge className={cn("text-xs", getTransactionTypeColor(transaction.transaction_type_cd))}>
                          {getTransactionTypeLabel(transaction.transaction_type_cd)}
                        </Badge>
                        {transaction.payment_plan_id && transaction.installment_number && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {transaction.installment_number}/{transaction.installment_total || '?'} Parcelas
                          </Badge>
                        )}
                        <Button
                          variant={transaction.paid ? "default" : "secondary"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePaidStatus(transaction)
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-1.5"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : transaction.paid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Pago
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3" />
                              Pendente
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className={cn(
                        "text-lg font-semibold",
                        isRevenue ? "text-accent" : "text-danger"
                      )}>
                        {isRevenue ? '+' : '-'}{formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm text-text-secondary pt-4 border-t border-border">
                    <div>
                      <span className="font-medium">Vencimento:</span>{' '}
                      {formatDate(transaction.due_date)}
                    </div>
                    {transaction.paid_at && (
                      <div>
                        <span className="font-medium">Pagamento:</span>{' '}
                        {formatDate(transaction.paid_at)}
                      </div>
                    )}
                    {transaction.contact && (
                      <div className="col-span-2">
                        <span className="font-medium">Contato:</span>{' '}
                        {transaction.contact.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
                    {transaction.payment_plan_id && transaction.payment_type_cd === 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditInstallments(transaction)}
                        title="Editar parcelas"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Transactions Table - Desktop View */}
      <div className="hidden md:block w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Transações</h2>
            <p className="text-sm text-text-secondary mt-1">
              {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="whitespace-nowrap text-sm font-semibold py-4" style={{ width: '10%' }}>Vencimento</TableHead>
                <TableHead className="!whitespace-normal text-sm font-semibold py-4">Descrição</TableHead>
                <TableHead className="whitespace-nowrap text-sm font-semibold py-4" style={{ width: '12%' }}>Categoria</TableHead>
                <TableHead className="whitespace-nowrap text-sm font-semibold py-4" style={{ width: '12%' }}>Valor</TableHead>
                <TableHead className="whitespace-nowrap text-sm font-semibold py-4" style={{ width: '12%' }}>Tipo</TableHead>
                <TableHead className="whitespace-nowrap text-sm font-semibold py-4" style={{ width: '10%' }}>Status</TableHead>
                <TableHead className="text-right whitespace-nowrap text-sm font-semibold py-4" style={{ width: '12%' }}>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-text-secondary">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction, index) => {
                    const amount = parseFloat(transaction.amount_cents || 0) / 100
                    const isRevenue = transaction.transaction_type_cd === 0
                    const isFirst = index === 0
                    const isLast = index === filteredTransactions.length - 1
                    
                    return (
                      <TableRow 
                        key={transaction.id}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                          isFirst && "serial-position-first",
                          isLast && "serial-position-last"
                        )}
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <TableCell className="text-base whitespace-nowrap text-text-primary py-4">{formatDate(transaction.due_date)}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div 
                                className="font-medium text-base text-text-primary leading-relaxed" 
                                style={{ 
                                  whiteSpace: 'normal', 
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}
                              >
                                {transaction.name || transaction.description || 'Sem descrição'}
                              </div>
                              {transaction.contact && (
                                <div className="text-sm text-text-secondary mt-1 truncate">
                                  {transaction.contact.name}
                                </div>
                              )}
                            </div>
                            {transaction.payment_plan_id && transaction.installment_number && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
                                {transaction.installment_number}/{transaction.installment_total || '?'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          {transaction.category ? (
                            <Badge variant="outline" className="whitespace-nowrap">{transaction.category.name}</Badge>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <span className={cn(
                            "font-semibold text-lg",
                            isRevenue ? "text-accent" : "text-danger"
                          )}>
                            {isRevenue ? '+' : '-'}{formatCurrency(amount)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <Badge className={cn("text-xs whitespace-nowrap", getTransactionTypeColor(transaction.transaction_type_cd))}>
                            {getTransactionTypeLabel(transaction.transaction_type_cd)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap py-4">
                          <Button
                            variant={transaction.paid ? "default" : "secondary"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTogglePaidStatus(transaction)
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-2 whitespace-nowrap"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : transaction.paid ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Pago
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4" />
                                Pendente
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap py-4">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {transaction.payment_plan_id && transaction.payment_type_cd === 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditInstallments(transaction)}
                                title="Editar parcelas"
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                              title="Editar transação"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              title="Excluir transação"
                            >
                              <Trash2 className="w-4 h-4 text-danger" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">
            Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, totalCount)} de {totalCount} transações
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-text-secondary px-4">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 md:col-span-2">
              <Label>Descrição</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  onBlur={(e) => {
                    // Formata a cada 6 palavras quando sair do campo
                    const text = e.target.value
                    if (text && text.trim()) {
                      const formatted = formatDescriptionWithBreaks(text, 6)
                      if (formatted !== text) {
                        setEditFormData({...editFormData, description: formatted})
                      }
                    }
                  }}
                  placeholder="Descrição da transação (quebra automática a cada 6 palavras)"
                  rows={4}
                  className="resize-y min-h-[100px]"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                />
            </div>
            <div className="space-y-3">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={editFormData.amount_cents}
                onChange={(e) => setEditFormData({...editFormData, amount_cents: e.target.value})}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-3">
              <Label>Tipo</Label>
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
            <div className="space-y-3">
              <Label>Data de Vencimento</Label>
              <Input
                type="text"
                placeholder="dd/mm/aaaa"
                value={editFormData.due_date}
                onChange={(e) => {
                  const value = e.target.value
                  const maskedValue = applyDateMask(value)
                  setEditFormData({...editFormData, due_date: maskedValue})
                }}
                maxLength={10}
              />
            </div>
            <div className="space-y-3">
              <Label>Data de Pagamento</Label>
              <Input
                type="text"
                placeholder="dd/mm/aaaa"
                value={editFormData.paid_at}
                onChange={(e) => {
                  const value = e.target.value
                  const maskedValue = applyDateMask(value)
                  setEditFormData({...editFormData, paid_at: maskedValue})
                }}
                maxLength={10}
              />
            </div>
            <div className="space-y-3">
              <Label>Categoria</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {editFormData.category_id 
                      ? categories.find(c => c.id.toString() === editFormData.category_id)?.name || 'Selecione'
                      : 'Selecione uma categoria'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]">
                  <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                  {categories.map((category) => (
                    <DropdownMenuItem 
                      key={category.id}
                      onClick={() => setEditFormData({...editFormData, category_id: category.id.toString()})}
                    >
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-3">
              <Label>Centro de Custo</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {editFormData.cost_center_id 
                      ? costCenters.find(c => c.id.toString() === editFormData.cost_center_id)?.name || 'Selecione'
                      : 'Selecione um centro de custo'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]">
                  <DropdownMenuLabel>Centros de Custo</DropdownMenuLabel>
                  {costCenters.map((costCenter) => (
                    <DropdownMenuItem 
                      key={costCenter.id}
                      onClick={() => setEditFormData({...editFormData, cost_center_id: costCenter.id.toString()})}
                    >
                      {costCenter.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddCostCenterOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Centro de Custo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-3">
              <Label>Contato</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {editFormData.contact_id 
                      ? contacts.find(c => c.id.toString() === editFormData.contact_id)?.name || 'Selecione'
                      : 'Selecione um contato'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px]">
                  <DropdownMenuLabel>Contatos</DropdownMenuLabel>
                  {contacts.map((contact) => (
                    <DropdownMenuItem 
                      key={contact.id}
                      onClick={() => setEditFormData({...editFormData, contact_id: contact.id.toString()})}
                    >
                      {contact.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddContactOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contato
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-3">
              <Label>Conta Bancária</Label>
              <Select 
                value={editFormData.bank_account_id?.toString() || '1'} 
                onValueChange={(value) => setEditFormData({...editFormData, bank_account_id: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Método de Pagamento</Label>
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
                        <div className="space-y-3">
                          <Label>Status</Label>
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
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsEditTransactionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTransaction} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Modals */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria"
            />
            {duplicateWarning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-[var(--radius-sm)]">
                <p className="text-sm text-yellow-800">{duplicateWarning}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => {
              setIsAddCategoryOpen(false)
              setNewCategoryName('')
              setDuplicateWarning('')
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={isLoading || !newCategoryName.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Nome do contato"
            />
            {duplicateWarning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-[var(--radius-sm)]">
                <p className="text-sm text-yellow-800">{duplicateWarning}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => {
              setIsAddContactOpen(false)
              setNewContactName('')
              setDuplicateWarning('')
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateContact} disabled={isLoading || !newContactName.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCostCenterOpen} onOpenChange={setIsAddCostCenterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newCostCenterName}
              onChange={(e) => setNewCostCenterName(e.target.value)}
              placeholder="Nome do centro de custo"
            />
            {duplicateWarning && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-[var(--radius-sm)]">
                <p className="text-sm text-yellow-800">{duplicateWarning}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => {
              setIsAddCostCenterOpen(false)
              setNewCostCenterName('')
              setDuplicateWarning('')
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCostCenter} disabled={isLoading || !newCostCenterName.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Parcelas */}
      <Dialog open={showEditInstallmentsDialog} onOpenChange={setShowEditInstallmentsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Parcelas</DialogTitle>
          </DialogHeader>
          {loadingInstallments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-text-secondary mb-4">
                Você pode editar individualmente cada parcela. Os valores podem ser diferentes entre as parcelas.
              </div>
              
              <div className="space-y-3">
                {installmentsData.map((installment, index) => (
                  <div key={installment.id} className="p-4 border border-border rounded-lg bg-surface-elevated">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">
                        Parcela {installment.installment_number}
                      </h4>
                      <Badge variant={installment.paid ? "default" : "secondary"}>
                        {installment.paid ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Valor *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={installment.amount_cents}
                          onChange={(e) => updateInstallmentField(index, 'amount_cents', e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Data Vencimento *</Label>
                        <Input
                          type="text"
                          placeholder="dd/mm/aaaa"
                          value={installment.due_date}
                          onChange={(e) => {
                            const value = e.target.value
                            const maskedValue = applyDateMask(value)
                            updateInstallmentField(index, 'due_date', maskedValue)
                          }}
                          maxLength={10}
                          className="h-9 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Data Pagamento</Label>
                        <Input
                          type="text"
                          placeholder="dd/mm/aaaa"
                          value={installment.paid_at}
                          onChange={(e) => {
                            const value = e.target.value
                            const maskedValue = applyDateMask(value)
                            updateInstallmentField(index, 'paid_at', maskedValue)
                          }}
                          maxLength={10}
                          className="h-9 text-sm"
                          disabled={!installment.paid}
                        />
                      </div>
                      
                      <div className="space-y-1 flex items-end">
                        <div className="flex items-center space-x-2 w-full">
                          <Checkbox
                            id={`paid-${installment.id}`}
                            checked={installment.paid}
                            onCheckedChange={(checked) => {
                              updateInstallmentField(index, 'paid', checked === true)
                              if (checked && !installment.paid_at) {
                                updateInstallmentField(index, 'paid_at', getTodayDate())
                              }
                            }}
                          />
                          <Label htmlFor={`paid-${installment.id}`} className="text-xs cursor-pointer">
                            Pago
                          </Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={installment.description}
                        onChange={(e) => updateInstallmentField(index, 'description', e.target.value)}
                        placeholder="Descrição da parcela"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleUpdateInstallments}
                  className="flex-1 bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white"
                  disabled={loadingInstallments}
                >
                  {loadingInstallments ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditInstallmentsDialog(false)
                    setEditingPaymentPlan(null)
                    setInstallmentsData([])
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para Recorrências Próximas do Fim */}
      <Dialog open={showRecurrenceDialog} onOpenChange={setShowRecurrenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recorrência Próxima do Fim</DialogTitle>
          </DialogHeader>
          {selectedRecurrence && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  <strong>{selectedRecurrence.description}</strong>
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Esta recorrência termina em {selectedRecurrence.months_remaining} {selectedRecurrence.months_remaining === 1 ? 'mês' : 'meses'}.
                  Última data: {new Date(selectedRecurrence.last_due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      await apiService.extendRecurrence(selectedRecurrence.payment_plan_id)
                      // Remover esta recorrência da lista
                      setExpiringRecurrences(prev => prev.filter(r => r.payment_plan_id !== selectedRecurrence.payment_plan_id))
                      // Se houver mais recorrências, mostrar a próxima
                      const remaining = expiringRecurrences.filter(r => r.payment_plan_id !== selectedRecurrence.payment_plan_id)
                      if (remaining.length > 0) {
                        setSelectedRecurrence(remaining[0])
                      } else {
                        setShowRecurrenceDialog(false)
                      }
                      alert('Recorrência estendida com sucesso por mais 12 meses!')
                    } catch (error) {
                      console.error('Erro ao estender recorrência:', error)
                      alert('Erro ao estender recorrência. Tente novamente.')
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white"
                >
                  Estender por mais 12 meses
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Remover esta recorrência da lista
                    setExpiringRecurrences(prev => prev.filter(r => r.payment_plan_id !== selectedRecurrence.payment_plan_id))
                    // Se houver mais recorrências, mostrar a próxima
                    const remaining = expiringRecurrences.filter(r => r.payment_plan_id !== selectedRecurrence.payment_plan_id)
                    if (remaining.length > 0) {
                      setSelectedRecurrence(remaining[0])
                    } else {
                      setShowRecurrenceDialog(false)
                    }
                  }}
                >
                  Depois
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Botão Flutuante para Mobile - Nova Transação */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <Button
          onClick={() => setIsQuickAddOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      </div>
    </div>
  )
}
