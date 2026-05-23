import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Globe,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Unlink,
  Link2,
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { T } from '@/lib/tokens'
import { apiService } from '@/lib/api'
import { WhatsAppConnectionCard } from '@/components/whatsapp/WhatsAppConnectionCard'

function GoogleCalendarCard() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    apiService.getGoogleCalendarStatus()
      .then(res => setStatus(res))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false))
  }, [])

  const handleConnect = async () => {
    try {
      setConnecting(true)
      const res = await apiService.getGoogleCalendarOAuthUrl()
      if (res?.oauth_url) {
        window.location.href = res.oauth_url
      }
    } catch {
      toast.error('Erro ao iniciar conexão com Google Calendar')
      setConnecting(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await apiService.syncGoogleCalendar()
      toast.success(res?.message || 'Sincronização iniciada!')
    } catch (e) {
      toast.error(e?.message || 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar o Google Calendar? Os agendamentos existentes não serão removidos da agenda.')) return
    try {
      setDisconnecting(true)
      await apiService.disconnectGoogleCalendar()
      setStatus({ connected: false })
      toast.success('Google Calendar desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar className="h-4 w-4" style={{ color: T.brand }} />
          </div>
          <div>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription style={{ margin: 0 }}>Sincronize seus agendamentos com o Google Agenda</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verificando…
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: '#10B981' }} />
              <span className="text-sm font-semibold" style={{ color: '#10B981' }}>Conectado</span>
              {status.calendar_id && status.calendar_id !== 'primary' && (
                <span className="text-xs text-muted-foreground">({status.calendar_id})</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Novos agendamentos serão automaticamente adicionados à sua agenda do Google.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar agora
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Google para sincronizar agendamentos automaticamente com o Google Agenda.
            </p>
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={connecting}
              className="gap-2"
              style={{ background: T.brand, color: '#fff' }}
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Conectar Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDarkMode, toggleTheme } = useTheme()
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    paymentReminders: true,
    weeklyReports: false,
    language: 'pt-BR',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'BRL',
    shareAnalytics: false,
    allowDataExport: true,
    autoBackup: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  })

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }))
      }
    } catch {}
  }, [])

  // Handle OAuth callback query params
  useEffect(() => {
    const calendarStatus = searchParams.get('google_calendar')
    const reason = searchParams.get('reason')
    if (calendarStatus === 'connected') {
      toast.success('Google Calendar conectado com sucesso!')
      setSearchParams({})
    } else if (calendarStatus === 'error') {
      const msg = reason === 'token_exchange' ? 'Erro ao trocar token com Google' :
                  reason === 'invalid_state' ? 'Estado inválido, tente novamente' :
                  'Erro ao conectar Google Calendar'
      toast.error(msg)
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      localStorage.setItem('app_settings', JSON.stringify(settings))
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências do sistema e personalização</p>
      </div>

      {/* Aparência */}
      <Card>
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SettingsIcon className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Aparência</CardTitle>
              <CardDescription style={{ margin: 0 }}>Personalize a aparência do sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme" className="text-base">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
            </div>
            <div className="flex items-center space-x-2">
              {isDarkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-yellow-500" />}
              <Switch id="theme" checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <WhatsAppConnectionCard />

      {/* Google Calendar */}
      <GoogleCalendarCard />

      {/* Notificações */}
      <Card>
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription style={{ margin: 0 }}>Configure como e quando você deseja ser notificado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Notificações por Email', desc: 'Receber notificações importantes por email' },
            { key: 'pushNotifications', label: 'Notificações Push', desc: 'Receber notificações no navegador' },
            { key: 'appointmentReminders', label: 'Lembretes de Agendamentos', desc: 'Receber lembretes antes dos agendamentos' },
            { key: 'paymentReminders', label: 'Lembretes de Pagamentos', desc: 'Receber lembretes de pagamentos pendentes' },
            { key: 'weeklyReports', label: 'Relatórios Semanais', desc: 'Receber relatórios semanais por email' },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={item.key} className="text-base">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch id={item.key} checked={settings[item.key]} onCheckedChange={(v) => handleSettingChange(item.key, v)} />
              </div>
              {i < arr.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Preferências</CardTitle>
              <CardDescription style={{ margin: 0 }}>Configure idioma, formato de data e outras preferências</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: 'language', label: 'Idioma', opts: [{ value: 'pt-BR', label: 'Português (BR)' }, { value: 'en-US', label: 'English (US)' }, { value: 'es-ES', label: 'Español' }] },
            { key: 'dateFormat', label: 'Formato de Data', opts: [{ value: 'dd/MM/yyyy', label: 'DD/MM/AAAA' }, { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA' }, { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD' }] },
            { key: 'timeFormat', label: 'Formato de Hora', opts: [{ value: '24h', label: '24 horas' }, { value: '12h', label: '12h (AM/PM)' }] },
            { key: 'currency', label: 'Moeda', opts: [{ value: 'BRL', label: 'R$ Real' }, { value: 'USD', label: '$ Dólar' }, { value: 'EUR', label: '€ Euro' }] },
          ].map(({ key, label, opts }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {opts.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => handleSettingChange(key, opt.value)}
                    style={{
                      padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                      borderColor: settings[key] === opt.value ? T.brand : T.border,
                      background: settings[key] === opt.value ? T.chip : T.white,
                      color: settings[key] === opt.value ? T.brand : T.text,
                      transition: 'all 150ms',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sistema */}
      <Card>
        <CardHeader className="pb-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Database className="h-4 w-4" style={{ color: T.brand }} />
            </div>
            <div>
              <CardTitle>Sistema</CardTitle>
              <CardDescription style={{ margin: 0 }}>Configurações avançadas do sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoBackup" className="text-base">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">Fazer backup automático dos dados periodicamente</p>
            </div>
            <Switch id="autoBackup" checked={settings.autoBackup} onCheckedChange={(v) => handleSettingChange('autoBackup', v)} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Tempo de Sessão (minutos)</Label>
            <input
              id="sessionTimeout" type="number" min="5" max="120" value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
            <p className="text-sm text-muted-foreground">Tempo de inatividade antes de fazer logout automático</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Tentativas Máximas de Login</Label>
            <input
              id="maxLoginAttempts" type="number" min="3" max="10" value={settings.maxLoginAttempts}
              onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
            <p className="text-sm text-muted-foreground">Número máximo de tentativas de login antes de bloquear a conta</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3">
        <Button onClick={handleSaveSettings} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Salvar Configurações</>
          )}
        </Button>
      </div>
    </div>
  )
}
