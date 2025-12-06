# 🧪 Comandos para Executar Testes E2E Mobile

## 📋 Pré-requisitos

- ✅ Backend Rails configurado
- ✅ Frontend React configurado
- ✅ Appium instalado
- ✅ Android SDK instalado
- ✅ Dispositivo Android conectado OU emulador rodando

---

## 🚀 Iniciar Ambiente Completo (Recomendado)

### Opção 1: Script Automático

```bash
# Na raiz do projeto
./bin/start-test-environment.sh
```

Este script verifica e inicia automaticamente:
- ✅ Backend Rails (porta 3000)
- ✅ Frontend React (porta 5173)
- ✅ Appium (porta 4723)
- ✅ Detecta dispositivos Android

### Opção 2: Manual (Passo a Passo)

#### 1. Iniciar Backend Rails

```bash
# Na raiz do projeto
# IMPORTANTE: Use foreman para escutar em 0.0.0.0 (acessível na rede)
foreman start -f Procfile.dev web
```

**OU em background:**

```bash
foreman start -f Procfile.dev web > /tmp/rails.log 2>&1 &
```

**Verificar se está rodando:**

```bash
# Deve mostrar 0.0.0.0:3000 (não 127.0.0.1:3000)
netstat -tlnp | grep :3000

# Testar acesso
curl http://192.168.201.56:3000/api/v1/health
```

#### 2. Iniciar Frontend React

```bash
cd FrontEnd
pnpm dev
```

**OU em background:**

```bash
cd FrontEnd
pnpm dev > /tmp/vite.log 2>&1 &
```

**Verificar se está rodando:**

```bash
curl http://localhost:5173
```

#### 3. Iniciar Appium

```bash
# Configurar variáveis de ambiente
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Iniciar Appium
appium --allow-insecure chromedriver_autodownload
```

**OU em background:**

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
appium --allow-insecure chromedriver_autodownload > /tmp/appium.log 2>&1 &
```

**Verificar se está rodando:**

```bash
curl http://localhost:4723/status
```

#### 4. Conectar Dispositivo Android

**Dispositivo Físico:**

```bash
# 1. Conecte o dispositivo via USB
# 2. Ative "Depuração USB" no dispositivo
# 3. Autorize quando solicitado

# Verificar conexão
adb devices

# Deve mostrar algo como:
# R9QW102M9CX    device
```

**Emulador:**

```bash
# Iniciar emulador
./bin/start-android-emulator.sh

# OU manualmente
emulator -avd Medium_Phone_API_36.0

# Verificar conexão
adb devices
```

---

## 🧪 Executar Testes

### 1. Configurar Dispositivo

**Para Dispositivo Físico:**

```bash
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)
echo "Usando dispositivo: $APPIUM_DEVICE_NAME"
```

**Para Emulador:**

```bash
export APPIUM_DEVICE_NAME=emulator-5554
```

**OU usar script de detecção:**

```bash
cd AndroidApp
./scripts/setup-physical-device.sh
# O script já exporta a variável APPIUM_DEVICE_NAME
```

### 2. Executar Todos os Testes

```bash
cd AndroidApp/tests/java
./../../gradlew test
```

### 3. Executar Teste Específico

```bash
cd AndroidApp/tests/java

# Teste de carregamento da página
./../../gradlew test --tests "com.barbermanagement.tests.e2e.LoginTest.testLoginPageLoads"

# Teste de login
./../../gradlew test --tests "com.barbermanagement.tests.e2e.LoginTest.testLoginSimpleSuccess"

# Todos os testes de login
./../../gradlew test --tests "com.barbermanagement.tests.e2e.LoginTest.*"

# Todos os testes
./../../gradlew test --tests "com.barbermanagement.tests.*"
```

### 4. Executar com Limpeza (Recomendado)

```bash
cd AndroidApp/tests/java
./../../gradlew clean test
```

---

## 🔍 Verificar Status dos Serviços

### Verificar Todos os Serviços

```bash
# Backend
curl http://localhost:3000/api/v1/health
curl http://192.168.201.56:3000/api/v1/health  # Pela rede

# Frontend
curl http://localhost:5173

# Appium
curl http://localhost:4723/status

# Dispositivos
adb devices
```

### Verificar Portas

```bash
# Ver todas as portas em uso
netstat -tlnp | grep -E ":(3000|5173|4723)"

# OU
ss -tlnp | grep -E ":(3000|5173|4723)"
```

### Verificar Logs

```bash
# Backend
tail -f /tmp/rails.log

# Frontend
tail -f /tmp/vite.log

# Appium
tail -f /tmp/appium.log

# Logs do dispositivo
adb logcat
```

---

## 🛑 Parar Serviços

### Parar Todos os Serviços

```bash
# Backend
pkill -f "rails server"
pkill -f puma
pkill -f foreman

# Frontend
pkill -f vite
pkill -f "pnpm dev"

# Appium
pkill -f appium

# Verificar processos
ps aux | grep -E "rails|vite|appium" | grep -v grep
```

### Parar Serviços Específicos

```bash
# Backend
pkill -f puma

# Frontend
pkill -f vite

# Appium
pkill -f appium
```

---

## 🔧 Troubleshooting

### Backend não acessível pela rede

```bash
# Verificar se está escutando em 0.0.0.0
netstat -tlnp | grep :3000
# Deve mostrar: 0.0.0.0:3000 (não 127.0.0.1:3000)

