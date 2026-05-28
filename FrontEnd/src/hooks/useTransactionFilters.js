import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const convertDateToISO = (dateString) => {
  if (!dateString) return null
  const parts = dateString.split('/')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return dateString
}

const formatDate = (d) => {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const getMonthBounds = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  return { first, last }
}

export function useTransactionFilters() {
  const location = useLocation()
  const initialFilterApplied = useRef(false)
  const monthNavigationActive = useRef(true)

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))

  const [searchQuery, setSearchQuery]                     = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery]   = useState('')
  const [selectedFilter, setSelectedFilter]               = useState('all')
  const [sort, setSort]                                   = useState({ field: 'due_date', direction: 'asc' })
  const [showFilters, setShowFilters]                     = useState(false)
  const [showMoreFilters, setShowMoreFilters]             = useState(false)
  const [currentPage, setCurrentPage]                     = useState(1)

  const { first: initFirst, last: initLast } = getMonthBounds(new Date(now.getFullYear(), now.getMonth(), 1))
  const [startDate, setStartDate]                         = useState(formatDate(initFirst))
  const [endDate, setEndDate]                             = useState(formatDate(initLast))

  const [selectedCategoryIds, setSelectedCategoryIds]     = useState([])
  const [selectedCostCenterIds, setSelectedCostCenterIds] = useState([])
  const [selectedBankAccountIds, setSelectedBankAccountIds] = useState([])
  const [selectedContactIds, setSelectedContactIds]       = useState([])
  const [selectedTagIds, setSelectedTagIds]               = useState([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [selectedPaymentTypes, setSelectedPaymentTypes]   = useState([])
  const [includePaid, setIncludePaid]                     = useState(true)
  const [includeUnpaid, setIncludeUnpaid]                 = useState(true)
  const [dateType, setDateType]                           = useState('due_date')

  // Sync startDate/endDate when currentMonth changes (only if month navigation is active)
  useEffect(() => {
    if (!monthNavigationActive.current) return
    const { first, last } = getMonthBounds(currentMonth)
    setStartDate(formatDate(first))
    setEndDate(formatDate(last))
    setCurrentPage(1)
  }, [currentMonth])

  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Aplica filtros vindos do dashboard via location.state (ex: "hoje", "vencidos")
  useEffect(() => {
    if (initialFilterApplied.current || !location.state) return
    initialFilterApplied.current = true
    monthNavigationActive.current = false
    const { filter, search } = location.state

    if (search) {
      setSearchQuery(search)
      setDebouncedSearchQuery(search)
    }
    if (filter === 'today') {
      const today = new Date()
      setStartDate(formatDate(today))
      setEndDate(formatDate(today))
      setShowFilters(true)
    } else if (filter === 'overdue') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setStartDate('')
      setEndDate(formatDate(yesterday))
      setIncludePaid(false)
      setIncludeUnpaid(true)
      setShowFilters(true)
    }
  }, [location.state])

  // Debounce de busca — reset para página 1 quando o termo muda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (currentPage !== 1) setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset para página 1 quando o filtro de tipo muda
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1)
  }, [selectedFilter])

  const filters = useMemo(() => {
    const f = {}
    if (selectedFilter !== 'all') f.transaction_type = selectedFilter
    if (debouncedSearchQuery) f.search = debouncedSearchQuery

    const isoStart = convertDateToISO(startDate)
    const isoEnd   = convertDateToISO(endDate)
    if (isoStart) f.start_date = isoStart
    if (isoEnd)   f.end_date   = isoEnd

    if (selectedCategoryIds.length > 0)    f.category_ids     = selectedCategoryIds
    if (selectedCostCenterIds.length > 0)  f.cost_center_ids  = selectedCostCenterIds
    if (selectedBankAccountIds.length > 0) f.bank_account_ids = selectedBankAccountIds
    if (selectedContactIds.length > 0)     f.contact_ids      = selectedContactIds
    if (selectedTagIds.length > 0)         f.tag_ids          = selectedTagIds
    if (selectedPaymentMethods.length > 0) f.payment_methods  = selectedPaymentMethods
    if (selectedPaymentTypes.length > 0)   f.payment_types    = selectedPaymentTypes

    if (!includePaid && !includeUnpaid) {
      f.paid = ['__none__']
    } else if (includePaid && !includeUnpaid) {
      f.paid = ['true']
    } else if (!includePaid && includeUnpaid) {
      f.paid = ['false']
    }

    if (dateType) f.date_type = dateType
    return f
  }, [
    selectedFilter, debouncedSearchQuery, startDate, endDate,
    selectedCategoryIds, selectedCostCenterIds, selectedBankAccountIds,
    selectedContactIds, selectedTagIds, selectedPaymentMethods, selectedPaymentTypes,
    includePaid, includeUnpaid, dateType,
  ])

  function resetFilters() {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedFilter('all')
    const { first, last } = getMonthBounds(currentMonth)
    setStartDate(formatDate(first))
    setEndDate(formatDate(last))
    setSelectedCategoryIds([])
    setSelectedCostCenterIds([])
    setSelectedBankAccountIds([])
    setSelectedContactIds([])
    setSelectedTagIds([])
    setSelectedPaymentMethods([])
    setSelectedPaymentTypes([])
    setIncludePaid(true)
    setIncludeUnpaid(true)
    setDateType('due_date')
    setCurrentPage(1)
    monthNavigationActive.current = true
  }

  return {
    // filter UI visibility
    showFilters, setShowFilters,
    showMoreFilters, setShowMoreFilters,
    // search
    searchQuery, setSearchQuery,
    // type pill
    selectedFilter, setSelectedFilter,
    // sort
    sort, setSort,
    // pagination
    currentPage, setCurrentPage,
    // month navigation
    currentMonth, goToPrevMonth, goToNextMonth, goToCurrentMonth, monthLabel,
    // date range
    startDate, setStartDate,
    endDate, setEndDate,
    dateType, setDateType,
    // multi-select filters
    selectedCategoryIds, setSelectedCategoryIds,
    selectedCostCenterIds, setSelectedCostCenterIds,
    selectedBankAccountIds, setSelectedBankAccountIds,
    selectedContactIds, setSelectedContactIds,
    selectedTagIds, setSelectedTagIds,
    selectedPaymentMethods, setSelectedPaymentMethods,
    selectedPaymentTypes, setSelectedPaymentTypes,
    // paid/unpaid toggles
    includePaid, setIncludePaid,
    includeUnpaid, setIncludeUnpaid,
    // computed
    filters,
    resetFilters,
  }
}
