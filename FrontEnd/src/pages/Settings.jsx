import { useState, useEffect } from 'react'
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
  Mail,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

export function Settings() {
  const isMobile = useIsMobile()
  const { isDarkMode, toggleTheme } = useTheme()
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    // Notificações
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    paymentReminders: true,
    weeklyReports: false,
    
    // Preferências
    language: 'pt-BR',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'BRL',
    
    // Privacidade
    shareAnalytics: false,
    allowDataExport: true,
    
    // Sistema
    autoBackup: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  })

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('app_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
    }
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
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
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie as preferências do sistema e personalização
        </p>
      </div>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2 text-blue-600" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme" className="text-base">
                Modo Escuro
              </Label>
              <p className="text-sm text-muted-foreground">
                Alternar entre tema claro e escuro
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
              <Switch
                id="theme"
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-600" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como e quando você deseja ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications" className="text-base">
                Notificações por Email
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações importantes por email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications" className="text-base">
                Notificações Push
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações no navegador
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="appointmentReminders" className="text-base">
                Lembretes de Agendamentos
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber lembretes antes dos agendamentos
              </p>
            </div>
            <Switch
              id="appointmentReminders"
              checked={settings.appointmentReminders}
              onCheckedChange={(checked) => handleSettingChange('appointmentReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paymentReminders" className="text-base">
                Lembretes de Pagamentos
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber lembretes de pagamentos pendentes
              </p>
            </div>
            <Switch
              id="paymentReminders"
              checked={settings.paymentReminders}
              onCheckedChange={(checked) => handleSettingChange('paymentReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyReports" className="text-base">
                Relatórios Semanais
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber relatórios semanais por email
              </p>
            </div>
            <Switch
              id="weeklyReports"
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-blue-600" />
            Preferências
          </CardTitle>
          <CardDescription>
            Configure idioma, formato de data e outras preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <select
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Formato de Hora</Label>
              <select
                id="timeFormat"
                value={settings.timeFormat}
                onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="24h">24 horas</option>
                <option value="12h">12 horas (AM/PM)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="BRL">R$ (Real Brasileiro)</option>
                <option value="USD">$ (Dólar Americano)</option>
                <option value="EUR">€ (Euro)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-600" />
            Sistema
          </CardTitle>
          <CardDescription>
            Configurações avançadas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoBackup" className="text-base">
                Backup Automático
              </Label>
              <p className="text-sm text-muted-foreground">
                Fazer backup automático dos dados periodicamente
              </p>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Tempo de Sessão (minutos)</Label>
            <input
              id="sessionTimeout"
              type="number"
              min="5"
              max="120"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Tempo de inatividade antes de fazer logout automático
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Tentativas Máximas de Login</Label>
            <input
              id="maxLoginAttempts"
              type="number"
              min="3"
              max="10"
              value={settings.maxLoginAttempts}
              onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Número máximo de tentativas de login antes de bloquear a conta
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