# Se não estiver, parar e reiniciar
pkill -f puma
foreman start -f Procfile.dev web
```

### Dispositivo não detectado

```bash
# Reiniciar ADB
adb kill-server
adb start-server
adb devices

# Verificar autorização no dispositivo
# (deve aparecer popup para autorizar)
```

### Appium não conecta

```bash
# Verificar se está rodando
curl http://localhost:4723/status

# Se não estiver, reiniciar
pkill -f appium
appium --allow-insecure chromedriver_autodownload
```

### Frontend não carrega no app

```bash
# Verificar se frontend está rodando
curl http://localhost:5173

# Testar no navegador do celular
# Acesse: http://192.168.201.56:5173
```

### Erro "Failed to fetch"

```bash
# 1. Verificar backend acessível
curl http://192.168.201.56:3000/api/v1/health

# 2. Verificar CORS (já configurado em config/initializers/rack_cors.rb)

# 3. Verificar firewall
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
```

---

## 📱 Comandos Úteis do ADB

```bash
# Listar dispositivos
adb devices

# Informações do dispositivo
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk

# Instalar app
adb install -r AndroidApp/app/build/outputs/apk/debug/app-debug.apk

# Desinstalar app
adb uninstall com.barbermanagement.app.debug

# Abrir app
adb shell am start -n com.barbermanagement.app.debug/com.barbermanagement.app.MainActivity

# Ver logs do app
adb logcat | grep barbermanagement

# Limpar dados do app
adb shell pm clear com.barbermanagement.app.debug
```

---

## 🎯 Fluxo Completo (Copy & Paste)

```bash
# 1. Iniciar ambiente completo
./bin/start-test-environment.sh

# 2. Aguardar ~10 segundos

# 3. Verificar serviços
curl http://localhost:3000/api/v1/health && echo "✅ Backend"
curl http://localhost:5173 > /dev/null && echo "✅ Frontend"
curl http://localhost:4723/status > /dev/null && echo "✅ Appium"
adb devices | grep device && echo "✅ Dispositivo"

# 4. Configurar dispositivo
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)
echo "📱 Usando: $APPIUM_DEVICE_NAME"

# 5. Executar testes
cd AndroidApp/tests/java
./../../gradlew clean test

# 6. Ver resultados
open build/reports/tests/test/index.html  # macOS
xdg-open build/reports/tests/test/index.html  # Linux
```

---

## 📊 Ver Resultados dos Testes

```bash
# HTML Report
cd AndroidApp/tests/java
open build/reports/tests/test/index.html  # macOS
xdg-open build/reports/tests/test/index.html  # Linux

# OU via terminal
cat build/test-results/test/TEST-*.xml
```

---

## 🔄 Recompilar e Reinstalar App

```bash
# Build do app
./bin/build-android-app.sh

# Instalar no dispositivo
./bin/install-android-app.sh

# OU manualmente
cd AndroidApp
./gradlew clean assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 💡 Dicas Rápidas

### Atalho para Tudo

```bash
# Criar alias (adicione ao ~/.bashrc ou ~/.zshrc)
alias start-tests='./bin/start-test-environment.sh'
alias run-tests='cd AndroidApp/tests/java && export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk "{print \$1}" | head -1) && ./../../gradlew clean test'
```

### Script Completo em Um Arquivo

```bash
#!/bin/bash
# Salve como: run-all-tests.sh

echo "🚀 Iniciando ambiente de testes..."

# Iniciar serviços
./bin/start-test-environment.sh
sleep 10

# Verificar serviços
echo "🔍 Verificando serviços..."
curl -s http://localhost:3000/api/v1/health > /dev/null && echo "✅ Backend" || echo "❌ Backend"
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend" || echo "❌ Frontend"
curl -s http://localhost:4723/status > /dev/null && echo "✅ Appium" || echo "❌ Appium"

# Configurar dispositivo
export APPIUM_DEVICE_NAME=$(adb devices | grep -v emulator | grep device | awk '{print $1}' | head -1)
echo "📱 Dispositivo: $APPIUM_DEVICE_NAME"

# Executar testes
echo "🧪 Executando testes..."
cd AndroidApp/tests/java
./../../gradlew clean test

echo "✅ Testes concluídos!"
echo "📊 Ver resultados: open build/reports/tests/test/index.html"
```

---

## 📝 Checklist Antes de Testar

- [ ] Backend rodando em `0.0.0.0:3000`
- [ ] Frontend rodando em `localhost:5173`
- [ ] Appium rodando em `localhost:4723`
- [ ] Dispositivo conectado e autorizado
- [ ] App instalado no dispositivo
- [ ] Dispositivo e PC na mesma rede Wi-Fi (se físico)
- [ ] IP configurado no `MainActivity.java` (se físico)

---

## 🆘 Comandos de Emergência

```bash
# Parar tudo e começar do zero
pkill -f "rails|vite|appium|puma|foreman"
sleep 2
./bin/start-test-environment.sh

# Limpar cache do Gradle
cd AndroidApp/tests/java
./../../gradlew clean

# Limpar dados do app no dispositivo
adb shell pm clear com.barbermanagement.app.debug

# Reinstalar app
./bin/install-android-app.sh
```

