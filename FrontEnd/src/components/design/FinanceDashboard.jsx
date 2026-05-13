import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const kpis = [
  { label: "Receitas",       value: "R$ 28.500", delta: "+12%", up: true  },
  { label: "Despesas",       value: "R$ 18.200", delta: "-5%",  up: false },
  { label: "Saldo",          value: "R$ 10.300", delta: "+18%", up: true  },
  { label: "Agendamentos",   value: "142",        delta: "+8%",  up: true  },
]

const chartData = [
  { name: "Mar", receitas: 4200, despesas: 2600 },
  { name: "Abr", receitas: 5100, despesas: 3000 },
  { name: "Mai", receitas: 4700, despesas: 2400 },
  { name: "Jun", receitas: 5600, despesas: 3200 },
]

const BRAND   = "#4C60AA"
const EXPENSE = "#CBD5E1"

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ fontSize: 13, fontWeight: 600, color: p.dataKey === "receitas" ? BRAND : "#94a3b8", margin: "2px 0" }}>
          {p.dataKey === "receitas" ? "Receitas" : "Despesas"}: R$ {p.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  )
}

export default function FinanceDashboard() {
  const [period, setPeriod] = useState("Mês")

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            Controle financeiro
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0", fontWeight: 500 }}>
            Visão clara e simples do seu negócio
          </p>
        </div>

        {/* Segmented control */}
        <div style={{ display: "flex", gap: 2, background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
          {["Hoje", "Semana", "Mês"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "5px 14px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.15s",
                background: period === p ? "#fff" : "transparent",
                color: period === p ? "#0f172a" : "#94a3b8",
                boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {kpi.value}
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: kpi.up ? "#10b981" : "#ef4444", margin: 0 }}>
              {kpi.delta}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>Receitas × Despesas</p>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { color: BRAND,   label: "Receitas" },
              { color: EXPENSE, label: "Despesas" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", radius: 6 }} />
              <Bar dataKey="receitas" fill={BRAND}   radius={[5, 5, 0, 0]} maxBarSize={36} />
              <Bar dataKey="despesas" fill={EXPENSE} radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
