# 🔧 Fix: "Failed to Fetch" nos Testes

## Problema

O serviço mobile não consegue buscar no backend, apresentando erro "Failed to fetch".

## Causas Principais

### 1. Backend não acessível pela rede
O backend estava escutando apenas em `127.0.0.1:3000` (localhost), que não é acessível por dispositivos físicos ou emuladores na rede.

### 2. URL da API não detectada corretamente no WebView
Quando o app Android carrega o frontend via WebView, o JavaScript não conseguia detectar corretamente o ambiente e usava a URL padrão `/api/v1` (proxy do Vite), que não funciona no WebView.

## Soluções Implementadas

### 1. Backend acessível pela rede
O backend precisa escutar em `0.0.0.0:3000` para ser acessível pela rede.

### 2. Injeção da URL da API no WebView
O app Android agora injeta automaticamente a URL correta da API no JavaScript quando a página carrega:
- **Emulador**: `http://10.0.2.2:3000/api/v1`
- **Dispositivo físico**: `http://[IP_DA_MAQUINA]:3000/api/v1`

O JavaScript do frontend também foi melhorado para:
- Detectar se está rodando em WebView Android
- Usar a URL injetada pelo WebView (prioridade máxima)
- Fazer fallback para detecção automática baseada no hostname

### ✅ Solução Correta (Já Configurada)

Use o **Procfile.dev** que já tem a configuração correta:

```bash
# Iniciar backend corretamente
foreman start -f Procfile.dev web
```

Ou use o script automatizado:

```bash
./bin/start-test-environment.sh
```

### ❌ Não Use (Não Funciona para Dispositivo Físico)

```bash
# ❌ ERRADO - Só escuta em localhost
bin/rails server

# ❌ ERRADO - Pode não funcionar
bin/rails server -p 3000
```

## Verificar se Está Funcionando

```bash
# 1. Verificar se está escutando em 0.0.0.0
netstat -tlnp | grep :3000
# Deve mostrar: 0.0.0.0:3000 (não 127.0.0.1:3000)

# 2. Testar acesso pela rede
curl http://192.168.201.56:3000/api/v1/health
# Deve retornar: {"status":"OK",...}
```

## Configuração no Puma

O arquivo `config/puma.rb` foi atualizado para sempre escutar em `0.0.0.0`:

```ruby
bind ENV.fetch('BIND', 'tcp://0.0.0.0:3000')
```

## Testar no Dispositivo

Após iniciar o backend corretamente:

1. ✅ Backend acessível: `curl http://192.168.201.56:3000/api/v1/health`
2. ✅ Frontend acessível: `curl http://192.168.201.56:5173`
3. ✅ Executar testes: `cd AndroidApp/tests/java && ./../../gradlew test`

## Troubleshooting

**Backend não acessível?**
```bash
# Parar processos antigos
pkill -f puma
pkill -f "rails server"

# Iniciar corretamente
foreman start -f Procfile.dev web
```

**Firewall bloqueando?**
```bash
sudo ufw allow 3000/tcp
```

**Verificar logs:**
```bash
tail -f /tmp/rails.log
```

## Como Funciona Agora

### No App Android (WebView)

1. O `MainActivity.java` detecta se está em emulador ou dispositivo físico
2. Quando a página carrega, injeta a URL da API via JavaScript:
   ```javascript
   window.APP_API_BASE_URL = 'http://10.0.2.2:3000/api/v1'; // emulador
   // ou
   window.APP_API_BASE_URL = 'http://192.168.201.56:3000/api/v1'; // dispositivo físico
   ```

### No Frontend (JavaScript)

O arquivo `FrontEnd/src/lib/api.js` agora:
1. Verifica primeiro se `window.APP_API_BASE_URL` foi injetado (prioridade máxima)
2. Se não, verifica variável de ambiente `VITE_API_URL`
3. Se não, detecta automaticamente baseado no hostname
4. Por último, usa o proxy do Vite (`/api/v1`) apenas em desenvolvimento local

### Debug

Para verificar se a URL está sendo injetada corretamente:
1. Abra o app no Android
2. Abra o Chrome DevTools (chrome://inspect)
3. Inspecione o WebView
4. No console, digite: `window.APP_API_BASE_URL`
5. Deve mostrar a URL correta da API

## Arquivos Modificados

- `FrontEnd/src/lib/api.js` - Melhorada detecção de ambiente e suporte a URL injetada
- `AndroidApp/app/src/main/java/com/barbermanagement/app/MainActivity.java` - Injeção da URL da API no WebView

