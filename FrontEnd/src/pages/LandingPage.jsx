import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import { FreeFinancialTool } from '@/components/design/FreeFinancialTool'
import FinanceDashboard from '@/components/design/FinanceDashboard'

export function LandingPage() {
  const isMobile = useIsMobile()
  const [scrollY, setScrollY] = useState(0)
  const [showStickyHeader, setShowStickyHeader] = useState(false)

  // SEO e Metadados
  useEffect(() => {
    document.title = "BarberManagement | Gestão Completa para sua Barbearia"
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute("content", "Aumente os lucros da sua barbearia com gestão financeira, agendamento online e controle de comissões. Teste nosso simulador gratuito.")
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setShowStickyHeader(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Dados para os gráficos
  const monthlyData = [
    { name: 'Jan', receitas: 4200, despesas: 2400 },
    { name: 'Fev', receitas: 3800, despesas: 2200 },
    { name: 'Mar', receitas: 4500, despesas: 2800 },
    { name: 'Abr', receitas: 5200, despesas: 3000 },
    { name: 'Mai', receitas: 4800, despesas: 2600 },
    { name: 'Jun', receitas: 5500, despesas: 3200 },
  ]

  const categoryData = [
    { name: 'Cortes', value: 45, color: '#3F5B8A' },
    { name: 'Barba', value: 30, color: '#5B7AA8' },
    { name: 'Produtos', value: 15, color: '#7A9D96' },
    { name: 'Outros', value: 10, color: '#D4A574' },
  ]

  const commissionData = [
    { name: 'João', comissao: 1250, servicos: 28, percentual: '30%' },
    { name: 'Maria', comissao: 980, servicos: 22, percentual: '30%' },
    { name: 'Pedro', comissao: 1450, servicos: 35, percentual: '30%' },
  ]

  return (
    <>
    <main className="bg-white text-slate-900 selection:bg-[#3F5B8A] selection:text-white">
      
      {/* STICKY HEADER COM CTA */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all duration-300 ${
          showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            BarberManagement
          </span>
          <a
            href="#signup"
            className="px-4 py-2 bg-[#3F5B8A] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#34495E] transition whitespace-nowrap flex-shrink-0"
          >
            Começar Agora
          </a>
        </div>
      </div>

      {/* ================= HERO VISUAL ================= */}
      <section className="w-full bg-[#F8FAFC] py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT */}
          <div className="text-center lg:text-left space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-[#1A1C1E] leading-tight tracking-tight">
              Controle seu dinheiro,
              <br className="hidden sm:block" />
              <span className="text-[#3F5B8A]"> sem planilhas e complicação</span>
            </h1>

            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Simule ganhos, preveja gastos e visualize seu futuro financeiro 
              com nossa ferramenta profissional. <span className="text-[#1A1C1E] font-semibold">Simples, rápido e eficiente.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a 
                href="#free-tool"
                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#3F5B8A] text-white font-semibold hover:bg-[#34495E] transition-all shadow-sm text-center"
              >
                Testar simulador grátis
              </a>

              <a 
                href="#signup"
                className="w-full sm:w-auto px-8 py-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all bg-white font-semibold text-center"
              >
                Criar minha conta
              </a>
            </div>
          </div>

          {/* RIGHT - PREVIEW (SIMULADOR REAL) */}
          <div className="relative w-full max-w-5xl mx-auto lg:mx-0" id="free-tool">
            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-2 sm:p-4 transition-all hover:shadow-2xl">
              <div className="bg-slate-50/30 rounded-xl p-2 sm:p-4 border border-slate-100">
                <FreeFinancialTool />
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ================= CALENDÁRIO VISUAL ================= */}
      <section className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center sm:text-left"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-neutral-900 tracking-tight">
              Agenda visual e organizada
            </h2>
            <p className="text-base text-neutral-600">
              Veja todos os agendamentos do mês e os compromissos do dia em um só lugar com interface de alta fidelidade.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Calendário */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Dezembro</h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">2025</p>
                </div>
                <div className="flex gap-2">
                  <div className="size-7 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 cursor-not-allowed">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </div>
                  <div className="size-7 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 cursor-not-allowed">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {/* Dias vazios do mês anterior (ex: Dez 2025 começa na segunda-feira) */}
                <div className="aspect-square flex items-center justify-center text-[10px] text-neutral-300">30</div>
                
                {[
                  { d: 1, c: 4, type: 'full' }, { d: 2, c: 2, type: 'partial' }, { d: 3, c: 5, type: 'full' }, 
                  { d: 4, c: 0 }, { d: 5, c: 8, type: 'full' }, { d: 6, c: 3, type: 'partial' }, { d: 7, c: 0 },
                  { d: 8, c: 6, type: 'full' }, { d: 9, c: 1, type: 'low' }, { d: 10, c: 4, type: 'full' }, 
                  { d: 11, c: 2, type: 'low' }, { d: 12, c: 7, type: 'full' }, { d: 13, c: 10, type: 'full' }, { d: 14, c: 0 },
                  { d: 15, c: 5, type: 'full' }, { d: 16, c: 3, type: 'low' }, { d: 17, c: 4, type: 'full' }, 
                  { d: 18, c: 0 }, { d: 19, c: 12, type: 'full', today: true }, { d: 20, c: 15, type: 'full' }, { d: 21, c: 0 },
                  { d: 22, c: 4, type: 'low' }, { d: 23, c: 2, type: 'low' }, { d: 24, c: 1, type: 'low' }, 
                  { d: 25, c: 0 }, { d: 26, c: 5, type: 'full' }, { d: 27, c: 8, type: 'full' }, { d: 28, c: 0 },
                  { d: 29, c: 3, type: 'low' }, { d: 30, c: 6, type: 'full' }, { d: 31, c: 4, type: 'full' }
                ].map((date) => (
                  <div
                    key={date.d}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-all duration-300 hover:scale-105 group cursor-default ${
                      date.today 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : ''
                    } ${
                      date.c > 0
                        ? 'bg-white border-neutral-200 shadow-sm'
                        : 'bg-neutral-50 border-transparent text-neutral-300'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${date.c > 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {date.d}
                    </span>
                    
                    {date.c > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(date.c, 3) }).map((_, i) => (
                          <div key={i} className={`size-0.5 rounded-full ${date.c > 6 ? 'bg-blue-600' : 'bg-blue-300'}`} />
                        ))}
                      </div>
                    )}

                    {/* Popover simulado no hover */}
                    {date.c > 0 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                        {date.c} agendamentos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Lista de hoje */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Próximos</p>
                  <h3 className="text-xl font-bold text-neutral-900">Hoje, 19 Dez</h3>
                </div>
                <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                  12 Total
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {[
                  { time: '09:00', client: 'João Silva', service: 'Corte + Barba', price: 'R$ 85', status: 'done' },
                  { time: '10:30', client: 'Marcos Oliveira', service: 'Corte Social', price: 'R$ 50', status: 'done' },
                  { time: '14:00', client: 'Ricardo Alves', service: 'Degradê', price: 'R$ 45', status: 'current' },
                  { time: '15:15', client: 'Lucas Penteado', service: 'Barba Terapia', price: 'R$ 40', status: 'pending' },
                  { time: '16:30', client: 'André Souza', service: 'Corte Infantil', price: 'R$ 40', status: 'pending' },
                  { time: '17:45', client: 'Gabriel Lima', service: 'Luzes', price: 'R$ 120', status: 'pending' },
                ].map((apt, i) => (
                  <div 
                    key={apt.client} 
                    className={`group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 border ${
                      apt.status === 'current' 
                        ? 'bg-blue-50/50 border-blue-100' 
                        : 'hover:bg-neutral-50 border-transparent hover:border-neutral-100'
                    }`}
                  >
                    <div className="text-center min-w-[45px]">
                      <span className={`text-[10px] font-bold block ${apt.status === 'done' ? 'text-neutral-400' : 'text-blue-600'}`}>
                        {apt.time}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${apt.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                          {apt.client}
                        </p>
                        <span className="text-[10px] font-bold text-neutral-500">{apt.price}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">{apt.service}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      {apt.status === 'done' ? (
                        <div className="size-4 rounded-full bg-emerald-100 flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-emerald-600" />
                        </div>
                      ) : apt.status === 'current' ? (
                        <div className="size-4 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                          <div className="size-1.5 rounded-full bg-blue-600" />
                        </div>
                      ) : (
                        <div className="size-4 rounded-full bg-neutral-100 flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-neutral-300" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 bg-neutral-50 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-colors">
                Ver agenda completa
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= COMISSÕES VISUAL ================= */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center sm:text-left"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-slate-900 tracking-tight">
              Comissões calculadas automaticamente
            </h2>
            <p className="text-base text-slate-600">
              O sistema calcula a comissão de cada profissional por serviço realizado de forma justa e transparente.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {commissionData.map((prof, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col mb-3">
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">{prof.name}</span>
                    <span className="text-xl font-bold text-slate-900">
                      <span className="text-xs font-medium text-slate-400 mr-1">R$</span>
                      {prof.comissao.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">{prof.servicos} serviços</span>
                    <span className="text-[10px] font-bold text-[#3F5B8A] uppercase tracking-wider">{prof.percentual} comissão</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Total a pagar em comissões</span>
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                <span className="text-sm font-medium text-slate-400 mr-1">R$</span>
                {commissionData.reduce((sum, p) => sum + p.comissao, 0).toLocaleString('pt-BR')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ================= GESTÃO PROFISSIONAL (Demonstração) ================= */}
      <section className="py-24 bg-white border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#1A1C1E] tracking-tight">Tudo o que você precisa para crescer</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Vá além do básico. Tenha uma visão 360º do seu negócio com métricas avançadas, 
              controle de estoque, fluxo de caixa e gestão de equipe em um só lugar.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-slate-50 rounded-[2.5rem] -z-10 blur-2xl opacity-60"></div>
            <FinanceDashboard />
          </motion.div>
        </div>
      </section>

      {/* ================= PREÇO VISUAL ================= */}
      <section className="py-20 sm:py-24 bg-[#0F172A] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xs sm:text-sm font-bold text-blue-400 mb-6 uppercase tracking-[0.3em]">
              Preço Único e Simples
            </h2>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-xl font-medium text-neutral-400">R$</span>
              <span className="text-6xl sm:text-7xl font-bold text-white tracking-tighter">19</span>
              <span className="text-lg font-medium text-neutral-400">/mês</span>
            </div>
            <p className="text-base text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
              Acesso total a todas as funcionalidades. Sem taxas escondidas, sem contratos abusivos.
            </p>
            <a
              href="#signup"
              className="inline-block px-8 py-3.5 bg-white text-[#0F172A] rounded-xl text-base font-bold hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
            >
              Começar agora
            </a>
            <p className="mt-6 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Cancela quando quiser • 14 dias grátis</p>
          </motion.div>
        </div>
      </section>

      {/* ================= DEPOIMENTOS ================= */}
      <section className="py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 tracking-tight">O que dizem nossos parceiros</h2>
            <p className="text-base text-neutral-600">Histórias reais de quem transformou a gestão da barbearia</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ricardo Santos",
                role: "Barbearia Classic",
                text: "O sistema mudou minha vida. Antes eu perdia horas calculando comissões, agora é tudo automático. Meus barbeiros amam a transparência.",
                rating: 5
              },
              {
                name: "Felipe Melo",
                role: "Barber Shop Elite",
                text: "O simulador gratuito me convenceu. Vi que o sistema era sério e decidi assinar. O agendamento online reduziu faltas em 40%.",
                rating: 5
              },
              {
                name: "Bruno Oliveira",
                role: "Studio B",
                text: "Design limpo e muito fácil de usar. Meus clientes elogiam muito a facilidade de agendar pelo link. Recomendo para qualquer barbeiro.",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-neutral-900 text-sm">{testimonial.name}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3 tracking-tight">Dúvidas Frequentes</h2>
            <p className="text-sm text-neutral-600">Tudo o que você precisa saber para começar</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm font-bold text-neutral-800 py-4">Como funciona o simulador gratuito?</AccordionTrigger>
              <AccordionContent className="text-sm text-neutral-500 leading-relaxed">
                O simulador é uma ferramenta de uso local. Seus dados não são salvos em nosso banco de dados, servindo apenas para uma organização rápida no seu navegador. Você pode gerar PDFs de seus relatórios a qualquer momento.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm font-bold text-neutral-800 py-4">Preciso de cartão de crédito para testar?</AccordionTrigger>
              <AccordionContent className="text-sm text-neutral-500 leading-relaxed">
                Não! Você pode criar sua conta e usar todas as funcionalidades profissionais por 14 dias sem precisar cadastrar nenhum cartão.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm font-bold text-neutral-800 py-4">O sistema funciona no celular?</AccordionTrigger>
              <AccordionContent className="text-sm text-neutral-500 leading-relaxed">
                Sim! O sistema é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores, sem precisar instalar nada.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-sm font-bold text-neutral-800 py-4">Como é feito o suporte?</AccordionTrigger>
              <AccordionContent className="text-sm text-neutral-500 leading-relaxed">
                Oferecemos suporte via WhatsApp e e-mail para todos os nossos assinantes, garantindo que você nunca fique na mão.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ================= CTA FINAL COM FORMULÁRIO ================= */}
      <section id="signup" className="py-20 sm:py-28 bg-[#F6F5F2] border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight text-neutral-900 leading-[1.1]">
                Pronto para transformar sua barbearia?
              </h2>
              <p className="text-base text-neutral-600 mb-8 max-w-md">
                Junte-se a centenas de barbeiros que já simplificaram sua gestão e aumentaram seus lucros.
              </p>
              
              <div className="space-y-3.5">
                {[
                  'Gestão financeira simplificada',
                  'Agendamento online 24/7',
                  'Cálculo automático de comissões',
                  'Relatórios detalhados'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <div className="size-1.5 rounded-full bg-emerald-600" />
                    </div>
                    <span className="text-neutral-700 text-sm font-semibold tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-neutral-200 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-blue-900/5 relative"
            >
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">
                Oferta Limitada
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  window.location.href = '/login'
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase ml-1 mb-2 block tracking-[0.2em]">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Como devemos te chamar?"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 uppercase ml-1 mb-2 block tracking-[0.2em]">Seu melhor Email</label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-[#1E293B] transition-all hover:shadow-lg active:scale-[0.98] mt-2 uppercase tracking-widest"
                >
                  Criar conta grátis
                </button>
                <p className="text-center text-[10px] text-neutral-400 mt-6 leading-relaxed font-medium uppercase tracking-wider">
                  Cancela quando quiser • 14 dias grátis
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
    
    {/* ================= FOOTER ESTRUTURADO ================= */}
    <footer className="bg-white text-neutral-900 pt-20 pb-10 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-lg font-bold tracking-tight">BarberManagement</h3>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-xs">
              A solução definitiva para gestão de barbearias. Simplificamos sua rotina para você focar no seu talento.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-neutral-50 border border-neutral-100 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900" aria-label="Instagram">
                <Instagram className="size-4" />
              </a>
              <a href="#" className="p-2 bg-neutral-50 border border-neutral-100 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900" aria-label="Facebook">
                <Facebook className="size-4" />
              </a>
              <a href="#" className="p-2 bg-neutral-50 border border-neutral-100 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-900" aria-label="Twitter">
                <Twitter className="size-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.3em] mb-6">Produto</h4>
            <ul className="space-y-4 text-sm text-neutral-500">
              <li><a href="#free-tool" className="hover:text-neutral-900 transition-colors font-medium">Simulador Financeiro</a></li>
              <li><a href="#signup" className="hover:text-neutral-900 transition-colors font-medium">Gestão de Comissões</a></li>
              <li><a href="#signup" className="hover:text-neutral-900 transition-colors font-medium">Agenda Online</a></li>
              <li><a href="#signup" className="hover:text-neutral-900 transition-colors font-medium">Relatórios Avançados</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.3em] mb-6">Institucional</h4>
            <ul className="space-y-4 text-sm text-neutral-500">
              <li><a href="#" className="hover:text-neutral-900 transition-colors font-medium">Sobre nós</a></li>
              <li><a href="#" className="hover:text-neutral-900 transition-colors font-medium">Planos e Preços</a></li>
              <li><a href="#" className="hover:text-neutral-900 transition-colors font-medium">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-neutral-900 transition-colors font-medium">Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.3em] mb-6">Contato</h4>
            <ul className="space-y-4 text-sm text-neutral-500">
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-neutral-400" />
                <span>suporte@barbermanagement.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-neutral-400" />
                <span>(11) 99999-9999</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-4 text-neutral-400" />
                <span>São Paulo, SP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
            © 2025 BarberManagement. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition-colors">Segurança</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Status</a>
          </div>
        </div>
      </div>
    </footer>
  </>
  );
}
