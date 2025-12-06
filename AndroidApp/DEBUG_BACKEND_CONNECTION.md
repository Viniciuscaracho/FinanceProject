# 🔍 Debug: Conexão com Backend

## Problema
O app mobile não consegue buscar no backend.

## Melhorias Implementadas

### 1. Logs Detalhados no MainActivity.java

O `MainActivity` agora gera logs detalhados em todas as etapas:

- **Logs de inicialização**: Mostra se é emulador ou dispositivo físico
- **Logs de URL**: Mostra qual URL do frontend está sendo usada
- **Logs de injeção**: Mostra quando a URL da API é injetada
- **Logs de erro**: Captura e exibe erros de carregamento
- **Console do JavaScript**: Captura todos os logs do console JavaScript

### 2. Injeção Robusta da URL da API

- **Múltiplas tentativas**: Tenta injetar a URL até 3 vezes se necessário
- **Verificação**: Confirma se a URL foi injetada corretamente
- **Teste automático**: Testa a conexão com o backend automaticamente após injeção
- **Informações de debug**: Injeta objeto `APP_DEBUG_INFO` com todas as informações

### 3. Logs Detalhados no Frontend (api.js)

O `api.js` agora loga:
- Todas as requisições (método, URL, headers)
- Todas as respostas (status, dados)
- Todos os erros (detalhados com stack trace)
- Health checks

### 4. Teste de Conexão nos Testes

Novo teste `testBackendConnection()` que:
- Verifica se a URL da API foi injetada
- Coleta informações do ambiente
- Verifica status da conexão com backend
- Exibe logs detalhados

## Como Ver os Logs

### 1. Logs do Android (MainActivity)

```bash
# Ver logs em tempo real
adb logcat -s MainActivity:D

# Ver apenas logs do app
adb logcat | grep "com.barbermanagement.app"

# Ver logs do JavaScript no WebView
adb logcat | grep "JS Console"
```

### 2. Logs do JavaScript (Console do WebView)

1. Conecte o dispositivo/emulador
2. Abra Chrome e vá para `chrome://inspect`
3. Clique em "inspect" no WebView do app
4. Abra a aba "Console" para ver todos os logs

### 3. Logs dos Testes

Os testes agora geram logs detalhados usando SLF4J:

```bash
# Executar testes com logs detalhados
cd AndroidApp/tests/java
./../../gradlew test --info

# Ou com mais detalhes
./../../gradlew test --debug
```

## Verificações

### 1. Verificar se a URL foi injetada

No console do WebView (chrome://inspect):
```javascript
window.APP_API_BASE_URL
```

Deve retornar algo como:
- Emulador: `"http://10.0.2.2:3000/api/v1"`
- Dispositivo físico: `"http://192.168.201.56:3000/api/v1"`

### 2. Verificar informações de debug

```javascript
window.APP_DEBUG_INFO
```

Retorna objeto com:
- `apiUrl`: URL da API
- `hostname`: Hostname atual
- `userAgent`: User agent do navegador
- `timestamp`: Quando foi injetado

### 3. Verificar status da conexão

```javascript
window.APP_BACKEND_CONNECTED  // true ou false
window.APP_BACKEND_ERROR      // mensagem de erro se houver
```

### 4. Testar conexão manualmente

```javascript
fetch(window.APP_API_BASE_URL + '/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Troubleshooting

### Problema: URL não está sendo injetada

**Sintomas:**
- `window.APP_API_BASE_URL` é `undefined`
- Logs mostram "URL não foi injetada"

**Soluções:**
1. Verificar logs do MainActivity:
   ```bash
   adb logcat -s MainActivity:D
   ```
2. Verificar se a página carregou completamente
3. Aguardar mais tempo (a injeção acontece após `onPageFinished`)

### Problema: Backend não conecta

**Sintomas:**
- `window.APP_BACKEND_CONNECTED` é `false`
- `window.APP_BACKEND_ERROR` tem mensagem de erro

**Soluções:**
1. Verificar se o backend está rodando:
   ```bash
   # Emulador
   curl http://10.0.2.2:3000/api/v1/health
   
   # Dispositivo físico
   curl http://192.168.201.56:3000/api/v1/health
   ```

2. Verificar se o backend está escutando em `0.0.0.0:3000`:
   ```bash
   netstat -tlnp | grep :3000
   # Deve mostrar: 0.0.0.0:3000
   ```

3. Verificar firewall:
   ```bash
   sudo ufw allow 3000/tcp
   ```

### Problema: URL incorreta

**Sintomas:**
- URL injetada não corresponde ao ambiente

**Soluções:**
1. Verificar detecção de emulador:
   ```bash
   adb logcat | grep "É emulador"
   ```

2. Verificar URL do frontend:
   ```bash
   adb logcat | grep "URL do frontend"
   ```

3. Ajustar `FRONTEND_URL_PHYSICAL` no `MainActivity.java` se necessário

## Estrutura dos Logs

### MainActivity Logs

```
MainActivity: 📄 Página iniciando: http://10.0.2.2:5173
MainActivity: 🔍 Detectando ambiente:
MainActivity:   - É emulador: true
MainActivity:   - URL do frontend: http://10.0.2.2:5173
MainActivity: 🤖 Usando URL do emulador: http://10.0.2.2:3000/api/v1
MainActivity: ✅ Página carregada: http://10.0.2.2:5173
MainActivity: 🔧 Injetando URL da API: http://10.0.2.2:3000/api/v1 (tentativa 1)
MainActivity: ✅ Script de injeção executado (tentativa 1)
MainActivity: ✅ URL da API confirmada: "http://10.0.2.2:3000/api/v1"
```

### JavaScript Console Logs

```
🔧 API Base URL injetada: http://10.0.2.2:3000/api/v1
📱 Appium ready
🔍 Debug Info: {apiUrl: "...", hostname: "...", ...}
✅ Backend conectado: {status: "OK", ...}
```

### Test Logs

```
🔍 ========================================
🔍 Testando conexão com o backend
🔍 ========================================
⏳ Aguardando página de login carregar...
✅ Página de login carregou
🔄 Mudando para contexto WebView...
✅ Contexto WebView ativado
📊 Informações do ambiente:
  {apiUrl: "http://10.0.2.2:3000/api/v1", ...}
✅ URL da API injetada: http://10.0.2.2:3000/api/v1
✅ Backend conectado com sucesso!
```

## Próximos Passos

1. Executar o teste de conexão:
   ```bash
   cd AndroidApp/tests/java
   ./../../gradlew test --tests "*BackendConnectionTest.testBackendConnection"
   ```

2. Verificar os logs:
   ```bash
   adb logcat -s MainActivity:D
   ```

3. Inspecionar o WebView:
   - Abrir `chrome://inspect`
   - Verificar console e network tabs

