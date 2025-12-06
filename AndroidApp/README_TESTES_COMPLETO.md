# 🧪 Guia Completo de Testes E2E Mobile

## 📋 Pré-requisitos

1. **Backend Rails** rodando na porta 3000
2. **Frontend React** rodando na porta 5173
3. **Appium** rodando na porta 4723
4. **Dispositivo Android** conectado (físico ou emulador)

## 🚀 Iniciar Ambiente Completo

### Opção 1: Script Automático (Recomendado)

```bash
./bin/start-test-environment.sh
```

Este script:
- ✅ Verifica se os serviços estão rodando
- ✅ Inicia Backend, Frontend e Appium automaticamente
- ✅ Detecta dispositivos Android conectados
- ✅ Mostra configuração de rede

### Opção 2: Manual

#### 1. Iniciar Backend Rails
```bash
# Na raiz do projeto
bin/rails server -p 3000 -b 0.0.0.0
```

**Importante**: Use `-b 0.0.0.0` para permitir acesso da rede local (necessário para dispositivo físico).

#### 2. Iniciar Frontend React
```bash
cd FrontEnd
pnpm dev
```

O frontend já está configurado para detectar automaticamente:
- **Emulador**: Usa `http://10.0.2.2:3000/api/v1` para backend
- **Dispositivo Físico**: Usa `http://192.168.201.56:3000/api/v1` (IP da máquina)

#### 3. Iniciar Appium
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
appium --allow-insecure chromedriver_autodownload
```

#### 4. Conectar Dispositivo Android

**Dispositivo Físico:**
```bash
# Conecte via USB
# Ative "Depuração USB" no dispositivo
# Autorize quando solicitado
adb devices  # Deve mostrar o dispositivo
```

**Emulador:**
```bash
./bin/start-android-emulator.sh
```

## 🧪 Executar Testes

### 1. Configurar Dispositivo

```bash
# Para dispositivo físico
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)

# Para emulador (se não houver físico)
export APPIUM_DEVICE_NAME=emulator-5554
```

### 2. Executar Testes

```bash
cd AndroidApp/tests/java
./../../gradlew test
```

### 3. Executar Teste Específico

```bash
./../../gradlew test --tests "com.barbermanagement.tests.e2e.LoginTest.testLoginSimpleSuccess"
```

## 🔧 Configuração de Rede

### Para Emulador Android

O app detecta automaticamente que está em emulador e usa:
- Frontend: `http://10.0.2.2:5173`
- Backend: `http://10.0.2.2:3000/api/v1`

**Não precisa configurar nada!**

### Para Dispositivo Físico

O app detecta automaticamente que está em dispositivo físico e usa:
- Frontend: `http://192.168.201.56:5173` (IP da máquina)
- Backend: `http://192.168.201.56:3000/api/v1` (IP da máquina)

**Requisitos:**
1. ✅ Dispositivo e PC na mesma rede Wi-Fi
2. ✅ IP configurado no `MainActivity.java` (já está: `192.168.201.56`)
3. ✅ Backend rodando com `-b 0.0.0.0` (acessível na rede)

## 📱 Validações que Requerem Backend

Os seguintes testes precisam do backend rodando:

### ✅ Login
- `testLoginSimpleSuccess` - Valida login com credenciais reais
- `testLoginWithInvalidCredentials` - Valida erro com credenciais inválidas
- `testCreateTestUser` - Cria usuário de teste via API

### ✅ Dashboard
- Carregamento de dados do dashboard
- Listagem de transações
- Estatísticas

### ✅ Outros
- Qualquer teste que interage com API

## 🐛 Troubleshooting

### Backend não acessível do dispositivo

**Sintoma**: Login falha, erros de conexão

**Solução**:
```bash
# Verificar se backend está acessível
curl http://192.168.201.56:3000/api/v1/health

# Se não funcionar, verificar firewall
sudo ufw allow 3000/tcp

# Reiniciar backend com binding correto
bin/rails server -p 3000 -b 0.0.0.0
```

### Frontend não carrega no app

**Sintoma**: Tela branca no app

**Solução**:
1. Verificar se frontend está rodando: `curl http://localhost:5173`
2. Verificar IP no `MainActivity.java`
3. Testar no navegador do celular: `http://192.168.201.56:5173`

### Appium não conecta

**Sintoma**: Erro de conexão nos testes

**Solução**:
```bash
# Verificar se Appium está rodando
curl http://localhost:4723/status

# Reiniciar Appium
pkill -f appium
appium --allow-insecure chromedriver_autodownload
```

### Dispositivo não detectado

**Sintoma**: `adb devices` não mostra dispositivo

**Solução**:
```bash
# Reiniciar ADB
adb kill-server
adb start-server
adb devices

# Verificar autorização no dispositivo
# (deve aparecer popup para autorizar)
```

## 📊 Verificar se Tudo Está Funcionando

```bash
# 1. Backend
curl http://localhost:3000/api/v1/health

# 2. Frontend
curl http://localhost:5173

# 3. Appium
curl http://localhost:4723/status

# 4. Dispositivo
adb devices

# 5. Teste completo
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)
cd AndroidApp/tests/java
./../../gradlew test --tests "com.barbermanagement.tests.e2e.LoginTest.testLoginPageLoads"
```

## 🎯 Fluxo Completo de Teste

1. **Iniciar ambiente**: `./bin/start-test-environment.sh`
2. **Aguardar serviços iniciarem** (~10 segundos)
3. **Verificar logs** se necessário
4. **Executar testes**: `cd AndroidApp/tests/java && ./../../gradlew test`
5. **Ver resultados** em `AndroidApp/tests/java/build/reports/tests/test/index.html`

## 💡 Dicas

- Use `tail -f` nos logs para debug em tempo real
- Mantenha backend e frontend rodando durante os testes
- Para testes rápidos, use emulador (mais estável)
- Para testes reais, use dispositivo físico (mais realista)
- O frontend detecta automaticamente o tipo de dispositivo e ajusta as URLs

