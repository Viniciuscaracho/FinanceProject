# 🔧 Fix: "Failed to Fetch" em Dispositivo Físico

## Problema Identificado

O backend estava escutando apenas em `127.0.0.1:3000` (localhost), que **não é acessível** por dispositivos físicos na rede.

## Solução

### 1. Backend deve escutar em `0.0.0.0:3000`

O backend precisa escutar em **todas as interfaces de rede** (0.0.0.0) para ser acessível por dispositivos na mesma rede.

**✅ Forma Correta:**
```bash
# Usar foreman com Procfile.dev
foreman start -f Procfile.dev web

# Ou diretamente
bin/rails server -p 3000 -b '0.0.0.0'
```

**❌ Forma Errada:**
```bash
# NÃO funciona para dispositivo físico
bin/rails server
# ou
bin/rails server -p 3000
# (sem -b '0.0.0.0')
```

### 2. Verificar se está escutando corretamente

```bash
# Deve mostrar 0.0.0.0:3000 (não 127.0.0.1:3000)
netstat -tlnp | grep :3000
# ou
ss -tlnp | grep :3000
```

Saída esperada:
```
tcp    0    0    0.0.0.0:3000    0.0.0.0:*    LISTEN    [PID]/puma
```

### 3. Testar acesso pela rede

```bash
# Substitua pelo IP da sua máquina
curl http://192.168.201.56:3000/api/v1/health
```

Deve retornar:
```json
{"status":"OK",...}
```

### 4. Configurar IP no App Android

O `MainActivity.java` já está configurado para usar o IP correto:

```java
private static final String FRONTEND_URL_PHYSICAL = "http://192.168.201.56:5173";
```

Se seu IP for diferente, atualize esta constante.

## Passo a Passo para Corrigir

### 1. Parar backend atual

```bash
# Parar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou parar todos os processos Rails
pkill -9 puma rails
```

### 2. Reiniciar backend corretamente

```bash
# Na raiz do projeto
foreman start -f Procfile.dev web
```

**OU em background:**
```bash
nohup foreman start -f Procfile.dev web > /tmp/rails.log 2>&1 &
```

### 3. Verificar

```bash
# Verificar se está escutando em 0.0.0.0
netstat -tlnp | grep :3000

# Testar acesso pela rede
curl http://192.168.201.56:3000/api/v1/health
```

### 4. Recompilar e reinstalar app

```bash
cd AndroidApp
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Verificar Logs

### Logs do Backend
```bash
tail -f /tmp/rails.log
```

### Logs do Android (MainActivity)
```bash
adb logcat -s MainActivity:D
```

### Logs do JavaScript (WebView)
1. Abra `chrome://inspect` no Chrome
2. Clique em "inspect" no WebView do app
3. Veja a aba "Console" para logs do JavaScript

## Troubleshooting

### Backend ainda não acessível?

1. **Verificar firewall:**
   ```bash
   sudo ufw allow 3000/tcp
   ```

2. **Verificar se está escutando em 0.0.0.0:**
   ```bash
   netstat -tlnp | grep :3000
   ```
   Se mostrar `127.0.0.1:3000`, o backend não está acessível na rede.

3. **Reiniciar backend:**
   ```bash
   pkill -9 puma rails
   foreman start -f Procfile.dev web
   ```

### App ainda não conecta?

1. **Verificar URL injetada:**
   No console do WebView (`chrome://inspect`):
   ```javascript
   window.APP_API_BASE_URL
   ```
   Deve mostrar: `"http://192.168.201.56:3000/api/v1"`

2. **Verificar logs do MainActivity:**
   ```bash
   adb logcat -s MainActivity:D | grep "API"
   ```

3. **Testar conexão manualmente:**
   No console do WebView:
   ```javascript
   fetch('http://192.168.201.56:3000/api/v1/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

## Script Automático

Use o script de reset completo:

```bash
./bin/reset-and-reconfigure.sh
```

Este script:
- Para tudo
- Reinicia backend escutando em 0.0.0.0
- Reinicia frontend
- Reinicia Appium
- Verifica tudo

## Resumo

✅ **Backend deve escutar em `0.0.0.0:3000`** (não 127.0.0.1:3000)
✅ **IP do dispositivo físico deve estar correto** no MainActivity
✅ **Backend deve estar acessível pela rede** (teste com curl)
✅ **App deve ter a URL da API injetada** (verificar logs)

