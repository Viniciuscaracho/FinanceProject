import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"

const kpis = [
  { label: "Receitas", value: "R$ 28.500", delta: "+12%", positive: true },
  { label: "Despesas", value: "R$ 18.200", delta: "-5%", positive: false },
  { label: "Saldo", value: "R$ 10.300", delta: "+18%", positive: true },
  { label: "Agendamentos", value: "142", delta: "+8%", positive: true }
]

const chartData = [
  { name: "Mar", receitas: 4200, despesas: 2600 },
  { name: "Abr", receitas: 5100, despesas: 3000 },
  { name: "Mai", receitas: 4700, despesas: 2400 },
  { name: "Jun", receitas: 5600, despesas: 3200 }
]

export default function FinanceDashboard() {
  const [period, setPeriod] = useState("Mês")

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-neutral-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Controle financeiro</h1>
          <p className="text-neutral-500 text-[11px] font-medium uppercase tracking-wider">Visão clara e simples do seu negócio</p>
        </div>
        <div className="flex gap-1 bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/50">
          {["Hoje", "Semana", "Mês"].map(p => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                period === p 
                  ? "bg-white text-[#0F172A] shadow-sm hover:bg-white border border-neutral-200/50" 
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-xl border-neutral-200 shadow-none bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-500 font-medium">{kpi.label}</p>
                <div className="flex items-end justify-between mt-1">
                  <span className="text-lg font-semibold text-neutral-900">{kpi.value}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      kpi.positive ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {kpi.delta}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card className="rounded-xl border-neutral-200 shadow-none bg-white">
        <CardContent className="p-6">
          <h2 className="text-sm font-medium text-neutral-900 mb-6">Receitas x Despesas</h2>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="receitas" 
                  fill="#0F172A" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="despesas" 
                  fill="#E2E8F0" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
