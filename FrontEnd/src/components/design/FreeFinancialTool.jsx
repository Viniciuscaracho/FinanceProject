import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { Plus, Trash2, FileText, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { motion } from "framer-motion"

export function FreeFinancialTool() {
  const [initialBalance, setInitialBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  const categories = {
    income: [
      { id: 'salary', label: 'Salário', icon: '💰' },
      { id: 'freelance', label: 'Freelance', icon: '💻' },
      { id: 'investments', label: 'Investimentos', icon: '📈' },
      { id: 'gift', label: 'Presente', icon: '🎁' },
      { id: 'other_in', label: 'Outros', icon: '✨' },
    ],
    expense: [
      { id: 'rent', label: 'Moradia', icon: '🏠' },
      { id: 'food', label: 'Alimentação', icon: '🍎' },
      { id: 'transport', label: 'Transporte', icon: '🚗' },
      { id: 'leisure', label: 'Lazer', icon: '🎮' },
      { id: 'health', label: 'Saúde', icon: '🏥' },
      { id: 'education', label: 'Educação', icon: '📚' },
      { id: 'bills', label: 'Contas Fixas', icon: '📄' },
      { id: 'other_out', label: 'Outros', icon: '✨' },
    ]
  }

  const addTransaction = (forcedType) => {
    // Se não for passado tipo, tenta inferir pelo valor (positivo=entrada, negativo=saída)
    // ou usa o estado 'type' como fallback
    let finalType = forcedType || type
    let finalAmount = parseFloat(amount)

    if (!description || isNaN(finalAmount)) return

    if (!forcedType && finalAmount < 0) {
      finalType = 'expense'
      finalAmount = Math.abs(finalAmount)
    } else if (!forcedType && finalAmount > 0) {
      finalType = 'income'
    }
    
    const newTransaction = {
      id: Date.now(),
      description,
      amount: finalAmount,
      type: finalType,
      category: category || (finalType === 'income' ? 'Outros' : 'Outros'),
      date: new Date().toLocaleDateString('pt-BR')
    }

    setTransactions([newTransaction, ...transactions])
    setDescription('')
    setAmount('')
    setCategory('')
    
    // Auto-foco no campo de descrição para o próximo lançamento
    setTimeout(() => {
      document.getElementById('trans-desc')?.focus()
    }, 10)
  }

  const handleKeyPress = (e, forcedType) => {
    if (e.key === 'Enter') {
      // Se tiver valor positivo, assume entrada. Se negativo, saída.
      // Ou apenas usa o tipo padrão se o usuário só apertar enter
      addTransaction(forcedType)
    }
  }

  const removeTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const totals = useMemo(() => {
    const incomes = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)
    
    return {
      incomes,
      expenses,
      balance: initialBalance + incomes - expenses
    }
  }, [transactions, initialBalance])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="w-full space-y-6">
      <div className="no-print space-y-6">
        {/* Configuração Inicial e Nova movimentação em Grid para melhor integração */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-xl border-slate-200 shadow-sm bg-white transition-all hover:border-slate-300">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Saldo inicial</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                <Input 
                  type="number"
                  placeholder="0,00" 
                  className="bg-slate-50 pl-9 h-10 border-slate-200 focus:ring-1 focus:ring-[#4C60AA]/20 focus:border-[#4C60AA] text-sm font-bold text-slate-900 rounded-lg"
                  value={initialBalance || ''}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                Informe quanto você tem hoje
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-xl border-slate-200 shadow-sm bg-white transition-all overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova movimentação</p>
                <div className="hidden sm:block">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Enter para salvar
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <Input 
                      id="trans-desc"
                      placeholder="Descrição" 
                      className="bg-slate-50 h-10 border-slate-200 text-sm focus:ring-1 focus:ring-[#4C60AA]/20 focus:border-[#4C60AA] font-medium text-slate-900 placeholder:text-slate-400 rounded-lg transition-all"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e)}
                    />
                  </div>
                  <div className="md:col-span-4 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                    <Input 
                      id="trans-amount"
                      type="number"
                      placeholder="0,00" 
                      className="bg-slate-50 pl-9 h-10 border-slate-200 text-sm focus:ring-1 focus:ring-[#4C60AA]/20 focus:border-[#4C60AA] font-bold text-slate-900 rounded-lg transition-all"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e)}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                  <div className="flex-1 w-full">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-slate-50 h-10 border-slate-200 text-xs focus:ring-1 focus:ring-[#4C60AA]/20 focus:border-[#4C60AA] font-medium text-slate-900 rounded-lg">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entradas</div>
                        {categories.income.map(cat => (
                          <SelectItem key={cat.id} value={cat.label} className="text-xs">
                            <span className="mr-2">{cat.icon}</span> {cat.label}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t mt-1">Saídas</div>
                        {categories.expense.map(cat => (
                          <SelectItem key={cat.id} value={cat.label} className="text-xs">
                            <span className="mr-2">{cat.icon}</span> {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      onClick={() => addTransaction('income')} 
                      className="flex-1 sm:flex-none h-10 px-4 rounded-lg bg-[#4C60AA] text-white hover:bg-[#34495E] gap-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                    >
                      <Plus className="size-3.5" />
                      Receita
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => addTransaction('expense')} 
                      className="flex-1 sm:flex-none h-10 px-4 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 gap-2 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                      <Plus className="size-3.5 rotate-45" />
                      Despesa
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                Entradas ou saídas atualizam o saldo automaticamente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Entradas", value: totals.incomes, color: "blue", icon: TrendingUp },
            { label: "Saídas", value: totals.expenses, color: "rose", icon: TrendingDown },
            { label: "Saldo Previsto", value: totals.balance, color: "teal", icon: Wallet, highlight: true }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <Card className={`rounded-xl border-slate-200 bg-white shadow-sm overflow-hidden h-full transition-all 
                ${item.highlight ? 'border-l-4 border-l-[#4C60AA]' : ''} 
                ${item.color === 'blue' ? 'hover:border-blue-200' : ''}
                ${item.color === 'rose' ? 'hover:border-rose-200' : ''}
                ${item.color === 'teal' ? 'hover:border-teal-200' : ''}
              `}>
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.label}</p>
                    <item.icon className={`size-3.5 ${
                      item.color === 'blue' ? 'text-[#4C60AA]' : 
                      item.color === 'rose' ? 'text-rose-500' : 
                      'text-teal-600'
                    }`} />
                  </div>
                  <p className={`text-2xl font-bold tracking-tight ${
                    item.label === 'Entradas' ? 'text-[#4C60AA]' : 
                    item.label === 'Saídas' ? 'text-rose-600' : 
                    (item.value < 0 ? 'text-rose-600' : 'text-slate-900')
                  }`}>
                    <span className="text-xs font-semibold text-slate-400 mr-1">R$</span>
                    {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Relatório */}
      <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden transition-all">
        <CardContent className="p-0 sm:p-6">
          <div className="flex items-center justify-between p-5 sm:p-0 mb-4 no-print">
            <h2 className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
              <FileText className="size-3.5 text-[#4C60AA]" />
              Fluxo de Caixa
            </h2>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-2 text-[9px] font-bold uppercase tracking-widest border-slate-200 hover:bg-slate-50 rounded-lg px-3 transition-all text-slate-600">
              <FileText className="size-3" />
              Relatório
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold tracking-widest">
                <tr>
                  <th className="px-4 py-3 border-y border-slate-100">Data</th>
                  <th className="px-4 py-3 border-y border-slate-100">Descrição</th>
                  <th className="px-4 py-3 border-y border-slate-100">Categoria</th>
                  <th className="px-4 py-3 border-y border-slate-100 text-right">Valor</th>
                  <th className="px-4 py-3 border-y border-slate-100 text-right no-print w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-slate-400 text-xs italic">
                      Nenhuma movimentação registrada
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-medium">{t.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          t.type === 'income' ? 'bg-blue-50 text-[#4C60AA]' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        t.type === 'income' ? 'text-[#4C60AA]' : 'text-rose-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right no-print">
                        <button 
                          onClick={() => removeTransaction(t.id)}
                          className="text-slate-300 hover:text-rose-500 transition-all p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo Final</span>
            <span className={`text-xl font-bold tracking-tight ${totals.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              <span className="text-xs font-semibold text-slate-400 mr-1">R$</span>
              {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print, .print * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          /* Fix for reporting card in print mode */
          .max-w-6xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          Card, .rounded-2xl {
            border: none !important;
            box-shadow: none !important;
            visibility: visible !important;
          }
          CardContent, table, th, td, span, div, h1, h2, p {
            visibility: visible !important;
          }
          body, main {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
