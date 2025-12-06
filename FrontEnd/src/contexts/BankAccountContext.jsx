import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useBankAccounts } from '@/hooks/useFormData'

const BankAccountContext = createContext(null)

export function BankAccountProvider({ children }) {
  const { data: bankAccountsData, isLoading, refetch: refetchBankAccounts } = useBankAccounts()
  const bankAccounts = bankAccountsData?.bank_accounts || []
  
  // Estado para conta selecionada (usa a primeira conta ou a salva no localStorage)
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    const saved = localStorage.getItem('selectedBankAccountId')
    return saved || null
  })
  
  // Estado para saldo da conta selecionada
  const [balance, setBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Selecionar primeira conta se não houver seleção
  useEffect(() => {
    if (!isLoading && bankAccounts.length > 0 && !selectedAccountId) {
      const firstAccount = bankAccounts[0]
      setSelectedAccountId(firstAccount.id.toString())
      localStorage.setItem('selectedBankAccountId', firstAccount.id.toString())
    }
  }, [isLoading, bankAccounts, selectedAccountId])

  const selectedAccount = bankAccounts.find(acc => acc.id.toString() === selectedAccountId) || bankAccounts[0]

  // Função para atualizar saldo com base na conta selecionada
  const updateBalanceFromAccount = useCallback((account) => {
    if (!account) {
      console.log('⚠️ Conta não encontrada')
      setBalance(0)
      return
    }
    
    // Usar o balance_cents do modelo (sempre disponível após refetch)
    let accountBalance = 0
    
    if (account.balance_cents !== undefined && account.balance_cents !== null) {
      accountBalance = account.balance_cents / 100.0
    } else if (account.balance !== undefined && account.balance !== null) {
      accountBalance = account.balance
    }
    
    console.log('💰 Atualizando saldo:', {
      balance_cents: account.balance_cents,
      balance: account.balance,
      calculated: accountBalance
    })
    
    setBalance(accountBalance)
    setLastUpdated(new Date())
  }, [])

  // Atualizar saldo quando a conta selecionada mudar ou quando os dados de bank accounts forem atualizados
  useEffect(() => {
    if (selectedAccount && bankAccounts.length > 0) {
      console.log('💳 Dados da conta recebidos:', {
        id: selectedAccount.id,
        name: selectedAccount.name,
        balance_cents: selectedAccount.balance_cents,
        balance: selectedAccount.balance,
        raw: selectedAccount
      })
      updateBalanceFromAccount(selectedAccount)
    } else if (bankAccounts.length === 0) {
      setBalance(0)
    }
  }, [selectedAccountId, bankAccounts, selectedAccount, updateBalanceFromAccount])


  const selectAccount = (accountId) => {
    setSelectedAccountId(accountId.toString())
    localStorage.setItem('selectedBankAccountId', accountId.toString())
  }

  const refreshBalance = useCallback(async () => {
    setBalanceLoading(true)
    try {
      // Forçar refetch da query de bank_accounts
      const result = await refetchBankAccounts()
      // O saldo será atualizado automaticamente pelo useEffect que observa bankAccounts
      // Mas vamos garantir atualização imediata aqui também
      if (result.data?.bank_accounts) {
        const account = result.data.bank_accounts.find(
          acc => acc.id.toString() === selectedAccountId
        )
        if (account) {
          updateBalanceFromAccount(account)
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error)
    } finally {
      setBalanceLoading(false)
    }
  }, [refetchBankAccounts, selectedAccountId, updateBalanceFromAccount])

  const value = {
    bankAccounts,
    selectedAccount,
    selectedAccountId,
    selectAccount,
    balance,
    balanceLoading,
    lastUpdated,
    refreshBalance,
    isLoading
  }

  return (
    <BankAccountContext.Provider value={value}>
      {children}
    </BankAccountContext.Provider>
  )
}

export function useBankAccount() {
  const context = useContext(BankAccountContext)
  if (!context) {
    throw new Error('useBankAccount must be used within BankAccountProvider')
  }
  return context
}

