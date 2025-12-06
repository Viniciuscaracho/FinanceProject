import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  Zap, 
  TrendingUp,
  ArrowRight,
  Check,
  Scissors,
  Palette,
  Smartphone,
  BarChart3,
  Clock,
  Users,
  Wallet,
  Bot,
  ArrowDown,
  Play
} from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Floating gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #ff6b6b 0%, #4ecdc4 50%, #ffe66d 100%)',
            top: `${-200 + scrollY * 0.3}px`,
            left: '-300px',
            transform: `rotate(${scrollY * 0.1}deg)`
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-15"
          style={{
            background: 'radial-gradient(circle, #5B7A9E 0%, #6B8FA3 50%, #7A9D96 100%)',
            bottom: `${-100 + scrollY * 0.2}px`,
            right: '-200px',
            transform: `rotate(${-scrollY * 0.15}deg)`
          }}
        />
      </div>

      {/* Navigation - Minimalist */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] bg-clip-text text-transparent">
              BarberFlow
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
            <Button 
              className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white border-0"
              onClick={handleGetStarted}
            >
              Começar agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Asymmetric & Emotional */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline */}
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white/70">Para profissionais que querem crescer</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-black leading-tight">
                <span className="block bg-gradient-to-r from-[#6B8FA3] via-[#5B7A9E] to-[#7A9D96] bg-clip-text text-transparent">
                  Pare de perder
                </span>
                <span className="block text-white mt-2">
                  tempo com papel
                </span>
                <span className="block bg-gradient-to-r from-cyan-400 via-[#6B8FA3] to-[#5B7A9E] bg-clip-text text-transparent mt-2">
                  e dinheiro
                </span>
              </h1>

              <p className="text-xl text-white/60 leading-relaxed max-w-lg">
                A plataforma completa que une <strong className="text-white">gestão financeira</strong>, 
                <strong className="text-white"> agendamentos inteligentes</strong> e 
                <strong className="text-white"> chatbot WhatsApp</strong> em uma experiência única.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white text-lg px-8 py-6 rounded-2xl shadow-2xl shadow-[#5B7A9E]/30"
                  onClick={handleGetStarted}
                >
                  Experimentar grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-2xl backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Ver demonstração
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center space-x-6 pt-4">
                <div>
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-sm text-white/50">Profissionais</div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-bold text-white">R$ 2M+</div>
                  <div className="text-sm text-white/50">Gerenciados</div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-bold text-white">4.9★</div>
                  <div className="text-sm text-white/50">Avaliação</div>
                </div>
              </div>
            </div>

            {/* Right: Visual - Abstract UI Mockup */}
            <div className="relative lg:translate-x-12">
              <div className="relative">
                {/* Main card with glassmorphism */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="space-y-4">
                    {/* Mock dashboard */}
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 bg-white/20 rounded-full" />
                      <div className="h-4 w-4 bg-white/20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                          <div className="h-3 w-16 bg-white/30 rounded mb-2" />
                          <div className="h-6 w-20 bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] rounded" />
                        </div>
                      ))}
                    </div>
                    <div className="h-32 bg-gradient-to-br from-[#5B7A9E]/20 to-[#6B8FA3]/20 rounded-xl border border-white/10" />
                  </div>
                </div>

                {/* Floating elements */}
                <div 
                  className="absolute -top-8 -right-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-2xl shadow-yellow-500/30"
                  style={{ transform: `rotate(${scrollY * 0.05}deg)` }}
                >
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div 
                  className="absolute -bottom-6 -left-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-4 shadow-2xl shadow-cyan-500/30"
                  style={{ transform: `rotate(${-scrollY * 0.05}deg)` }}
                >
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div 
                  className="absolute top-1/2 -right-12 bg-gradient-to-br from-[#6B8FA3] to-[#D4A574] rounded-2xl p-4 shadow-2xl shadow-[#5B7A9E]/30"
                  style={{ transform: `translateY(${scrollY * 0.1}px)` }}
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-6 h-6 text-white/40" />
        </div>
      </section>

      {/* Before/After Storytelling - Creative Layout */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] bg-clip-text text-transparent">
                Antes era caos.
              </span>
              <br />
              <span className="text-white">Agora é fluxo.</span>
            </h2>
          </div>

          {/* Split view - Creative */}
          <div className="grid lg:grid-cols-2 gap-8 relative">
            {/* Before - Messy */}
            <div className="relative">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 backdrop-blur-xl rounded-3xl p-8 border border-red-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
                  <h3 className="text-3xl font-bold mb-6 text-red-300">Antes</h3>
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <div>
                        <div className="h-4 w-48 bg-red-500/30 rounded mb-2" />
                        <div className="h-3 w-32 bg-red-500/20 rounded" />
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <div>
                        <div className="h-4 w-40 bg-red-500/30 rounded mb-2" />
                        <div className="h-3 w-36 bg-red-500/20 rounded" />
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
                      <div>
                        <div className="h-4 w-44 bg-red-500/30 rounded mb-2" />
                        <div className="h-3 w-28 bg-red-500/20 rounded" />
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <div className="text-sm text-red-300">📱 WhatsApp lotado</div>
                      <div className="text-sm text-red-300">📅 Agenda física</div>
                      <div className="text-sm text-red-300">💰 Planilhas confusas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* After - Organized */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl rounded-3xl p-8 border border-green-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                <h3 className="text-3xl font-bold mb-6 text-green-300">Depois</h3>
                <div className="space-y-4 relative z-10">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-3 w-24 bg-green-400/30 rounded" />
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="h-2 w-full bg-green-500/20 rounded" />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-3 w-28 bg-green-400/30 rounded" />
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="h-2 w-full bg-green-500/20 rounded" />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-3 w-32 bg-green-400/30 rounded" />
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="h-2 w-full bg-green-500/20 rounded" />
                  </div>
                  <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="text-sm text-green-300">✅ Chatbot automático</div>
                    <div className="text-sm text-green-300">✅ Agendamento online</div>
                    <div className="text-sm text-green-300">✅ Relatórios em tempo real</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Diagonal & Fluid */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-[#6B8FA3] to-[#5B7A9E] bg-clip-text text-transparent">
                Tudo que você precisa
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Uma plataforma pensada para profissionais que querem focar no que realmente importa
            </p>
          </div>

          {/* Diagonal feature blocks */}
          <div className="space-y-8">
            {/* Feature 1 - Financial Management */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="lg:order-2 relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-white/20 rounded" />
                      <Wallet className="w-6 h-6 text-[#6B8FA3]" />
                    </div>
                    <div className="h-8 w-32 bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] rounded-lg" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="h-2 w-16 bg-white/20 rounded mb-2" />
                        <div className="h-4 w-20 bg-green-400/30 rounded" />
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="h-2 w-16 bg-white/20 rounded mb-2" />
                        <div className="h-4 w-20 bg-red-400/30 rounded" />
                      </div>
                    </div>
                    <div className="h-24 bg-gradient-to-br from-[#5B7A9E]/20 to-[#6B8FA3]/20 rounded-xl" />
                  </div>
                </div>
                <div className="absolute -z-10 top-8 left-8 w-full h-full bg-gradient-to-br from-[#5B7A9E]/20 to-[#6B8FA3]/20 rounded-3xl blur-2xl" />
              </div>
              <div className="lg:order-1 space-y-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#5B7A9E]/20 border border-[#6B8FA3]/30">
                  <DollarSign className="w-4 h-4 text-[#6B8FA3]" />
                  <span className="text-sm text-[#6B8FA3]">Gestão Financeira</span>
                </div>
                <h3 className="text-4xl font-bold text-white">
                  Controle total do seu dinheiro
                </h3>
                <p className="text-lg text-white/60 leading-relaxed">
                  Receitas, despesas, relatórios detalhados e previsões. Tudo em um só lugar, 
                  com visualizações que fazem sentido para o seu negócio.
                </p>
                <ul className="space-y-3">
                  {['Relatórios em tempo real', 'Categorização automática', 'Previsão de fluxo de caixa', 'Integração bancária'].map((item) => (
                    <li key={item} className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 2 - Scheduling */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Calendar className="w-6 h-6 text-cyan-400" />
                      <div className="h-4 w-24 bg-white/20 rounded" />
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-10 rounded-lg ${
                            i % 7 === 0 || i % 7 === 6 
                              ? 'bg-white/5' 
                              : i === 15 
                              ? 'bg-gradient-to-br from-cyan-400 to-blue-500' 
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1 h-12 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-lg" />
                      <div className="flex-1 h-12 bg-white/5 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 top-8 right-8 w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300">Agendamentos</span>
                </div>
                <h3 className="text-4xl font-bold text-white">
                  Agenda que funciona como você
                </h3>
                <p className="text-lg text-white/60 leading-relaxed">
                  Links de agendamento estilo Calendly, gestão de profissionais, 
                  horários disponíveis e lembretes automáticos. Seus clientes agendam, 
                  você trabalha.
                </p>
                <ul className="space-y-3">
                  {['Links públicos de agendamento', 'Gestão multi-profissional', 'Lembretes automáticos', 'Integração com WhatsApp'].map((item) => (
                    <li key={item} className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 - WhatsApp Chatbot */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="lg:order-2 relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="space-y-4">
                    {/* Phone mockup */}
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-500/30">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-green-500/30" />
                          <div className="h-3 w-24 bg-white/20 rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white/10 rounded-lg p-3 ml-8">
                            <div className="h-2 w-32 bg-white/30 rounded mb-1" />
                            <div className="h-2 w-24 bg-white/20 rounded" />
                          </div>
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 mr-8">
                            <div className="h-2 w-28 bg-white/40 rounded mb-1" />
                            <div className="h-2 w-20 bg-white/30 rounded" />
                          </div>
                          <div className="bg-white/10 rounded-lg p-3 ml-8">
                            <div className="h-2 w-36 bg-white/30 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-white/60">
                      <Bot className="w-4 h-4" />
                      <span>Chatbot automático 24/7</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -z-10 top-8 left-8 w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
              </div>
              <div className="lg:order-1 space-y-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                  <MessageCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Chatbot WhatsApp</span>
                </div>
                <h3 className="text-4xl font-bold text-white">
                  Atenda clientes enquanto dorme
                </h3>
                <p className="text-lg text-white/60 leading-relaxed">
                  Integração completa com WhatsApp via n8n. Seus clientes agendam, 
                  recebem confirmações e lembretes automaticamente. Você foca no trabalho, 
                  o chatbot cuida do resto.
                </p>
                <ul className="space-y-3">
                  {['Agendamento via chat', 'Confirmações automáticas', 'Lembretes inteligentes', 'Integração n8n'].map((item) => (
                    <li key={item} className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bold */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#5B7A9E]/20 via-[#6B8FA3]/20 to-[#7A9D96]/20 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5B7A9E]/10 to-[#6B8FA3]/10 animate-pulse" />
            <div className="relative z-10">
              <h2 className="text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-[#6B8FA3] via-[#5B7A9E] to-[#7A9D96] bg-clip-text text-transparent">
                  Pronto para transformar
                </span>
                <br />
                <span className="text-white">seu negócio?</span>
              </h2>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de profissionais que já estão usando o BarberFlow 
                para crescer seus negócios.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#5B7A9E] to-[#6B8FA3] hover:from-[#4A5C7A] hover:to-[#5B7A9E] text-white text-lg px-10 py-6 rounded-2xl shadow-2xl shadow-[#5B7A9E]/30"
                  onClick={handleGetStarted}
                >
                  Começar agora - Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B7A9E] via-[#6B8FA3] to-[#7A9D96] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#6B8FA3] to-[#5B7A9E] bg-clip-text text-transparent">
                BarberFlow
              </span>
            </div>
            <div className="text-sm text-white/40">
              © 2025 BarberFlow. Feito com ❤️ para profissionais de beleza.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

